
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
  karma: number;
  nodes: GameNode[];
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
  | { type: 'TICK'; payload: { width: number; height: number } }
  | { type: 'START_GAME' }
  | { type: 'ADVANCE_TUTORIAL'; payload?: { forceEnd?: boolean } }
  | { type: 'RESOLVE_CROSSROADS'; payload: { choiceEffect: (gs: GameState) => GameState } }
  | { type: 'PURCHASE_UPGRADE'; payload: { upgrade: Upgrade } }
  | { type: 'NODE_CLICK'; payload: { nodeId: string | null } }
  | { type: 'TOGGLE_UPGRADE_MODAL'; payload?: { show?: boolean } }
  | { type: 'DISMISS_NOTIFICATION' }
  | { type: 'MILESTONE_COMPLETE' }
  | { type: 'CONNECT_NODE'; payload: { targetId: string } };
