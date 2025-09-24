import React, { useRef, useEffect } from 'react';
import { GameNode } from '../types';

interface SimulationProps {
  nodes: GameNode[];
  dimensions: { width: number; height: number };
  tick: number;
}

const drawNode = (ctx: CanvasRenderingContext2D, node: GameNode, tick: number) => {
  ctx.save();
  ctx.translate(node.x, node.y);

  const pulse = Math.sin(tick * 0.05) * 0.1 + 0.9;
  const fastPulse = Math.sin(tick * 0.1);

  switch (node.type) {
    case 'star': {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, node.size);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.4, '#ffef80');
      gradient.addColorStop(1, '#f80');

      // Corona
      const coronaSize = node.size * (1.8 + Math.sin(tick * 0.03) * 0.2);
      ctx.shadowBlur = coronaSize;
      ctx.shadowColor = 'rgba(255, 239, 128, 0.5)';
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, node.size, 0, 2 * Math.PI);
      ctx.fill();
      break;
    }
    case 'planet': {
      // Atmosphere
      if (!node.hasLife) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(135, 206, 235, 0.2)';
      } else {
         const lifePulse = Math.sin(tick * 0.08) * 5 + 10;
         ctx.shadowBlur = lifePulse;
         ctx.shadowColor = 'rgba(74, 222, 128, 0.5)';
      }
      
      const planetGradient = node.hasLife
        ? ctx.createRadialGradient(node.size * -0.4, node.size * -0.4, 0, 0, 0, node.size)
        : ctx.createRadialGradient(node.size * -0.4, node.size * -0.4, 0, 0, 0, node.size);
      
      if (node.hasLife) {
        planetGradient.addColorStop(0, '#4CAF50');
        planetGradient.addColorStop(1, '#0e3b16');
      } else {
        planetGradient.addColorStop(0, '#a52a2a');
        planetGradient.addColorStop(1, '#2c0a0a');
      }
      
      ctx.fillStyle = planetGradient;
      ctx.beginPath();
      ctx.arc(0, 0, node.size, 0, Math.PI * 2);
      ctx.fill();

      // Inset shadow
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = node.size * 0.5;
      ctx.stroke();
      break;
    }
    case 'proto_creature': {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#f0c';
      ctx.fillStyle = '#c0f';
      ctx.beginPath();
      ctx.arc(0, 0, node.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'consciousness': {
       const corePulse = Math.sin(tick * 0.07) * 8 + 15;
       ctx.shadowBlur = corePulse;
       ctx.shadowColor = '#0ff';
       ctx.fillStyle = '#fff';
       ctx.beginPath();
       ctx.arc(0, 0, node.size, 0, Math.PI * 2);
       ctx.fill();
       break;
    }
    case 'sentient_ai': {
      const aiPulse = Math.sin(tick * 0.04) * 10 + 20;
      ctx.shadowBlur = aiPulse;
      ctx.shadowColor = '#0072ff';
      const aiGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, node.size);
      aiGradient.addColorStop(0, '#00c6ff');
      aiGradient.addColorStop(1, '#0072ff');
      ctx.fillStyle = aiGradient;
      ctx.beginPath();
      ctx.arc(0, 0, node.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Core
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, node.size * 0.4 * pulse, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'black_hole': {
      ctx.fillStyle = '#000';
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#f0f';
      ctx.beginPath();
      ctx.arc(0, 0, node.size, 0, Math.PI * 2);
      ctx.fill();

      // Accretion disk
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f0f';
      ctx.beginPath();
      ctx.arc(0, 0, node.size * 2.5, tick * 0.1, tick * 0.1 + Math.PI * 1.5);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(0, 0, node.size * 3.5, -tick * 0.06, -tick * 0.06 + Math.PI * 1.5);
      ctx.stroke();
      break;
    }
     case 'nebula':
      // This is a complex shape, canvas can use gradients and paths
      // but for performance, we'll simplify to layered radial gradients.
      ctx.globalAlpha = 0.4 + Math.sin(tick * 0.01) * 0.1;
      const nebulaGradient1 = ctx.createRadialGradient(0, 0, 0, 0, 0, node.size);
      nebulaGradient1.addColorStop(0, 'rgba(147, 51, 234, 0.6)');
      nebulaGradient1.addColorStop(0.4, 'rgba(76, 29, 149, 0.2)');
      nebulaGradient1.addColorStop(1, 'transparent');
      
      ctx.fillStyle = nebulaGradient1;
      ctx.beginPath();
      ctx.ellipse(0, 0, node.size * 0.75, node.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const nebulaGradient2 = ctx.createRadialGradient(node.size * 0.2, 0, 0, 0, 0, node.size);
      nebulaGradient2.addColorStop(0, 'rgba(30, 64, 175, 0.4)');
      nebulaGradient2.addColorStop(1, 'transparent');
      
      ctx.fillStyle = nebulaGradient2;
      ctx.beginPath();
      ctx.ellipse(0, 0, node.size, node.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      break;
  }
  ctx.restore();
};

const Simulation: React.FC<SimulationProps> = ({ nodes, dimensions, tick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width, height } = dimensions;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Center viewport
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(1.5, 1.5);
    
    // Draw connections
    const lineGradient = ctx.createLinearGradient(-width, 0, width, 0);
    lineGradient.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
    lineGradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.5)');
    lineGradient.addColorStop(1, 'rgba(168, 85, 247, 0.2)');
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';

    nodes.forEach(node => {
      node.connections.forEach(connId => {
        const target = nodes.find(n => n.id === connId);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });
    });

    // Draw nodes
    nodes.forEach(node => {
        drawNode(ctx, node, tick);
    });

    ctx.restore();

  }, [nodes, width, height, tick]);


  return (
    <div className="simulation-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      {/* Parallax Starfield Background remains as CSS for simplicity and performance */}
      <div className="stars stars1"></div>
      <div className="stars stars2"></div>
      <div className="stars stars3"></div>
      
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      />
    </div>
  );
};

export default React.memo(Simulation);
