

import React, { useReducer, useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, GameAction, Upgrade, EnergyOrb, GameNode, QuantumPhage, CollectionEffect, CosmicEvent, AnomalyParticle, ConnectionParticle, PlayerState, ProjectionState, CollectionBloom, CollectionFlare, WorldTransform } from '../types';
import { UPGRADES, CHAPTERS, TUTORIAL_STEPS, CROSSROADS_EVENTS } from './constants';
import { useGameLoop } from '../hooks/useGameLoop';
import { audioService } from '../services/AudioService';
import { getNodeImagePrompt } from '../services/promptService';
import { generateNodeImage, getGeminiLoreForNode } from '../services/geminiService';
import { useWorldScale } from '../hooks/useWorldScale';

import Simulation from './Simulation';
import UpgradeModal from './UpgradeModal';
import Notification from './Notification';
import Tutorial from './Tutorial';
import MilestoneVisual from './MilestoneVisual';
import SplashScreen from './SplashScreen';
import KarmaParticles from '../hooks/KarmaParticles';
import BackgroundEffects from './BackgroundEffects';
import CrossroadsModal from './CrossroadsModal';
import NodeInspector from './NodeInspector';
import ChapterTransition from './ChapterTransition';
import LevelTransition from './LevelTransition';
import SettingsModal from './SettingsModal';


