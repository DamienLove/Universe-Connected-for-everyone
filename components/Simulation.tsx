

import React, { useState, useEffect } from 'react';
import { GameAction, GameState } from '../types';
import { useWorldScale } from '../hooks/useWorldScale';

interface SimulationProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  onNodeClick: (nodeId: string | null) => void;
  selectedNodeId: string | null;
  dimensions: { width: number; height: number };
  mouseWorldPos: { x: number, y: number };
  onMouseMove: (pos: { x: number, y: number }) => void;
}

const Simulation: React.FC<SimulationProps> = ({ gameState, dispatch, onNodeClick, selectedNodeId, dimensions, mouseWorldPos, onMouseMove }) => {
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
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && gameState.connectMode.active) {
            dispatch({ type: 'CANCEL_CONNECTION_MODE' });
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.connectMode.active, dispatch]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isPanningRef.current) {
      if (gameState.connectMode.active) {
        dispatch({ type: 'CANCEL_CONNECTION_MODE' });
      } else {
        onNodeClick(null);
      }
    }
  };

  const handleSimMouseMove = (e: React.MouseEvent) => {
    handleMouseMove(e); // For panning
    const worldPos = screenToWorld(e.clientX, e.clientY, dimensions);
    onMouseMove(worldPos);
  };

  const sourceNode = gameState.connectMode.active && gameState.connectMode.sourceNodeId
    ? gameState.nodes.find(n => n.id === gameState.connectMode.sourceNodeId)
    : null;

  return (
    <div
      className="simulation-container"
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
          {sourceNode && (
            <line
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={mouseWorldPos.x}
              y2={mouseWorldPos.y}
              stroke="rgba(0, 255, 255, 0.7)"
              strokeWidth={3 / transform.scale}
              strokeDasharray={`${8 / transform.scale} ${4 / transform.scale}`}
            />
          )}
        </svg>

        {/* Render Connection Particles */}
        {gameState.connectionParticles.map(p => {
            const pSource = gameState.nodes.find(n => n.id === p.sourceId);
            const pTarget = gameState.nodes.find(n => n.id === p.targetId);
            if (!pSource || !pTarget) return null;

            const x = pSource.x + (pTarget.x - pSource.x) * p.progress;
            const y = pSource.y + (pTarget.y - pSource.y) * p.progress;

            return (
                <div
                    key={p.id}
                    className="connection-particle"
                    style={{
                        left: `${x}px`,
                        top: `${y}px`,
                    }}
                />
            );
        })}

        {/* Render Connection Pulses */}
        {gameState.connectionPulses.map(pulse => {
            const source = gameState.nodes.find(n => n.id === pulse.sourceId);
            const target = gameState.nodes.find(n => n.id === pulse.targetId);
            if (!source || !target) return null;

            const x = source.x + (target.x - source.x) * pulse.progress;
            const y = source.y + (target.y - source.y) * pulse.progress;

            return (
                <div
                    key={pulse.id}
                    className="connection-pulse"
                    style={{
                        left: `${x}px`,
                        top: `${y}px`,
                    }}
                />
            );
        })}

        {/* Render Energy Orbs */}
        {gameState.energyOrbs.map(orb => (
          <div
            key={orb.id}
            className="energy-orb"
            style={{
              left: `${orb.x}px`,
              top: `${orb.y}px`,
              width: `${orb.radius * 2}px`,
              height: `${orb.radius * 2}px`,
            }}
          />
        ))}

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
                zIndex: node.type === 'player_consciousness' ? 20 : isSelected || isConnectSource ? 10 : 1,
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                boxShadow: isSelected ? '0 0 25px rgba(0, 255, 255, 0.8)' : isConnectSource ? '0 0 30px rgba(0, 220, 255, 1)' : 'none',
                border: isConnectSource ? `2px dashed rgba(0, 255, 255, 0.9)` : 'none',
                borderRadius: '50%',
                transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out', // Removed transition on left/top for smoother physics
              }}
              onClick={(e) => {
                if (node.type !== 'player_consciousness') {
                  e.stopPropagation();
                  // FIX: Corrected a typo from 'node.00id' to 'node.id' to fix the error.
                  onNodeClick(node.id);
                }
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
                 <div className={classNames} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Simulation;