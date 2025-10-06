// This file was created by inferring types from their usage in other files.

export interface ProjectionState {
  playerState: 'IDLE' | 'AIMING_DIRECTION' | 'AIMING_POWER' | 'PROJECTING' | 'REFORMING';
  aimAngle: number;
  power: number; // 0 to 100
  reformTimer: number;
}

export interface WorldTransform {
  x: number;
  y: number;
  scale: number;
}

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
  canTunnel?: boolean;
  tunnelingState?: {
    phase: 'out' | 'in';
    progress: number; // Ticks
    targetX: number;
    targetY: number;
  } | null;
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

export interface AnomalyParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // in ticks
}

export interface EnergyOrb {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isFromBloom?: boolean;
}

export interface CollectionEffect {
  id: string;
  x: number;
  y: number;
  radius: number;
  life: number; // in frames
}

export interface CollectionBloom {
  id: string;
  x: number;
  y: number;
  radius: number;
  life: number; // in frames
}

export interface CollectionFlare {
  id: string;
  x: number;
  y: number;
  life: number; // in frames
  angle: number; // in degrees
}

export interface ProjectileTrailParticle {
    id: string;
    x: number;
    y: number;
    life: number; // in ticks
}

export interface CosmicEvent {
  id: string;
  type: 'supernova' | 'gravitational_anomaly' | 'resource_bloom' | 'black_hole' | 'wave_of_harmony' | 'wave_of_discord';
  x?: number;
  y?: number;
  radius?: number;
  duration: number; // Ticks remaining
  strength?: number;
  targetNodeId?: string; // For supernova
  phase?: 'warning' | 'active'; // For multi-stage events like supernova
}

export interface CollectedItem {
  id: string;
  name: string;
  description: string;
  icon: string; // An identifier for the icon, e.g., a class name
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
  
  // Inventory
  inventory: CollectedItem[];

  // Game Progression
  unlockedUpgrades: Set<string>;
  currentChapter: number;
  tutorialStep: number;
  activeMilestone: { id: string; imageUrl?: string } | null;
  activeCrossroadsEvent: CrossroadsEvent | null;
  activeChapterTransition: number | null;
  zoomLevel: number; // New fractal progression level
  levelTransitionState: 'none' | 'cleared' | 'zooming';

  // Simulation Objects
  nodes: GameNode[];
  phages: QuantumPhage[];
  cosmicEvents: CosmicEvent[];

  // UI State
  notifications: string[];
  connectMode: {
    active: boolean;
    sourceNodeId: string | null;
  };
  
  // UI State for new features
  selectedNodeId: string | null;
  aimAssistTargetId: string | null;
  loreState: {
    nodeId: string | null;
    text: string;
    isLoading: boolean;
  };
  
  // New Player Control State
  projection: ProjectionState;

  // Visual Effects
  connectionParticles: ConnectionParticle[];
  energyOrbs: EnergyOrb[];
  collectionEffects: CollectionEffect[];
  collectionBlooms: CollectionBloom[];
  collectionFlares: CollectionFlare[];
  projectileTrailParticles: ProjectileTrailParticle[];
  screenShake: { intensity: number; duration: number };
  anomalyParticles: AnomalyParticle[];
  
  // New Settings
  settings: {
    sfxVolume: number;
    musicVolume: number;
    colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
    aimAssist: boolean;
  };
}

export type NodeType = 'star' | 'rocky_planet' | 'life_seed' | 'sentient_colony' | 'player_consciousness';

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
  generatesNodeType?: NodeType;
  modifiesNodeTypeTarget?: NodeType;
  animationId?: string;
}

export interface Chapter {
  id: number;
  name: string;
  description: string;
  unlockCondition: (gameState: GameState) => boolean;
  objective: string;
  quote: string;
  entityType: 'gas' | 'single' | 'multi' | 'universal';
}

export interface TutorialStep {
  text: string;
  highlight: string;
}

// FIX: Added missing CrossroadsEvent interface definition.
export interface CrossroadsEvent {
  id: string;
  title: string;
  description: string;
  trigger: (gs: GameState) => boolean;
  optionA: {
      text: string;
      effect: (gs: GameState) => GameState;
  };
  optionB: {
      text: string;
      effect: (gs: GameState) => GameState;
  };
}

export type GameAction =
  | { type: 'TICK'; payload: { width: number; height: number; transform: WorldTransform; } }
  | { type: 'PURCHASE_UPGRADE'; payload: { upgrade: Upgrade, imageUrl?: string } }
  | { type: 'ADVANCE_TUTORIAL'; payload?: { forceEnd?: boolean } }
  | { type: 'DISMISS_NOTIFICATION'; payload: { index: number } }
  | { type: 'MILESTONE_COMPLETE' }
  | { type: 'CANCEL_CONNECTION_MODE' }
  | { type: 'RESOLVE_CROSSROADS'; payload: { choiceEffect: (gs: GameState) => GameState } }
  | { type: 'START_GAME'; payload: { playerImageUrl: string } }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SELECT_NODE'; payload: { nodeId: string | null } }
  | { type: 'SET_LORE_LOADING'; payload: { nodeId: string } }
  | { type: 'SET_LORE_RESULT'; payload: { nodeId: string, text: string } }
  | { type: 'CLEAR_LORE' }
  | { type: 'HUNT_PHAGE'; payload: { phageId: string } }
  | { type: 'SAVE_GAME' }
  | { type: 'LOAD_GAME'; payload: GameState }
  | { type: 'CHANGE_SETTING'; payload: { key: keyof GameState['settings']; value: string | number | boolean } }
  | { type: 'START_LEVEL_TRANSITION' }
  | { type: 'COMPLETE_LEVEL_TRANSITION' }
  | { type: 'UPDATE_NODE_IMAGE'; payload: { nodeId: string, imageUrl: string } }
  | { type: 'END_CHAPTER_TRANSITION' }
  | { type: 'USE_ITEM'; payload: { itemId: string } }
  // Player Control Actions
  | { type: 'START_AIMING' }
  | { type: 'SET_DIRECTION' }
  | { type: 'LAUNCH_PLAYER' };