// Constants for game balance
const BASE_KNOWLEDGE_RATE = 0.1;
const STAR_ENERGY_RATE = 0.5;
const LIFE_BIOMASS_RATE = 0.2;
const COLLECTIVE_UNITY_RATE = 0.1;
const DATA_GENERATION_RATE = 0.2;
const STAR_ORB_SPAWN_CHANCE = 0.005;
const PHAGE_SPAWN_CHANCE = 0.0001;
const PHAGE_ATTRACTION = 0.01;
const PHAGE_DRAIN_RATE = 0.5;
const PLAYER_HUNT_RANGE = 150;
const SUPERNOVA_WARNING_TICKS = 1800; // 30 seconds at 60fps
const SUPERNOVA_EXPLOSION_TICKS = 120; // 2 seconds
const ANOMALY_DURATION_TICKS = 1200; // 20 seconds
const ANOMALY_PULL_STRENGTH = 0.1;
const BLOOM_DURATION_TICKS = 2400; // 40 seconds
const BLOOM_SPAWN_MULTIPLIER = 20;
const BLACK_HOLE_SPAWN_CHANCE = 0.00005;
const BLACK_HOLE_DURATION_TICKS = 3600; // 1 minute
const BLACK_HOLE_PULL_STRENGTH = 100;

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
    {
      id: 'tutorial_planet',
      label: 'Silent World',
      type: 'rocky_planet',
      x: 200,
      y: -150,
      vx: 0,
      vy: 0,
      radius: 15,
      connections: [],
      hasLife: false,
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
      powerDirection: 1,
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

const HARMONY_THRESHOLD = 50;
const CHAOS_THRESHOLD = -50;

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
        ...initialState, // Start fresh
        gameStarted: true, 
        nodes: updatedNodes,
        notifications: ['The cosmos awakens to your presence.'] 
      };
    }
    case 'TICK': {
      if (state.isPaused) return state;
      let nextState = { ...state };
      const { width, height, transform } = action.payload;
      const worldRadius = (Math.min(width, height) * 1.5) / (state.zoomLevel + 1);

      // --- KARMA & GLOBAL MODIFIERS ---
      let harmonyBonus = 1.0;
      let chaosPenalty = 1.0;

      if (nextState.karma > HARMONY_THRESHOLD) harmonyBonus = 1.25; // 25% passive boost
      if (nextState.karma < CHAOS_THRESHOLD) chaosPenalty = 0.75; // 25% passive penalty

      if (nextState.cosmicEvents.some(e => e.type === 'wave_of_harmony')) harmonyBonus *= 1.5; // Event-based 50% boost
      if (nextState.cosmicEvents.some(e => e.type === 'wave_of_discord')) chaosPenalty *= 0.5; // Event-based 50% penalty

      // --- RESOURCE GENERATION ---
      nextState.knowledge += BASE_KNOWLEDGE_RATE;
      nextState.nodes.forEach(node => {
        if (node.type === 'star') nextState.energy += STAR_ENERGY_RATE;
        if (node.hasLife) nextState.biomass += LIFE_BIOMASS_RATE * harmonyBonus;
      });
      if (nextState.unlockedUpgrades.has('cellular_specialization')) {
        nextState.biomass += nextState.nodes.filter(n => n.hasLife).length * 0.5 * harmonyBonus;
      }
      if (nextState.unlockedUpgrades.has('collective_intelligence')) {
        nextState.unity += COLLECTIVE_UNITY_RATE * harmonyBonus * chaosPenalty;
      }
      if (nextState.unlockedUpgrades.has('quantum_computing')) {
        nextState.data += DATA_GENERATION_RATE;
      }
      
      let mutableNodes = nextState.nodes.map(n => ({...n}));
      const nodesToRemove = new Set<string>();
      let newEnergyOrbs: EnergyOrb[] = [];
      
      // --- COSMIC EVENT MANAGEMENT ---
      let nextCosmicEvents = [...nextState.cosmicEvents];
      
      // 1. Spawn new events (influenced by karma)
      const hasSupernovaWarning = nextCosmicEvents.some(e => e.type === 'supernova' && e.phase === 'warning');
      let supernovaChance = 0.0002;
      if (nextState.karma < CHAOS_THRESHOLD) supernovaChance *= 3; // Chaos triples chance

      if (!hasSupernovaWarning && Math.random() < supernovaChance) {
          const potentialStars = mutableNodes.filter(n => n.type === 'star');
          if (potentialStars.length > 0) {
              const star = potentialStars[Math.floor(Math.random() * potentialStars.length)];
              nextCosmicEvents.push({
                  id: `supernova_${star.id}`,
                  type: 'supernova',
                  phase: 'warning',
                  targetNodeId: star.id,
                  x: star.x, y: star.y,
                  radius: star.radius * 20,
                  duration: SUPERNOVA_WARNING_TICKS,
              });
              nextState.notifications.push('A star shows signs of instability...');
          }
      }
      
      let bloomChance = 0.00015;
      if (nextState.karma > HARMONY_THRESHOLD) bloomChance *= 3; // Harmony triples chance

      if (nextCosmicEvents.filter(e => e.type === 'resource_bloom').length === 0 && Math.random() < bloomChance) {
        nextCosmicEvents.push({
          id: `bloom_${Date.now()}`,
          type: 'resource_bloom',
          x: (Math.random() - 0.5) * worldRadius,
          y: (Math.random() - 0.5) * worldRadius,
          radius: 120,
          strength: BLOOM_SPAWN_MULTIPLIER,
          duration: BLOOM_DURATION_TICKS,
        });
        nextState.notifications.push('A bloom of cosmic resources has appeared!');
      }
      
      // Spawn global karma events
      if (nextState.karma > HARMONY_THRESHOLD && !nextCosmicEvents.some(e => e.type === 'wave_of_harmony') && Math.random() < 0.0005) {
          nextCosmicEvents.push({ id: `harmony_${Date.now()}`, type: 'wave_of_harmony', duration: 1800 });
          nextState.notifications.push('A wave of cosmic harmony enhances growth and unity.');
      }
      if (nextState.karma < CHAOS_THRESHOLD && !nextCosmicEvents.some(e => e.type === 'wave_of_discord') && Math.random() < 0.0005) {
          nextCosmicEvents.push({ id: `discord_${Date.now()}`, type: 'wave_of_discord', duration: 1800 });
          nextState.notifications.push('A discordant echo stifles the growth of unity.');
      }

      if (nextCosmicEvents.filter(e => e.type === 'gravitational_anomaly').length === 0 && Math.random() < 0.0001) {
        nextCosmicEvents.push({
          id: `anomaly_${Date.now()}`,
          type: 'gravitational_anomaly',
          x: (Math.random() - 0.5) * worldRadius,
          y: (Math.random() - 0.5) * worldRadius,
          radius: 150,
          strength: ANOMALY_PULL_STRENGTH,
          duration: ANOMALY_DURATION_TICKS,
        });
        nextState.notifications.push('A gravitational anomaly has formed!');
      }

      if (nextCosmicEvents.filter(e => e.type === 'black_hole').length === 0 && Math.random() < BLACK_HOLE_SPAWN_CHANCE) {
        nextCosmicEvents.push({
          id: `blackhole_${Date.now()}`,
          type: 'black_hole',
          x: (Math.random() - 0.5) * worldRadius,
          y: (Math.random() - 0.5) * worldRadius,
          radius: Math.random() * 20 + 30, // 30-50 radius
          strength: BLACK_HOLE_PULL_STRENGTH,
          duration: BLACK_HOLE_DURATION_TICKS,
        });
        nextState.notifications.push('A tear in spacetime appears...');
      }
      
      // 2. Update and remove events
      nextCosmicEvents = nextCosmicEvents.map(event => {
        let duration = event.duration - 1;

        if (event.type === 'supernova' && event.phase === 'warning' && duration <= 0) {
          const star = mutableNodes.find(n => n.id === event.targetNodeId);
          if (star) {
            star.label = 'Supernova Remnant';
            star.type = 'rocky_planet'; 
            star.radius = star.radius * 0.8;
            star.imageUrl = ''; // Could generate a nebula image here
          }
          nextState.screenShake = { intensity: 20, duration: 30 };
          audioService.playSound('phage_spawn'); // Placeholder for explosion
          return { ...event, phase: 'active' as const, duration: SUPERNOVA_EXPLOSION_TICKS };
        }
        
        if(event.type === 'resource_bloom' && duration > 0) {
            if(Math.random() < ((event.strength || 1) / 1000)) {
                const angle = Math.random() * 2 * Math.PI;
                const dist = Math.random() * (event.radius || 1);
                newEnergyOrbs.push({
                    id: `orb_event_${Date.now()}_${Math.random()}`,
                    x: (event.x || 0) + Math.cos(angle) * dist,
                    y: (event.y || 0) + Math.sin(angle) * dist,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: 5,
                    isFromBloom: true,
                });
            }
        }
        
        return { ...event, duration };
      }).filter(event => event.duration > 0);
      nextState.cosmicEvents = nextCosmicEvents;

      // --- NODE PHYSICS ---
      mutableNodes.forEach(node => {
        // Gravity from stars and planets
        mutableNodes.forEach(otherNode => {
          if (node.id === otherNode.id || node.type === 'player_consciousness') return;
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (otherNode.type === 'star' ? STAR_GRAVITY_CONSTANT : PLANET_GRAVITY_CONSTANT) * otherNode.radius / distSq;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        });

        // Pull from cosmic events
        nextState.cosmicEvents.forEach(event => {
            const dx = (event.x || 0) - node.x;
            const dy = (event.y || 0) - node.y;
            const distSq = dx * dx + dy * dy;

            if (event.type === 'gravitational_anomaly' && event.radius && event.strength) {
                if (distSq < event.radius * event.radius) {
                    const dist = Math.sqrt(distSq);
                    const force = event.strength * (1 - dist / event.radius);
                    node.vx += (dx / dist) * force;
                    node.vy += (dy / dist) * force;
                }
            } else if (event.type === 'black_hole' && event.radius && event.strength) {
                 if (distSq < (event.radius * 10) * (event.radius * 10)) { // Large influence radius
                    const dist = Math.sqrt(distSq);
                    if (dist < event.radius) {
                        nodesToRemove.add(node.id); // Consumed by the black hole
                    } else {
                        const force = event.strength / distSq;
                        node.vx += (dx / dist) * force;
                        node.vy += (dy / dist) * force;
                    }
                 }
            }
        });
        
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.99;
        node.vy *= 0.99;
        
        // Boundary collision
        const distFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
        if (distFromCenter > worldRadius - node.radius) {
            const angle = Math.atan2(node.y, node.x);
            node.x = Math.cos(angle) * (worldRadius - node.radius);
            node.y = Math.sin(angle) * (worldRadius - node.radius);
            const dot = node.vx * Math.cos(angle) + node.vy * Math.sin(angle);
            node.vx -= 2 * dot * Math.cos(angle);
            node.vy -= 2 * dot * Math.sin(angle);
        }

        // Star orb spawning
        if (node.type === 'star' && Math.random() < STAR_ORB_SPAWN_CHANCE) {
            const angle = Math.random() * 2 * Math.PI;
            const dist = node.radius + 10;
            newEnergyOrbs.push({
                id: `orb_${Date.now()}_${Math.random()}`,
                x: node.x + Math.cos(angle) * dist,
                y: node.y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                radius: 4,
            });
        }
      });
      
      // Filter out removed nodes
      if (nodesToRemove.size > 0) {
        mutableNodes = mutableNodes.filter(n => !nodesToRemove.has(n.id));
        if (nodesToRemove.has(nextState.selectedNodeId || '')) {
          nextState.selectedNodeId = null; // Deselect node if it gets destroyed
        }
      }

      // --- PHAGE MANAGEMENT ---
      let nextPhages = [...nextState.phages];
      let phageSpawnChance = PHAGE_SPAWN_CHANCE;
      if (nextState.karma < CHAOS_THRESHOLD) phageSpawnChance *= 10; // Chaos dramatically increases phage threat
      
      if (Math.random() < phageSpawnChance && mutableNodes.length > 2) {
         const spawnEdge = Math.random() * 4;
         let x, y;
         if (spawnEdge < 1) { x = Math.random() * worldRadius * 2 - worldRadius; y = -worldRadius; } 
         else if (spawnEdge < 2) { x = worldRadius; y = Math.random() * worldRadius * 2 - worldRadius; } 
         else if (spawnEdge < 3) { x = Math.random() * worldRadius * 2 - worldRadius; y = worldRadius; } 
         else { x = -worldRadius; y = Math.random() * worldRadius * 2 - worldRadius; }
         
         nextPhages.push({
             id: `phage_${Date.now()}`, x, y, vx: 0, vy: 0, radius: 8, targetNodeId: null, state: 'seeking',
         });
         audioService.playSound('phage_spawn');
      }

      nextPhages.forEach(phage => {
          if (phage.state === 'seeking' || !phage.targetNodeId || !mutableNodes.find(n => n.id === phage.targetNodeId)) {
              let closestNode: GameNode | null = null;
              let minDistance = Infinity;
              mutableNodes.forEach(node => {
                  if (node.type === 'player_consciousness') return;
                  const d = Math.hypot(node.x - phage.x, node.y - phage.y);
                  if (d < minDistance) { minDistance = d; closestNode = node; }
              });
              phage.targetNodeId = closestNode ? closestNode.id : null;
          }

          const target = mutableNodes.find(n => n.id === phage.targetNodeId);
          if (target) {
              const dist = Math.hypot(target.x - phage.x, target.y - phage.y);
              if (dist < target.radius) {
                  phage.state = 'draining';
                  phage.vx = 0; phage.vy = 0;
              } else {
                  phage.vx += (target.x - phage.x) / dist * PHAGE_ATTRACTION;
                  phage.vy += (target.y - phage.y) / dist * PHAGE_ATTRACTION;
              }
          }
          phage.x += phage.vx; phage.y += phage.vy;
          phage.vx *= 0.99; phage.vy *= 0.99;
      });
      nextState.phages = nextPhages;

      // --- PLAYER LOGIC ---
      const playerNode = mutableNodes.find(n => n.type === 'player_consciousness');
      if (playerNode) {
          if (playerNode.playerState === 'PROJECTING') {
              playerNode.reformTimer! -= 1;
              if (playerNode.reformTimer! <= 0) {
                  playerNode.playerState = 'REFORMING';
                  playerNode.reformTimer = PLAYER_REFORM_TIME;
                  playerNode.vx = 0;
                  playerNode.vy = 0;
                  playerNode.x = nextState.projectionState.launchPosition.x;
                  playerNode.y = nextState.projectionState.launchPosition.y;
              } else {
                  // Collection logic
                   nextState.energyOrbs = nextState.energyOrbs.filter(orb => {
                      const dx = playerNode.x - orb.x;
                      const dy = playerNode.y - orb.y;
                      const dist = Math.sqrt(dx*dx + dy*dy);
                      if (dist < playerNode.radius + orb.radius + ORB_COLLECTION_LEEWAY) {
                          nextState.energy += 10;
                          audioService.playSound('collect_orb_standard');
                          return false;
                      }
                      return true;
                  });
              }
          }
          if (playerNode.playerState === 'REFORMING') {
              playerNode.reformTimer! -= 1;
              if (playerNode.reformTimer! <= 0) {
                  playerNode.playerState = 'IDLE';
                  nextState.projectionState = {...initialState.projectionState, launchPosition: { x: playerNode.x, y: playerNode.y }};
                  if (nextState.tutorialStep === 3) {
                    nextState.tutorialStep++;
                  }
              }
          }
      }
      nextState.nodes = mutableNodes;
      nextState.energyOrbs = [...nextState.energyOrbs, ...newEnergyOrbs];

      // --- AIM ASSIST LOGIC ---
      if (nextState.projectionState.phase === 'aiming' && nextState.settings.aimAssist && playerNode) {
        const aimAngle = nextState.projectionState.angle;
        let bestTarget: string | null = null;
        let bestAngleDiff = 0.2; // ~11.5 degrees tolerance

        nextState.nodes.forEach(node => {
            if (node.id === playerNode.id) return;
            const dx = node.x - playerNode.x;
            const dy = node.y - playerNode.y;
            const nodeAngle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(aimAngle - nodeAngle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            if (angleDiff < bestAngleDiff) {
                bestAngleDiff = angleDiff;
                bestTarget = node.id;
            }
        });
        nextState.aimAssistTargetId = bestTarget;
      } else {
        nextState.aimAssistTargetId = null;
      }
      
      // Update other systems...
      // Chapter progression
      const currentChapter = CHAPTERS[nextState.currentChapter];
      if (currentChapter && nextState.currentChapter < CHAPTERS.length - 1) {
        const nextChapter = CHAPTERS[nextState.currentChapter + 1];
        if (nextChapter.unlockCondition(nextState)) {
          nextState.currentChapter += 1;
          nextState.activeChapterTransition = nextState.currentChapter;
          audioService.playSound('milestone_achievement');
        }
      }
      
      return nextState;
    }
    case 'PURCHASE_UPGRADE': {
      const { upgrade, imageUrl } = action.payload;
      let nextState = { ...state };
      // FIX: Replaced the Object.entries loop with a type-safe for...of loop to correctly subtract resource costs without causing a type error.
      for (const resource of Object.keys(upgrade.cost) as Array<keyof typeof upgrade.cost>) {
        const value = upgrade.cost[resource];
        if (value !== undefined) {
          (nextState as any)[resource] -= value;
        }
      }
      nextState.unlockedUpgrades = new Set(nextState.unlockedUpgrades).add(upgrade.id);
      nextState = upgrade.effect(nextState, imageUrl);

      if (upgrade.animationId) {
        nextState.activeMilestone = { id: upgrade.animationId, imageUrl };
      }
      
      audioService.playSound('purchase_upgrade');
      return nextState;
    }
    case 'ADVANCE_TUTORIAL':
      if (action.payload?.forceEnd || state.tutorialStep >= TUTORIAL_STEPS.length - 1) {
        return { ...state, tutorialStep: -1 }; // End tutorial
      }
      return { ...state, tutorialStep: state.tutorialStep + 1 };
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter((_, i) => i !== action.payload.index) };
    case 'MILESTONE_COMPLETE':
      return { ...state, activeMilestone: null };
    case 'START_LEVEL_TRANSITION':
      return { ...state, levelTransitionState: 'zooming' };
    case 'COMPLETE_LEVEL_TRANSITION': {
       const playerNode = state.nodes.find(n => n.type === 'player_consciousness');
       return { 
         ...state, 
         levelTransitionState: 'none', 
         zoomLevel: state.zoomLevel + 1,
         nodes: playerNode ? [playerNode] : [], // Reset world
         energyOrbs: [],
         cosmicEvents: [],
       };
    }
    case 'END_CHAPTER_TRANSITION':
      return { ...state, activeChapterTransition: null };
    case 'SELECT_NODE':
      if (state.tutorialStep === 4 && action.payload.nodeId === 'tutorial_planet') {
        return { ...state, selectedNodeId: action.payload.nodeId, tutorialStep: 5 };
      }
      return { ...state, selectedNodeId: action.payload.nodeId };
    case 'SET_LORE_LOADING':
      if (state.tutorialStep === 5 && action.payload.nodeId === 'tutorial_planet') {
          return { ...state, loreState: { nodeId: action.payload.nodeId, text: '', isLoading: true }, tutorialStep: 6 };
      }
      return { ...state, loreState: { nodeId: action.payload.nodeId, text: '', isLoading: true } };
    case 'SET_LORE_RESULT':
      if (state.loreState.nodeId !== action.payload.nodeId) return state; // Stale response
      return { ...state, loreState: { ...state.loreState, text: action.payload.text, isLoading: false } };
    case 'CLEAR_LORE':
      return { ...state, loreState: { nodeId: null, text: '', isLoading: false } };
    case 'SET_PAUSED':
      return { ...state, isPaused: action.payload };
    case 'PLAYER_CONTROL_CLICK': {
      const playerNode = state.nodes.find(n => n.type === 'player_consciousness');
      if (!playerNode || playerNode.playerState !== 'IDLE') return state;

      let nextState = { ...state };
      let nextProjectionState = { ...state.projectionState };
      const currentPhase = state.projectionState.phase;
      
      switch (currentPhase) {
          case 'inactive':
              nextProjectionState.phase = 'aiming';
              if (state.tutorialStep === 0) nextState = gameReducer(nextState, {type: 'ADVANCE_TUTORIAL'});
              break;
          case 'aiming':
              nextProjectionState.phase = 'charging';
              nextProjectionState.power = 0.5; // Start at a default power
              if (state.tutorialStep === 1) nextState = gameReducer(nextState, {type: 'ADVANCE_TUTORIAL'});
              break;
          case 'charging':
              const speed = PLAYER_PROJECTION_MIN_SPEED + state.projectionState.power * (PLAYER_PROJECTION_MAX_SPEED - PLAYER_PROJECTION_MIN_SPEED);
              const angle = state.aimAssistTargetId 
                  ? Math.atan2(
                      state.nodes.find(n => n.id === state.aimAssistTargetId)!.y - playerNode.y,
                      state.nodes.find(n => n.id === state.aimAssistTargetId)!.x - playerNode.x
                    )
                  : state.projectionState.angle;
              
              const newNodes = state.nodes.map(n => {
                  if (n.id === playerNode.id) {
                      return { 
                          ...n, 
                          playerState: 'PROJECTING' as PlayerState,
                          vx: Math.cos(angle) * speed,
                          vy: Math.sin(angle) * speed,
                          reformTimer: PLAYER_PROJECTION_LIFESPAN,
                      };
                  }
                  return n;
              });
              nextState.nodes = newNodes;
              
              // Reset projection state for the next shot after reforming
              nextProjectionState = { ...initialState.projectionState, phase: 'inactive' };

              if (state.tutorialStep === 2) nextState = gameReducer(nextState, {type: 'ADVANCE_TUTORIAL'});
              break;
      }
      
      nextProjectionState.launchPosition = { x: playerNode.x, y: playerNode.y };
      return { ...nextState, projectionState: nextProjectionState };
    }
    case 'AIM_WITH_MOUSE': {
        if (state.projectionState.phase !== 'aiming') return state;
        const player = state.nodes.find(n => n.type === 'player_consciousness');
        if (!player) return state;

        const dx = action.payload.worldX - player.x;
        const dy = action.payload.worldY - player.y;
        const angle = Math.atan2(dy, dx);

        return { ...state, projectionState: { ...state.projectionState, angle } };
    }
    case 'ADJUST_LAUNCH_POWER': {
        if (state.projectionState.phase !== 'charging') return state;
        const newPower = Math.max(0, Math.min(1, state.projectionState.power + action.payload.delta));
        return { ...state, projectionState: { ...state.projectionState, power: newPower } };
    }
    case 'CHANGE_SETTING': {
        const { key, value } = action.payload;
        const newSettings = { ...state.settings, [key]: value };
        
        if (key === 'sfxVolume') audioService.setSfxVolume(value as number);
        if (key === 'musicVolume') audioService.setMusicVolume(value as number);

        return { ...state, settings: newSettings };
    }
    case 'SAVE_GAME': {
        try {
            const stateToSave = { ...state, unlockedUpgrades: Array.from(state.unlockedUpgrades) };
            localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
            return { ...state, notifications: [...state.notifications, 'Game Saved!'] };
        } catch (e) {
            console.error("Failed to save game", e);
            return { ...state, notifications: [...state.notifications, 'Error: Could not save game.'] };
        }
    }
    case 'LOAD_GAME': {
      try {
        const loadedState = action.payload;
        loadedState.unlockedUpgrades = new Set(loadedState.unlockedUpgrades); // Convert array back to Set
        audioService.userInteraction().then(() => audioService.playBackgroundMusic());
        return { ...loadedState, isPaused: false, gameStarted: true, notifications: [...loadedState.notifications, 'Game Loaded!']};
      } catch (e) {
          console.error("Failed to load game", e);
          return state;
      }
    }
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { transform, handleWheel, handleMouseDown, handleMouseUp, handleMouseMove, screenToWorld: rawScreenToWorld, zoom, isPanningRef } = useWorldScale();
  const screenToWorld = useCallback((x: number, y: number) => rawScreenToWorld(x, y, dimensions), [rawScreenToWorld, dimensions]);

  useGameLoop(dispatch, dimensions, gameState.isPaused, transform);

  const startGame = useCallback(async () => {
    const prompt = getNodeImagePrompt('player_consciousness');
    const imageUrl = await generateNodeImage(prompt);
    dispatch({ type: 'START_GAME', payload: { playerImageUrl: imageUrl || '' } });
  }, []);

  const loadGame = useCallback(() => {
    const savedGame = localStorage.getItem(SAVE_GAME_KEY);
    if (savedGame) {
      dispatch({ type: 'LOAD_GAME', payload: JSON.parse(savedGame) });
    }
  }, []);
  
  // Memoize HUD values to prevent re-renders
  const chapterInfo = useMemo(() => CHAPTERS[gameState.currentChapter], [gameState.currentChapter]);
  const karmaIndicatorPosition = useMemo(() => `${(gameState.karma + 100) / 2}%`, [gameState.karma]);
  
  const chapterUpgrades = useMemo(() => UPGRADES.filter(u => u.chapter === gameState.currentChapter), [gameState.currentChapter]);
  const unlockedChapterUpgrades = useMemo(() => chapterUpgrades.filter(u => gameState.unlockedUpgrades.has(u.id)).length, [chapterUpgrades, gameState.unlockedUpgrades]);
  const chapterProgress = useMemo(() => chapterUpgrades.length > 0 ? (unlockedChapterUpgrades / chapterUpgrades.length) * 100 : 0, [unlockedChapterUpgrades, chapterUpgrades.length]);

  if (!gameState.gameStarted) {
    return <SplashScreen onStartGame={startGame} onLoadGame={loadGame} dispatch={dispatch} settings={gameState.settings} />;
  }

  return (
    <>
      <div className={`app-container colorblind-${gameState.settings.colorblindMode} ${gameState.screenShake.duration > 0 ? 'shaking' : ''}`} style={{'--shake-intensity': `${gameState.screenShake.intensity}px`} as React.CSSProperties}>
        <BackgroundEffects gameState={gameState} dimensions={dimensions} />
        <KarmaParticles karma={gameState.karma} width={dimensions.width} height={dimensions.height} />
        
        <Simulation 
          gameState={gameState} 
          dispatch={dispatch} 
          dimensions={dimensions} 
          isZoomingOut={gameState.levelTransitionState === 'zooming'}
          transform={transform}
          worldScaleHandlers={{handleWheel, handleMouseDown, handleMouseUp, handleMouseMove}}
          screenToWorld={screenToWorld}
          isPanningRef={isPanningRef}
        />
      </div>
      
      <div className="hud-container">
          <div className="hud-top-bar">
              <div className="hud-resources hud-element">
                  <div className="hud-resource-item" title="Energy">
                    <svg fill="#fde047" viewBox="0 0 20 20"><path d="M11.23 13.06l-1.33 4.14a.5.5 0 01-.94 0l-1.33-4.14-.85.35a.5.5 0 01-.59-.64L7.5 7.5H4.5a.5.5 0 01-.4-.8l6-5.5a.5.5 0 01.8 0l6 5.5a.5.5 0 01-.4.8H13.5L12.18 12.77l-.95.29z"/></svg>
                    <span>{Math.floor(gameState.energy).toLocaleString()}</span>
                  </div>
                  <div className="hud-resource-item" title="Knowledge">
                    <svg fill="#a78bfa" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.13 5.13a6 6 0 018.48 0L10 10 5.13 5.13zM10 18a6 6 0 01-4.24-1.76l4.24-4.24 4.24 4.24A6 6 0 0110 18z"/></svg>
                    <span>{Math.floor(gameState.knowledge).toLocaleString()}</span>
                  </div>
              </div>
              
              <div className="hud-top-center hud-element">
                  <div className="hud-chapter-info">
                      <h2>{chapterInfo.name}</h2>
                      <p>Chapter {chapterInfo.id + 1}</p>
                  </div>
                   <div className="hud-chapter-progress-bar" title={`Chapter Progress: ${chapterProgress.toFixed(0)}%`}>
                      <div className="hud-chapter-progress-fill" style={{ width: `${chapterProgress}%` }} />
                   </div>
                   <div className="hud-karma-meter">
                        <div className="karma-labels">
                            <span className="karma-label-chaos">Chaos</span>
                            <span className="karma-label-harmony">Harmony</span>
                        </div>
                        <div className="karma-bar-bg">
                            <div className="karma-indicator" style={{ left: karmaIndicatorPosition }} />
                        </div>
                   </div>
                   <div className="text-center h-5 mt-1">
                      {gameState.karma > HARMONY_THRESHOLD && (
                          <p className="text-xs text-cyan-300 animate-pulse">Harmony's Favor</p>
                      )}
                      {gameState.karma < CHAOS_THRESHOLD && (
                          <p className="text-xs text-pink-400 animate-pulse">Chaotic Influence</p>
                      )}
                  </div>
              </div>

              <div className="hud-notifications">
                {gameState.notifications.map((msg, index) => (
                  <Notification key={`${msg}-${index}`} message={msg} onDismiss={() => dispatch({ type: 'DISMISS_NOTIFICATION', payload: { index } })} />
                ))}
              </div>
          </div>

          <div className="hud-action-buttons">
              <button onClick={() => setUpgradeModalOpen(true)} className="action-button">UPGRADES</button>
              <button onClick={() => setSettingsModalOpen(true)} className="action-button purple">OPTIONS</button>
              <button onClick={() => dispatch({type: 'SET_PAUSED', payload: !gameState.isPaused})} className="action-button blue">PAUSE</button>
          </div>
          
          <div className="hud-zoom-controls">
            <button onClick={() => zoom(1.2)} className="zoom-button" aria-label="Zoom In">+</button>
            <button onClick={() => zoom(1 / 1.2)} className="zoom-button" aria-label="Zoom Out">-</button>
          </div>
      </div>
      
      {gameState.isPaused && (
          <div className="pause-overlay">
            <h1 className="text-6xl font-bold text-teal-300 glow-text">PAUSED</h1>
          </div>
      )}
      
      <NodeInspector gameState={gameState} dispatch={dispatch} />
      
      {isUpgradeModalOpen && <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} gameState={gameState} onPurchase={(upgrade, imageUrl) => dispatch({type: 'PURCHASE_UPGRADE', payload: {upgrade, imageUrl}})} />}
      {isSettingsModalOpen && <SettingsModal settings={gameState.settings} dispatch={dispatch} onClose={() => setSettingsModalOpen(false)} />}
      {gameState.tutorialStep !== -1 && <Tutorial step={gameState.tutorialStep} dispatch={dispatch} />}
      {gameState.activeMilestone && <MilestoneVisual milestoneId={gameState.activeMilestone.id} imageUrl={gameState.activeMilestone.imageUrl} onComplete={() => dispatch({type: 'MILESTONE_COMPLETE'})} />}
      {gameState.activeCrossroadsEvent && <CrossroadsModal event={gameState.activeCrossroadsEvent} dispatch={dispatch} />}
      {gameState.activeChapterTransition && <ChapterTransition chapterId={gameState.activeChapterTransition} dispatch={dispatch} />}
      {gameState.levelTransitionState !== 'none' && <LevelTransition levelState={gameState.levelTransitionState} zoomLevel={gameState.zoomLevel} dispatch={dispatch} />}
    </>
  );
};

export default App;