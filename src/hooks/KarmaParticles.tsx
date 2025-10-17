import React, { useRef, useEffect } from 'react';
import { useParticles } from './useParticles';

interface KarmaParticlesProps {
  karma: number;
  width: number;
  height: number;
}

const KarmaParticles: React.FC<KarmaParticlesProps> = ({ karma, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { particles, updateParticles } = useParticles(karma, width, height);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      updateParticles();

      if (width > 0 && height > 0) {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [width, height, particles, updateParticles]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full z-1 pointer-events-none"
    />
  );
};

export default KarmaParticles;