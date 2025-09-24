import { useRef, useMemo, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  type: 'harmony' | 'chaos' | 'neutral';
}

interface ParticleConfig {
  count: number;
  type: 'harmony' | 'chaos' | 'neutral';
  color: string;
  minSize: number;
  maxSize: number;
  minDuration: number;
  maxDuration: number;
}

const getParticleConfig = (karma: number): ParticleConfig => {
  if (karma > 20) {
    return {
      count: karma > 75 ? 40 : 25,
      type: 'harmony',
      color: 'rgba(74, 222, 128, 0.6)',
      minSize: 1, maxSize: 4, minDuration: 10 * 60, maxDuration: 25 * 60,
    };
  }
  if (karma < -20) {
    return {
      count: karma < -75 ? 50 : 30,
      type: 'chaos',
      color: 'rgba(220, 38, 38, 0.5)',
      minSize: 2, maxSize: 3, minDuration: 1 * 60, maxDuration: 3 * 60,
    };
  }
  return {
    count: 15,
    type: 'neutral',
    color: 'rgba(107, 114, 128, 0.4)',
    minSize: 1, maxSize: 2, minDuration: 30 * 60, maxDuration: 60 * 60,
  };
};

const createParticle = (config: ParticleConfig, width: number, height: number): Particle => {
  const size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
  const life = Math.random() * (config.maxDuration - config.minDuration) + config.minDuration;
  let x, y, vx, vy;

  switch (config.type) {
    case 'harmony':
    case 'neutral':
      x = Math.random() * width;
      y = Math.random() * height + height; // Start below the screen
      vx = 0;
      vy = - (Math.random() * 0.5 + 0.2); // Drift up
      break;
    case 'chaos':
      x = Math.random() * width;
      y = Math.random() * height;
      vx = (Math.random() - 0.5) * 2;
      vy = (Math.random() - 0.5) * 2;
      break;
  }

  return { x, y, vx, vy, size, color: config.color, life, type: config.type };
};


export const useParticles = (karma: number, width: number, height: number) => {
  const particles = useRef<Particle[]>([]);
  const particleConfig = useMemo(() => getParticleConfig(karma), [karma]);

  // This useMemo hook ensures that particles are only re-initialized when necessary
  useMemo(() => {
    if (width > 0 && height > 0) {
      particles.current = Array.from({ length: particleConfig.count }).map(() => createParticle(particleConfig, width, height));
    }
  }, [particleConfig, width, height]);

  const updateParticles = useCallback(() => {
    if (!width || !height) return;

    particles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life <= 0) {
        Object.assign(p, createParticle(particleConfig, width, height));
      }
      
      // Reset particles that go off-screen for drift types
      if (p.type !== 'chaos' && p.y < -p.size) {
         Object.assign(p, createParticle(particleConfig, width, height), { y: height + p.size });
      }
    });
  }, [particleConfig, width, height]);

  return { particles: particles.current, updateParticles };
};