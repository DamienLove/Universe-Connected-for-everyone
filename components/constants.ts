import { Upgrade, Chapter, TutorialStep, CrossroadsEvent, GameState, GameNode, NodeType } from '../types';

// Base64 encoded SVGs for node types
const NODE_IMAGES = {
  player_consciousness: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciIGcxPSIxMDAlIiBnMj0iMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwZmZmZmYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmZmYiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==',
  star: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciIGcxPSIxMDAlIiBnMj0iMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZmI0MDAiLz48c3RvcCBvZmZzZXQ9IjgwJSIgc3RvcC1jb2xvcj0iI2ZmZGEwMCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmZiIvPjwvcmFkaWFsR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQ1IiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+',
  rocky_planet: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM1YzRjM2MiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM4ZDc1NjMiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0idXJsKCNnKSIvPjxjaXJjbGUgY3g9IjcwIiBjeT0iMzAiIHI9IjEwIiBmaWxsPSIjNWM0YzNjIi8+PGNpcmNsZSBjeD0iMzUiIGN5PSI3MCIgcj0iNyIgZmlsbD0iIzVjNGMzYyIvPjxjaXJjbGUgY3g9IjI1IiBjeT0iMzUiIHI9IjUiIGZpbGw9IiM1YzRjM2MiLz48L3N2Zz4=',
  life_seed: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwMDZkYmYiLz48c3RvcCBvZmZzZXQ9IjgwJSIgc3RvcC1jb2xvcj0iIzIxYTFiNyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2FmZiIvPjwvcmFkaWFsR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQ4IiBmaWxsPSJ1cmwoI2cpIi8+PHBhdGggZD0iTTMwIDcwIEMgNDAgNDAsIDYwIDgwLCA3MCAzMCIgc3Ryb2tlPSIjMGFhM2Q0IiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiIHN0cm9rZS1vcGFjaXR5PSIwLjciLz48cGF0aCBkPSJNNjAgODAgQyA4MCA2MCwgNzAgMjAsIDQwIDIwIiBzdHJva2U9IiMwYWEzZDQiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLW9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==',
  sentient_colony: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2ZjQyYzUiLz48c3RvcCBvZmZzZXQ9IjgwJSIgc3RvcC1jb2xvcj0iI2E4NTVmNyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2Y5ZTVmZiIvPjwvcmFkaWFsR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQ4IiBmaWxsPSJ1cmwoI2cpIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSIyMCIgcj0iNSIgZmlsbD0iI2Y5ZTVmZiIgb3BhY2l0eT0iMC44Ii8+PGNpcmNsZSBjeD0iMjUiIGN5PSI3MCIgcj0iNSIgZmlsbD0iI2Y5ZTVmZiIgb3BhY2l0eT0iMC44Ii8+PGNpcmNsZSBjeD0iNzUiIGN5PSI3MCIgcj0iNSIgZmlsbD0iI2Y5ZTVmZiIgb3BhY2l0eT0iMC44Ii8+PGxpbmUgeDE9IjUwIiB5MT0iMjAiIHgyPSIyNSIgeTI9IjcwIiBzdHJva2U9IiNmOWU1ZmYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC42Ii8+PGxpbmUgeDE9IjI1IiB5MT0iNzAiIHgyPSI3NSIgeTI9IjcwIiBzdHJva2U9IiNmOWU1ZmYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC42Ii8+PGxpbmUgeDE9Ijc1IiB5MT0iNzAiIHgyPSI1MCIgeTE9IjIwIiBzdHJva2U9IiNmOWU1ZmYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC42Ii8+PC9zdmc+',
};

export const NODE_IMAGE_MAP: Record<NodeType, string[]> = {
    player_consciousness: [NODE_IMAGES.player_consciousness],
    star: [NODE_IMAGES.star],
    rocky_planet: [NODE_IMAGES.rocky_planet],
    life_seed: [NODE_IMAGES.life_seed],
    sentient_colony: [NODE_IMAGES.sentient_colony],
};

const getRandomImage = (nodeType: NodeType): string | undefined => {
    const images = NODE_IMAGE_MAP[nodeType];
    if (!images || images.length === 0) return undefined;
    return images[Math.floor(Math.random() * images.length)];
};

