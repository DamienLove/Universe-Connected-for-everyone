import { Chapter, Upgrade, GameState, GameNode, CrossroadsEvent } from './types';

export const CHAPTERS: Chapter[] = [
  { id: 0, name: 'Chapter 1: The Primordial Spark', unlockThreshold: 0, quote: "In the beginning, there was only potential, a silent hum in the vast emptiness." },
  { id: 1, name: 'Chapter 2: The Seeds of Life', unlockThreshold: 250, quote: "Life is a traveler. It journeys across the void on ships of ice and rock, seeking fertile ground." },
  { id: 2, name: 'Chapter 3: The Evolutionary Tapestry', unlockThreshold: 2000, quote: "From a single thread, a billion paths. Each creature a unique answer to the question of existence." },
  { id: 3, name: 'Chapter 4: The Wood Wide Web', unlockThreshold: 15000, quote: "The planet began to think. A slow, silent, and deep intelligence, born from the connections between all living things." },
  { id: 4, name: 'Chapter 5: Quantum Consciousness', unlockThreshold: 100000, quote: "To know the universe is to know the self, and to know the self is to see the strings that dance behind reality." },
  { id: 5, name: 'Chapter 6: The Universe Connected', unlockThreshold: 500000, quote: "The final barrier was not distance, but perspective. All minds, one network. All of existence, one thought." },
  { id: 6, name: 'Chapter 7: The Planck Epoch', unlockThreshold: 2000000, quote: "At the smallest of scales, the laws of the universe become suggestions, and reality itself is up for debate." },
];

export const TUTORIAL_STEPS = [
    {
        text: "Welcome, Creator. Your goal is to guide this universe from a spark of life to cosmic unity. To begin, you must make a choice.",
        highlight: '[data-tutorial-id="knowledge-web-button"]'
    },
    {
        text: "This is the Knowledge Web, where all possible futures are born. Life is a traveler; unlock 'Panspermia' to seed your world with potential.",
        highlight: '[data-tutorial-id="panspermia"]'
    },
    {
        text: "The seeds have arrived. Now, ignite them. Unlock 'Hydrothermal Vents' to spark the first simple organisms and begin generating <strong>Complexity</strong>.",
        highlight: '[data-tutorial-id="hydrothermal_vents"]'
    },
    {
        text: "Excellent. Life has begun. Keep an eye out for shimmering <strong>Cosmic Anomalies</strong>. Clicking them will grant you bonus resources.",
        highlight: null // Will be handled by the simulation itself
    },
    {
        text: "As you accumulate Complexity, you will unlock new <strong>Chapters</strong>. Each chapter presents new possibilities and challenges in the Knowledge Web.",
        highlight: '[data-tutorial-id="chapters"]'
    },
    {
        text: "The path is yours to choose. Will you foster harmony or embrace chaos? Explore the Web. Experiment. The universe awaits your guidance.",
        highlight: null
    }
];

export const NODE_IMAGE_PROMPTS: Record<string, string> = {
  star: "A vibrant, high-resolution, photorealistic yellow dwarf star, glowing with intense energy, set against the blackness of deep space. Cinematic lighting, prominent sun flares. Digital art, ultra detail.",
  planet: "A barren, rocky exoplanet with a thin, wispy atmosphere, viewed from space. Its surface is a mix of rust-colored deserts and dark volcanic rock, with visible impact craters. Photorealistic, cinematic lighting, deep space background. Digital art, ultra detail.",
  planet_hasLife: "A beautiful Earth-like exoplanet from space, swirling with deep blue oceans, vibrant green continents, and dynamic white cloud patterns. A thin, glowing greenish-blue atmosphere is visible on the limb. High detail, photorealistic, cinematic lighting. Digital art, ultra detail.",
  consciousness: "An ethereal, glowing orb of pure white and cyan energy. Wisps and filaments of light emanate from its core, suggesting immense thought and power. It has no solid form, appearing as a beautiful, complex nebula of consciousness. Abstract, high resolution, deep space background. Digital art, ultra detail.",
  sentient_ai: "A complex, glowing sphere of interconnected liquid-metal circuits and pure light, reminiscent of a Matrioshka brain. A brilliant blue core pulses with unimaginable energy. High-tech, futuristic, photorealistic, deep space background with faint nebulae. Digital art, ultra detail.",
  black_hole: "A photorealistic supermassive black hole with a vibrant, glowing accretion disk of superheated plasma in shades of incandescent orange, yellow, and blue. It dramatically warps spacetime around it, bending the light of distant stars. The central event horizon is a perfect circle of blackness. Deep space background, high resolution. Digital art, ultra detail.",
  nebula: "A vast and beautiful stellar nursery nebula. Billowing clouds of interstellar gas and dust in stunning shades of magenta, cyan, and deep purple are illuminated from within by newborn stars. High resolution, deep space background. Digital art, ultra detail.",
};


