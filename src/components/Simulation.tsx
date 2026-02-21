import React, { useRef } from 'react';
import { GameAction, GameState, WorldTransform } from '../types';
import RadialMenu from './RadialMenu';
import LoreTooltip from './LoreTooltip';
import { getGeminiLoreForNode } from '../services/geminiService';
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
  isPanningRef: React.MutableRefObject<boolean>;
}

const PLAYER_HUNT_RANGE = 150;

const Simulation: React.FC<SimulationProps> = ({ gameState, dispatch, dimensions, isZoomingOut, transform, worldScaleHandlers, screenToWorld, isPanningRef }) => {
  const { width, height } = dimensions;

  const playerNode = gameState.nodes.find(n => n.type === 'player_consciousness');
  
  const handleNodeClick = (nodeId: string) => {
    dispatch({ type: 'SELECT_NODE', payload: { nodeId } });
  };
  
  const handlePlayerInteraction = (e: React.MouseEvent) => {
    // This function now handles the entire projection state machine on clicks
    switch (gameState.projection.playerState) {
        case 'IDLE':
            dispatch({ type: 'START_AIMING' });
            break;
        case 'AIMING_DIRECTION':
            dispatch({ type: 'SET_DIRECTION' });
            break;
        case 'AIMING_POWER':
            dispatch({ type: 'LAUNCH_PLAYER' });
            break;
        default:
            // Do nothing if projecting or reforming
            break;
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Allow clicking anywhere to control the player
    if (e.target === e.currentTarget && !isPanningRef.current) {
        if(gameState.selectedNodeId) {
            dispatch({ type: 'SELECT_NODE', payload: { nodeId: null } });
        } else {
             handlePlayerInteraction(e);
        }
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
  
  const worldRadius = (Math.min(width, height) * 1.5) / (gameState.zoomLevel + 1);

  // Calculate aim angle for locked target
  const lockedOnTarget = gameState.nodes.find(n => n.id === gameState.aimAssistTargetId);
  let aimAngle = gameState.projection.aimAngle;
  if (playerNode && lockedOnTarget) {
      aimAngle = Math.atan2(lockedOnTarget.y - playerNode.y, lockedOnTarget.x - playerNode.x);
  }

  return (
    <div
      className="simulation-container"
      onWheel={worldScaleHandlers.handleWheel}
      onMouseDown={worldScaleHandlers.handleMouseDown}
      onMouseUp={worldScaleHandlers.handleMouseUp}
      onMouseMove={worldScaleHandlers.handleMouseMove}
      onMouseLeave={worldScaleHandlers.handleMouseUp}
      onClick={handleContainerClick}
      style={{ cursor: isPanningRef.current ? 'grabbing' : 'crosshair' }}
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

        {/* --- Player Projection UI --- */}
        {playerNode && gameState.projection.playerState === 'AIMING_DIRECTION' && (
             <div
                id="aim-indicator"
                className={`aim-indicator ${lockedOnTarget ? 'locked-on' : ''}`}
                style={{
                    left: `${playerNode.x}px`, top: `${playerNode.y}px`,
                    width: '300px',
                    transform: `rotate(${aimAngle}rad)`,
                }}
            />
        )}
         {playerNode && gameState.projection.playerState === 'AIMING_POWER' && (
            <div id="power-meter-container" style={{ left: `${playerNode.x}px`, top: `${playerNode.y}px` }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" className="power-meter-bg" strokeWidth="4" fill="none" />
                    <circle
                        cx="80" cy="80" r="70"
                        className="power-meter-fg"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 70}
                        strokeDashoffset={(2 * Math.PI * 70) * (1 - gameState.projection.power / 100)}
                        transform="rotate(-90 80 80)"
                    />
                    <text x="80" y="80" className="power-meter-text" textAnchor="middle" dominantBaseline="central" fill="white">
                        {Math.round(gameState.projection.power)}%
                    </text>
                </svg>
            </div>
        )}
        {gameState.projectileTrailParticles.map(p => (
            <div key={p.id} className="projectile-trail-particle" style={{
                left: p.x, top: p.y,
                opacity: p.life / 20, // Fade out
                transform: `scale(${p.life / 20})`,
            }} />
        ))}

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
            if (event.type === 'black_hole') {
                 return (
                     <div key={event.id} style={{ left: `${event.x}px`, top: `${event.y}px`, pointerEvents: 'none' }}>
                         <div className="black-hole-core" style={{ width: `${event.radius * 2}px`, height: `${event.radius * 2}px` }} />
                         <div className="black-hole-accretion-disk" style={{ width: `${event.radius * 4}px`, height: `${event.radius * 4}px` }} />
                     </div>
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
        {gameState.nodes.map(node => {
            const isPlayer = node.type === 'player_consciousness';
            const blackHoles = gameState.cosmicEvents.filter(e => e.type === 'black_hole');
            let warpingClassName = '';
            if (blackHoles.length > 0) {
                for (const bh of blackHoles) {
                    const dx = node.x - bh.x;
                    const dy = node.y - bh.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const influenceRadius = bh.radius * 4;
                    if (dist < influenceRadius) {
                        warpingClassName = 'node-warping';
                        break;
                    }
                }
            }

            const otherClasses = [
                node.id === gameState.aimAssistTargetId ? 'aim-assist-target' : '',
                node.type,
                node.id === gameState.selectedNodeId ? 'selected' : '',
                node.tunnelingState ? `tunnel-${node.tunnelingState.phase}` : ''
            ].join(' ');
            
            return (
                <div
                    key={node.id}
                    data-node-id={node.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isPlayer) {
                           handlePlayerInteraction(e);
                        } else {
                           handleNodeClick(node.id);
                        }
                    }}
                    className={`node-container ${otherClasses} ${warpingClassName}`}
                    style={{
                        left: `${node.x}px`, top: `${node.y}px`,
                        width: `${node.radius * 2}px`, height: `${node.radius * 2}px`,
                        cursor: isPlayer ? 'pointer' : 'pointer',
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
                </div>
            )
        })}
        
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