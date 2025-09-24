import React, { useState } from 'react';
import { GameState } from '../types';
import { useWorldScale } from '../hooks/useWorldScale';

interface SimulationProps {
  gameState: GameState;
  onNodeClick: (nodeId: string | null) => void;
  selectedNodeId: string | null;
  dimensions: { width: number; height: number };
}

const Simulation: React.FC<SimulationProps> = ({ gameState, onNodeClick, selectedNodeId, dimensions }) => {
  const { width, height } = dimensions;

  const {
    transform,
    handleWheel,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    isPanningRef,
    screenToWorld,
  } = useWorldScale(1.5);

  const [worldMousePos, setWorldMousePos] = useState({ x: 0, y: 0 });
  
  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isPanningRef.current) {
      onNodeClick(null);
    }
  };

  const handleSimMouseMove = (e: React.MouseEvent) => {
    handleMouseMove(e);
    if (gameState.connectMode.active && gameState.connectMode.sourceNodeId) {
        const { x, y } = screenToWorld(e.clientX, e.clientY, dimensions);
        setWorldMousePos({ x, y });
    }
  };

  const sourceNode = gameState.connectMode.sourceNodeId
    ? gameState.nodes.find(n => n.id === gameState.connectMode.sourceNodeId)
    : null;

  return (
    <div
      className="simulation-container"
      style={{ cursor: gameState.connectMode.active ? 'crosshair' : 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleSimMouseMove}
      onMouseLeave={handleMouseUp}
      onClick={handleContainerClick}
    >
      <div
        className="world-container"
        style={{
          transform: `translate(${width / 2}px, ${height / 2}px) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
        }}
      >
        <svg className="connections-svg">
          {gameState.nodes.map(node =>
            node.connections.map(connId => {
              const target = gameState.nodes.find(n => n.id === connId);
              if (!target) return null;
              return (
                <line
                  key={`${node.id}-${connId}`}
                  x1={node.x}
                  y1={node.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="rgba(100, 180, 255, 0.2)"
                  strokeWidth={2 / transform.scale}
                />
              );
            })
          )}
          {gameState.connectMode.active && sourceNode && (
            <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={worldMousePos.x}
                y2={worldMousePos.y}
                stroke="rgba(0, 255, 255, 0.7)"
                strokeWidth={2 / transform.scale}
                strokeDasharray={`${6 / transform.scale} ${3 / transform.scale}`}
            />
          )}
        </svg>

        {gameState.nodes.map(node => {
          const isSelected = node.id === selectedNodeId && !gameState.connectMode.active;
          const isConnectSource = node.id === gameState.connectMode.sourceNodeId;
          const classNames = `node-image ${node.type} ${node.hasLife ? 'hasLife' : ''}`;
          
          return (
            <div
              key={node.id}
              className="node-image-container"
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.radius * 2}px`,
                height: `${node.radius * 2}px`,
                zIndex: isSelected || isConnectSource ? 10 : 1,
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                boxShadow: isSelected ? '0 0 25px rgba(0, 255, 255, 0.8)' : isConnectSource ? '0 0 30px rgba(0, 220, 255, 1)' : 'none',
                border: isConnectSource ? `2px dashed rgba(0, 255, 255, 0.9)` : 'none',
                borderRadius: '50%',
                transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick(node.id);
              }}
            >
              {node.imageUrl ? (
                <div
                  className={classNames}
                  style={{
                    backgroundImage: `url(${node.imageUrl})`,
                  }}
                />
              ) : (
                <div className="node-placeholder" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Simulation;