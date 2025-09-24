
import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { GameState, GameAction, Upgrade, GameNode, Chapter } from './types';
import { UPGRADES, CHAPTERS, TUTORIAL_STEPS, CROSSROADS_EVENTS } from './constants';
import { useGameLoop } from './hooks/useGameLoop';

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

const initialGameState: GameState = {
  gameStarted: false,
  energy: 10,
  knowledge: 10,
  unity: 0,
  complexity: 0,
  data: 0,
  karma: 0,
  nodes: [
    { id: 'sun', label: 'Primordial Star', type: 'star', x: 0, y: 0, radius: 40, connections: [], hasLife: false },
  ],
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
      // Resource generation logic
      if (state.unlockedUpgrades.has('star_formation')) {
        newState.energy += 0.1;
      }
      if (state.unlockedUpgrades.has('basic_physics')) {
        newState.knowledge += 0.05;
      }
      if (state.unlockedUpgrades.has('quantum_computing')) {
        newState.knowledge += 0.5; // Quantum insights accelerate discovery
      }
      if (state.unlockedUpgrades.has('galactic_federation')) {
        newState.unity += 0.2; // The Federation fosters constant unity
      }
      if (state.unlockedUpgrades.has('von_neumann_probes')) {
        newState.complexity += 0.2; // The Probes endlessly build and complexify
      }


      // Crossroads event trigger
      if (!state.currentCrossroads) {
        for (const event of CROSSROADS_EVENTS) {
            if (event.trigger(state)) {
                newState.currentCrossroads = event;
                break;
            }
        }
      }

      // Chapter progression
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
        let canAfford = true;
        if (cost.energy && state.energy < cost.energy) canAfford = false;
        if (cost.knowledge && state.knowledge < cost.knowledge) canAfford = false;
        if (cost.unity && state.unity < cost.unity) canAfford = false;
        if (cost.complexity && state.complexity < cost.complexity) canAfford = false;
        if (cost.data && state.data < cost.data) canAfford = false;

        if (!canAfford) return state;

        const newUnlocked = new Set(state.unlockedUpgrades);
        newUnlocked.add(upgrade.id);

        let newState: GameState = {
            ...state,
            energy: state.energy - (cost.energy || 0),
            knowledge: state.knowledge - (cost.knowledge || 0),
            unity: state.unity - (cost.unity || 0),
            complexity: state.complexity - (cost.complexity || 0),
            data: state.data - (cost.data || 0),
            unlockedUpgrades: newUnlocked,
            notifications: [...state.notifications, `Unlocked: ${upgrade.title}`],
        };
        
        newState = upgrade.effect(newState);

        // If tutorial is active and this is the target upgrade
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
        // Advance tutorial if it's step 1 and we are opening the modal
        if (show && state.tutorialStep === 1) {
            return { ...state, showUpgradeModal: show, tutorialStep: 2 };
        }
        // Advance tutorial if it's step 3 and we are closing the modal
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
        newState.currentCrossroads = null; // Event is resolved
        return newState;
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

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const selectedNode = gameState.selectedNodeId ? gameState.nodes.find(n => n.id === gameState.selectedNodeId) : null;
  const currentChapter = gameState.chapters.find(c => c.id === gameState.currentChapter) as Chapter;
  
  if (!gameState.gameStarted) {
    return <SplashScreen onStartGame={handleStartGame} />;
  }

  const isInteractive = !gameState.activeMilestone && !gameState.currentCrossroads;

  return (
    <main className="w-screen h-screen bg-black text-white overflow-hidden relative font-sans">
      <BackgroundEffects gameState={gameState} dimensions={dimensions} />
      <KarmaParticles karma={gameState.karma} width={dimensions.width} height={dimensions.height} />
      
      <div className={`absolute inset-0 transition-opacity duration-500 ${isInteractive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Simulation 
            gameState={gameState} 
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
                <div className="text-green-300">Unity: {formatResource(gameState.unity)}</div>
                <div className="text-purple-300">Complexity: {formatResource(gameState.complexity)}</div>
                <div className="text-blue-300">Data: {formatResource(gameState.data)}</div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-end gap-4 pointer-events-auto">
                <button id="upgrade-button" onClick={handleToggleUpgradeModal} className="bg-purple-700/80 hover:bg-purple-600/80 border border-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg">
                    Knowledge Web
                </button>
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