export const UPGRADES: Upgrade[] = [
  // CHAPTER 0: The Void
  {
    id: 'basic_physics',
    title: 'Basic Physics',
    description: 'Understand the fundamental forces of the universe.',
    cost: { knowledge: 10 },
    chapter: 0,
    effect: (gs) => ({ ...gs, complexity: gs.complexity + 5 }),
    animationId: 'basic_physics',
  },
  {
    id: 'star_formation',
    title: 'Star Formation',
    description: 'Ignite the first stars, turning hydrogen into light and heat.',
    cost: { energy: 50, knowledge: 20 },
    prerequisites: ['basic_physics'],
    chapter: 0,
    generatesNodeType: 'star',
    animationId: 'star_formation',
    effect: (gs, imageUrl) => {
      const newStar: GameNode = {
        id: `star_${gs.nodes.length}_${Date.now()}`,
        label: 'Newborn Star',
        type: 'star',
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 800,
        radius: 30 + Math.random() * 15,
        connections: [],
        hasLife: false,
        vx: (Math.random() - 0.5) * 0.2, 
        vy: (Math.random() - 0.5) * 0.2,
        imageUrl: imageUrl || getRandomImage('star'),
      };
      return { ...gs, energy: gs.energy + 100, nodes: [...gs.nodes, newStar] };
    },
  },
  // CHAPTER 1: Age of Matter
  {
    id: 'planetary_accretion',
    title: 'Planetary Accretion',
    description: 'Coalesce cosmic dust and rock into planetary bodies.',
    cost: { energy: 200, complexity: 10 },
    prerequisites: ['star_formation'],
    chapter: 1,
    generatesNodeType: 'rocky_planet',
    animationId: 'planetary_accretion',
    effect: (gs, imageUrl) => {
      const star = gs.nodes.find(n => n.type === 'star');
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 100;
      const newPlanet: GameNode = {
        id: `planet_${gs.nodes.length}_${Date.now()}`,
        label: 'Barren World',
        type: 'rocky_planet',
        x: star ? star.x + Math.cos(angle) * dist : (Math.random() - 0.5) * 800,
        y: star ? star.y + Math.sin(angle) * dist : (Math.random() - 0.5) * 800,
        radius: 10 + Math.random() * 5,
        connections: [],
        hasLife: false,
        vx: 0, vy: 0,
        imageUrl: imageUrl || getRandomImage('rocky_planet'),
      };
      return { ...gs, nodes: [...gs.nodes, newPlanet] };
    },
  },
  // CHAPTER 2: The Spark of Life
  {
    id: 'spark_of_life',
    title: 'Spark of Life',
    description: 'Catalyze the chemical reactions needed for life to emerge in primordial oceans.',
    cost: { energy: 500, knowledge: 100 },
    prerequisites: ['planetary_accretion'],
    chapter: 2,
    modifiesNodeTypeTarget: 'life_seed',
    karmaRequirement: (k) => k >= 0,
    karmaRequirementText: 'Requires Harmonic Karma',
    exclusiveWith: ['panspermia'],
    animationId: 'spark_of_life',
    effect: (gs, imageUrl) => {
      const target = gs.nodes.find(n => n.type === 'rocky_planet' && !n.hasLife);
      if (target) {
        target.hasLife = true;
        target.label = 'Primordial World';
        target.type = 'life_seed';
        target.imageUrl = imageUrl || getRandomImage('life_seed');
      }
      return { ...gs, biomass: gs.biomass + 10, karma: gs.karma + 10 };
    },
  },
  {
    id: 'panspermia',
    title: 'Panspermia',
    description: 'Life is a traveler. Guide extremophilic microbes across the void to seed new worlds.',
    cost: { energy: 300, knowledge: 150 },
    prerequisites: ['planetary_accretion'],
    chapter: 2,
    modifiesNodeTypeTarget: 'life_seed',
    karmaRequirement: (k) => k <= 0,
    karmaRequirementText: 'Requires Chaotic Karma',
    exclusiveWith: ['spark_of_life'],
    animationId: 'panspermia',
    effect: (gs, imageUrl) => {
      const target = gs.nodes.find(n => n.type === 'rocky_planet' && !n.hasLife);
      if (target) {
        target.hasLife = true;
        target.label = 'Seeded World';
        target.type = 'life_seed';
        target.imageUrl = imageUrl || getRandomImage('life_seed');
      }
      return { ...gs, biomass: gs.biomass + 10, karma: gs.karma - 10 };
    },
  },
  // CHAPTER 3: Ascent of Consciousness
  {
    id: 'eukaryotic_evolution',
    title: 'Eukaryotic Evolution',
    description: 'Foster symbiotic relationships that lead to complex cellular structures.',
    cost: { biomass: 200, knowledge: 200 },
    chapter: 3,
    animationId: 'eukaryotic_evolution',
    effect: (gs) => {
        return { ...gs, complexity: gs.complexity + 50 };
    },
  },
  {
    id: 'cellular_specialization',
    title: 'Cellular Specialization',
    description: 'Cells learn to perform different functions, leading to multicellular organisms.',
    cost: { biomass: 500, knowledge: 300 },
    chapter: 3,
    effect: (gs) => ({ ...gs, complexity: gs.complexity + 100 }),
  },
  {
    id: 'collective_intelligence',
    title: 'Collective Intelligence',
    description: 'Individual minds connect, forming a single, more powerful consciousness.',
    cost: { unity: 100, knowledge: 500 },
    chapter: 3,
    modifiesNodeTypeTarget: 'sentient_colony',
    animationId: 'collective_intelligence',
    effect: (gs, imageUrl) => {
        const target = gs.nodes.find(n => n.type === 'life_seed');
        if (target) {
            target.label = 'Sentient Colony';
            target.type = 'sentient_colony';
            target.imageUrl = imageUrl || getRandomImage('sentient_colony');
        }
        return { ...gs, karma: gs.karma + 20 };
    }
  },
  // CHAPTER 4: Transcending Matter
  {
    id: 'quantum_computing',
    title: 'Quantum Computing',
    description: 'Harness the strange laws of the quantum realm to perform impossible calculations.',
    cost: { complexity: 500, data: 200, knowledge: 1000 },
    chapter: 4,
    animationId: 'quantum_computing',
    effect: (gs) => ({ ...gs }),
  },
  {
    id: 'quantum_tunneling',
    title: 'Quantum Tunneling',
    description: 'Bend spacetime to travel instantaneously between connected nodes.',
    cost: { energy: 5000, data: 1000 },
    prerequisites: ['quantum_computing'],
    chapter: 4,
    animationId: 'quantum_tunneling',
    effect: (gs) => {
        const newNodes = gs.nodes.map(n => ({...n, canTunnel: true}));
        return { ...gs, nodes: newNodes };
    },
  },
  {
    id: 'the_great_zoom_out',
    title: 'The Great Zoom Out',
    description: 'Perceive the true nature of reality.',
    cost: { unity: 1000, knowledge: 5000, data: 5000 },
    prerequisites: ['quantum_tunneling'],
    chapter: 4,
    animationId: 'the_great_zoom_out',
    effect: (gs) => ({ ...gs }),
  }
];

