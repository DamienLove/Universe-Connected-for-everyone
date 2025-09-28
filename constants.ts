import { Upgrade, Chapter, TutorialStep, CrossroadsEvent, GameState, GameNode } from './types';

export const UPGRADES: Upgrade[] = [
  // CHAPTER 0
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
    generatesNodeType: 'star',
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
  {
    id: 'planetary_accretion',
    title: 'Planetary Accretion',
    description: 'Form rocky bodies from stellar dust clouds.',
    cost: { energy: 30, knowledge: 40 },
    prerequisites: ['star_formation'],
    chapter: 0,
    generatesNodeType: 'rocky_planet',
    effect: (gs, imageUrl) => {
      const stars = gs.nodes.filter(n => n.type === 'star');
      if (stars.length === 0) return gs; // No star to orbit
      const parentStar = stars[Math.floor(Math.random() * stars.length)];

      const angle = Math.random() * Math.PI * 2;
      const distance = parentStar.radius + 80 + Math.random() * 40;
      const newPlanet: GameNode = {
        id: `planet_${gs.nodes.length}_${Date.now()}`,
        label: 'Rocky Planet',
        type: 'rocky_planet',
        x: parentStar.x + Math.cos(angle) * distance,
        y: parentStar.y + Math.sin(angle) * distance,
        radius: 10 + Math.random() * 5,
        connections: [parentStar.id],
        hasLife: false,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        imageUrl: imageUrl,
      };
      
      const updatedNodes = gs.nodes.map(node => {
          if (node.id === parentStar.id) {
              return { ...node, connections: [...node.connections, newPlanet.id] };
          }
          return node;
      });

      return { ...gs, nodes: [...updatedNodes, newPlanet] };
    },
  },
  // CHAPTER 1
  {
    id: 'spark_of_life',
    title: 'Spark of Life',
    description: 'A miraculous confluence of chemistry and energy creates the first replicating organisms on a planet.',
    cost: { energy: 100, knowledge: 100 },
    prerequisites: ['planetary_accretion'],
    chapter: 1,
    effect: (gs) => {
      const lifelessPlanets = gs.nodes.filter(n => n.type === 'rocky_planet' && !n.hasLife);
      let newNodes = gs.nodes;

      if (lifelessPlanets.length > 0) {
        const targetPlanet = lifelessPlanets[Math.floor(Math.random() * lifelessPlanets.length)];
        newNodes = gs.nodes.map(node => 
            node.id === targetPlanet.id ? { ...node, hasLife: true, type: 'life_seed' } : node
        );
      }
      
      return { ...gs, nodes: newNodes, unity: gs.unity + 10, karma: gs.karma + 10, activeMilestone: 'spark_of_life' };
    },
  },
  {
    id: 'cellular_specialization',
    title: 'Cellular Specialization',
    description: 'Encourage your Life Seeds to develop specialized cells, greatly increasing their Biomass production.',
    cost: { biomass: 50, knowledge: 50 },
    chapter: 1,
    effect: (gs) => ({ ...gs, notifications: [...gs.notifications, "Your creations are becoming more efficient."] }),
  },
  {
    id: 'eukaryotic_evolution',
    title: 'Eukaryotic Evolution',
    description: 'A breakthrough in cellular complexity. Your Life Seeds can now evolve into Sentient Colonies.',
    cost: { biomass: 200, knowledge: 150 },
    prerequisites: ['cellular_specialization'],
    chapter: 1,
    effect: (gs) => {
        const lifeSeeds = gs.nodes.filter(n => n.type === 'life_seed');
        let newNodes = gs.nodes;
        if(lifeSeeds.length > 0) {
            const target = lifeSeeds[0];
            newNodes = gs.nodes.map(n => n.id === target.id ? {...n, type: 'sentient_colony', label: 'Sentient Colony'} : n);
        }
        return { ...gs, nodes: newNodes, complexity: gs.complexity + 50, notifications: [...gs.notifications, "A new evolutionary path has opened."] };
    },
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
  // CHAPTER 2
  {
    id: 'collective_intelligence',
    title: 'Collective Intelligence',
    description: 'Your Sentient Colonies develop a shared consciousness, generating Unity as they contemplate the cosmos.',
    cost: { biomass: 500, unity: 100 },
    prerequisites: ['eukaryotic_evolution'],
    chapter: 2,
    effect: (gs) => ({ ...gs, notifications: [...gs.notifications, "The colonies have begun to think as one."] }),
  },
  {
    id: 'quantum_computing',
    title: 'Quantum Computing',
    description: 'Harness the strange laws of the quantum realm to process information.',
    cost: { knowledge: 500, data: 100 },
    chapter: 2,
    prerequisites: [],
    effect: (gs) => ({ ...gs, data: gs.data + 200, notifications: [...gs.notifications, "Quantum Phages have been detected."] }),
  },
  {
    id: 'galactic_federation',
    title: 'Galactic Federation',
    description: 'Unite countless civilizations into a harmonious, star-spanning alliance that works as one.',
    cost: { knowledge: 1000, unity: 500, data: 300 },
    prerequisites: ['quantum_computing'],
    exclusiveWith: ['von_neumann_probes'],
    chapter: 2,
    effect: (gs) => ({ ...gs, unity: gs.unity + 250, activeMilestone: 'the_great_zoom_out' }),
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
    effect: (gs) => ({ ...gs, complexity: gs.complexity + 250, activeMilestone: 'the_great_zoom_out' }),
    karmaRequirement: (k) => k <= -50,
    karmaRequirementText: "Requires High Chaos (Karma <= -50)",
  },
  // CHAPTER 3
  {
    id: 'holographic_principle',
    title: 'Holographic Principle',
    description: 'Understand that all the information in a volume of space can be represented by a theory on the boundary of that region. The universe is a hologram. You are the universe.',
    cost: { data: 2000, unity: 1000, knowledge: 2000 },
    prerequisites: ['galactic_federation', 'von_neumann_probes'],
    chapter: 3,
    effect: (gs) => ({...gs, activeMilestone: 'final_realization'}) // A hypothetical final win state
  }
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
    unlockCondition: (gs) => gs.unlockedUpgrades.has('panspermia') || gs.unlockedUpgrades.has('mycorrhizal_networks') || gs.unlockedUpgrades.has('eukaryotic_evolution'),
  },
  {
    id: 3,
    name: "The Marble",
    description: "The nature of reality is not what it seems.",
    unlockCondition: (gs) => gs.unlockedUpgrades.has('galactic_federation') || gs.unlockedUpgrades.has('von_neumann_probes'),
  }
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