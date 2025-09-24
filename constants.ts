import { Era, Upgrade, GameState, GameNode } from './types';

export const ERAS: Era[] = [
  { id: 0, name: 'Primordial Spark', unlockThreshold: 0 },
  { id: 1, name: 'The Seeds of Life', unlockThreshold: 250 },
  { id: 2, name: 'The Evolutionary Tapestry', unlockThreshold: 2000 },
  { id: 3, name: 'The Wood Wide Web', unlockThreshold: 15000 },
  { id: 4, name: 'Quantum Consciousness', unlockThreshold: 100000 },
  { id: 5, name: 'The Universe Connected', unlockThreshold: 500000 },
];

export const TUTORIAL_STEPS = [
    {
        text: "Welcome, Creator. Your goal is to guide this universe from a spark of life to cosmic unity. To begin, you must make a choice.",
        highlight: '[data-tutorial-id="knowledge-web-button"]'
    },
    {
        text: "This is the Knowledge Web, where all possible futures are born. Life needs a cradle to begin. Unlock 'Hydrothermal Vents' to create the first spark.",
        highlight: '[data-tutorial-id="hydrothermal_vents"]'
    },
    {
        text: "Excellent. Life has begun on your planet, generating <strong>Complexity</strong>. Watch your resources grow in the top-right corner.",
        highlight: '[data-tutorial-id="resources"]'
    },
    {
        text: "As you accumulate Complexity, you will unlock new <strong>Eras</strong>. Each era presents new possibilities and challenges in the Knowledge Web.",
        highlight: '[data-tutorial-id="eras"]'
    },
    {
        text: "The path is yours to choose. Will you foster harmony or embrace chaos? Explore the Web. Experiment. The universe awaits your guidance.",
        highlight: null
    }
];

export const UPGRADES: Upgrade[] = [
  // FIX: Added the initial upgrade required by the tutorial.
  {
    id: 'hydrothermal_vents',
    title: 'Hydrothermal Vents',
    description: 'Create a cradle of life in the deep ocean, using geothermal energy to spark the first simple organisms.',
    cost: { energy: 50 },
    era: 0, // FIX: Set to Era 0 to be available at game start.
    prerequisites: [],
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
  // Era 2: Evolutionary Tapestry
  {
    id: 'cambrian_explosion',
    title: 'Cambrian Explosion',
    description: 'A sudden diversification of life. New, complex forms appear in a geological blink of an eye, dramatically boosting complexity.',
    cost: { complexity: 800, knowledge: 100 },
    era: 2,
    // FIX: Updated prerequisites to ensure game progression is possible after the tutorial.
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
    description: 'Organisms form bonds instead of just competing. Mitochondria are born, paving the way for multicellular life and a massive leap in energy efficiency.',
    cost: { energy: 1000 },
    era: 2,
    // FIX: Updated prerequisites to ensure game progression is possible after the tutorial.
    prerequisites: ['hydrothermal_vents'],
    effect: (gs) => ({
      ...gs,
      energy: gs.energy * 1.1, // Start passive energy gain
      complexity: gs.complexity * 2,
      karma: gs.karma + 20,
      notifications: [...gs.notifications, 'Cooperation triumphs! Eukaryotic life emerges.'],
    }),
  },
    {
    id: 'cosmic_dust_cloud',
    title: 'Cosmic Dust Cloud',
    description: 'Condense a vast nebula, a stellar nursery that passively generates energy for nearby celestial bodies.',
    cost: { energy: 1500 },
    era: 2,
    // FIX: Updated prerequisites to ensure game progression is possible after the tutorial.
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
  // Era 3: Wood Wide Web
  {
    id: 'mycorrhizal_networks',
    title: 'Mycorrhizal Networks',
    description: 'A silent, vast underground intelligence forms. Fungi connect organisms across the planet, foreshadowing a unified consciousness by creating a world-wide-web of nutrient and information exchange.',
    cost: { energy: 5000 },
    era: 3,
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
    era: 3,
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
    era: 3,
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
  // Era 4: Quantum Consciousness
  {
    id: 'induce_star_collapse',
    title: 'Induce Star Collapse',
    description: 'Manipulate spacetime to collapse a massive star into a singularity, creating a black hole that warps the fabric of your universe.',
    cost: { energy: 50000, knowledge: 5000 },
    era: 4,
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
    era: 4,
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
    era: 4,
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
    era: 4,
    prerequisites: ['induce_star_collapse'],
    karmaRequirement: (karma) => karma < -50,
    karmaRequirementText: 'Requires Karma < -50',
    effect: (gs) => ({
      ...gs,
      karma: gs.karma - 25,
      notifications: [...gs.notifications, 'Power is extracted from chaos, but at what cost?'],
    }),
  },
  // Era 5: The Universe Connected
  {
    id: 'transcendence',
    title: 'The Universe Connected',
    description: 'Merge all consciousness into a single, unified cosmic mind. The ultimate expression of unity, transcending individual existence.',
    cost: { unity: 10000 },
    era: 5,
    prerequisites: ['digital_ascension', 'universal_symbiosis'],
    effect: (gs) => ({
      ...gs,
      // A "win" state effect
      notifications: [...gs.notifications, 'All has become one. The universe is finally connected.'],
      activeMilestone: 'transcendence',
    }),
  },
];