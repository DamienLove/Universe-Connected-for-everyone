import React, { useMemo } from 'react';

interface KarmaParticlesProps {
  karma: number;
}

interface ParticleConfig {
  count: number;
  className: string;
  minSize: number;
  maxSize: number;
  minDuration: number;
  maxDuration: number;
}

const KarmaParticles: React.FC<KarmaParticlesProps> = ({ karma }) => {
  const particleConfig = useMemo((): ParticleConfig => {
    if (karma > 20) {
      return {
        count: karma > 75 ? 40 : 25,
        className: 'particle-harmony',
        minSize: 1,
        maxSize: 4,
        minDuration: 10,
        maxDuration: 25,
      };
    }
    if (karma < -20) {
      return {
        count: karma < -75 ? 50 : 30,
        className: 'particle-chaos',
        minSize: 2,
        maxSize: 3,
        minDuration: 1,
        maxDuration: 3,
      };
    }
    return {
      count: 15,
      className: 'particle-neutral',
      minSize: 1,
      maxSize: 2,
      minDuration: 30,
      maxDuration: 60,
    };
  }, [karma]);

  const particles = useMemo(() => {
    return Array.from({ length: particleConfig.count }).map((_, idx) => {
      const size = Math.random() * (particleConfig.maxSize - particleConfig.minSize) + particleConfig.minSize;
      const duration = Math.random() * (particleConfig.maxDuration - particleConfig.minDuration) + particleConfig.minDuration;
      const delay = Math.random() * particleConfig.maxDuration;
      const startX = Math.random() * 100;
      // Chaos particles start anywhere, others start at the bottom to drift up
      const startY = particleConfig.className === 'particle-chaos' ? Math.random() * 100 : 100;
      
      const i = Math.random() * 2 - 1; // for chaos path randomization
      const j = Math.random() * 2 - 1; // for chaos path randomization

      const style: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}%`,
        top: `${startY}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      };
      
      if (particleConfig.className === 'particle-chaos') {
          (style as any)['--i'] = i.toFixed(2);
          (style as any)['--j'] = j.toFixed(2);
      }

      return {
        id: idx,
        style,
      };
    });
  }, [particleConfig]);

  return (
    <div className="particle-container">
      {particles.map(p => (
        <div key={p.id} className={`particle ${particleConfig.className}`} style={p.style} />
      ))}
    </div>
  );
};

export default KarmaParticles;
