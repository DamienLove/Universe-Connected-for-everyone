import React, { useReducer, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { GameState, GameAction, Upgrade, GameNode, Chapter, EnergyOrb, ConnectionParticle, ConnectionPulse } from './types';
// FIX: Corrected typo in import from 'UPGRADADES' to 'UPGRADES'.
import { UPGRADES, CHAPTERS, TUTORIAL_STEPS, CROSSROADS_EVENTS } from './constants';
import { useGameLoop } from './hooks/useGameLoop';
import { generateNodeImage } from './services/geminiService';
import { audioService } from './services/AudioService';

// Components
import Simulation from './components/Simulation';
import SplashScreen from './components/SplashScreen';
import UpgradeModal from './UpgradeModal';
import Notification from './components/Notification';
import Tutorial from './components/Tutorial';
import NodeInspector from './components/NodeInspector';
import MilestoneVisual from './components/MilestoneVisual';
import CrossroadsModal from './CrossroadsModal';
import BackgroundEffects from './services/BackgroundEffects';
import KarmaParticles from './KarmaParticles';

const PLAYER_NODE_ID = 'player_consciousness_0';
const ENERGY_FOR_DIVISION = 100;
const MAX_ENERGY_ORBS = 50;
const EVOLUTION_THRESHOLD = 1500; // Ticks for a life seed to evolve
const ORBIT_SPEED_MULTIPLIER = 150;
const PARTICLE_SPAWN_CHANCE = 0.01;
const PARTICLE_LIFE = 200; // ticks
const PLAYER_ACCELERATION = 0.04;
const PLAYER_DAMPING = 0.98;


const initialGameState: GameState = {
  gameStarted: false,
  energy: 10,
  knowledge: 10,
  unity: 0,
  complexity: 0,
  data: 0,
  biomass: 0,
  karma: 0,
  nodes: [
    { id: 'sun', label: 'Primordial Star', type: 'star', x: 200, y: 200, radius: 40, connections: [], hasLife: false },
    { id: PLAYER_NODE_ID, label: 'Player', type: 'player_consciousness', x: 0, y: 0, radius: 15, connections: [], hasLife: false, vx: 0, vy: 0 },
  ],
  energyOrbs: [],
  connectionParticles: [],
  connectionPulses: [],
  playerNodeId: PLAYER_NODE_ID,
  unlockedUpgrades: new Set(),
  currentChapter: 0,
  chapters: CHAPTERS,
  connectMode: { active: false, sourceNodeId: null },
  tutorialStep: 0,
  activeMilestone: null,
  currentCrossroads: null,
  notifications: [],
  selectedNodeId: null,
  showUpgradeModal: false,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, gameStarted: true };
    case 'TICK': {
      let newState = { ...state };
      const { mousePos } = action.payload;
      
      let playerNode = newState.nodes.find(n => n.id === newState.playerNodeId);
      if (!playerNode) return newState;

      // --- Player Physics & Collision ---
      if (playerNode) {
          const dx = mousePos.x - playerNode.x;
          const dy = mousePos.y - playerNode.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          let ax = 0, ay = 0;
          if (dist > 1) { // Avoid jittering
              ax = (dx / dist) * PLAYER_ACCELERATION;
              ay = (dy / dist) * PLAYER_ACCELERATION;
          }

          playerNode.vx = (playerNode.vx || 0) + ax;
          playerNode.vy = (playerNode.vy || 0) + ay;
          
          playerNode.vx *= PLAYER_DAMPING;
          playerNode.vy *= PLAYER_DAMPING;

          playerNode.x += playerNode.vx;
          playerNode.y += playerNode.vy;

          // Collision with other nodes
          newState.nodes.forEach(otherNode => {
              if (otherNode.id === playerNode!.id) return;
              const cdx = otherNode.x - playerNode!.x;
              const cdy = otherNode.y - playerNode!.y;
              const cDist = Math.sqrt(cdx*cdx + cdy*cdy);
              const combinedRadius = playerNode!.radius + otherNode.radius;

              if (cDist < combinedRadius) {
                  const overlap = combinedRadius - cDist;
                  const nx = cdx / cDist;
                  const ny = cdy / cDist;
                  
                  playerNode!.x -= nx * overlap;
                  playerNode!.y -= ny * overlap;

                  const dot = (playerNode!.vx || 0) * nx + (playerNode!.vy || 0) * ny;
                  playerNode!.vx -= 2 * dot * nx;
                  playerNode!.vy -= 2 * dot * ny;
              }
          });
      }


      // --- Energy Orb Spawning ---
      newState.nodes.forEach(node => {
        if (node.type === 'star' && newState.energyOrbs.length < MAX_ENERGY_ORBS) {
          const spawnChance = node.radius / 1000;
          if (Math.random() < spawnChance) {
            const angle = Math.random() * 2 * Math.PI;
            const speed = Math.random() * 0.5 + 0.2;
            newState.energyOrbs.push({
              id: `orb_${Date.now()}_${Math.random()}`,
              x: node.x, y: node.y,
              vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
              radius: Math.random() * 3 + 4,
              life: 2000,
            });
          }
        }
      });
      
      // --- Energy Orb Physics & Collection ---
      const collectedOrbIds = new Set<string>();
      newState.energyOrbs.forEach(orb => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.life--;
        if (playerNode) {
            const dx = playerNode.x - orb.x;
            const dy = playerNode.y - orb.y;
            if (Math.sqrt(dx * dx + dy * dy) < playerNode.radius + orb.radius) {
              newState.energy += 5;
              collectedOrbIds.add(orb.id);
            }
        }
      });
      newState.energyOrbs = newState.energyOrbs.filter(orb => orb.life > 0 && !collectedOrbIds.has(orb.id));

      // --- Orbital Mechanics ---
      const nodeMap = new Map(newState.nodes.map(n => [n.id, n]));
      newState.nodes = newState.nodes.map(node => {
          if (node.orbit) {
              const parent = nodeMap.get(node.orbit.parentId);
              if (parent) {
                  const newAngle = node.orbit.angle + node.orbit.speed;
                  return {
                      ...node,
                      orbit: { ...node.orbit, angle: newAngle },
                      x: parent.x + node.orbit.distance * Math.cos(newAngle),
                      y: parent.y + node.orbit.distance * Math.sin(newAngle),
                  };
              }
          }
          // Update player node in the map
          if (node.id === playerNode.id) {
              return playerNode;
          }
          return node;
      });

      // --- Connection Particle Spawning & Physics ---
      let newParticles: ConnectionParticle[] = [];
      newState.nodes.forEach(node => {
          node.connections.forEach(connId => {
              if (node.id < connId && Math.random() < PARTICLE_SPAWN_CHANCE) {
                  newParticles.push({
                      id: `particle_${Date.now()}_${Math.random()}`,
                      sourceId: node.id,
                      targetId: connId,
                      progress: 0,
                      life: PARTICLE_LIFE,
                  });
              }
          });
      });

      newState.connectionParticles = [
          ...newState.connectionParticles.map(p => ({
              ...p,
              progress: p.progress + 1 / p.life,
          })).filter(p => p.progress < 1),
          ...newParticles
      ];
      
      // --- Connection Pulse Physics ---
      newState.connectionPulses = newState.connectionPulses
        .map(p => ({
            ...p,
            progress: p.progress + 1 / p.life,
        }))
        .filter(p => p.progress < 1);


      // --- Evolution and Resource Generation from Life ---
      let biomassGeneration = 0;
      let unityFromColonies = 0;
      const canEvolve = newState.unlockedUpgrades.has('eukaryotic_evolution');
      
      newState.nodes = newState.nodes.map(node => {
        if (node.type === 'life_seed') {
          biomassGeneration += state.unlockedUpgrades.has('cellular_specialization') ? 0.05 : 0.01;
          if (canEvolve) {
            const newProgress = (node.evolutionProgress || 0) + 1;
            if (newProgress >= EVOLUTION_THRESHOLD) {
              newState.notifications = [...newState.notifications, "A Life Seed has evolved into a Sentient Colony!"];
              return {
                ...node, type: 'sentient_colony', label: 'Sentient Colony',
                radius: 12, imageUrl: undefined, evolutionProgress: 0,
              };
            }
            return { ...node, evolutionProgress: newProgress };
          }
        } else if (node.type === 'sentient_colony') {
          biomassGeneration += state.unlockedUpgrades.has('cellular_specialization') ? 0.2 : 0.08;
          if (state.unlockedUpgrades.has('collective_intelligence')) {
            unityFromColonies += 0.01;
          }
        }
        return node;
      });
      
      newState.biomass += biomassGeneration;
      newState.unity += unityFromColonies;

      // --- General Passive Resource Generation ---
      if (state.unlockedUpgrades.has('basic_physics')) newState.knowledge += 0.05;
      // FIX: The line below was incomplete in the original file. Added passive data generation for Quantum Computing.
      if (state.unlockedUpgrades.has('quantum_computing')) newState.data += 0.05;
      
      // --- Chapter Progression ---
      const nextChapter = newState.chapters.find(c => c.id === newState.currentChapter + 1);
      if (nextChapter && nextChapter.unlockCondition(newState)) {
          newState.currentChapter += 1;
          newState.notifications.push(`You have entered Chapter ${newState.currentChapter + 1}: ${nextChapter.name}`);
      }
      
      // --- Crossroads Events ---
      if (!newState.currentCrossroads && !state.activeMilestone) {
          const triggeredEvent = CROSSROADS_EVENTS.find(event => event.trigger(newState));
          if (triggeredEvent) {
              newState.currentCrossroads = triggeredEvent;
          }
      }

      return newState;
    }
    case 'PURCHASE_UPGRADE': {
      const { upgrade } = action.payload;
      
      const hasEnoughResources = 
        (upgrade.cost.energy === undefined || state.energy >= upgrade.cost.energy) &&
        (upgrade.cost.knowledge === undefined || state.knowledge >= upgrade.cost.knowledge) &&
        (upgrade.cost.unity === undefined || state.unity >= upgrade.cost.unity) &&
        (upgrade.cost.complexity === undefined || state.complexity >= upgrade.cost.complexity) &&
        (upgrade.cost.data === undefined || state.data >= upgrade.cost.data) &&
        (upgrade.cost.biomass === undefined || state.biomass >= upgrade.cost.biomass);

      const meetsPrereqs = (upgrade.prerequisites || []).every(p => state.unlockedUpgrades.has(p));
      const meetsKarmaReq = upgrade.karmaRequirement ? upgrade.karmaRequirement(state.karma) : true;
      const isNotExclusive = !(upgrade.exclusiveWith || []).some(ex => state.unlockedUpgrades.has(ex));

      if (hasEnoughResources && meetsPrereqs && meetsKarmaReq && isNotExclusive && !state.unlockedUpgrades.has(upgrade.id)) {
        let newState = { ...state };
        
        newState.energy -= upgrade.cost.energy || 0;
        newState.knowledge -= upgrade.cost.knowledge || 0;
        newState.unity -= upgrade.cost.unity || 0;
        newState.complexity -= upgrade.cost.complexity || 0;
        newState.data -= upgrade.cost.data || 0;
        newState.biomass -= upgrade.cost.biomass || 0;

        newState.unlockedUpgrades = new Set(newState.unlockedUpgrades).add(upgrade.id);
        
        newState = upgrade.effect(newState);
        
        if (upgrade.id === 'spark_of_life' || upgrade.id === 'panspermia') {
            const lifeNode = newState.nodes.find(n => n.hasLife && n.imageUrl === undefined);
            if (lifeNode) {
                const prompt = upgrade.id === 'spark_of_life' 
                    ? `A vibrant, microbial ecosystem on a primordial alien planet, glowing with bioluminescence. Abstract, beautiful.`
                    : `Cosmic seeds of life traveling on a glowing comet through deep space, nebulae in the background.`;
                // Fire and forget; the state will update via a dispatched action when the promise resolves.
                generateNodeImage(prompt)
                    .then(imageUrl => {
                        // This dispatch will be handled by the game loop's reducer instance.
                        const dispatchFunc = (action: GameAction) => gameReducer(newState, action);
                        dispatchFunc({ type: 'SET_NODE_IMAGE', payload: { nodeId: lifeNode.id, imageUrl }});
                    });
            }
        }
        
        return newState;
      }
      return state;
    }
    case 'NODE_CLICK': {
        const { nodeId } = action.payload;
        if (state.connectMode.active && state.connectMode.sourceNodeId && nodeId && state.connectMode.sourceNodeId !== nodeId) {
            const sourceId = state.connectMode.sourceNodeId;
            const targetId = nodeId;
            
            const sourceNode = state.nodes.find(n => n.id === sourceId);
            if (sourceNode && sourceNode.connections.includes(targetId)) {
                return { ...state, connectMode: { active: false, sourceNodeId: null } };
            }
            
            const newPulse: ConnectionPulse = {
              id: `pulse_${sourceId}_${targetId}_${Date.now()}`,
              sourceId,
              targetId,
              progress: 0,
              life: 100
            };

            return {
                ...state,
                nodes: state.nodes.map(n => {
                    if (n.id === sourceId) return { ...n, connections: [...n.connections, targetId] };
                    if (n.id === targetId) return { ...n, connections: [...n.connections, sourceId] };
                    return n;
                }),
                connectionPulses: [...state.connectionPulses, newPulse],
                connectMode: { active: false, sourceNodeId: null },
                selectedNodeId: targetId,
                unity: state.unity + 2,
            };
        }
        
        return { ...state, selectedNodeId: action.payload.nodeId };
    }
    case 'TOGGLE_UPGRADE_MODAL':
        return { ...state, showUpgradeModal: action.payload?.show ?? !state.showUpgradeModal };
    case 'DISMISS_NOTIFICATION':
        return { ...state, notifications: state.notifications.slice(1) };
    case 'ADVANCE_TUTORIAL': {
        if (action.payload?.forceEnd) {
            return { ...state, tutorialStep: TUTORIAL_STEPS.length };
        }
        const nextStep = state.tutorialStep + 1;
        return { ...state, tutorialStep: nextStep };
    }
    case 'MILESTONE_COMPLETE':
        return { ...state, activeMilestone: null };
    case 'RESOLVE_CROSSROADS':
        if (!state.currentCrossroads) return state;
        const newStateAfterEffect = action.payload.choiceEffect(state);
        return {
            ...newStateAfterEffect,
            currentCrossroads: null,
            unlockedUpgrades: new Set(state.unlockedUpgrades).add(`${state.currentCrossroads.id}_completed`)
        };
    case 'SET_NODE_IMAGE':
        return {
            ...state,
            nodes: state.nodes.map(n => n.id === action.payload.nodeId ? { ...n, imageUrl: action.payload.imageUrl } : n),
        };
    case 'DIVIDE_CONSCIOUSNESS': {
        if (state.energy < ENERGY_FOR_DIVISION) return state;
        const playerNode = state.nodes.find(n => n.id === state.playerNodeId);
        if (!playerNode) return state;

        const newLifeSeed: GameNode = {
            id: `life_seed_${state.nodes.length}_${Date.now()}`,
            label: 'Life Seed',
            type: 'life_seed',
            x: playerNode.x,
            y: playerNode.y,
            radius: 8,
            connections: [],
            hasLife: true,
            evolutionProgress: 0,
        };
        return {
            ...state,
            energy: state.energy - ENERGY_FOR_DIVISION,
            nodes: [...state.nodes, newLifeSeed],
            notifications: [...state.notifications, "You have planted a Seed of Life."],
        };
    }
    case 'START_CONNECTION_MODE':
        return { ...state, connectMode: { active: true, sourceNodeId: action.payload.sourceId }, selectedNodeId: null };
    case 'CANCEL_CONNECTION_MODE':
        return { ...state, connectMode: { active: false, sourceNodeId: null } };
    default:
      return state;
  }
};

