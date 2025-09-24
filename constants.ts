import { Upgrade, Chapter, TutorialStep, CrossroadsEvent, GameState } from './types';

export const UPGRADES: Upgrade[] = [
  {
    id: 'basic_physics',
    title: 'Basic Physics',
    description: 'Understand the fundamental forces of the universe.',
    cost: { knowledge: 10 },
    chapter: 0,
    effect: (gs) => ({ ...gs, complexity: gs.complexity + 5 }),
  },
  {
    id: 'star_formation',
    title: 'Star Formation',
    description: 'Ignite the first stars, turning hydrogen into light and heat.',
    cost: { energy: 50, knowledge: 20 },
    prerequisites: ['basic_physics'],
    chapter: 0,
    effect: (gs) => ({ ...gs, energy: gs.energy + 100 }),
  },
  {
    id: 'planetary_accretion',
    title: 'Planetary Accretion',
    description: 'Form rocky bodies from stellar dust clouds.',
    cost: { energy: 30, knowledge: 40 },
    prerequisites: ['star_formation'],
    chapter: 0,
    effect: (gs) => ({ ...gs }),
  },
  {
    id: 'spark_of_life',
    title: 'Spark of Life',
    description: 'A miraculous confluence of chemistry and energy creates the first replicating organisms.',
    cost: { energy: 100, knowledge: 100 },
    prerequisites: ['planetary_accretion'],
    chapter: 1,
    effect: (gs) => ({ ...gs, unity: gs.unity + 10, karma: gs.karma + 10, activeMilestone: 'spark_of_life' }),
  },
  {
    id: 'panspermia',
    title: 'Panspermia',
    description: 'Seed life across the cosmos on the backs of comets and asteroids.',
    cost: { knowledge: 150, unity: 20 },
    prerequisites: ['spark_of_life'],
    exclusiveWith: ['mycorrhizal_networks'],
    chapter: 1,
    effect: (gs) => ({ ...gs, unity: gs.unity + 50, activeMilestone: 'panspermia' }),
    karmaRequirement: (k) => k > 0,
    karmaRequirementText: "Requires Positive Karma (Expansionist)",
  },
  {
    id: 'mycorrhizal_networks',
    title: 'Mycorrhizal Networks',
    description: 'Develop a planet-wide fungal network, creating a unified superorganism.',
    cost: { knowledge: 150, unity: 20 },
    prerequisites: ['spark_of_life'],
    exclusiveWith: ['panspermia'],
    chapter: 1,
    effect: (gs) => ({ ...gs, unity: gs.unity + 50, activeMilestone: 'mycorrhizal_networks' }),
    karmaRequirement: (k) => k < 0,
    karmaRequirementText: "Requires Negative Karma (Isolationist)",
  },
  {
    id: 'quantum_computing',
    title: 'Quantum Computing',
    description: 'Harness the strange laws of the quantum realm to process information.',
    cost: { knowledge: 500, data: 100 },
    chapter: 2,
    prerequisites: [],
    effect: (gs) => ({ ...gs, data: gs.data + 200 }),
  },
  {
    id: 'galactic_federation',
    title: 'Galactic Federation',
    description: 'Unite countless civilizations into a harmonious, star-spanning alliance that works as one.',
    cost: { knowledge: 1000, unity: 500, data: 300 },
    prerequisites: ['quantum_computing'],
    exclusiveWith: ['von_neumann_probes'],
    chapter: 2,
    effect: (gs) => ({ ...gs, unity: gs.unity + 250, notifications: [...gs.notifications, "A new era of cosmic cooperation has begun."] }),
    karmaRequirement: (k) => k >= 50,
    karmaRequirementText: "Requires High Harmony (Karma >= 50)",
  },
  {
    id: 'von_neumann_probes',
    title: 'Von Neumann Probes',
    description: 'Unleash self-replicating machines that convert all matter into pure computation and complexity.',
    cost: { knowledge: 1000, complexity: 500, data: 300 },
    prerequisites: ['quantum_computing'],
    exclusiveWith: ['galactic_federation'],
    chapter: 2,
    effect: (gs) => ({ ...gs, complexity: gs.complexity + 250, notifications: [...gs.notifications, "The great work of universal conversion has begun."] }),
    karmaRequirement: (k) => k <= -50,
    karmaRequirementText: "Requires High Chaos (Karma <= -50)",
  },
];

export const CHAPTERS: Chapter[] = [
  {
    id: 0,
    name: "The Lonely Cosmos",
    description: "The universe is cold, dark, and empty. Bring forth the first light.",
    unlockCondition: () => true,
  },
  {
    id: 1,
    name: "The Dawn of Life",
    description: "From inanimate matter, a spark of something new. Nurture it.",
    unlockCondition: (gs) => gs.unlockedUpgrades.has('planetary_accretion'),
  },
  {
    id: 2,
    name: "The Rise of Intelligence",
    description: "Consciousness begins to ponder its own existence.",
    unlockCondition: (gs) => gs.unlockedUpgrades.has('panspermia') || gs.unlockedUpgrades.has('mycorrhizal_networks'),
  },
];

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    text: "Welcome, Universal Consciousness. You begin with <strong>Energy</strong> and <strong>Knowledge</strong>. Use them to shape reality.",
    highlight: '#resource-bar',
  },
  {
    text: "Click here to open the <strong>Knowledge Web</strong>, where you can unlock new concepts and abilities.",
    highlight: '#upgrade-button',
  },
  {
    text: "This is an <strong>Upgrade</strong>. It costs resources to unlock. Let's unlock 'Basic Physics'.",
    highlight: '[data-tutorial-id="basic_physics"]',
  },
  {
    text: "Excellent. New possibilities have opened. Explore the Knowledge Web and guide the cosmos on its journey.",
    highlight: '.bg-gray-900.border.border-purple-500', 
  },
];

export const CROSSROADS_EVENTS: CrossroadsEvent[] = [
    {
        id: 'first_contact',
        title: 'First Contact',
        description: 'A fledgling civilization has detected signs of your influence. How do you respond?',
        trigger: (gs) => gs.unlockedUpgrades.has('panspermia') && !gs.unlockedUpgrades.has('contact_made'),
        optionA: {
            text: 'Reveal yourself as a benevolent guide.',
            effect: (gs) => ({ ...gs, karma: gs.karma + 25, unity: gs.unity + 50, notifications: [...gs.notifications, "They call you 'The Gardener'."] }),
        },
        optionB: {
            text: 'Remain a silent, unknowable observer.',
            effect: (gs) => ({ ...gs, karma: gs.karma - 25, knowledge: gs.knowledge + 50, notifications: [...gs.notifications, "Your existence remains a haunting mystery."] }),
        }
    }
];