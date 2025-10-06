import React from 'react';
import { GameAction, GameState, GameNode, WorldTransform } from '../types';
import RadialMenu from './RadialMenu';
import LoreTooltip from './LoreTooltip';
import { getGeminiLoreForNode, generateNodeImage } from '../services/geminiService';
import { CHAPTERS } from './constants';

interface SimulationProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  dimensions: { width: number; height: number };
  isZoomingOut: boolean;
  transform: WorldTransform;
  worldScaleHandlers: {
    handleWheel: (event: React.WheelEvent) => void;
    handleMouseDown: (event: React.MouseEvent) => void;
    handleMouseUp: () => void;
    handleMouseMove: (event: React.MouseEvent) => void;
  };
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
}

const PLAYER_HUNT_RANGE = 150;
const TUNNEL_DURATION_TICKS = 60; // Must match constant in App.tsx

const Simulation: React.FC<SimulationProps> = ({ gameState, dispatch, dimensions, isZoomingOut, transform, worldScaleHandlers, screenToWorld }) => {
  const { width, height } = dimensions;

  const isPanningRef = React.useRef(false);
  const handleMouseDown = (e: React.MouseEvent) => {
      isPanningRef.current = false; // Reset on new click
      const originalMouseDown = worldScaleHandlers.handleMouseDown;
      
      const moveHandler = () => {
          isPanningRef.current = true;
          window.removeEventListener('mousemove', moveHandler);
      };
      window.addEventListener('mousemove', moveHandler, { once: true });
      
      originalMouseDown(e);
  };

  const playerNode = gameState.nodes.find(n => n.type === 'player_consciousness');
  
  const handleNodeClick = (nodeId: string) => {
    dispatch({ type: 'SELECT_NODE', payload: { nodeId } });
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isPanningRef.current) {
        if(gameState.selectedNodeId) {
            dispatch({ type: 'SELECT_NODE', payload: { nodeId: null } });
        } else {
            dispatch({ type: 'PLAYER_CONTROL_CLICK' });
        }
    }
  };

  const handleMouseMoveForAiming = (e: React.MouseEvent) => {
    if (gameState.projectionState.phase === 'aiming' && !isPanningRef.current) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      dispatch({ type: 'AIM_WITH_MOUSE', payload: { worldX: x, worldY: y } });
    }
  };

  const handleWheelForPower = (e: React.WheelEvent) => {
    if (gameState.projectionState.phase === 'charging') {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      dispatch({ type: 'ADJUST_LAUNCH_POWER', payload: { delta } });
    } else {
      worldScaleHandlers.handleWheel(e);
    }
  };

  const handleAsk = async (nodeId: string) => {
    const node = gameState.nodes.find(n => n.id === nodeId);
    const chapter = CHAPTERS[gameState.currentChapter];
    if (!node || !chapter) return;

    dispatch({ type: 'SET_LORE_LOADING', payload: { nodeId } });
    try {
        const lore = await getGeminiLoreForNode(node, chapter);
        dispatch({ type: 'SET_LORE_RESULT', payload: { nodeId, text: lore } });
    } catch (error) {
        dispatch({ type: 'SET_LORE_RESULT', payload: { nodeId, text: "The cosmos remains silent..." } });
    }
  };

  const selectedNode = gameState.nodes.find(n => n.id === gameState.selectedNodeId);
  
  const huntablePhages = playerNode ? gameState.phages.filter(p => {
    const dx = playerNode.x - p.x;
    const dy = playerNode.y - p.y;
    return Math.sqrt(dx * dx + dy * dy) < PLAYER_HUNT_RANGE;
  }) : [];
  
  const renderProjectionUI = () => {
    if (!playerNode || playerNode.playerState !== 'IDLE') return null;

    const { projectionState, aimAssistTargetId } = gameState;
    const { phase, angle, power } = projectionState;

    if (phase === 'inactive') return null;
    
    // Aim indicator
    const aimAngleDegrees = angle * (180 / Math.PI); // Convert radians to degrees
    const aimIndicator = (
      <div
        id="aim-indicator"
        className={`aim-indicator ${aimAssistTargetId ? 'locked-on' : ''}`}
        style={{
          left: `${playerNode.x}px`,
          top: `${playerNode.y}px`,
          width: '500px',
          transform: `rotate(${aimAngleDegrees}deg)`,
          opacity: phase === 'charging' ? 0.5 : 1,
        }}
      />
    );
    
    // Power meter
    const powerMeterRadius = playerNode.radius + 15;
    const circumference = 2 * Math.PI * powerMeterRadius;
    const powerMeter = phase === 'charging' && (
      <svg 
        id="power-meter-container"
        width={powerMeterRadius * 2 + 8} height={powerMeterRadius * 2 + 8}
        style={{
            left: `${playerNode.x}px`, top: `${playerNode.y}px`,
            filter: 'drop-shadow(0 0 5px #00f6ff)'
        }}
    >
        <circle
            className="power-meter-bg"
            cx="50%" cy="50%" r={powerMeterRadius}
            strokeWidth="4" fill="transparent"
        />
        <circle
            className="power-meter-fg"
            cx="50%" cy="50%" r={powerMeterRadius}
            strokeWidth="4" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - power)}
            transform={`rotate(-90 ${powerMeterRadius+4} ${powerMeterRadius+4})`}
        />
      </svg>
    );

    return <> {aimIndicator} {powerMeter} </>;
  };

  const renderReformingParticles = () => {
      if (!playerNode || playerNode.playerState !== 'REFORMING') return null;
      
      return Array.from({length: 30}).map((_, i) => {
          const angle = (i / 30) * Math.PI * 2 + (Math.random() - 0.5);
          // By using a constant distance, we create a stable vortex instead of a jittery slideshow effect.
          const dist = 150 + Math.random() * 50; 
          return (
              <div key={i} className="reforming-particle" style={{
                  left: `${gameState.projectionState.launchPosition.x}px`,
                  top: `${gameState.projectionState.launchPosition.y}px`,
                  width: '5px', height: '5px',
                  // CSS Custom Properties for the animation
                  '--x-start': `${Math.cos(angle) * dist}px`,
                  '--y-start': `${Math.sin(angle) * dist}px`,
              } as React.CSSProperties} />
          );
      });
  }
  
  const worldRadius = (Math.min(width, height) * 1.5) / (gameState.zoomLevel + 1);

  return (
    <div
      className="simulation-container"
      onWheel={handleWheelForPower}
      onMouseDown={handleMouseDown}
      onMouseUp={worldScaleHandlers.handleMouseUp}
      onMouseMove={(e) => {
        worldScaleHandlers.handleMouseMove(e);
        handleMouseMoveForAiming(e);
      }}
      onMouseLeave={worldScaleHandlers.handleMouseUp}
      onClick={handleContainerClick}
    >
      <div
        className={`world-container ${isZoomingOut ? 'level-zoom-out' : ''}`}
        style={{
          transform: `translate(${width / 2}px, ${height / 2}px) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
        }}
      >
        <div 
            className="playable-area-boundary"
            style={{ width: `${worldRadius * 2}px`, height: `${worldRadius * 2}px`, left: '0', top: '0' }}
        />

        <svg className="connections-svg">
          {gameState.nodes.map(node =>
            node.connections.map(connId => {
              const target = gameState.nodes.find(n => n.id === connId);
              if (!target) return null;
              return (
                <line
                  key={`${node.id}-${connId}`}
                  className="connection-line"
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
          {/* Taming Beams for Phages */}
          {huntablePhages.map(phage => playerNode && (
            <line
                key={`beam-${phage.id}`}
                x1={playerNode.x}
                y1={playerNode.y}
                x2={phage.x}
                y2={phage.y}
                stroke="rgba(173, 216, 230, 0.5)"
                strokeWidth={2 / transform.scale}
            />
          ))}
        </svg>

        {renderProjectionUI()}

        {/* Render Connection Pulses */}
        {gameState.connectionParticles.map(particle => {
            const source = gameState.nodes.find(n => n.id === particle.sourceId);
            const target = gameState.nodes.find(n => n.id === particle.targetId);
            if (!source || !target) return null;

            const x = source.x + (target.x - source.x) * particle.progress;
            const y = source.y + (target.y - source.y) * particle.progress;
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            const pulseWidth = 40 / transform.scale;

            return (
                <div
                    key={particle.id}
                    className="connection-pulse"
                    style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        width: `${pulseWidth}px`,
                        transform: `rotate(${angle}deg)`,
                    }}
                />
            );
        })}
        
        {/* Render Cosmic Events */}
        {gameState.cosmicEvents.map(event => {
            if (event.type === 'supernova' && event.phase === 'active') {
                const baseSize = event.radius * 2;
                const containerStyle: React.CSSProperties = {
                    left: `${event.x}px`, top: `${event.y}px`,
                    width: `${baseSize}px`, height: `${baseSize}px`,
                };
                return (
                    <div key={event.id} className="supernova-container" style={containerStyle}>
                        <div className="supernova-flash" style={{ inset: 0 }} />
                        <div className="supernova-shockwave" style={{ inset: 0 }} />
                        <div className="supernova-nebula" style={{ inset: 0 }} />
                    </div>
                );
            }
            if (event.type === 'supernova' && event.phase === 'warning') {
                const targetNode = gameState.nodes.find(n => n.id === event.targetNodeId);
                if (!targetNode) return null;
                return (
                    <div key={event.id} className="supernova-warning" style={{
                        left: `${targetNode.x}px`, top: `${targetNode.y}px`,
                        width: `${targetNode.radius * 2.5}px`, height: `${targetNode.radius * 2.5}px`
                    }} />
                );
            }
            if (event.type === 'gravitational_anomaly') {
                return (
                     <div key={event.id} className="anomaly-vortex" style={{
                         left: `${event.x}px`, top: `${event.y}px`,
                         width: `${event.radius * 2}px`, height: `${event.radius * 2}px`
                     }} />
                );
            }
            if (event.type === 'resource_bloom') {
                 return (
                     <div key={event.id} className="resource-bloom" style={{
                         left: `${event.x}px`, top: `${event.y}px`,
                         width: `${event.radius * 2}px`, height: `${event.radius * 2}px`,
                         opacity: event.duration < 300 ? (event.duration / 300) : 1, // Fade out
                     }} />
                 );
            }
            return null;
        })}

        {/* Render Anomaly Particles */}
        {gameState.anomalyParticles.map(p => (
            <div
                key={p.id}
                className="anomaly-particle"
                style={{
                    left: `${p.x}px`,
                    top: `${p.y}px`,
                    width: '3px',
                    height: '3px',
                    opacity: p.life / 120, // Fade out
                }}
            />
        ))}

        {/* Render Collection Effects */}
        {gameState.collectionEffects.map(effect => {
            const progress = effect.life / 20.0; // Assuming initial life is 20
            const currentRadius = effect.radius + (25 * (1 - progress)); // Expands by 25px
            const opacity = progress;
            return (
                <div
                    key={effect.id}
                    className="collection-effect"
                    style={{
                        left: `${effect.x}px`,
                        top: `${effect.y}px`,
                        width: `${currentRadius * 2}px`,
                        height: `${currentRadius * 2}px`,
                        opacity: opacity
                    }}
                />
            );
        })}
        {/* FIX: The component was truncated. Added missing rendering logic for blooms, flares, nodes, and other UI elements. */}
        {/* Render Collection Blooms */}
        {gameState.collectionBlooms.map(bloom => {
            const progress = 1 - (bloom.life / 24.0); // 0 to 1
            const opacity = Math.sin(progress * Math.PI); // Fades in and out
            const scale = 1 + progress * 2;
            return (
                <div
                    key={bloom.id}
                    className="collection-bloom"
                    style={{
                        left: `${bloom.x}px`,
                        top: `${bloom.y}px`,
                        width: `${bloom.radius * 2}px`,
                        height: `${bloom.radius * 2}px`,
                        opacity: opacity,
                        transform: `translate(-50%, -50%) scale(${scale})`
                    }}
                />
            );
        })}
        {/* Render Collection Flares */}
        {gameState.collectionFlares.map(flare => {
            const progress = 1 - (flare.life / 24.0);
            const opacity = 1 - progress;
            const distance = progress * 50;
            return (
                <div
                    key={flare.id}
                    className="collection-flare"
                    style={{
                        left: `${flare.x}px`,
                        top: `${flare.y}px`,
                        opacity: opacity,
                        transform: `translate(-50%, -50%) rotate(${flare.angle}deg) translateY(${-distance}px)`
                    }}
                />
            );
        })}

        {/* Render Energy Orbs */}
        {gameState.energyOrbs.map(orb => (
            <div
                key={orb.id}
                className={`energy-orb ${orb.isFromBloom ? 'bloom-orb' : ''}`}
                style={{
                    left: `${orb.x}px`,
                    top: `${orb.y}px`,
                    width: `${orb.radius * 2}px`,
                    height: `${orb.radius * 2}px`,
                }}
            />
        ))}

        {/* Render Game Nodes */}
        {gameState.nodes.map(node => (
            <div
                key={node.id}
                data-node-id={node.id}
                onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node.id);
                }}
                className={`node-container ${node.id === gameState.aimAssistTargetId ? 'aim-assist-target' : ''} ${node.type} ${node.id === gameState.selectedNodeId ? 'selected' : ''} ${node.tunnelingState ? `tunnel-${node.tunnelingState.phase}` : ''}`}
                style={{
                    left: `${node.x}px`, top: `${node.y}px`,
                    width: `${node.radius * 2}px`, height: `${node.radius * 2}px`,
                    '--tunnel-duration': `${TUNNEL_DURATION_TICKS / 60}s`,
                } as React.CSSProperties}
            >
             {node.imageUrl ? (
                <div 
                    className={`node-image ${node.type} ${node.hasLife ? 'hasLife' : ''}`} 
                    style={{ backgroundImage: `url(${node.imageUrl})`}}
                />
             ) : (
                <div className={`node-image ${node.type} ${node.hasLife ? 'hasLife' : ''}`} />
             )}
             {node.type === 'player_consciousness' && node.playerState === 'PROJECTING' && <div className="player-projection-trail" />}
             {node.type === 'player_consciousness' && node.playerState === 'IDLE' && <div className="player-idle-aura" />}
            </div>
        ))}
        
        {renderReformingParticles()}

        {selectedNode && selectedNode.id !== playerNode?.id && (
            <RadialMenu node={selectedNode} dispatch={dispatch} onAsk={handleAsk} />
        )}
        {gameState.loreState.nodeId && (
            <LoreTooltip gameState={gameState} onClose={() => dispatch({ type: 'CLEAR_LORE' })} />
        )}
      </div>
    </div>
  );
};

export default Simulation;