// FIX: Added the main App component, which was missing, to provide a default export.
const App: React.FC = () => {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [mouseWorldPos, setMouseWorldPos] = useState({ x: 0, y: 0 });
  const appRef = useRef<HTMLDivElement>(null);

  useGameLoop(dispatch, dimensions, mouseWorldPos);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleStartGame = useCallback(() => {
    audioService.init().then(() => {
      audioService.playSound('uiStart');
      audioService.playMusic('backgroundMusic');
      dispatch({ type: 'START_GAME' });
    });
  }, []);

  const handleNodeClick = useCallback((nodeId: string | null) => {
    dispatch({ type: 'NODE_CLICK', payload: { nodeId } });
  }, []);

  const handlePurchaseUpgrade = useCallback((upgrade: Upgrade) => {
    dispatch({ type: 'PURCHASE_UPGRADE', payload: { upgrade } });
    audioService.playUpgradeSound();
  }, []);

  const handleCloseUpgradeModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_UPGRADE_MODAL', payload: { show: false } });
  }, []);
  
  const handleOpenUpgradeModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_UPGRADE_MODAL', payload: { show: true } });
     audioService.playSound('uiStart', 0.4);
  }, []);

  const handleDismissNotification = useCallback(() => {
    dispatch({ type: 'DISMISS_NOTIFICATION' });
  }, []);

  const handleMilestoneComplete = useCallback(() => {
    dispatch({ type: 'MILESTONE_COMPLETE' });
  }, []);

  const currentChapter = useMemo(() => {
      return CHAPTERS.find(c => c.id === gameState.currentChapter) || CHAPTERS[0];
  }, [gameState.currentChapter]);

  const selectedNode = useMemo(() => {
      return gameState.nodes.find(n => n.id === gameState.selectedNodeId) || null;
  }, [gameState.selectedNodeId, gameState.nodes]);

  const showTutorial = gameState.tutorialStep < TUTORIAL_STEPS.length && !gameState.activeMilestone;

  if (!gameState.gameStarted) {
    return <SplashScreen onStartGame={handleStartGame} />;
  }

  return (
    <div ref={appRef} className="app-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
        <BackgroundEffects gameState={gameState} dimensions={dimensions} />
        <KarmaParticles karma={gameState.karma} width={dimensions.width} height={dimensions.height} />

        <Simulation
            gameState={gameState}
            dispatch={dispatch}
            onNodeClick={handleNodeClick}
            selectedNodeId={gameState.selectedNodeId}
            dimensions={dimensions}
            mouseWorldPos={mouseWorldPos}
            onMouseMove={setMouseWorldPos}
        />
        
        {/* UI Overlay */}
        <div className="ui-overlay">
            <div id="resource-bar" className="resource-bar">
                <span>Energy: {Math.floor(gameState.energy).toLocaleString()}</span>
                <span>Knowledge: {Math.floor(gameState.knowledge).toLocaleString()}</span>
                <span>Unity: {Math.floor(gameState.unity).toLocaleString()}</span>
                <span>Complexity: {Math.floor(gameState.complexity).toLocaleString()}</span>
                <span>Biomass: {Math.floor(gameState.biomass).toLocaleString()}</span>
                <span>Data: {Math.floor(gameState.data).toLocaleString()}</span>
                <span>Karma: {gameState.karma}</span>
            </div>
            
            <div className="chapter-display">
                <h2 className="text-xl font-bold text-purple-300">Chapter {currentChapter.id + 1}: {currentChapter.name}</h2>
                <p className="text-sm text-gray-400">{currentChapter.description}</p>
            </div>
            
            <button id="upgrade-button" onClick={handleOpenUpgradeModal} className="upgrade-button">
              Knowledge Web
            </button>
        </div>

        {selectedNode && (
            <NodeInspector 
                node={selectedNode}
                chapter={currentChapter}
                onClose={() => handleNodeClick(null)}
                dispatch={dispatch}
            />
        )}

        <UpgradeModal
            isOpen={gameState.showUpgradeModal}
            onClose={handleCloseUpgradeModal}
            gameState={gameState}
            onPurchase={handlePurchaseUpgrade}
        />

        {gameState.notifications.length > 0 && (
            <Notification
                message={gameState.notifications[0]}
                onDismiss={handleDismissNotification}
            />
        )}
        
        {showTutorial && <Tutorial step={gameState.tutorialStep} dispatch={dispatch} />}

        {gameState.activeMilestone && (
            <MilestoneVisual milestoneId={gameState.activeMilestone} onComplete={handleMilestoneComplete} />
        )}

        {gameState.currentCrossroads && (
            <CrossroadsModal event={gameState.currentCrossroads} dispatch={dispatch} />
        )}
    </div>
  );
};

export default App;
