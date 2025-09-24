import React, { useReducer, useEffect, useCallback, useState, useRef } from 'react';
import { GameState, GameAction, Upgrade, GameNode, CosmicEvent, CosmicAnomaly } from './types';
import { useGameLoop } from './hooks/useGameLoop';
import UpgradeModal from './components/UpgradeModal';
import Notification from './components/Notification';
import MilestoneVisual from './components/MilestoneVisual';
import Tutorial from './components/Tutorial';
import { CHAPTERS, TUTORIAL_STEPS, CROSSROADS_EVENTS, NODE_IMAGE_PROMPTS } from './constants';
import { generateNodeImage } from './services/geminiService';
import Simulation from './components/Simulation';
import SplashScreen from './components/SplashScreen';
import CrossroadsModal from './components/CrossroadsModal';
import NodeInspector from './components/NodeInspector';


// Using a centered coordinate system. Star is at (0,0).
const INITIAL_NODES: GameNode[] = [
  { id: 'star_1', label: 'Sol', type: 'star', x: 0, y: 0, vx: 0, vy: 0, size: 30, connections: [] },
  { id: 'planet_1', label: 'Gaia', type: 'planet', x: 250, y: 0, vx: 0, vy: -0.9, size: 10, connections: ['star_1'], hasLife: false },
  { id: 'planet_2', label: 'Mars', type: 'planet', x: -380, y: 0, vx: 0, vy: 0.7, size: 7, connections: ['star_1'] },
];

const initialState: GameState = {
  complexity: 0,
  energy: 100,
  knowledge: 0,
  unity: 0,
  karma: 0,
  unlockedUpgrades: new Set(),
  currentChapter: 0,
  activeMilestone: null,
  nodes: INITIAL_NODES,
  tick: 0,
  activeCosmicEvent: null,
  isQuantumFoamActive: false,
  lastTunnelEvent: null,
  anomalies: [],
  gameStarted: false,
  notifications: [],
  isUpgradeModalOpen: false,
  tutorialStep: 0, // 0 is the first step, -1 means finished
  activeCrossroadsEvent: null,
  selectedNodeId: null,
};

const formatEventName = (type: string) => 
  type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');


