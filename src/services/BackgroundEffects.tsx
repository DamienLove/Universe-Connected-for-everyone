

import React, { useRef, useEffect } from 'react';
import { GameState } from '../types';
import { useBackgroundEffects } from './useBackgroundEffects';

interface BackgroundEffectsProps {
  gameState: GameState;
  dimensions: { width: number; height: number };
}

const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ gameState, dimensions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isQuantumFoamActive = gameState.unlockedUpgrades.has('quantum_computing');

  const { twinklingStars, meteors, quantumFoam, updateEffects } = useBackgroundEffects(dimensions.width, dimensions.height, isQuantumFoamActive);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (time: number) => {
      // Update particle positions
      updateEffects();

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw twinkling stars
      twinklingStars.forEach(star => {
        const opacity = Math.abs(Math.sin(time / 2000 + star.offset)) * star.maxOpacity;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw quantum foam
      if (isQuantumFoamActive) {
          quantumFoam.forEach(p => {
              const opacity = (p.life / p.maxLife) * 0.5; // Fade in and out
              ctx.fillStyle = `rgba(150, 220, 255, ${opacity})`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
          });
      }

      // Draw meteors
      meteors.forEach(meteor => {
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * (meteor.len / 20), meteor.y - meteor.vy * (meteor.len / 20)); // Adjust tail length
        ctx.strokeStyle = `rgba(255, 255, 255, ${meteor.life / 50})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });


      animationFrameId = window.requestAnimationFrame(render);
    };

    render(0);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [
    dimensions.width,
    dimensions.height,
    twinklingStars,
    meteors,
    quantumFoam,
    updateEffects,
    isQuantumFoamActive
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
    />
  );
};

export default BackgroundEffects;