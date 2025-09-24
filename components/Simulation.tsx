import React from 'react';
import { GameNode } from '../types';

interface SimulationProps {
  nodes: GameNode[];
  dimensions: { width: number; height: number };
}

const Simulation: React.FC<SimulationProps> = ({ nodes, dimensions }) => {
  const { width, height } = dimensions;

  return (
    <div className="simulation-container">
      {/* Parallax Starfield Background */}
      <div className="stars stars1"></div>
      <div className="stars stars2"></div>
      <div className="stars stars3"></div>

      {/* Viewport for centering and zooming */}
      <div 
        className="simulation-viewport"
        style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: `translate(${width / 2}px, ${height / 2}px) scale(1.5)`
        }}
       >
        {/* Draw connections first so they are underneath the nodes */}
        <svg width="100%" height="100%" style={{ position: 'absolute', top: '-50%', left: '-50%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: 'rgba(168, 85, 247, 0.2)' }} />
              <stop offset="50%" style={{ stopColor: 'rgba(236, 72, 153, 0.5)' }} />
              <stop offset="100%" style={{ stopColor: 'rgba(168, 85, 247, 0.2)' }} />
            </linearGradient>
             <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
          </defs>
          <g>
            {nodes.map(node =>
              node.connections.map(connId => {
                const target = nodes.find(n => n.id === connId);
                if (target) {
                  return (
                    <line
                      key={`${node.id}-${connId}`}
                      x1={node.x}
                      y1={node.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="url(#line-gradient)"
                      strokeWidth="1.5"
                      filter="url(#glow)"
                    />
                  );
                }
                return null;
              })
            )}
          </g>
        </svg>
        
        {/* Draw nodes */}
        {nodes.map(node => {
          const nodeClasses = `node ${node.type} ${node.hasLife ? 'hasLife' : ''}`;
          const nodeStyle: React.CSSProperties = {
            left: `${node.x}px`,
            top: `${node.y}px`,
          };
          // For non-circular nodes like nebula
          if (node.type === 'nebula') {
             nodeStyle.width = `${node.size * 1.5}px`;
             nodeStyle.height = `${node.size}px`;
          } else {
             nodeStyle.width = `${node.size * 2}px`;
             nodeStyle.height = `${node.size * 2}px`;
          }

          return (
              <div key={node.id} className={nodeClasses} style={nodeStyle}>
                  {/* Optional: Add labels inside nodes if needed */}
              </div>
          );
        })}
       </div>
    </div>
  );
};

export default Simulation;