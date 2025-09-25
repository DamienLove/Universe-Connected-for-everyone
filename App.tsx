
import React, { useReducer, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { GameState, GameAction, Upgrade, GameNode, Chapter, EnergyOrb } from './types';
import { UPGRADES, CHAPTERS, TUTORIAL_STEPS, CROSSROADS_EVENTS } from './constants';
import { useGameLoop } from './hooks/useGameLoop';
import { generateNodeImage } from './services/geminiService';

// Components
import Simulation from './components/Simulation';
import SplashScreen from './components/SplashScreen';
import UpgradeModal from './components/UpgradeModal';
import Notification from './components/Notification';
import Tutorial from './components/Tutorial';
import NodeInspector from './components/NodeInspector';
import MilestoneVisual from './components/MilestoneVisual';
import CrossroadsModal from './components/CrossroadsModal';
import BackgroundEffects from './components/BackgroundEffects';
import KarmaParticles from './components/KarmaParticles';

const PLAYER_NODE_ID = 'player_consciousness_0';
const ENERGY_FOR_DIVISION = 100;
const MAX_ENERGY_ORBS = 50;
const EVOLUTION_THRESHOLD = 1500; // Ticks for a life seed to evolve

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
    { id: PLAYER_NODE_ID, label: 'Player', type: 'player_consciousness', x: 0, y: 0, radius: 15, connections: [], hasLife: false },
  ],
  energyOrbs: [],
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
      
      const playerNode = newState.nodes.find(n => n.id === newState.playerNodeId);
      if (!playerNode) return newState;

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
        const dx = playerNode.x - orb.x;
        const dy = playerNode.y - orb.y;
        if (Math.sqrt(dx * dx + dy * dy) < playerNode.radius + orb.radius) {
          newState.energy += 5;
          collectedOrbIds.add(orb.id);
        }
      });
      newState.energyOrbs = newState.energyOrbs.filter(orb => orb.life > 0 && !collectedOrbIds.has(orb.id));

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
      if (state.unlockedUpgrades.has('quantum_computing')) newState.knowledge += 0.5;
      if (state.unlockedUpgrades.has('galactic_federation')) newState.unity += 0.2;
      if (state.unlockedUpgrades.has('von_neumann_probes')) newState.complexity += 0.2;

      // --- Event Triggers ---
      if (!state.currentCrossroads) {
        for (const event of CROSSROADS_EVENTS) {
            if (event.trigger(state)) {
                newState.currentCrossroads = event;
                break;
            }
        }
      }
      const nextChapter = state.chapters.find(c => c.id === state.currentChapter + 1);
      if (nextChapter && nextChapter.unlockCondition(state)) {
          newState.currentChapter = nextChapter.id;
          newState.notifications = [...state.notifications, `New Chapter: ${nextChapter.name}`];
      }
      
      return newState;
    }
    case 'PURCHASE_UPGRADE': {
        const { upgrade } = action.payload;
        if (state.unlockedUpgrades.has(upgrade.id)) return state;

        const cost = upgrade.cost;
        if ((cost.energy && state.energy < cost.energy) ||
            (cost.knowledge && state.knowledge < cost.knowledge) ||
            (cost.unity && state.unity < cost.unity) ||
            (cost.complexity && state.complexity < cost.complexity) ||
            (cost.data && state.data < cost.data) ||
            (cost.biomass && state.biomass < cost.biomass)) {
          return state; // Can't afford
        }

        const newUnlocked = new Set(state.unlockedUpgrades);
        newUnlocked.add(upgrade.id);

        let newState: GameState = {
            ...state,
            energy: state.energy - (cost.energy || 0),
            knowledge: state.knowledge - (cost.knowledge || 0),
            unity: state.unity - (cost.unity || 0),
            complexity: state.complexity - (cost.complexity || 0),
            data: state.data - (cost.data || 0),
            biomass: state.biomass - (cost.biomass || 0),
            unlockedUpgrades: newUnlocked,
            notifications: [...state.notifications, `Unlocked: ${upgrade.title}`],
        };
        
        newState = upgrade.effect(newState);

        if (state.tutorialStep === 2 && upgrade.id === 'basic_physics') {
            return { ...newState, tutorialStep: state.tutorialStep + 1 };
        }
        
        return newState;
    }
    case 'NODE_CLICK': {
        return { ...state, selectedNodeId: action.payload.nodeId };
    }
    case 'TOGGLE_UPGRADE_MODAL': {
        const show = action.payload?.show ?? !state.showUpgradeModal;
        if (show && state.tutorialStep === 1) {
            return { ...state, showUpgradeModal: show, tutorialStep: 2 };
        }
        if (!show && state.tutorialStep === 3) {
            return { ...state, showUpgradeModal: show, tutorialStep: 4 };
        }
        return { ...state, showUpgradeModal: show };
    }
    case 'ADVANCE_TUTORIAL': {
        const forceEnd = action.payload?.forceEnd || false;
        const nextStep = forceEnd ? TUTORIAL_STEPS.length : state.tutorialStep + 1;
        return { ...state, tutorialStep: nextStep };
    }
    case 'MILESTONE_COMPLETE': {
        return { ...state, activeMilestone: null };
    }
    case 'DISMISS_NOTIFICATION': {
        return { ...state, notifications: state.notifications.slice(1) };
    }
    case 'RESOLVE_CROSSROADS': {
        if (!state.currentCrossroads) return state;
        let newState = action.payload.choiceEffect(state);
        newState.currentCrossroads = null;
        return newState;
    }
    case 'SET_NODE_IMAGE': {
        const { nodeId, imageUrl } = action.payload;
        return {
            ...state,
            nodes: state.nodes.map(node =>
                node.id === nodeId ? { ...node, imageUrl } : node
            ),
        };
    }
    case 'PLAYER_MOVE': {
        if (!state.playerNodeId) return state;
        return {
            ...state,
            nodes: state.nodes.map(node => 
                node.id === state.playerNodeId ? { ...node, x: action.payload.x, y: action.payload.y } : node
            )
        };
    }
    case 'DIVIDE_CONSCIOUSNESS': {
        const playerNode = state.nodes.find(n => n.id === state.playerNodeId);
        if (!playerNode || state.energy < ENERGY_FOR_DIVISION) return state;
        
        const newNode: GameNode = {
            id: `life_seed_${Date.now()}`,
            label: 'Life Seed',
            type: 'life_seed',
            x: playerNode.x + (Math.random() - 0.5) * 20,
            y: playerNode.y + (Math.random() - 0.5) * 20,
            radius: 8,
            connections: [],
            hasLife: true,
            evolutionProgress: 0,
        };
        
        return {
            ...state,
            energy: state.energy - ENERGY_FOR_DIVISION,
            knowledge: state.knowledge + 50,
            karma: state.karma + 5,
            nodes: [...state.nodes, newNode],
            notifications: [...state.notifications, "A new life has been seeded."]
        };
    }
    default:
      return state;
  }
};

