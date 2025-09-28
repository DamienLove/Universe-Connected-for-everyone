// This file was created by inferring types from their usage in other files.

export interface GameNode {
  id: string;
  label: string;
  type: string; // e.g., 'star', 'rocky_planet', 'player_consciousness'
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: string[];
  hasLife: boolean;
  imageUrl?: string;
}

export interface QuantumPhage {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    targetNodeId: string | null;
    state: 'seeking' | 'draining';
}

export interface ConnectionParticle {
  id:string;
  sourceId: string;
  targetId: string;
  progress: number;
  speed: number;
}

export interface ConnectionPulse {
  id: string;
  sourceId: string;
  targetId: string;
  progress: number;
}

export interface EnergyOrb {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface GameState {
  // Game state
  gameStarted: boolean;
  isPaused: boolean;

  // Resources
  energy: number;
  knowledge: number;
  biomass: number;
  unity: number;
  complexity: number;
  data: number;
  karma: number; // -100 (chaos) to 100 (harmony)

  // Game Progression
  unlockedUpgrades: Set<string>;
  currentChapter: number;
  tutorialStep: number;
  activeMilestone: string | null;
  activeCrossroadsEvent: CrossroadsEvent | null;

  // Simulation Objects
  nodes: GameNode[];
  phages: QuantumPhage[];

  // UI State
  notifications: string[];
  connectMode: {
    active: boolean;
    sourceNodeId: string | null;
  };
  
  // UI State for new features
  selectedNodeId: string | null;
  loreState: {
    nodeId: string | null;
    text: string;
    isLoading: boolean;
  };

  // Visual Effects
  connectionParticles: ConnectionParticle[];
  connectionPulses: ConnectionPulse[];
  energyOrbs: EnergyOrb[];
}

export interface Upgrade {
  id: string;
  title: string;
  description: string;
  cost: {
    energy?: number;
    knowledge?: number;
    biomass?: number;
    unity?: number;
    complexity?: number;
    data?: number;
  };
  chapter: number;
  effect: (gameState: GameState, imageUrl?: string) => GameState;
  prerequisites?: string[];
  exclusiveWith?: string[];
  karmaRequirement?: (karma: number) => boolean;
  karmaRequirementText?: string;
  generatesNodeType?: 'star' | 'rocky_planet';
}

export interface Chapter {
  id: number;
  name: string;
  description: string;
  unlockCondition: (gameState: GameState) => boolean;
}

export interface TutorialStep {
  text: string;
  highlight: string;
}

export interface CrossroadsEvent {
  id: string;
  title: string;
  description: string;
  trigger: (gameState: GameState) => boolean;
  optionA: {
    text: string;
    effect: (gameState: GameState) => GameState;
  };
  optionB: {
    text: string;
    effect: (gameState: GameState) => GameState;
  };
}

export type GameAction =
  | { type: 'TICK'; payload: { width: number; height: number; mousePos: { x: number; y: number } } }
  | { type: 'PURCHASE_UPGRADE'; payload: { upgrade: Upgrade, imageUrl?: string } }
  | { type: 'ADVANCE_TUTORIAL'; payload?: { forceEnd?: boolean } }
  | { type: 'DISMISS_NOTIFICATION'; payload: { index: number } }
  | { type: 'MILESTONE_COMPLETE' }
  | { type: 'START_CONNECTION_MODE'; payload: { sourceId: string } }
  | { type: 'CANCEL_CONNECTION_MODE' }
  | { type: 'CREATE_CONNECTION'; payload: { targetId: string } }
  | { type: 'RESOLVE_CROSSROADS'; payload: { choiceEffect: (gs: GameState) => GameState } }
  | { type: 'START_GAME' }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SELECT_NODE'; payload: { nodeId: string | null } }
  | { type: 'SET_LORE_LOADING'; payload: { nodeId: string } }
  | { type: 'SET_LORE_RESULT'; payload: { nodeId: string, text: string } }
  | { type: 'CLEAR_LORE' }
  | { type: 'HUNT_PHAGE'; payload: { phageId: string } };