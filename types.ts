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
  entangledWith?: string;
  imageUrl?: string; // New: For high-resolution generated images
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
  chapter: number;
  prerequisites?: string[];
  effect?: (gameState: GameState) => GameState;
  crossroadsId?: string; // New: Triggers a narrative choice event instead of a direct effect
  karmaRequirement?: (karma: number) => boolean;
  karmaRequirementText?: string;
  exclusiveWith?: string[];
}

export interface Chapter {
  id: number;
  name: string;
  unlockThreshold: number;
  quote: string;
}

export interface CosmicEvent {
  type: 'distant_supernova' | 'asteroid_impact' | 'gamma_ray_burst';
  duration: number; // in ticks
  remaining: number; // in ticks
  x: number; // position for visual effect
  y: number;
  targetId?: string; // e.g., planet ID for impact
}

export interface CosmicAnomaly {
    id: string;
    x: number;
    y: number;
    size: number;
    type: 'energy' | 'complexity' | 'knowledge';
    lifespan: number; // in ticks
}

export interface CrossroadsEvent {
  id: string;
  title: string;
  description: string;
  sourceUpgrade: string;
  optionA: {
    text: string;
    effect: (gs: GameState) => GameState;
  };
  optionB: {
    text: string;
    effect: (gs: GameState) => GameState;
  };
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
  currentChapter: number;
  activeMilestone: string | null;

  // Simulation
  nodes: GameNode[];
  tick: number;
  activeCosmicEvent: CosmicEvent | null;
  isQuantumFoamActive: boolean;
  lastTunnelEvent: { nodeId: string; tick: number } | null;
  anomalies: CosmicAnomaly[];

  // Game Flow
  gameStarted: boolean;

  // UI State
  notifications: string[];
  isUpgradeModalOpen: boolean;
  tutorialStep: number;
  activeCrossroadsEvent: CrossroadsEvent | null;
  selectedNodeId: string | null;
}

// Actions for the game reducer
export type GameAction =
  | { type: 'TICK'; payload: { width: number; height: number } }
  | { type: 'PURCHASE_UPGRADE'; payload: Upgrade }
  | { type: 'TOGGLE_UPGRADE_MODAL' }
  | { type: 'DISMISS_NOTIFICATION' }
  | { type: 'ADVANCE_TUTORIAL' }
  | { type: 'COMPLETE_MILESTONE' }
  | { type: 'START_GAME' }
  | { type: 'CLICK_ANOMALY'; payload: { id: string } }
  | { type: 'RESOLVE_CROSSROADS'; payload: { choiceEffect: (gs: GameState) => GameState } }
  | { type: 'SELECT_NODE'; payload: { id: string } }
  | { type: 'DESELECT_NODE' }
  | { type: 'SET_NODE_IMAGE'; payload: { nodeTypeKey: string; imageUrl: string } }; // New action for images