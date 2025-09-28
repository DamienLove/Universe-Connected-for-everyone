import React, { useReducer, useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, GameAction, Upgrade, EnergyOrb, GameNode, QuantumPhage } from './types';
import { UPGRADES, CHAPTERS, TUTORIAL_STEPS, CROSSROADS_EVENTS } from './constants';
import { useGameLoop } from './services/useGameLoop';
import { audioService } from './services/AudioService';

import Simulation from './components/Simulation';
import UpgradeModal from './UpgradeModal';
import Notification from './Notification';
import Tutorial from './components/Tutorial';
import MilestoneVisual from './components/MilestoneVisual';
import SplashScreen from './components/SplashScreen';
import KarmaParticles from './hooks/KarmaParticles';
import BackgroundEffects from './services/BackgroundEffects';
import CrossroadsModal from './CrossroadsModal';

// Constants for game balance
const BASE_KNOWLEDGE_RATE = 0.1;
const STAR_ENERGY_RATE = 0.5;
const LIFE_BIOMASS_RATE = 0.2;
const COLLECTIVE_UNITY_RATE = 0.1;
const ORB_ATTRACTION_FORCE = 0.05;
const PHAGE_SPAWN_CHANCE = 0.001;
const PHAGE_ATTRACTION = 0.01;
const PHAGE_DRAIN_RATE = 0.5;
const PLAYER_HUNT_RANGE = 150;

const initialState: GameState = {
  gameStarted: false,
  isPaused: false,
  energy: 50,
  knowledge: 10,
  biomass: 0,
  unity: 0,
  complexity: 0,
  data: 0,
  karma: 0,
  unlockedUpgrades: new Set(),
  currentChapter: 0,
  tutorialStep: 0,
  activeMilestone: null,
  activeCrossroadsEvent: null,
  nodes: [
    {
      id: 'player_consciousness',
      label: 'You',
      type: 'player_consciousness',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 20,
      connections: [],
      hasLife: false,
    },
  ],
  phages: [],
  notifications: [],
  connectMode: { active: false, sourceNodeId: null },
  connectionParticles: [],
  connectionPulses: [],
  energyOrbs: [],
  selectedNodeId: null,
  loreState: { nodeId: null, text: '', isLoading: false },
};

// Physics helper function for line-point distance
const distToSegmentSquared = (p: GameNode, v: GameNode, w: GameNode) => {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 === 0) return (p.x - v.x)**2 + (p.y - v.y)**2;
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = v.x + t * (w.x - v.x);
    const projY = v.y + t * (w.y - v.y);
    return (p.x - projX)**2 + (p.y - projY)**2;
}

