import React, { useReducer, useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, GameAction, Upgrade, EnergyOrb, GameNode, QuantumPhage, CollectionEffect, CosmicEvent, AnomalyParticle, ConnectionParticle, PlayerState, ProjectionState, CollectionBloom, CollectionFlare, WorldTransform } from '../types';
import { UPGRADES, CHAPTERS, TUTORIAL_STEPS, CROSSROADS_EVENTS } from './constants';
import { useGameLoop } from '../services/useGameLoop';
import { audioService } from '../services/AudioService';
import { getNodeImagePrompt } from '../services/promptService';
import { generateNodeImage } from '../services/geminiService';
import { useWorldScale } from '../hooks/useWorldScale';

import Simulation from './Simulation';
import UpgradeModal from '../UpgradeModal';
import Notification from '../Notification';
import Tutorial from './Tutorial';
import MilestoneVisual from './MilestoneVisual';
import SplashScreen from './SplashScreen';
import KarmaParticles from '../hooks/KarmaParticles';
import BackgroundEffects from '../services/BackgroundEffects';
import CrossroadsModal from '../CrossroadsModal';
import NodeInspector from './NodeInspector';
import AudioUploadModal from './AudioUploadModal'; // Ensure component is part of the build
import ChapterTransition from './ChapterTransition';
import LevelTransition from './LevelTransition';

// Constants for game balance
const BASE_KNOWLEDGE_RATE = 0.1;
const STAR_ENERGY_RATE = 0.5;
const LIFE_BIOMASS_RATE = 0.2;
const COLLECTIVE_UNITY_RATE = 0.1;
const DATA_GENERATION_RATE = 0.2;
const STAR_ORB_SPAWN_CHANCE = 0.005;
const PHAGE_SPAWN_CHANCE = 0.001;
const PHAGE_ATTRACTION = 0.01;
const PHAGE_DRAIN_RATE = 0.5;
const PLAYER_HUNT_RANGE = 150;
const SUPERNOVA_WARNING_TICKS = 1800; // 30 seconds at 60fps
const SUPERNOVA_EXPLOSION_TICKS = 120; // 2 seconds
const ANOMALY_DURATION_TICKS = 1200; // 20 seconds
const ANOMALY_PULL_STRENGTH = 0.1;
const BLOOM_DURATION_TICKS = 2400; // 40 seconds
const BLOOM_SPAWN_MULTIPLIER = 20;

const PLAYER_PROJECTION_MAX_SPEED = 20;
const PLAYER_PROJECTION_MIN_SPEED = 4;
const PLAYER_REFORM_TIME = 120; // 2 seconds
const PLAYER_PROJECTION_LIFESPAN = 300; // 5 seconds
const STAR_GRAVITY_CONSTANT = 0.5;
const PLANET_GRAVITY_CONSTANT = 0.1;
const ORB_COLLECTION_LEEWAY = 10; // Extra radius for easier collection

const TUNNEL_CHANCE_PER_TICK = 0.0005;
const TUNNEL_DISTANCE = 400;
const TUNNEL_DURATION_TICKS = 60; // 1 second

const SAVE_GAME_KEY = 'universe-connected-save';

const initialState: GameState = {
  gameStarted: false,
  isPaused: false,
  energy: 50,
  knowledge: 10,
  biomass: 0,
  unity: 0,
  complexity: 0,
  data: 0,
  karma: 0,
  unlockedUpgrades: new Set(),
  currentChapter: 0,
  tutorialStep: 0,
  activeMilestone: null,
  activeCrossroadsEvent: null,
  activeChapterTransition: null,
  zoomLevel: 0,
  levelTransitionState: 'none',
  nodes: [
    {
      id: 'player_consciousness',
      label: 'You',
      type: 'player_consciousness',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 20,
      connections: [],
      hasLife: false,
      playerState: 'IDLE',
      reformTimer: 0,
    },
  ],
  phages: [],
  cosmicEvents: [],
  notifications: [],
  connectMode: { active: false, sourceNodeId: null },
  projectionState: {
      phase: 'inactive',
      angle: -Math.PI / 2, // Start pointing up
      power: 0,
      launchPosition: { x: 0, y: 0 },
  },
  connectionParticles: [],
  energyOrbs: [],
  collectionEffects: [],
  collectionBlooms: [],
  collectionFlares: [],
  selectedNodeId: null,
  aimAssistTargetId: null,
  loreState: { nodeId: null, text: '', isLoading: false },
  screenShake: { intensity: 0, duration: 0 },
  anomalyParticles: [],
  settings: {
    sfxVolume: 1.0,
    musicVolume: 0.3,
    colorblindMode: 'none',
    aimAssist: true,
  }
};


// The main game reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      audioService.userInteraction().then(() => audioService.playBackgroundMusic());
      const playerNode = state.nodes.find(n => n.type === 'player_consciousness');
      if (!playerNode) return state; // Should not happen

      const updatedNodes = state.nodes.map(n => 
        n.id === playerNode.id ? { ...n, imageUrl: action.payload.playerImageUrl } : n
      );

      return { 
        ...state, 
        gameStarted: true, 
        nodes: updatedNodes,
        notifications: [...state.notifications, 'The cosmos awakens to your presence.'] 
      };
    }
    case 'TICK': {
      if (state.isPaused) return state;
      let nextState = { ...state };
      const { width, height, transform } = action.payload;
      const worldRadius = (Math.min(width, height) * 1.5) / (state.zoomLevel + 1);

      // Resource generation
      nextState.knowledge += BASE_KNOWLEDGE_RATE;

      nextState.nodes.forEach(node => {
        if (node.type === 'star') nextState.energy += STAR_ENERGY_RATE;
        if (node.hasLife) nextState.biomass += LIFE_BIOMASS_RATE;
      });

      if (nextState.unlockedUpgrades.has('cellular_specialization')) {
        nextState.biomass += nextState.nodes.filter(n => n.hasLife).length * 0.5;
      }
      if (nextState.unlockedUpgrades.has('collective_intelligence')) {
        nextState.unity += COLLECTIVE_UNITY_RATE;
      }
      if (nextState.unlockedUpgrades.has('quantum_computing')) {
        nextState.data += DATA_GENERATION_RATE;
      }
      
      const mutableNodes = nextState.nodes.map(n => ({...n}));
      
      // --- COSMIC EVENT MANAGEMENT ---
      let nextCosmicEvents = [...nextState.cosmicEvents];
      let nextAnomalyParticles = [...nextState.anomalyParticles];
      let newEnergyOrbsFromEvents: EnergyOrb[] = [];

      // 1. Spawn new events
      const hasSupernovaWarning = nextCosmicEvents.some(e => e.type === 'supernova' && e.phase === 'warning');
      if (!hasSupernovaWarning && Math.random() < 0.0002) {
          const potentialStars = mutableNodes.filter(n => n.type === 'star');
          if (potentialStars.length > 0) {
              const star = potentialStars[Math.floor(Math.random() * potentialStars.length)];
              nextCosmicEvents.push({
                  id: `supernova_${star.id}`,
                  type: 'supernova',
                  phase: 'warning',
                  targetNodeId: star.id,
                  x: star.x, y: star.y,
                  radius: star.radius * 20, // Explosion radius
                  strength: 0,
                  duration: SUPERNOVA_WARNING_TICKS,
              });
              nextState.notifications.push('A star shows signs of instability...');
          }
      }
      if (nextCosmicEvents.filter(e