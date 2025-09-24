import React, { useReducer, useEffect, useCallback, useState } from 'react';
import { GameState, GameAction, Upgrade, GameNode } from './types';
import { useGameLoop } from './hooks/useGameLoop';
import UpgradeModal from './components/UpgradeModal';
import Notification from './components/Notification';
import MilestoneVisual from './components/MilestoneVisual';
import KarmaParticles from './components/KarmaParticles';
import Tutorial from './components/Tutorial';
import { ERAS, TUTORIAL_STEPS } from './constants';
import Simulation from './components/Simulation';
import SplashScreen from './components/SplashScreen';

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
  currentEra: 0,
  activeMilestone: null,
  nodes: INITIAL_NODES,
  tick: 0,
  gameStarted: false,
  notifications: [],
  isUpgradeModalOpen: false,
  tutorialStep: 0, // 0 is the first step, -1 means finished
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, gameStarted: true };
    case 'TICK': {
      // Pause game simulation during early tutorial steps for clarity.
      if (state.tutorialStep !== -1 && state.tutorialStep < 2) return state;

      let newState = { ...state, tick: state.tick + 1 };
      
      // Resource generation based on unlocked upgrades.
      if (state.unlockedUpgrades.has('hydrothermal_vents')) {
          newState.complexity += 0.5;
      }
      if (state.unlockedUpgrades.has('symbiosis')) {
          newState.energy += 0.2;
      }
      if (state.unlockedUpgrades.has('digital_ascension')) {
          newState.knowledge += 1;
      }
      if (state.unlockedUpgrades.has('universal_symbiosis')) {
        newState.unity += 0.5;
        newState.complexity += 1;
        newState.energy += 1;
        newState.knowledge += 1;
      }
      if (state.unlockedUpgrades.has('path_of_chaos')) {
          const blackHoleCount = state.nodes.filter(n => n.type === 'black_hole').length;
          newState.energy += blackHoleCount * 5;
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
      
      newState = upgrade.effect(newState);
      newState.unlockedUpgrades = new Set(state.unlockedUpgrades).add(upgrade.id);
      
      // If the purchase triggers a milestone, close the modal to prevent it being stuck behind the animation.
      if (newState.activeMilestone && newState.activeMilestone !== state.activeMilestone) {
          newState.isUpgradeModalOpen = false;
      }

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
      // If the tutorial was waiting for the first milestone, advance it now.
      if (state.tutorialStep === 1 && state.unlockedUpgrades.has('hydrothermal_vents')) {
        newState.tutorialStep = 2;
      }
      return newState;
    }
    default:
      return state;
  }
};

// Helper to format large numbers for the UI.
const formatNumber = (num: number): string => {
  if (num < 1000) return Math.floor(num).toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useGameLoop(dispatch, dimensions);
  
  // Effect to handle window resizing.
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to check for Era progression.
  useEffect(() => {
    if (!state.gameStarted) return;
    const nextEraData = ERAS[state.currentEra + 1];
    if (nextEraData && state.complexity >= nextEraData.unlockThreshold) {
      // Use a dummy upgrade to dispatch the era change effect.
      dispatch({ type: 'PURCHASE_UPGRADE', payload: {
        id: `era_${nextEraData.id}`,
        title: '', description: '', cost: {}, era: 0,
        effect: (gs) => ({
          ...gs,
          currentEra: gs.currentEra + 1,
          notifications: [...gs.notifications, `A new era has dawned: ${nextEraData.name}!`],
        }),
      }});
    }
  }, [state.complexity, state.currentEra, state.gameStarted]);

  const handlePurchase = useCallback((upgrade: Upgrade) => {
    dispatch({ type: 'PURCHASE_UPGRADE', payload: upgrade });
  }, []);

  const toggleUpgradeModal = useCallback(() => {
    dispatch({ type: 'TOGGLE_UPGRADE_MODAL' });
  }, []);

  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);
  
  const currentEra = ERAS[state.currentEra];

  if (!state.gameStarted) {
    return <SplashScreen onStartGame={startGame} />;
  }

  return (
    <div className="App">
        <KarmaParticles karma={state.karma} />
        <Simulation nodes={state.nodes} dimensions={dimensions} />
      
        {state.activeMilestone && (
            <MilestoneVisual 
                milestoneId={state.activeMilestone} 
                onComplete={() => dispatch({ type: 'COMPLETE_MILESTONE' })} 
            />
        )}
        
        {state.tutorialStep !== -1 && <Tutorial step={state.tutorialStep} dispatch={dispatch} activeMilestone={state.activeMilestone} />}

        <div className="ui-container">
            <div className="top-bar" data-tutorial-id="resources">
                <div className="resource">Complexity: <span>{formatNumber(state.complexity)}</span></div>
                <div className="resource">Energy: <span>{formatNumber(state.energy)}</span></div>
                <div className="resource">Knowledge: <span>{formatNumber(state.knowledge)}</span></div>
                <div className="resource">Unity: <span>{formatNumber(state.unity)}</span></div>
                <div className="resource">Karma: <span>{state.karma}</span></div>
            </div>

            <div className="bottom-bar">
                <div className="era-display" data-tutorial-id="eras">
                    <h3>Era: {currentEra.name}</h3>
                    {ERAS[state.currentEra + 1] && (
                        <div className="progress-bar">
                           <div 
                              className="progress-bar-fill" 
                              style={{ width: `${Math.min(100, (state.complexity / ERAS[state.currentEra + 1].unlockThreshold) * 100)}%` }}
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