const formatResource = (num: number): string => {
    if (num < 1000) return num.toFixed(1);
    if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1_000_000).toFixed(1)}M`;
};

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const processingNodesRef = useRef(new Set<string>());

  const nodeIds = useMemo(() => gameState.nodes.map(n => n.id).join(','), [gameState.nodes.length]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    gameState.nodes.forEach(node => {
      if (!node.imageUrl && !processingNodesRef.current.has(node.id)) {
        processingNodesRef.current.add(node.id);

        let prompt = '';
        switch (node.type) {
          case 'star':
            prompt = `A beautiful, cinematic digital painting of a vibrant ${node.label.toLowerCase()}, a star burning brightly in the vast emptiness of deep space. Nebula, cosmic dust, high detail.`;
            break;
          case 'rocky_planet':
            prompt = `A high-detail digital painting of a ${node.label.toLowerCase()}, a terrestrial world with continents and oceans, seen from space. Cinematic lighting, realistic textures.`;
            break;
          case 'life_seed':
             prompt = `A macro photograph of a glowing, organic, simple lifeform. A single-celled organism shimmering with green bio-luminescence against a dark background. Ethereal, beautiful, simple.`;
             break;
          case 'sentient_colony':
             prompt = `Digital painting of a complex, interconnected biological network. Glowing purple and blue synapses firing within a translucent, crystalline structure. Represents collective intelligence. Abstract, sci-fi, beautiful.`;
             break;
          default:
            prompt = `A digital painting of a cosmic entity: a ${node.label.toLowerCase()} of type '${node.type.replace(/_/g, ' ')}'. Epic, cinematic, vibrant colors, deep space background.`;
        }

        generateNodeImage(prompt)
          .then(imageUrl => {
            dispatch({ type: 'SET_NODE_IMAGE', payload: { nodeId: node.id, imageUrl } });
          })
          .catch(error => {
            console.error(`Failed to generate image for node ${node.id}:`, error);
          })
          .finally(() => {
            processingNodesRef.current.delete(node.id);
          });
      }
    });
  }, [nodeIds]); // Changed dependency to only run when nodes are added/removed

  useGameLoop(dispatch, dimensions);

  const handleStartGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const handlePurchaseUpgrade = useCallback((upgrade: Upgrade) => {
    dispatch({ type: 'PURCHASE_UPGRADE', payload: { upgrade } });
  }, []);

  const handleNodeClick = useCallback((nodeId: string | null) => {
    dispatch({ type: 'NODE_CLICK', payload: { nodeId } });
  }, []);
  
  const handleToggleUpgradeModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_UPGRADE_MODAL' });
  }, []);

  const handleDivide = useCallback(() => {
    dispatch({ type: 'DIVIDE_CONSCIOUSNESS' });
  }, []);

  const selectedNode = gameState.selectedNodeId ? gameState.nodes.find(n => n.id === gameState.selectedNodeId) : null;
  const currentChapter = gameState.chapters.find(c => c.id === gameState.currentChapter) as Chapter;
  
  if (!gameState.gameStarted) {
    return <SplashScreen onStartGame={handleStartGame} />;
  }

  const isInteractive = !gameState.activeMilestone && !gameState.currentCrossroads;
  const canDivide = gameState.energy >= ENERGY_FOR_DIVISION;

  return (
    <main className="w-screen h-screen bg-black text-white overflow-hidden relative font-sans">
      <BackgroundEffects gameState={gameState} dimensions={dimensions} />
      <KarmaParticles karma={gameState.karma} width={dimensions.width} height={dimensions.height} />
      
      <div className={`absolute inset-0 transition-opacity duration-500 ${isInteractive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Simulation 
            gameState={gameState} 
            dispatch={dispatch}
            onNodeClick={handleNodeClick}
            selectedNodeId={gameState.selectedNodeId}
            dimensions={dimensions} 
        />
        
        {/* HUD */}
        <div className="absolute top-0 left-0 p-4 w-full flex justify-between items-start pointer-events-none">
            {/* Resources */}
            <div id="resource-bar" className="flex flex-wrap gap-4 bg-black/50 p-2 rounded-lg pointer-events-auto">
                <div className="text-yellow-300">Energy: {formatResource(gameState.energy)}</div>
                <div className="text-teal-300">Knowledge: {formatResource(gameState.knowledge)}</div>
                <div className="text-lime-400">Biomass: {formatResource(gameState.biomass)}</div>
                <div className="text-green-300">Unity: {formatResource(gameState.unity)}</div>
                <div className="text-purple-300">Complexity: {formatResource(gameState.complexity)}</div>
                <div className="text-blue-300">Data: {formatResource(gameState.data)}</div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-end gap-4 pointer-events-auto">
                <button id="upgrade-button" onClick={handleToggleUpgradeModal} className="bg-purple-700/80 hover:bg-purple-600/80 border border-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg">
                    Knowledge Web
                </button>
                {canDivide && (
                  <button onClick={handleDivide} className="bg-cyan-500/80 hover:bg-cyan-400/80 border border-cyan-300 text-white font-bold py-2 px-4 rounded-lg shadow-lg animate-pulse">
                      Divide ({ENERGY_FOR_DIVISION} E)
                  </button>
                )}
                <div className="bg-black/50 p-2 rounded-lg text-sm text-center">
                  <p className="text-gray-300">Chapter {gameState.currentChapter + 1}:</p>
                  <p className="text-white font-bold">{currentChapter.name}</p>
                </div>
            </div>
        </div>
        
        {selectedNode && (
          <NodeInspector 
            node={selectedNode}
            chapter={currentChapter}
            onClose={() => handleNodeClick(null)} 
          />
        )}
      </div>

      <UpgradeModal 
        isOpen={gameState.showUpgradeModal}
        onClose={handleToggleUpgradeModal}
        gameState={gameState}
        onPurchase={handlePurchaseUpgrade}
      />

      {gameState.tutorialStep < TUTORIAL_STEPS.length && !gameState.activeMilestone && (
        <Tutorial step={gameState.tutorialStep} dispatch={dispatch} />
      )}
      
      {gameState.activeMilestone && (
        <MilestoneVisual 
          milestoneId={gameState.activeMilestone} 
          onComplete={() => dispatch({ type: 'MILESTONE_COMPLETE' })}
        />
      )}
      
      {gameState.currentCrossroads && (
          <CrossroadsModal event={gameState.currentCrossroads} dispatch={dispatch} />
      )}
      
      {gameState.notifications.length > 0 && (
        <Notification 
          message={gameState.notifications[0]} 
          onDismiss={() => dispatch({ type: 'DISMISS_NOTIFICATION' })} 
        />
      )}
    </main>
  );
}

export default App;