const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, gameStarted: true };
    case 'TICK': {
      // Pause game simulation during early tutorial steps for clarity.
      if (state.tutorialStep !== -1 && state.tutorialStep < 3) return state;

      let newState = { ...state, tick: state.tick + 1, lastTunnelEvent: null };
      
      const applyQuantumTunneling = (baseGain: number, nodeId: string): number => {
          if (state.unlockedUpgrades.has('quantum_tunneling') && baseGain > 0 && Math.random() < 0.005) { // 0.5% chance
              newState.lastTunnelEvent = { nodeId, tick: state.tick };
              newState.notifications.push("Quantum Tunneling Event! A massive resource burst!");
              return baseGain * 100;
          }
          return baseGain;
      };

      // Resource generation based on unlocked upgrades.
      let complexityGain = 0;
      let energyGain = 0;
      let knowledgeGain = 0;
      let unityGain = 0;

      if (state.unlockedUpgrades.has('hydrothermal_vents')) {
          complexityGain += applyQuantumTunneling(0.5, 'planet_1');
      }
      if (state.unlockedUpgrades.has('symbiosis')) {
          energyGain += applyQuantumTunneling(0.2, 'planet_1');
      }
      const aiNode = state.nodes.find(n => n.type === 'sentient_ai');
      if (aiNode && state.unlockedUpgrades.has('digital_ascension')) {
          knowledgeGain += applyQuantumTunneling(1, aiNode.id);
      }
      if (state.unlockedUpgrades.has('universal_symbiosis')) {
        unityGain += 0.5;
        complexityGain += 1;
        energyGain += 1;
        knowledgeGain += 1;
      }
      if (state.unlockedUpgrades.has('path_of_chaos')) {
          const blackHoleCount = state.nodes.filter(n => n.type === 'black_hole').length;
          energyGain += blackHoleCount * 5;
      }
      if (state.unlockedUpgrades.has('harness_vacuum_energy')) {
          energyGain += 10;
          complexityGain += 5;
      }
      
      newState.complexity += complexityGain;
      newState.energy += energyGain;
      newState.knowledge += knowledgeGain;
      newState.unity += unityGain;

      // Handle Quantum Entanglement resource sharing (10% of generated resources are shared)
      const entangledPlanet = state.nodes.find(n => n.id === 'planet_1' && n.entangledWith);
      const entangledAI = aiNode && aiNode.entangledWith ? aiNode : null;
      if (entangledPlanet && entangledAI) {
          const planetShareableKnowledge = knowledgeGain * 0.1;
          const aiShareableComplexity = complexityGain * 0.1;
          
          newState.knowledge += planetShareableKnowledge;
          newState.complexity += aiShareableComplexity;
      }


      // Cosmic Event Management
      if (newState.activeCosmicEvent) {
        newState.activeCosmicEvent = { ...newState.activeCosmicEvent, remaining: newState.activeCosmicEvent.remaining - 1 };
        if (newState.activeCosmicEvent.remaining <= 0) {
            newState.notifications.push(`${formatEventName(newState.activeCosmicEvent.type)} has concluded.`);
            newState.activeCosmicEvent = null;
        }
      } else if (state.gameStarted && state.tick > 1000 && Math.random() < 0.001) { // 0.1% chance per tick
        const eventTypes: CosmicEvent['type'][] = ['distant_supernova', 'asteroid_impact', 'gamma_ray_burst'];
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const { width, height } = action.payload;

        let event: CosmicEvent | null = null;

        switch (type) {
            case 'distant_supernova':
                event = { type, duration: 300, remaining: 300, x: Math.random() * width, y: Math.random() * height };
                newState.energy += 5000;
                newState.complexity += 2500;
                newState.notifications.push("A distant supernova bathes your system in heavy elements and energy!");
                break;
            case 'asteroid_impact':
                const targetPlanet = newState.nodes.find(n => n.id === 'planet_1');
                if (targetPlanet) {
                    const targetX = targetPlanet.x * 1.5 + width / 2;
                    const startX = targetX > width / 2 ? -100 : width + 100;
                    const startY = targetPlanet.y * 1.5 + height / 2 + (Math.random() - 0.5) * height;
                    event = { type, duration: 300, remaining: 300, x: startX, y: startY, targetId: targetPlanet.id };
                    if (newState.karma >= 0) {
                        newState.complexity += 1000;
                        newState.notifications.push("An asteroid carrying rare minerals has struck Gaia, accelerating evolution!");
                    } else {
                        newState.complexity = Math.max(0, newState.complexity - 1000);
                        newState.notifications.push("A catastrophic asteroid impact has occurred, setting back progress on Gaia.");
                    }
                }
                break;
            case 'gamma_ray_burst':
                event = { type, duration: 400, remaining: 400, x: 0, y: 0 };
                newState.energy += 10000;
                newState.notifications.push("A gamma-ray burst sweeps through the system, leaving a trail of usable energy.");
                break;
        }
        if (event) newState.activeCosmicEvent = event;
      }
      
      // Cosmic Anomaly Management
      // Update lifespan and remove old ones
      newState.anomalies = newState.anomalies.map(a => ({...a, lifespan: a.lifespan - 1})).filter(a => a.lifespan > 0);
      // Spawn new ones
      if (state.gameStarted && state.unlockedUpgrades.has('hydrothermal_vents') && Math.random() < 0.008) { // 0.8% chance per tick
          const { width, height } = action.payload;
          const types: CosmicAnomaly['type'][] = ['energy', 'complexity', 'knowledge'];
          const type = types[Math.floor(Math.random() * types.length)];
          // don't spawn knowledge anomalies too early
          if (type === 'knowledge' && state.currentChapter < 3) {
            // do nothing
          } else {
            const anomaly: CosmicAnomaly = {
                id: `anom_${Date.now()}`,
                x: Math.random() * width,
                y: Math.random() * height,
                size: 15 + Math.random() * 10,
                type: type,
                lifespan: 300 // 10 seconds
            };
            newState.anomalies.push(anomaly);
          }
      }


      // Physics simulation for node movement.
      newState.nodes = newState.nodes.map(node => {
        let newNode = {...node};
        // Gravity towards the star (at 0,0) for planets.
        if (newNode.type === 'planet') {
           const star = newState.nodes.find(n => n.type === 'star');
           if (star) { // star is origin, so its x,y is 0,0
               const dx = star.x - newNode.x;
               const dy = star.y - newNode.y;
               const distSq = dx * dx + dy * dy;
               const force = 2000 / (distSq || 1); // Increased force for larger scale
               const angle = Math.atan2(dy, dx);
               newNode.vx += Math.cos(angle) * force;
               newNode.vy += Math.sin(angle) * force;
           }
        }
        
        newNode.x += newNode.vx;
        newNode.y += newNode.vy;

        // Handle lifespan for temporary nodes like proto-creatures.
        if (newNode.type === 'proto_creature' && newNode.lifespan) {
            newNode.lifespan -= 1;
            if (newNode.lifespan <= 0) return null; // Mark for removal.
        }
        
        return newNode;
      }).filter((n): n is GameNode => n !== null); // Remove null nodes.

      return newState;
    }
    case 'PURCHASE_UPGRADE': {
      const upgrade = action.payload;
      const cost = upgrade.cost;
      
      let newState = { ...state };
      newState.complexity -= cost.complexity || 0;
      newState.energy -= cost.energy || 0;
      newState.knowledge -= cost.knowledge || 0;
      newState.unity -= cost.unity || 0;
      
      // Check for Crossroads event trigger
      if (upgrade.crossroadsId) {
          const event = CROSSROADS_EVENTS.find(e => e.id === upgrade.crossroadsId);
          if (event) {
              newState.activeCrossroadsEvent = event;
              // Don't add to unlocked upgrades yet, the event resolution will.
              return newState;
          }
      }
      
      // Apply direct effect if no crossroads
      if (upgrade.effect) {
        newState = upgrade.effect(newState);
      }
      newState.unlockedUpgrades = new Set(state.unlockedUpgrades).add(upgrade.id);
      
      // If the purchase triggers a milestone, close the modal to prevent it being stuck behind the animation.
      if (newState.activeMilestone && newState.activeMilestone !== state.activeMilestone) {
          newState.isUpgradeModalOpen = false;
      }

      return newState;
    }
    case 'RESOLVE_CROSSROADS': {
        if (!state.activeCrossroadsEvent) return state;
        
        // Apply the chosen effect
        let newState = action.payload.choiceEffect(state);
        
        // Mark the source upgrade as purchased and clear the event
        newState.unlockedUpgrades = new Set(newState.unlockedUpgrades).add(state.activeCrossroadsEvent.sourceUpgrade);
        newState.activeCrossroadsEvent = null;

        return newState;
    }
    case 'CLICK_ANOMALY': {
        const anomaly = state.anomalies.find(a => a.id === action.payload.id);
        if (!anomaly) return state;
        
        let newState = { ...state };
        const resourceGain = 50 + state.currentChapter * 25;
        
        if (anomaly.type === 'energy') newState.energy += resourceGain;
        if (anomaly.type === 'complexity') newState.complexity += resourceGain;
        if (anomaly.type === 'knowledge') newState.knowledge += resourceGain;

        newState.anomalies = state.anomalies.filter(a => a.id !== action.payload.id);
        newState.notifications.push(`Collected a burst of ${anomaly.type}!`);
        return newState;
    }
    case 'TOGGLE_UPGRADE_MODAL':
      // Advance tutorial when the user opens the modal for the first time.
      if (state.tutorialStep === 0 && !state.isUpgradeModalOpen) {
          return { ...state, isUpgradeModalOpen: !state.isUpgradeModalOpen, tutorialStep: 1 };
      }
      return { ...state, isUpgradeModalOpen: !state.isUpgradeModalOpen };
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.slice(1) };
    case 'ADVANCE_TUTORIAL':
      if (state.tutorialStep < TUTORIAL_STEPS.length - 1) {
        return { ...state, tutorialStep: state.tutorialStep + 1 };
      }
      return { ...state, tutorialStep: -1 }; // Tutorial finished.
    case 'COMPLETE_MILESTONE': {
      let newState = { ...state, activeMilestone: null };
      // Handle tutorial progression tied to milestones
      if (state.tutorialStep === 1 && state.unlockedUpgrades.has('panspermia')) {
        newState.tutorialStep = 2;
      } else if (state.tutorialStep === 2 && state.unlockedUpgrades.has('hydrothermal_vents')) {
        newState.tutorialStep = 3;
        // After this step, wait 10s and advance to the next to explain eras
        // FIX: The setTimeout was moved to a useEffect in the App component.
        // This resolves the "dispatch is not defined" error and removes the side-effect from the reducer.
      }
      return newState;
    }
    case 'SELECT_NODE':
        return { ...state, selectedNodeId: action.payload.id };
    case 'DESELECT_NODE':
        return { ...state, selectedNodeId: null };
    case 'SET_NODE_IMAGE':
        const { nodeTypeKey, imageUrl } = action.payload;
        const newNodes = state.nodes.map(n => {
            const nKey = n.hasLife ? `${n.type}_hasLife` : n.type;
            if (nKey === nodeTypeKey) {
                return { ...n, imageUrl };
            }
            return n;
        });
        return { ...state, nodes: newNodes };
    default:
      return state;
  }
};