// FIX: Added missing CHAPTERS, TUTORIAL_STEPS, and CROSSROADS_EVENTS exports.
export const CHAPTERS: Chapter[] = [
    {
      id: 0, name: "The Void", 
      description: "Before time, before light, there was only you. A potential waiting to unfold.",
      unlockCondition: (gs: GameState) => true,
      objective: "Ignite the first star.",
      quote: "In the beginning, there was nothing. And it was boring.",
      entityType: 'gas',
    },
    {
      id: 1, name: "Age of Matter",
      description: "From the first spark of fusion, the universe begins to take form.",
      unlockCondition: (gs: GameState) => gs.nodes.some(n => n.type === 'star'),
      objective: "Form a planetary body.",
      quote: "Let there be light.",
      entityType: 'single',
    },
    {
      id: 2, name: "The Spark of Life",
      description: "On silent worlds, a new possibility emerges. A fragile, chemical miracle.",
      unlockCondition: (gs: GameState) => gs.nodes.some(n => n.type === 'rocky_planet'),
      objective: "Seed a barren world with life.",
      quote: "The universe is not required to be in perfect harmony with human ambition.",
      entityType: 'single',
    },
    {
      id: 3, name: "Ascent of Consciousness",
      description: "Life begins to look inward, to question, to connect.",
      unlockCondition: (gs: GameState) => gs.nodes.some(n => n.hasLife),
      objective: "Evolve a sentient colony.",
      quote: "We are a way for the cosmos to know itself.",
      entityType: 'multi',
    },
    {
        id: 4, name: "Transcending Matter",
        description: "The boundaries of physical law begin to blur.",
        unlockCondition: (gs: GameState) => gs.unlockedUpgrades.has('collective_intelligence'),
        objective: "Perceive the true nature of reality.",
        quote: "Any sufficiently advanced technology is indistinguishable from magic.",
        entityType: 'universal',
    }
];

export const TUTORIAL_STEPS: TutorialStep[] = [
    { text: "Welcome. Your journey begins. <strong>Click your consciousness</strong> to prepare for movement.", highlight: '[data-node-id="player_consciousness"]' },
    { text: "A directional line is now spinning around you. <strong>Click anywhere</strong> to set your trajectory.", highlight: '.simulation-container' },
    { text: "Now set your launch power. <strong>Click again</strong> when the meter reaches the desired strength.", highlight: '#power-meter-container' },
    { text: "You are now in motion. Collide with objects to interact. You will reform after coming to a stop.", highlight: '.simulation-container' },
    { text: "Unlock new abilities in the <strong>Upgrades</strong> panel. May your journey be infinite.", highlight: '.action-button:first-of-type' },
];

export const CROSSROADS_EVENTS: CrossroadsEvent[] = [
    {
        id: 'primordial_soup_choice',
        title: 'A Fork in the Primordial Soup',
        description: 'A life-bearing planet is on the verge of a breakthrough. Do you guide its evolution toward fierce, competitive individualism or cooperative, symbiotic harmony?',
        trigger: (gs: GameState) => gs.unlockedUpgrades.has('eukaryotic_evolution') && gs.biomass > 1000 && !gs.unlockedUpgrades.has('predation') && !gs.unlockedUpgrades.has('mycorrhizal_networks'),
        optionA: {
            text: 'Embrace Competition',
            effect: (gs: GameState) => ({ ...gs, karma: gs.karma - 15, notifications: [...gs.notifications, 'A new age of predators and prey begins.'] }),
        },
        optionB: {
            text: 'Foster Symbiosis',
            effect: (gs: GameState) => ({ ...gs, karma: gs.karma + 15, notifications: [...gs.notifications, 'The planet begins to weave itself into a single, complex network.'] }),
        }
    }
];