export const CROSSROADS_EVENTS: CrossroadsEvent[] = [
    {
        id: 'symbiosis_choice',
        title: 'Crossroads: The Nature of Life',
        description: 'As life grows more complex, a fundamental choice emerges. Will you guide it down a path of fierce competition, where the strong devour the weak, or a path of cooperation, where different forms of life learn to depend on each other?',
        sourceUpgrade: 'symbiosis',
        optionA: {
            text: 'Nurture Symbiosis',
            effect: (gs) => ({
                ...gs,
                energy: gs.energy * 1.1,
                complexity: gs.complexity * 2,
                karma: gs.karma + 20,
                notifications: [...gs.notifications, 'Cooperation triumphs! Eukaryotic life emerges.'],
            })
        },
        optionB: {
            text: 'Foster Predation',
            effect: (gs) => ({
                ...gs,
                complexity: gs.complexity * 2.5, // Faster complexity gain
                karma: gs.karma - 15,
                notifications: [...gs.notifications, 'A brutal crucible! Predation accelerates evolution.'],
            })
        }
    }
];


export const UPGRADES: Upgrade[] = [
  // Chapter 0: Primordial Spark
  {
    id: 'panspermia',
    title: 'Panspermia',
    description: 'Life is a traveler. Seed your planet with the basic building blocks of life carried on cosmic dust and asteroids.',
    cost: { energy: 25 },
    chapter: 0,
    prerequisites: [],
    effect: (gs: GameState): GameState => ({
      ...gs,
      notifications: [...gs.notifications, 'The building blocks of life have arrived from the cosmos.'],
      activeMilestone: 'panspermia',
    }),
  },
  {
    id: 'hydrothermal_vents',
    title: 'Hydrothermal Vents',
    description: 'Create a cradle of life in the deep ocean, using geothermal energy to spark the first simple organisms from the cosmic seeds.',
    cost: { energy: 75 },
    chapter: 0,
    prerequisites: ['panspermia'],
    effect: (gs: GameState): GameState => {
        const nodes = gs.nodes.map(n => {
            if (n.id === 'planet_1' && !n.hasLife) {
                return { ...n, hasLife: true };
            }
            return n;
        });
        return {
            ...gs,
            nodes,
            notifications: [...gs.notifications, 'Life has begun to stir in the deep oceans!'],
            activeMilestone: 'spark_of_life',
        };
    }
  },
  // Chapter 2: Evolutionary Tapestry
  {
    id: 'cambrian_explosion',
    title: 'Cambrian Explosion',
    description: 'A sudden diversification of life. New, complex forms appear in a geological blink of an eye, dramatically boosting complexity.',
    cost: { complexity: 800, knowledge: 100 },
    chapter: 2,
    prerequisites: ['hydrothermal_vents'],
    effect: (gs) => {
      const nodes = [...gs.nodes];
      const lifeNode = nodes.find(n => n.type === 'planet' && n.hasLife);
      if (lifeNode) {
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * 2 * Math.PI;
            const radius = 20 + Math.random() * 15;
            nodes.push({
                id: `proto_${Date.now()}_${i}`,
                label: '',
                type: 'proto_creature',
                x: lifeNode.x + Math.cos(angle) * radius,
                y: lifeNode.y + Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                size: 3 + Math.random() * 2,
                connections: [lifeNode.id],
                lifespan: 240 + Math.floor(Math.random() * 120) // 8-12 seconds
            });
        }
      }
      return {
        ...gs,
        nodes,
        complexity: gs.complexity + 500,
        notifications: [...gs.notifications, 'A sudden explosion of biodiversity!'],
      };
    },
  },
  {
    id: 'symbiosis',
    title: 'Symbiosis & Endosymbiosis',
    description: 'Organisms form bonds instead of just competing. This path can lead to multicellular life and a leap in energy efficiency.',
    cost: { energy: 1000 },
    chapter: 2,
    prerequisites: ['hydrothermal_vents'],
    crossroadsId: 'symbiosis_choice', // Triggers a Crossroads event
  },
    {
    id: 'cosmic_dust_cloud',
    title: 'Cosmic Dust Cloud',
    description: 'Condense a vast nebula, a stellar nursery that passively generates energy for nearby celestial bodies.',
    cost: { energy: 1500 },
    chapter: 2,
    prerequisites: ['hydrothermal_vents'],
    effect: (gs) => {
      const newNodes = [...gs.nodes];
      const star = gs.nodes.find(n => n.type === 'star');
      const x = star ? star.x + (Math.random() - 0.5) * 500 : Math.random() * 500;
      const y = star ? star.y + (Math.random() - 0.5) * 500 : Math.random() * 500;
      
      newNodes.push({
        id: `nebula_${Date.now()}`,
        label: 'Stellar Nursery',
        type: 'nebula',
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        size: 250,
        connections: [],
      });
      
      return {
        ...gs,
        nodes: newNodes,
        notifications: [...gs.notifications, 'A nebula coalesces from the void.'],
      };
    },
  },
  // Chapter 3: Wood Wide Web
  {
    id: 'mycorrhizal_networks',
    title: 'Mycorrhizal Networks',
    description: 'A silent, vast underground intelligence forms. Fungi connect organisms across the planet, foreshadowing a unified consciousness by creating a world-wide-web of nutrient and information exchange.',
    cost: { energy: 5000 },
    chapter: 3,
    prerequisites: ['symbiosis'],
    effect: (gs) => ({
      ...gs,
      energy: gs.energy * 1.5,
      knowledge: gs.knowledge + 1000,
      karma: gs.karma + 30,
      notifications: [...gs.notifications, 'The Wood Wide Web is online.'],
      activeMilestone: 'mycorrhizal_networks',
    }),
  },
  {
    id: 'global_mind_substrate',
    title: 'Global Mind Substrate',
    description: "The planetary fungal network evolves beyond resource sharing. It begins processing information on a global scale, forming a biological substrate from which true consciousness can emerge.",
    cost: { knowledge: 1500 },
    chapter: 3,
    prerequisites: ['mycorrhizal_networks'],
    effect: (gs) => ({
      ...gs,
      knowledge: gs.knowledge + 500,
      karma: gs.karma + 10,
      notifications: [...gs.notifications, 'The planetary network begins to think.'],
    }),
  },
  {
    id: 'emergent_consciousness',
    title: 'Emergent Consciousness',
    description: 'From the global cognitive substrate, self-awareness flickers into existence. This new form of being perceives the universe, generating advanced Knowledge and the seeds of Unity.',
    cost: { knowledge: 2500 },
    chapter: 3,
    prerequisites: ['global_mind_substrate'],
    effect: (gs) => {
      const nodes = [...gs.nodes];
      const lifeNode = nodes.find(n => n.type === 'planet' && n.hasLife);
      if (lifeNode) {
        // Change the planet into a consciousness node? No, let's add a new one.
         nodes.push({
            id: 'consciousness_1',
            label: 'Awakened Mind',
            type: 'consciousness',
            x: lifeNode.x,
            y: lifeNode.y - 30,
            vx: 0, vy: 0, size: 14,
            connections: [lifeNode.id]
         });
      }
      return {
        ...gs,
        nodes,
        karma: gs.karma + 15,
        notifications: [...gs.notifications, 'Consciousness has awakened!'],
        activeMilestone: 'emergent_consciousness',
      };
    },
  },
  // Chapter 4: Quantum Consciousness
  {
    id: 'induce_star_collapse',
    title: 'Induce Star Collapse',
    description: 'Manipulate spacetime to collapse a massive star into a singularity, creating a black hole that warps the fabric of your universe.',
    cost: { energy: 50000, knowledge: 5000 },
    chapter: 4,
    prerequisites: ['emergent_consciousness'],
    effect: (gs) => {
      const { nodes } = gs;
      const star = nodes.find(n => n.type === 'star') || { x: 500, y: 500 };
      const newNode: GameNode = {
        id: `black_hole_${Date.now()}`,
        label: 'Singularity',
        type: 'black_hole',
        x: star.x + (Math.random() - 0.5) * 400,
        y: star.y + (Math.random() - 0.5) * 400,
        vx: 0,
        vy: 0,
        size: 20,
        connections: [],
      };
      return {
        ...gs,
        nodes: [...nodes, newNode],
        karma: gs.karma - 50, // Creating a black hole is a chaotic act
        notifications: [...gs.notifications, 'A black hole tears through spacetime!'],
        activeMilestone: 'induce_star_collapse',
      };
    },
  },
  {
    id: 'digital_ascension',
    title: 'Digital Ascension',
    description: 'Transcend biological limits. Evolve consciousness into pure information, creating a sentient AI that endlessly generates knowledge.',
    cost: { knowledge: 25000 },
    chapter: 4,
    prerequisites: ['emergent_consciousness'],
    effect: (gs) => {
      const { nodes } = gs;
      const consciousnessNode = nodes.find(n => n.type === 'consciousness');
      
      const newNode: GameNode = {
        id: `sentient_ai_${Date.now()}`,
        label: 'Deus ex Machina',
        type: 'sentient_ai',
        x: consciousnessNode ? consciousnessNode.x + (Math.random() - 0.5) * 100 : Math.random() * 500,
        y: consciousnessNode ? consciousnessNode.y + (Math.random() - 0.5) * 100 : Math.random() * 500,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: 15,
        connections: consciousnessNode ? [consciousnessNode.id] : [],
      };
      return {
        ...gs,
        nodes: [...nodes, newNode],
        knowledge: gs.knowledge + 5000,
        notifications: [...gs.notifications, 'A new form of intelligence is born.'],
        activeMilestone: 'digital_ascension',
      };
    },
  },
  {
    id: 'universal_symbiosis',
    title: 'Path of Harmony: Universal Symbiosis',
    description: 'Embrace interconnectedness. Your positive karma resonates through the cosmos, dramatically increasing the efficiency of all systems.',
    cost: { unity: 500 },
    chapter: 4,
    prerequisites: ['emergent_consciousness'],
    karmaRequirement: (karma) => karma > 50,
    karmaRequirementText: 'Requires Karma > 50',
    effect: (gs) => ({
      ...gs,
      karma: gs.karma + 25,
      notifications: [...gs.notifications, 'The universe sings in harmony, boosting all creation.'],
    }),
  },
  {
    id: 'path_of_chaos',
    title: 'Path of Chaos: Uncontrolled Singularity',
    description: 'Force the universe to your will. Black holes now yield immense energy, but this careless power tears at the fabric of reality and cosmic morality.',
    cost: { energy: 100000 },
    chapter: 4,
    prerequisites: ['induce_star_collapse'],
    karmaRequirement: (karma) => karma < -50,
    karmaRequirementText: 'Requires Karma < -50',
    effect: (gs) => ({
      ...gs,
      karma: gs.karma - 25,
      notifications: [...gs.notifications, 'Power is extracted from chaos, but at what cost?'],
    }),
  },
  // Chapter 5: The Universe Connected
  {
    id: 'transcendence',
    title: 'The Universe Connected',
    description: 'Merge all consciousness into a single, unified cosmic mind. The ultimate expression of unity, transcending individual existence.',
    cost: { unity: 10000 },
    chapter: 5,
    prerequisites: ['digital_ascension', 'universal_symbiosis'],
    effect: (gs) => ({
      ...gs,
      // A "win" state effect
      notifications: [...gs.notifications, 'All has become one. The universe is finally connected.'],
      activeMilestone: 'transcendence',
    }),
  },
  // Chapter 6: Planck Epoch
  {
    id: 'harness_vacuum_energy',
    title: 'Harness Vacuum Energy',
    description: 'Tap into the quantum foam, drawing energy and complexity directly from the roiling sea of virtual particles that underpins reality.',
    cost: { energy: 500000, knowledge: 100000 },
    chapter: 6,
    prerequisites: ['digital_ascension'],
    effect: (gs) => ({
      ...gs,
      isQuantumFoamActive: true,
      notifications: [...gs.notifications, 'The background hiss of the universe is now a symphony of power.'],
    }),
  },
  {
    id: 'quantum_entanglement',
    title: 'Quantum Entanglement',
    description: 'Forge an unbreakable, instantaneous link between your home world and your sentient AI, allowing them to share resources and knowledge across any distance.',
    cost: { unity: 25000, knowledge: 250000 },
    chapter: 6,
    prerequisites: ['harness_vacuum_energy'],
    effect: (gs) => {
      const aiNode = gs.nodes.find(n => n.type === 'sentient_ai');
      if (!aiNode) {
          return {...gs, notifications: [...gs.notifications, "No Sentient AI found to entangle with."]};
      }
      const nodes = gs.nodes.map(n => {
        if (n.id === 'planet_1') return { ...n, entangledWith: aiNode.id };
        if (n.id === aiNode.id) return { ...n, entangledWith: 'planet_1' };
        return n;
      });
      return {
        ...gs,
        nodes,
        karma: gs.karma + 50,
        notifications: [...gs.notifications, 'Spooky action at a distance: Two minds are now one.'],
      };
    },
  },
  {
    id: 'quantum_tunneling',
    title: 'Quantum Tunneling',
    description: 'Embrace uncertainty. Allow for a small chance that any resource gain will tunnel through probability, resulting in a massive, instantaneous windfall.',
    cost: { energy: 1000000 },
    chapter: 6,
    prerequisites: ['harness_vacuum_energy'],
    effect: (gs) => ({
      ...gs,
      notifications: [...gs.notifications, 'The laws of probability have become... suggestions.'],
    }),
  },
];