// The main game reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      audioService.userInteraction().then(() => audioService.playBackgroundMusic());
      return { ...state, gameStarted: true, notifications: [...state.notifications, 'The cosmos awakens to your presence.'] };
    case 'TICK': {
      // Resource generation
      let newKnowledge = state.knowledge + BASE_KNOWLEDGE_RATE;
      let newBiomass = state.biomass;
      let newUnity = state.unity;

      state.nodes.forEach(node => {
        if (node.type === 'star') state.energy += STAR_ENERGY_RATE;
        if (node.hasLife) newBiomass += LIFE_BIOMASS_RATE;
      });

      if (state.unlockedUpgrades.has('cellular_specialization')) {
        newBiomass += state.nodes.filter(n => n.hasLife).length * 0.5;
      }
      if (state.unlockedUpgrades.has('collective_intelligence')) {
        newUnity += COLLECTIVE_UNITY_RATE;
      }
      
      const playerNode = state.nodes.find(n => n.type === 'player_consciousness');
      if (!playerNode) return state;

      // Update player position
      const mutableNodes = state.nodes.map(n => ({...n}));
      const pNode = mutableNodes.find(n => n.id === playerNode.id);
      if(pNode) {
          pNode.x = action.payload.mousePos.x;
          pNode.y = action.payload.mousePos.y;
      }

      // Physics simulation for nodes
      for (let i = 0; i < mutableNodes.length; i++) {
          const node = mutableNodes[i];
          if (node.type === 'player_consciousness') continue;
          
          node.x += node.vx;
          node.y += node.vy;

          // World boundary collision
          const WORLD_DAMPING = 0.9;
          if (node.x - node.radius < -action.payload.width / 2 || node.x + node.radius > action.payload.width / 2) {
              node.vx *= -WORLD_DAMPING;
              node.x = Math.max(node.x, -action.payload.width / 2 + node.radius);
              node.x = Math.min(node.x, action.payload.width / 2 - node.radius);
              audioService.playSound('node_bounce', 0.2);
          }
          if (node.y - node.radius < -action.payload.height / 2 || node.y + node.radius > action.payload.height / 2) {
              node.vy *= -WORLD_DAMPING;
              node.y = Math.max(node.y, -action.payload.height/2 + node.radius);
              node.y = Math.min(node.y, action.payload.height/2 - node.radius);
              audioService.playSound('node_bounce', 0.2);
          }
          
          // Node-node collision
          for(let j=i+1; j < mutableNodes.length; j++) {
            const other = mutableNodes[j];
            if (other.type === 'player_consciousness') continue;

            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const min_dist = node.radius + other.radius;

            if (dist < min_dist) {
              // Resolve overlap
              const overlap = min_dist - dist;
              const adjustX = (overlap * dx / dist) / 2;
              const adjustY = (overlap * dy / dist) / 2;
              node.x -= adjustX; node.y -= adjustY;
              other.x += adjustX; other.y += adjustY;
              
              // Elastic collision
              const nx = dx/dist; const ny = dy/dist;
              const p = 2 * (node.vx * nx + node.vy * ny - other.vx * nx - other.vy * ny) / (node.radius + other.radius);
              node.vx -= p * other.radius * nx; node.vy -= p * other.radius * ny;
              other.vx += p * node.radius * nx; other.vy += p * node.radius * ny;
              audioService.playSound('node_bounce', 0.4);
            }
          }

          // Node-connection collision
          for (const source of mutableNodes) {
              for (const targetId of source.connections) {
                  const target = mutableNodes.find(n => n.id === targetId);
                  if (!target || source.id === node.id || target.id === node.id) continue;
                  
                  const distSq = distToSegmentSquared(node, source, target);
                  if (distSq < node.radius * node.radius) {
                      // Find closest point on segment and calculate collision normal
                      const l2 = (source.x - target.x)**2 + (source.y - target.y)**2;
                      let projX, projY;
                      if (l2 === 0) {
                          projX = source.x; projY = source.y;
                      } else {
                          let t = ((node.x - source.x) * (target.x - source.x) + (node.y - source.y) * (target.y - source.y)) / l2;
                          t = Math.max(0, Math.min(1, t));
                          projX = source.x + t * (target.x - source.x);
                          projY = source.y + t * (target.y - source.y);
                      }
                      
                      const vecX = node.x - projX;
                      const vecY = node.y - projY;
                      const vecLen = Math.sqrt(vecX*vecX + vecY*vecY);
                      
                      if (vecLen > 0) {
                          const overlap = node.radius - vecLen;
                          const collisionNormalX = vecX / vecLen;
                          const collisionNormalY = vecY / vecLen;
                          
                          // Position Correction: Push the node out of the line
                          node.x += collisionNormalX * overlap;
                          node.y += collisionNormalY * overlap;
                          
                          // Velocity Correction: Bounce the node
                          const dot = node.vx * collisionNormalX + node.vy * collisionNormalY;
                          if (dot < 0) { // Only bounce if moving towards the line
                              node.vx -= 2 * dot * collisionNormalX;
                              node.vy -= 2 * dot * collisionNormalY;
                          }
                          audioService.playSound('connection_bounce', 0.3);
                      }
                  }
              }
          }
      }

      // Energy Orb physics
      let collectedEnergy = 0;
      const remainingOrbs = state.energyOrbs.filter(orb => {
          const dx = playerNode.x - orb.x;
          const dy = playerNode.y - orb.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist < playerNode.radius + orb.radius) {
              collectedEnergy += 10;
              audioService.playSound('collect_orb', 0.5);
              return false;
          }
          orb.vx += (dx / dist) * ORB_ATTRACTION_FORCE;
          orb.vy += (dy / dist) * ORB_ATTRACTION_FORCE;
          orb.x += orb.vx;
          orb.y += orb.vy;
          orb.vx *= 0.98;
          orb.vy *= 0.98;
          return true;
      });
      
      // Quantum Phage logic
      let newPhages = [...state.phages];
      if(state.unlockedUpgrades.has('quantum_computing') && Math.random() < PHAGE_SPAWN_CHANCE && newPhages.length < 5) {
          audioService.playSound('phage_spawn');
          newPhages.push({
              id: `phage_${Date.now()}`, x: (Math.random() - 0.5) * action.payload.width, y: (Math.random() - 0.5) * action.payload.height,
              vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), radius: 15, targetNodeId: null, state: 'seeking'
          });
      }
      
      let knowledgeDrain = 0;
      let dataDrain = 0;
      newPhages.forEach(phage => {
        if(phage.state === 'seeking') {
            const complexNodes = state.nodes.filter(n => n.type !== 'player_consciousness');
            if(complexNodes.length > 0 && !phage.targetNodeId) {
                phage.targetNodeId = complexNodes[Math.floor(Math.random() * complexNodes.length)].id;
            }
            if(phage.targetNodeId) {
                const target = state.nodes.find(n => n.id === phage.targetNodeId);
                if (target) {
                    const dx = target.x - phage.x; const dy = target.y - phage.y; const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < target.radius + phage.radius) {
                        phage.state = 'draining';
                    } else {
                        phage.vx += (dx/dist) * PHAGE_ATTRACTION; phage.vy += (dy/dist) * PHAGE_ATTRACTION;
                    }
                } else {
                    phage.targetNodeId = null; // Target gone
                }
            }
        }
        if (phage.state === 'draining') {
            audioService.playSound('phage_drain', 0.1);
            knowledgeDrain += PHAGE_DRAIN_RATE;
            dataDrain += PHAGE_DRAIN_RATE;
        }

        phage.x += phage.vx; phage.y += phage.vy;
        phage.vx *= 0.99; phage.vy *= 0.99;
      });

      const huntablePhages = newPhages.map(p => {
        const dx = playerNode.x - p.x; const dy = playerNode.y - p.y;
        return {phage: p, dist: Math.sqrt(dx*dx + dy*dy)}
      }).filter(pd => pd.dist < PLAYER_HUNT_RANGE);
      
      let huntedKnowledge = 0;
      let huntedData = 0;
      if (huntablePhages.length > 0) {
        const huntedIds = new Set(huntablePhages.map(pd => pd.phage.id));
        newPhages = newPhages.filter(p => !huntedIds.has(p.id));
        const numHunted = huntedIds.size;
        huntedKnowledge = numHunted * 25;
        huntedData = numHunted * 50;
        if(numHunted > 0) audioService.playSound('phage_capture');
      }

      // Check for chapter progression
      const nextChapter = CHAPTERS.find(c => c.id > state.currentChapter && c.unlockCondition(state));

      return {
        ...state,
        energy: state.energy + collectedEnergy,
        knowledge: newKnowledge - knowledgeDrain + huntedKnowledge,
        data: state.data - dataDrain + huntedData,
        biomass: newBiomass,
        unity: newUnity,
        nodes: mutableNodes,
        phages: newPhages,
        energyOrbs: remainingOrbs,
        currentChapter: nextChapter ? nextChapter.id : state.currentChapter,
      };
    }
    case 'PURCHASE_UPGRADE': {
      const { upgrade, imageUrl } = action.payload;
      const stateAfterPurchase = {
        ...state,
        energy: state.energy - (upgrade.cost.energy || 0),
        knowledge: state.knowledge - (upgrade.cost.knowledge || 0),
        biomass: state.biomass - (upgrade.cost.biomass || 0),
        unity: state.unity - (upgrade.cost.unity || 0),
        complexity: state.complexity - (upgrade.cost.complexity || 0),
        data: state.data - (upgrade.cost.data || 0),
      };
      const newState = upgrade.effect(stateAfterPurchase, imageUrl);
      
      if (newState.activeMilestone && newState.activeMilestone !== state.activeMilestone) {
        audioService.playSound('milestone_achievement', 0.8);
      }

      const newUnlocked = new Set(state.unlockedUpgrades);
      newUnlocked.add(upgrade.id);

      return {
        ...newState,
        unlockedUpgrades: newUnlocked,
        notifications: [...state.notifications, `Unlocked: ${upgrade.title}`],
      };
    }
    case 'ADVANCE_TUTORIAL':
        const nextStep = state.tutorialStep + 1;
        if (action.payload?.forceEnd || nextStep >= TUTORIAL_STEPS.length) {
            return { ...state, tutorialStep: -1 };
        }
        return { ...state, tutorialStep: nextStep };
    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((_, i) => i !== action.payload.index),
      };
    case 'MILESTONE_COMPLETE':
        return { ...state, activeMilestone: null, isPaused: false };
    case 'RESOLVE_CROSSROADS':
        const resolvedState = action.payload.choiceEffect(state);
        return { ...resolvedState, activeCrossroadsEvent: null, isPaused: false };
    case 'START_CONNECTION_MODE':
      audioService.playSound('ui_click');
      return { ...state, connectMode: { active: true, sourceNodeId: action.payload.sourceId }, selectedNodeId: null };
    case 'CANCEL_CONNECTION_MODE':
      return { ...state, connectMode: { active: false, sourceNodeId: null } };
    case 'CREATE_CONNECTION': {
        const { sourceNodeId } = state.connectMode;
        const { targetId } = action.payload;
        if (!sourceNodeId || sourceNodeId === targetId) return state;

        const sourceNode = state.nodes.find(n => n.id === sourceNodeId);
        const targetNode = state.nodes.find(n => n.id === targetId);
        if (!sourceNode || !targetNode) return state;
        
        audioService.playSound('connect_success');

        const newNodes = state.nodes.map(n => {
            if (n.id === sourceNodeId && !n.connections.includes(targetId)) {
                return { ...n, connections: [...n.connections, targetId] };
            }
            if (n.id === targetId && !n.connections.includes(sourceNodeId)) {
                 return { ...n, connections: [...n.connections, sourceNodeId] };
            }
            return n;
        });
        
        // Energy Bounce mechanic
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        const newOrbs: EnergyOrb[] = Array.from({ length: 5 }).map(() => ({
            id: `orb_${Date.now()}_${Math.random()}`,
            x: midX + (Math.random() - 0.5) * 20,
            y: midY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: Math.random() * 3 + 4,
        }));

        return { ...state, nodes: newNodes, connectMode: { active: false, sourceNodeId: null }, energyOrbs: [...state.energyOrbs, ...newOrbs] };
    }
    case 'SELECT_NODE':
        if (state.connectMode.active && state.connectMode.sourceNodeId && action.payload.nodeId) {
            return gameReducer(state, { type: 'CREATE_CONNECTION', payload: { targetId: action.payload.nodeId } });
        }
        if (state.selectedNodeId !== action.payload.nodeId) {
             audioService.playSound('ui_open', 0.6);
        }
        return { ...state, selectedNodeId: action.payload.nodeId, connectMode: { active: false, sourceNodeId: null }, loreState: { nodeId: null, text: '', isLoading: false } };
    case 'SET_LORE_LOADING':
        return { ...state, loreState: { nodeId: action.payload.nodeId, text: '', isLoading: true } };
    case 'SET_LORE_RESULT':
        return { ...state, loreState: { nodeId: action.payload.nodeId, text: action.payload.text, isLoading: false } };
    case 'CLEAR_LORE':
        return { ...state, loreState: { nodeId: null, text: '', isLoading: false } };
    case 'HUNT_PHAGE':
      const phageToHunt = state.phages.find(p => p.id === action.payload.phageId);
      if(!phageToHunt) return state;
      audioService.playSound('phage_capture');
      return {
        ...state,
        phages: state.phages.filter(p => p.id !== action.payload.phageId),
        knowledge: state.knowledge + 25,
        data: state.data + 50,
      }
    case 'SET_PAUSED':
        return { ...state, isPaused: action.payload };
    default:
      return state;
  }
}

