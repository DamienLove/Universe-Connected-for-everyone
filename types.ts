
export interface GameNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  connections: string[];
  hasLife: boolean;
  imageUrl?: string;
  evolutionProgress?: number;
  orbit?: {
    parentId: string;
    distance: number;
    angle: number;
    speed: number;
  };
  vx?: number;
  vy?: number;
}

export interface EnergyOrb {
  id:string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
}

export interface ConnectionParticle {
  id: string;
  sourceId: string;
  targetId: string;
  progress: number; // 0 to 1
  life: number;
}

export interface ConnectionPulse {
  id: string;
  sourceId: string;
  targetId: string;
  progress: number; // 0 to 1
  life: number;
}

export interface Upgrade {
  id: string;
  title: string;
  description: string;
  cost: {
    energy?: number;
    knowledge?: number;
    unity?: number;
    complexity?: number;
    data?: number;
    biomass?: number;
  };
  prerequisites?: string[];
  exclusiveWith?: string[];
  karmaRequirement?: (karma: number) => boolean;
  karmaRequirementText?: string;
  chapter: number;
  effect: (gameState: GameState) => GameState;
}

export interface Chapter {
  id: number;
  name: string;
  description: string;
  unlockCondition: (state: GameState) => boolean;
}

export interface CrossroadsEvent {
  id: string;
  title: string;
  description: string;
  optionA: {
    text: string;
    effect: (gs: GameState) => GameState;
  };
  optionB: {
    text: string;
    effect: (gs: GameState) => GameState;
  };
  trigger: (gs: GameState) => boolean;
}

export interface TutorialStep {
  text: string;
  highlight: string;
}

export interface GameState {
  gameStarted: boolean;
  energy: number;
  knowledge: number;
  unity: number;
  complexity: number;
  data: number;
  biomass: number;
  karma: number;
  nodes: GameNode[];
  energyOrbs: EnergyOrb[];
  connectionParticles: ConnectionParticle[];
  connectionPulses: ConnectionPulse[];
  playerNodeId: string | null;
  unlockedUpgrades: Set<string>;
  currentChapter: number;
  chapters: Chapter[];
  connectMode: {
    active: boolean;
    sourceNodeId: string | null;
  };
  tutorialStep: number;
  activeMilestone: string | null;
  currentCrossroads: CrossroadsEvent | null;
  notifications: string[];
  selectedNodeId: string | null;
  showUpgradeModal: boolean;
}

export type GameAction =
  | { type: 'TICK'; payload: { width: number; height: number; mousePos: { x: number, y: number } } }
  | { type: 'START_GAME' }
  | { type: 'ADVANCE_TUTORIAL'; payload?: { forceEnd?: boolean } }
  | { type: 'RESOLVE_CROSSROADS'; payload: { choiceEffect: (gs: GameState) => GameState } }
  | { type: 'PURCHASE_UPGRADE'; payload: { upgrade: Upgrade } }
  | { type: 'NODE_CLICK'; payload: { nodeId: string | null } }
  | { type: 'TOGGLE_UPGRADE_MODAL'; payload?: { show?: boolean } }
  | { type: 'DISMISS_NOTIFICATION' }
  | { type: 'MILESTONE_COMPLETE' }
  | { type: 'SET_NODE_IMAGE'; payload: { nodeId: string; imageUrl: string } }
  | { type: 'DIVIDE_CONSCIOUSNESS' }
  | { type: 'START_CONNECTION_MODE'; payload: { sourceId: string } }
  | { type: 'CANCEL_CONNECTION_MODE' };