import { Upgrade, Chapter, TutorialStep, CrossroadsEvent, GameState, GameNode } from '../types';

// FIX: Completed the UPGRADES array, removing the malformed entry and adding new upgrades
// inferred from their usage in other components to flesh out the game's progression.
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
        imageUrl: imageUrl,
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
        imageUrl: imageUrl,
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
        if (imageUrl) target.imageUrl = imageUrl;
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
        if (imageUrl) target.imageUrl = imageUrl;
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
            if (imageUrl) target.imageUrl = imageUrl;
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
      quote: "In the beginning, there was nothing. And it was boring.",
      entityType: 'gas',
    },
    {
      id: 1, name: "Age of Matter",
      description: "From the first spark of fusion, the universe begins to take form.",
      unlockCondition: (gs: GameState) => gs.nodes.some(n => n.type === 'star'),
      quote: "Let there be light.",
      entityType: 'single',
    },
    {
      id: 2, name: "The Spark of Life",
      description: "On silent worlds, a new possibility emerges. A fragile, chemical miracle.",
      unlockCondition: (gs: GameState) => gs.nodes.some(n => n.type === 'rocky_planet'),
      quote: "The universe is not required to be in perfect harmony with human ambition.",
      entityType: 'single',
    },
    {
      id: 3, name: "Ascent of Consciousness",
      description: "Life begins to look inward, to question, to connect.",
      unlockCondition: (gs: GameState) => gs.nodes.some(n => n.hasLife),
      quote: "We are a way for the cosmos to know itself.",
      entityType: 'multi',
    },
    {
        id: 4, name: "Transcending Matter",
        description: "The boundaries of physical law begin to blur.",
        unlockCondition: (gs: GameState) => gs.unlockedUpgrades.has('collective_intelligence'),
        quote: "Any sufficiently advanced technology is indistinguishable from magic.",
        entityType: 'universal',
    }
];

export const TUTORIAL_STEPS: TutorialStep[] = [
    { text: "Welcome, nascent consciousness. The cosmos is yours to shape. <strong>Click anywhere</strong> to begin projecting your will.", highlight: '.simulation-container' },
    { text: "You are now aiming. An indicator shows your trajectory. <strong>Click again</strong> to lock in the angle and start charging your projection.", highlight: '.aim-indicator' },
    { text: "Now you are charging. <strong>Use your mouse wheel</strong> to adjust the launch power. <strong>Click a final time</strong> to launch.", highlight: '#power-meter-container' },
    { text: "Your projection reforms at your launch point. Explore to gather resources and find new worlds.", highlight: '.simulation-container' },
    { text: "This is a world, a potential nexus for your influence. <strong>Click on it</strong> to see your options.", highlight: '[data-node-id="tutorial_planet"]' },
    { text: "A radial menu has appeared. The 'Ask' button queries the Universal Consciousness for insight. <strong>Click the sparkling icon.</strong>", highlight: '[data-button-id="ask"]' },
    { text: "Unlock new abilities in the <strong>Upgrades</strong> panel. May your journey be infinite.", highlight: 'button:last-of-type' },
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