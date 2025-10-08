import { useRef, useMemo, useCallback } from 'react';

// For twinkling stars
interface TwinklingStar {
  x: number;
  y: number;
  size: number;
  maxOpacity: number;
  // For sine wave animation
  offset: number; 
}

// For meteors
interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
}

// For quantum foam
interface QuantumParticle {
    x: number;
    y: number;
    size: number;
    life: number;
    maxLife: number;
}

const NUM_TWINKLING_STARS = 100;
const NUM_QUANTUM_PARTICLES = 150;
const METEOR_CHANCE_PER_FRAME = 0.005; // 0.5% chance each frame

const createTwinklingStar = (width: number, height: number): TwinklingStar => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 1.5 + 0.5,
  maxOpacity: Math.random() * 0.5 + 0.2,
  offset: Math.random() * Math.PI * 2,
});

const createMeteor = (width: number, height: number): Meteor => {
    const fromLeft = Math.random() > 0.5;

    return {
        x: fromLeft ? -50 : width + 50,
        y: Math.random() * height,
        vx: (fromLeft ? 1 : -1) * (Math.random() * 5 + 10), // Faster speed
        vy: (Math.random() - 0.5) * 4,
        len: Math.random() * 150 + 50,
        life: 100, // frames until it fades
    }
};

const createQuantumParticle = (width: number, height: number): QuantumParticle => {
    const maxLife = Math.random() * 60 + 30; // 0.5 to 1.5 seconds
    return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1 + 0.5,
        life: maxLife,
        maxLife,
    }
};

export const useBackgroundEffects = (width: number, height: number, isQuantumFoamActive: boolean) => {
  const twinklingStars = useRef<TwinklingStar[]>([]);
  const meteors = useRef<Meteor[]>([]);
  const quantumFoam = useRef<QuantumParticle[]>([]);

  useMemo(() => {
    if (width > 0 && height > 0) {
      twinklingStars.current = Array.from({ length: NUM_TWINKLING_STARS }).map(() => createTwinklingStar(width, height));
      meteors.current = []; // Start with no meteors
      if (isQuantumFoamActive) {
          quantumFoam.current = Array.from({length: NUM_QUANTUM_PARTICLES}).map(() => createQuantumParticle(width, height));
      } else {
          quantumFoam.current = [];
      }
    }
  }, [width, height, isQuantumFoamActive]);

  const updateEffects = useCallback(() => {
    if (!width || !height) return;

    // Update existing meteors, removing them once their life ends
    meteors.current = meteors.current.filter(m => {
        m.x += m.vx;
        m.y += m.vy;
        m.life--;
        return m.life > 0;
    });

    // Randomly spawn new meteors
    if (Math.random() < METEOR_CHANCE_PER_FRAME) {
        meteors.current.push(createMeteor(width, height));
    }
    
    // Update quantum foam particles
    if (isQuantumFoamActive) {
        quantumFoam.current.forEach(p => {
            p.life--;
            if (p.life <= 0) {
                Object.assign(p, createQuantumParticle(width, height));
            }
        });
    }


  }, [width, height, isQuantumFoamActive]);

  return { twinklingStars: twinklingStars.current, meteors: meteors.current, quantumFoam: quantumFoam.current, updateEffects };
};