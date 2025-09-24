import React, { useRef, useEffect } from 'react';
import { GameNode, CosmicEvent, GameAction, CosmicAnomaly } from '../types';
import { useParticles } from '../hooks/useParticles';
import { useBackgroundEffects } from '../hooks/useBackgroundEffects';

interface SimulationProps {
  nodes: GameNode[];
  dimensions: { width: number; height: number };
  tick: number;
  karma: number;
  activeCosmicEvent: CosmicEvent | null;
  isQuantumFoamActive: boolean;
  lastTunnelEvent: { nodeId: string; tick: number } | null;
  anomalies: CosmicAnomaly[];
  dispatch: React.Dispatch<GameAction>;
  selectedNodeId: string | null;
  nodeImageCache: Record<string, string>;
}

const drawCosmicEvent = (ctx: CanvasRenderingContext2D, event: CosmicEvent, nodes: GameNode[], width: number, height: number, nodeImageCache: Record<string, string>) => {
    const progress = 1 - (event.remaining / event.duration);
    ctx.save();

    switch (event.type) {
        case 'distant_supernova': {
            const maxRadius = Math.min(width, height) * 0.3;
            const pulseProgress = Math.sin(progress * Math.PI); // Goes 0 -> 1 -> 0
            const currentRadius = maxRadius * pulseProgress;
            const opacity = pulseProgress;

            if (progress > 0.1) {
                const shockwaveProgress = (progress - 0.1) / 0.9;
                const shockwaveRadius = shockwaveProgress * width * 0.75;
                const shockwaveOpacity = (1 - shockwaveProgress) * 0.5;
                ctx.strokeStyle = `rgba(255, 220, 180, ${shockwaveOpacity})`;
                ctx.lineWidth = 3 + shockwaveProgress * 5;
                ctx.beginPath();
                ctx.arc(event.x, event.y, shockwaveRadius, 0, Math.PI * 2);
                ctx.stroke();
            }

            const gradient = ctx.createRadialGradient(event.x, event.y, 0, event.x, event.y, currentRadius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            gradient.addColorStop(0.3, `rgba(255, 220, 180, ${opacity * 0.8})`);
            gradient.addColorStop(0.7, `rgba(255, 150, 100, ${opacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(event.x, event.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            
            const particleCount = 50;
            const particleSpeed = progress * 250;
            for(let i=0; i<particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2 * 3.1415; // deterministic "random" angles
                const distance = particleSpeed * (1 - (i % 5) * 0.1); // varied distance
                const pX = event.x + Math.cos(angle) * distance;
                const pY = event.y + Math.sin(angle) * distance;
                const pOpacity = (1 - progress) * 0.8;
                ctx.fillStyle = `rgba(255, 200, 150, ${pOpacity})`;
                ctx.beginPath();
                ctx.arc(pX, pY, Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        }
        case 'asteroid_impact': {
            const target = nodes.find(n => n.id === event.targetId);
            if (!target) break;

            const targetX = target.x * 1.5 + width / 2;
            const targetY = target.y * 1.5 + height / 2;
            const impactTime = 0.95;

            const shakeProgress = (progress - impactTime) / (1-impactTime);
            if(progress > impactTime) {
                const shakeAmount = Math.sin(shakeProgress * Math.PI) * 10;
                ctx.translate(Math.random() * shakeAmount - shakeAmount / 2, Math.random() * shakeAmount - shakeAmount / 2);
            }

            const impactProgress = progress / impactTime;

            if (impactProgress < 1) { // Asteroid trajectory
                const currentX = event.x + (targetX - event.x) * impactProgress;
                const currentY = event.y + (targetY - event.y) * impactProgress;
                
                const dx = targetX - event.x;
                const dy = targetY - event.y;
                const angle = Math.atan2(dy, dx);
                const tailLength = 20;

                const gradient = ctx.createLinearGradient(currentX, currentY, currentX - Math.cos(angle) * tailLength, currentY - Math.sin(angle) * tailLength);
                gradient.addColorStop(0, '#f5b56c');
                gradient.addColorStop(1, 'transparent');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(currentX, currentY);
                ctx.lineTo(currentX - Math.cos(angle) * tailLength, currentY - Math.sin(angle) * tailLength);
                ctx.stroke();

                ctx.fillStyle = '#FFFFFF';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#f5b56c';
                ctx.beginPath();
                ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
                ctx.fill();

            } else { // Impact flash
                const flashProgress = (progress - impactTime) / (1 - impactTime);
                
                const coreFlashRadius = 30 * Math.sin(flashProgress * Math.PI);
                if (coreFlashRadius > 0) {
                    const coreGradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, coreFlashRadius);
                    coreGradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
                    coreGradient.addColorStop(1, `rgba(255, 220, 180, 0)`);
                    ctx.fillStyle = coreGradient;
                    ctx.beginPath();
                    ctx.arc(targetX, targetY, coreFlashRadius, 0, Math.PI * 2);
                    ctx.fill();
                }

                const shockwaveRadius = 80 * flashProgress;
                const shockwaveOpacity = (1 - flashProgress) * 0.7;
                if(shockwaveRadius > 0) {
                     const shockwaveGradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, shockwaveRadius);
                    shockwaveGradient.addColorStop(0.7, `rgba(255, 150, 50, ${shockwaveOpacity})`);
                    shockwaveGradient.addColorStop(1, `rgba(255, 150, 50, 0)`);
                    ctx.fillStyle = shockwaveGradient;
                    ctx.beginPath();
                    ctx.arc(targetX, targetY, shockwaveRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                if (flashProgress > 0.1 && flashProgress < 0.8) {
                    const debrisProgress = (flashProgress - 0.1) / 0.7;
                    for(let i=0; i<20; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = debrisProgress * 80;
                        const pX = targetX + Math.cos(angle) * distance;
                        const pY = targetY + Math.sin(angle) * distance;
                        const pOpacity = (1 - debrisProgress);
                        ctx.fillStyle = `rgba(255, 180, 100, ${pOpacity})`;
                        ctx.beginPath();
                        ctx.arc(pX, pY, Math.random() * 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            break;
        }
        case 'gamma_ray_burst': {
            const waveWidth = 250;
            const waveX = -waveWidth + (width + waveWidth * 2) * progress;
            const opacity = Math.sin(progress * Math.PI) * 0.6;

            const arcProgress = progress * 1.2;
            if (arcProgress < 1.0) {
                const arcX = -waveWidth + (width + waveWidth * 2) * arcProgress;
                const arcOpacity = Math.sin(arcProgress * Math.PI) * 0.3;
                const arcGradient = ctx.createLinearGradient(arcX, 0, arcX + waveWidth/2, 0);
                arcGradient.addColorStop(0, 'transparent');
                arcGradient.addColorStop(0.5, `rgba(0, 255, 255, ${arcOpacity})`);
                arcGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = arcGradient;
                ctx.fillRect(arcX - waveWidth / 4, 0, waveWidth/2, height);
            }
            
            const gradient = ctx.createLinearGradient(waveX, 0, waveX + waveWidth, 0);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.3, `rgba(173, 216, 230, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 1.2})`);
            gradient.addColorStop(0.7, `rgba(221, 160, 221, ${opacity})`);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(waveX - waveWidth / 2, 0, waveWidth, height);

            ctx.save();
            ctx.beginPath();
            ctx.rect(waveX - waveWidth / 2, 0, waveWidth, height);
            ctx.clip();
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < height; i += 3) {
                ctx.beginPath();
                ctx.moveTo(waveX - waveWidth / 2, i + (Math.random() * 4 - 2));
                ctx.lineTo(waveX + waveWidth / 2, i + (Math.random() * 4 - 2));
                ctx.stroke();
            }
            ctx.restore();

            if (progress > 0.05) {
                const trailProgress = (progress - 0.05) / 0.95;
                const trailWaveX = -waveWidth + (width + waveWidth * 2) * trailProgress;
                const trailOpacity = Math.sin(trailProgress * Math.PI) * 0.3;
                const trailGradient = ctx.createLinearGradient(trailWaveX, 0, trailWaveX + waveWidth, 0);
                trailGradient.addColorStop(0, 'transparent');
                trailGradient.addColorStop(0.5, `rgba(173, 216, 230, ${trailOpacity})`);
                trailGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = trailGradient;
                ctx.fillRect(trailWaveX - waveWidth / 2, 0, waveWidth, height);
            }
            break;
        }
    }
    ctx.restore();
};

const drawAnomaly = (ctx: CanvasRenderingContext2D, anomaly: CosmicAnomaly, tick: number) => {
    ctx.save();
    const pulse = Math.sin(tick * 0.1 + anomaly.id.length) * 0.15 + 0.85;
    const opacity = (anomaly.lifespan < 60 ? anomaly.lifespan / 60 : 1) * 0.8;
    
    let color: string;
    switch (anomaly.type) {
        case 'energy': color = `245, 158, 11, ${opacity}`; break; // amber-500
        case 'complexity': color = `168, 85, 247, ${opacity}`; break; // purple-500
        case 'knowledge': color = `20, 184, 166, ${opacity}`; break; // teal-500
        default: color = `255, 255, 255, ${opacity}`;
    }

    const gradient = ctx.createRadialGradient(anomaly.x, anomaly.y, 0, anomaly.x, anomaly.y, anomaly.size * pulse);
    gradient.addColorStop(0, `rgba(${color})`);
    gradient.addColorStop(0.7, `rgba(${color.replace(/, [0-9.]+\)$/, ', 0.5)')})`);
    gradient.addColorStop(1, `rgba(${color.replace(/, [0-9.]+\)$/, ', 0)')})`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(anomaly.x, anomaly.y, anomaly.size * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

const NodeComponent = React.memo(({ node, nodeImageCache, dispatch, selectedNodeId }: { node: GameNode, nodeImageCache: Record<string, string>, dispatch: React.Dispatch<GameAction>, selectedNodeId: string | null }) => {
    const typeKey = node.hasLife ? `${node.type}_hasLife` : node.type;
    const imageUrl = nodeImageCache[typeKey];
    
    // Proto-creatures are handled with CSS, not generated images.
    if (node.type === 'proto_creature') {
        return (
            <div 
                className="node-image-container"
                style={{
                    left: `${node.x}px`, top: `${node.y}px`,
                    width: `${node.size * 2}px`, height: `${node.size * 2}px`,
                }}
            >
                <div className="proto_creature" style={{width: '100%', height: '100%'}}></div>
            </div>
        );
    }
    
    const isLoading = !imageUrl || imageUrl === 'loading';

    const sizeMapping = {
        star: 80, planet: 30, sentient_ai: 40, consciousness: 35, black_hole: 50, nebula: 250
    };
    const displaySize = sizeMapping[node.type] || node.size * 2;


    return (
        <div 
            className="node-image-container"
            style={{
                left: `${node.x}px`, top: `${node.y}px`,
                width: `${displaySize}px`, height: `${displaySize}px`,
                filter: selectedNodeId === node.id ? 'drop-shadow(0 0 10px #14b8a6)' : 'none',
                transition: 'filter 0.3s',
            }}
            onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'SELECT_NODE', payload: { id: node.id } });
            }}
        >
            {isLoading ? (
                <div className={`node-placeholder ${node.type}`}></div>
            ) : (
                <div 
                    className={`node-image ${node.type} ${node.hasLife ? 'hasLife' : ''}`}
                    style={{ backgroundImage: `url(${imageUrl})` }}
                />
            )}
        </div>
    );
});


const Simulation: React.FC<SimulationProps> = ({ nodes, dimensions, tick, karma, activeCosmicEvent, isQuantumFoamActive, lastTunnelEvent, anomalies, dispatch, selectedNodeId, nodeImageCache }) => {
  const backgroundRef = useRef<HTMLCanvasElement>(null); // For particles
  const effectsRef = useRef<HTMLCanvasElement>(null); // For anomalies, cosmic events, etc
  const { width, height } = dimensions;
  const { particles, updateParticles } = useParticles(karma, width, height);
  const { twinklingStars, meteors, quantumFoam, updateEffects } = useBackgroundEffects(width, height, isQuantumFoamActive);

  useEffect(() => {
    const backgroundCanvas = backgroundRef.current;
    const bgCtx = backgroundCanvas?.getContext('2d');
    
    const effectsCanvas = effectsRef.current;
    const effectsCtx = effectsCanvas?.getContext('2d');
    
    if (!bgCtx || !effectsCtx) return;

    updateParticles();
    updateEffects();
    
    effectsCtx.clearRect(0, 0, width, height);
    if (isQuantumFoamActive) {
        quantumFoam.forEach(p => {
            const opacity = Math.sin(p.life / p.maxLife * Math.PI) * 0.8;
            effectsCtx.fillStyle = `rgba(200, 225, 255, ${opacity})`;
            effectsCtx.beginPath();
            effectsCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            effectsCtx.fill();
        });
    }
    if (activeCosmicEvent) {
        drawCosmicEvent(effectsCtx, activeCosmicEvent, nodes, width, height, nodeImageCache);
    }
    anomalies.forEach(anomaly => {
        drawAnomaly(effectsCtx, anomaly, tick);
    });
    twinklingStars.forEach(star => {
        const opacity = star.maxOpacity * (Math.sin(tick * 0.02 + star.offset) * 0.5 + 0.5);
        effectsCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        effectsCtx.beginPath();
        effectsCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        effectsCtx.fill();
    });
    meteors.forEach(meteor => {
        const gradient = effectsCtx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.vx, meteor.y - meteor.vy);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        effectsCtx.strokeStyle = gradient;
        effectsCtx.lineWidth = 2;
        effectsCtx.beginPath();
        effectsCtx.moveTo(meteor.x, meteor.y);
        effectsCtx.lineTo(meteor.x - meteor.vx * (meteor.len / 20), meteor.y - meteor.vy * (meteor.len / 20));
        effectsCtx.stroke();
    });

    bgCtx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        bgCtx.fillStyle = p.color;
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        bgCtx.fill();
    });

  }, [width, height, tick, karma, particles, updateParticles, twinklingStars, meteors, quantumFoam, updateEffects, activeCosmicEvent, isQuantumFoamActive, anomalies, nodes, nodeImageCache]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Check anomaly clicks first (based on screen coordinates)
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        for (const anomaly of [...anomalies].reverse()) {
            const dx = x - anomaly.x;
            const dy = y - anomaly.y;
            if (dx * dx + dy * dy < anomaly.size * anomaly.size * 4) { // Increased click radius
                dispatch({ type: 'CLICK_ANOMALY', payload: { id: anomaly.id } });
                return;
            }
        }
        
        // If an anomaly wasn't clicked, check if the click was on the container background to deselect
        if ((e.target as HTMLElement).classList.contains('simulation-container')) {
            dispatch({ type: 'DESELECT_NODE' });
        }
    };


  return (
    <div className="simulation-container" onClick={handleClick}>
      <div className="stars stars1"></div>
      <div className="stars stars2"></div>
      <div className="stars stars3"></div>
      
      <canvas ref={effectsRef} width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }} />
      <canvas ref={backgroundRef} width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'none' }}/>

      <div className="world-container" style={{ transform: `translate(${width/2}px, ${height/2}px) scale(1.5)` }}>
          <svg className="connections-svg">
              {nodes.map(node => (
                  <React.Fragment key={`conn-${node.id}`}>
                      {node.connections.map(connId => {
                          const target = nodes.find(n => n.id === connId);
                          if (!target) return null;
                          return <line key={`${node.id}-${connId}`} x1={node.x} y1={node.y} x2={target.x} y2={target.y} stroke="rgba(236, 72, 153, 0.2)" strokeWidth="1" />;
                      })}
                      {node.entangledWith && (() => {
                          const target = nodes.find(n => n.id === node.entangledWith);
                          if (!target) return null;
                          const opacity = Math.sin(tick * 0.1) * 0.3 + 0.7;
                          return <line key={`ent-${node.id}`} x1={node.x} y1={node.y} x2={target.x} y2={target.y} stroke={`rgba(0, 255, 255, ${opacity})`} strokeWidth="1.5" strokeDasharray="5 10" />;
                      })()}
                  </React.Fragment>
              ))}
          </svg>

          {nodes.map(node => (
              <NodeComponent key={node.id} node={node} nodeImageCache={nodeImageCache} dispatch={dispatch} selectedNodeId={selectedNodeId} />
          ))}
      </div>
    </div>
  );
};

export default React.memo(Simulation);