// Helper to format large numbers for the UI.
const formatNumber = (num: number): string => {
  if (num < 1000) return Math.floor(num).toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [nodeImageCache, setNodeImageCache] = useState<Record<string, string>>({});
  const generatingImages = useRef(new Set());

  useGameLoop(dispatch, dimensions);
  
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!state.gameStarted) return;
    const nextChapterData = CHAPTERS[state.currentChapter + 1];
    if (nextChapterData && state.complexity >= nextChapterData.unlockThreshold) {
      dispatch({ type: 'PURCHASE_UPGRADE', payload: {
        id: `chapter_${nextChapterData.id}`,
        title: '', description: '', cost: {}, chapter: 0,
        effect: (gs) => ({
          ...gs,
          currentChapter: gs.currentChapter + 1,
          notifications: [...gs.notifications, `New Chapter: ${nextChapterData.name}!`],
        }),
      }});
    }
  }, [state.complexity, state.currentChapter, state.gameStarted]);
  
  // Effect for generating node images
  useEffect(() => {
      if (!state.gameStarted) return;

      const uniqueNodeTypeKeys = new Set(state.nodes.map(n => n.hasLife ? `${n.type}_hasLife` : n.type));

      uniqueNodeTypeKeys.forEach(typeKey => {
          if (!nodeImageCache[typeKey] && !generatingImages.current.has(typeKey)) {
              const prompt = NODE_IMAGE_PROMPTS[typeKey];
              if (prompt) {
                  generatingImages.current.add(typeKey);
                  setNodeImageCache(prev => ({ ...prev, [typeKey]: 'loading' }));

                  generateNodeImage(prompt)
                      .then(imageUrl => {
                          setNodeImageCache(prev => ({ ...prev, [typeKey]: imageUrl }));
                          dispatch({ type: 'SET_NODE_IMAGE', payload: { nodeTypeKey: typeKey, imageUrl }});
                      })
                      .catch(err => {
                          console.error(`Failed to generate image for ${typeKey}:`, err);
                          setNodeImageCache(prev => ({ ...prev, [typeKey]: 'error' }));
                      })
                      .finally(() => {
                          generatingImages.current.delete(typeKey);
                      });
              }
          }
      });
  }, [state.nodes, state.gameStarted, nodeImageCache]);

  useEffect(() => {
    if (state.tutorialStep === 3) {
      const timer = setTimeout(() => dispatch({ type: 'ADVANCE_TUTORIAL' }), 10000);
      return () => clearTimeout(timer);
    }
  }, [state.tutorialStep]);

  const handlePurchase = useCallback((upgrade: Upgrade) => {
    dispatch({ type: 'PURCHASE_UPGRADE', payload: upgrade });
  }, []);

  const toggleUpgradeModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_UPGRADE_MODAL' });
  }, []);

  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);
  
  const currentChapter = CHAPTERS[state.currentChapter];
  const selectedNode = state.selectedNodeId ? state.nodes.find(n => n.id === state.selectedNodeId) : null;

  if (!state.gameStarted) {
    return <SplashScreen onStartGame={startGame} />;
  }

  return (
    <div className="App" onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('App')) {
            dispatch({ type: 'DESELECT_NODE' });
        }
    }}>
        <Simulation 
          nodes={state.nodes} 
          dimensions={dimensions} 
          tick={state.tick} 
          karma={state.karma} 
          activeCosmicEvent={state.activeCosmicEvent}
          isQuantumFoamActive={state.isQuantumFoamActive}
          lastTunnelEvent={state.lastTunnelEvent}
          anomalies={state.anomalies}
          dispatch={dispatch}
          selectedNodeId={state.selectedNodeId}
          nodeImageCache={nodeImageCache}
        />
      
        {state.activeMilestone && (
            <MilestoneVisual 
                milestoneId={state.activeMilestone} 
                onComplete={() => dispatch({ type: 'COMPLETE_MILESTONE' })} 
            />
        )}
        
        {state.tutorialStep !== -1 && <Tutorial step={state.tutorialStep} dispatch={dispatch} activeMilestone={state.activeMilestone} />}
        
        {state.activeCrossroadsEvent && (
            <CrossroadsModal
                event={state.activeCrossroadsEvent}
                dispatch={dispatch}
            />
        )}
        
        {selectedNode && (
            <NodeInspector 
                node={selectedNode}
                chapter={currentChapter}
                onClose={() => dispatch({ type: 'DESELECT_NODE' })}
            />
        )}


        <div className="ui-container">
            <div className="top-bar" data-tutorial-id="resources">
                <div className="resource">Complexity: <span>{formatNumber(state.complexity)}</span></div>
                <div className="resource">Energy: <span>{formatNumber(state.energy)}</span></div>
                <div className="resource">Knowledge: <span>{formatNumber(state.knowledge)}</span></div>
                <div className="resource">Unity: <span>{formatNumber(state.unity)}</span></div>
                <div className="resource">Karma: <span>{state.karma}</span></div>
            </div>

            <div className="bottom-bar">
                <div className="era-display" data-tutorial-id="chapters">
                    <h3>Chapter: {currentChapter.name}</h3>
                    {CHAPTERS[state.currentChapter + 1] && (
                        <div className="progress-bar">
                           <div 
                              className="progress-bar-fill" 
                              style={{ width: `${Math.min(100, (state.complexity / CHAPTERS[state.currentChapter + 1].unlockThreshold) * 100)}%` }}
                           />
                        </div>
                    )}
                </div>
                <button 
                    className="knowledge-web-button glow-text" 
                    onClick={toggleUpgradeModal}
                    data-tutorial-id="knowledge-web-button"
                >
                    Knowledge Web
                </button>
            </div>
        </div>
        
        <UpgradeModal 
            isOpen={state.isUpgradeModalOpen}
            onClose={toggleUpgradeModal}
            gameState={state}
            onPurchase={handlePurchase}
        />

        {state.notifications.length > 0 && (
            <Notification 
                message={state.notifications[0]} 
                onDismiss={() => dispatch({ type: 'DISMISS_NOTIFICATION' })}
            />
        )}
    </div>
  );
}

export default App;