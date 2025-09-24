// FIX: Define all necessary types for the application to compile.

export interface GameNode {
  id: string;
  label: string;
  type: 'star' | 'planet' | 'proto_creature' | 'nebula' | 'consciousness' | 'black_hole' | 'sentient_ai';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  connections: string[];
  hasLife?: boolean;
  lifespan?: number; // in ticks
}

export interface ResourceCost {
  complexity?: number;
  energy?: number;
  knowledge?: number;
  unity?: number;
}

export interface Upgrade {
  id:string;
  title: string;
  description: string;
  cost: ResourceCost;
  era: number;
  prerequisites?: string[];
  effect: (gameState: GameState) => GameState;
  karmaRequirement?: (karma: number) => boolean;
  karmaRequirementText?: string;
  exclusiveWith?: string[];
}

export interface Era {
  id: number;
  name: string;
  unlockThreshold: number;
}

export interface GameState {
  // Core Resources
  complexity: number;
  energy: number;
  knowledge: number;
  unity: number;
  karma: number; // -100 (chaos) to 100 (harmony)

  // Progression
  unlockedUpgrades: Set<string>;
  currentEra: number;
  activeMilestone: string | null;

  // Simulation
  nodes: GameNode[];
  tick: number;

  // Game Flow
  gameStarted: boolean;

  // UI State
  notifications: string[];
  isUpgradeModalOpen: boolean;
  tutorialStep: number;
}

// Actions for the game reducer
export type GameAction =
  | { type: 'TICK'; payload: { width: number; height: number } }
  | { type: 'PURCHASE_UPGRADE'; payload: Upgrade }
  | { type: 'TOGGLE_UPGRADE_MODAL' }
  | { type: 'DISMISS_NOTIFICATION' }
  | { type: 'ADVANCE_TUTORIAL' }
  | { type: 'COMPLETE_MILESTONE' }
  | { type: 'START_GAME' };