// Format resource numbers for display
const formatResource = (num: number) => {
    if (num < 1000) return num.toFixed(1);
    if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
    return (num / 1000000).toFixed(2) + 'M';
}

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [mouseWorldPos, setMouseWorldPos] = useState({ x: 0, y: 0 });

  const isPaused = gameState.isPaused || gameState.activeMilestone !== null || gameState.activeCrossroadsEvent !== null;

  useGameLoop(dispatch, dimensions, mouseWorldPos, isPaused);
  
  // Window resize handler
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Event trigger logic
  useEffect(() => {
    if (isPaused) return;
    const triggeredEvent = CROSSROADS_EVENTS.find(e => e.trigger(gameState));
    if (triggeredEvent && gameState.activeCrossroadsEvent?.id !== triggeredEvent.id) {
        // This is a side-effect and should ideally be an action.
        // For now, this is a simple way to trigger it.
    }
  }, [gameState, isPaused]);
  
  const handlePurchase = useCallback((upgrade: Upgrade, imageUrl?: string) => {
    audioService.playSound('purchase_upgrade', 0.7);
    dispatch({ type: 'PURCHASE_UPGRADE', payload: { upgrade, imageUrl } });
    if(upgrade.id === 'basic_physics' && gameState.tutorialStep === 2) {
        dispatch({ type: 'ADVANCE_TUTORIAL' });
    }
  }, [gameState.tutorialStep]);

  if (!gameState.gameStarted) {
    return <SplashScreen onStartGame={() => dispatch({ type: 'START_GAME' })} />;
  }

  const showTutorial = gameState.tutorialStep !== -1 && !gameState.activeMilestone;

  return (
    <div className="w-screen h-screen bg-black overflow-hidden text-white" onClick={() => audioService.userInteraction()}>
      <BackgroundEffects gameState={gameState} dimensions={dimensions} />
      <KarmaParticles karma={gameState.karma} width={dimensions.width} height={dimensions.height} />
      
      <Simulation
        gameState={gameState}
        dispatch={dispatch}
        dimensions={dimensions}
        mouseWorldPos={mouseWorldPos}
        onMouseMove={setMouseWorldPos}
      />

      {/* UI Elements */}
      <div id="resource-bar" className="absolute top-0 left-0 right-0 p-4 bg-black/30 backdrop-blur-sm flex justify-center items-center flex-wrap gap-x-6 gap-y-1 text-lg z-20">
        <span>Energy: {formatResource(gameState.energy)}</span>
        <span>Knowledge: {formatResource(gameState.knowledge)}</span>
        {gameState.unlockedUpgrades.has('spark_of_life') && <span>Biomass: {formatResource(gameState.biomass)}</span>}
        {gameState.unlockedUpgrades.has('spark_of_life') && <span>Unity: {formatResource(gameState.unity)}</span>}
        {gameState.unlockedUpgrades.has('basic_physics') && <span>Complexity: {formatResource(gameState.complexity)}</span>}
        {gameState.unlockedUpgrades.has('quantum_computing') && <span>Data: {formatResource(gameState.data)}</span>}
      </div>

      <button
        id="upgrade-button"
        className="absolute bottom-4 left-4 bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 px-5 rounded-lg shadow-lg z-20"
        onClick={() => {
            setIsUpgradeModalOpen(true);
            if(gameState.tutorialStep === 1) { dispatch({type: 'ADVANCE_TUTORIAL'}); }
        }}
      >
        Knowledge Web
      </button>

      {/* Modals & Overlays */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        gameState={gameState}
        onPurchase={handlePurchase}
      />
      
      <div className="absolute top-20 right-5 z-[100] flex flex-col items-end gap-2">
        {gameState.notifications.map((msg, index) => (
            <Notification key={`${msg}-${index}`} message={msg} onDismiss={() => dispatch({ type: 'DISMISS_NOTIFICATION', payload: { index } })} />
        ))}
      </div>

      {showTutorial && <Tutorial step={gameState.tutorialStep} dispatch={dispatch} />}
      
      {gameState.activeMilestone && (
          <MilestoneVisual milestoneId={gameState.activeMilestone} onComplete={() => dispatch({ type: 'MILESTONE_COMPLETE' })} />
      )}
      {gameState.activeCrossroadsEvent && (
          <CrossroadsModal event={gameState.activeCrossroadsEvent} dispatch={dispatch} />
      )}
    </div>
  );
}

export default App;
