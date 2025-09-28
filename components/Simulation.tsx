import React from 'react';
import { GameAction, GameState } from '../types';
import { useWorldScale } from '../hooks/useWorldScale';
import RadialMenu from './RadialMenu';
import LoreTooltip from './LoreTooltip';
import { getGeminiLoreForNode, generateNodeImage } from '../services/geminiService';
import { CHAPTERS } from '../constants';

interface SimulationProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  dimensions: { width: number; height: number };
  mouseWorldPos: { x: number, y: number };
  onMouseMove: (pos: { x: number, y: number }) => void;
}

const INTERACTION_RANGE = 200; // Max distance player can be to interact with a node
const PLAYER_HUNT_RANGE = 150;

const Simulation: React.FC<SimulationProps> = ({ gameState, dispatch, dimensions, mouseWorldPos, onMouseMove }) => {
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
  
  const playerNode = gameState.nodes.find(n => n.type === 'player_consciousness');
  
  const handleNodeClick = (nodeId: string) => {
    if (gameState.connectMode.active) {
        dispatch({ type: 'CREATE_CONNECTION', payload: { targetId: nodeId } });
        return;
    }
    
    const targetNode = gameState.nodes.find(n => n.id === nodeId);
    if (!targetNode || !playerNode) return;
    
    const dx = playerNode.x - targetNode.x;
    const dy = playerNode.y - targetNode.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance <= INTERACTION_RANGE) {
      dispatch({ type: 'SELECT_NODE', payload: { nodeId } });
    } else {
      // Maybe show a "too far" message? For now, do nothing.
      console.log("Node is out of range.");
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isPanningRef.current) {
      if (gameState.connectMode.active) {
        dispatch({ type: 'CANCEL_CONNECTION_MODE' });
      } else {
        dispatch({ type: 'SELECT_NODE', payload: { nodeId: null } });
      }
    }
  };

  const handleSimMouseMove = (e: React.MouseEvent) => {
    handleMouseMove(e); // For panning
    const worldPos = screenToWorld(e.clientX, e.clientY, dimensions);
    onMouseMove(worldPos);
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

  const sourceNode = gameState.connectMode.active && gameState.connectMode.sourceNodeId
    ? gameState.nodes.find(n => n.id === gameState.connectMode.sourceNodeId)
    : null;

  const selectedNode = gameState.nodes.find(n => n.id === gameState.selectedNodeId);
  
  const huntablePhages = playerNode ? gameState.phages.filter(p => {
    const dx = playerNode.x - p.x;
    const dy = playerNode.y - p.y;
    return Math.sqrt(dx * dx + dy * dy) < PLAYER_HUNT_RANGE;
  }) : [];


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

        {/* Render Quantum Phages */}
        {gameState.phages.map(phage => (
            <div key={phage.id}
                 className="phage-entity"
                 style={{
                     left: `${phage.x}px`,
                     top: `${phage.y}px`,
                     width: `${phage.radius * 2}px`,
                     height: `${phage.radius * 2}px`,
                 }}
            />
        ))}

        {gameState.nodes.map(node => {
          const isSelected = node.id === gameState.selectedNodeId && !gameState.connectMode.active;
          const isConnectSource = node.id === gameState.connectMode.sourceNodeId;
          const classNames = `node-image ${node.type} ${node.hasLife ? 'hasLife' : ''}`;
          
          let isInRange = false;
          if(playerNode && node.type !== 'player_consciousness') {
              const dx = playerNode.x - node.x;
              const dy = playerNode.y - node.y;
              const distance = Math.sqrt(dx*dx + dy*dy);
              isInRange = distance <= INTERACTION_RANGE;
          }

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
                boxShadow: isSelected ? '0 0 25px rgba(0, 255, 255, 0.8)' : isConnectSource ? '0 0 30px rgba(0, 220, 255, 1)' : (isInRange ? '0 0 20px rgba(255, 255, 255, 0.2)' : 'none'),
                border: isConnectSource ? `2px dashed rgba(0, 255, 255, 0.9)` : 'none',
                borderRadius: '50%',
                transition: 'box-shadow 0.2s ease-out',
                filter: !isInRange && node.type !== 'player_consciousness' ? 'brightness(0.7)' : 'brightness(1)',
              }}
              onClick={(e) => {
                if (node.type !== 'player_consciousness') {
                  e.stopPropagation();
                  handleNodeClick(node.id);
                }
              }}
            >
              {node.imageUrl ? (
                <div
                  className={classNames}
                  style={{ backgroundImage: `url(${node.imageUrl})` }}
                />
              ) : (
                 <div className={classNames} />
              )}
            </div>
          );
        })}

        {selectedNode && (
            <RadialMenu 
                node={selectedNode}
                dispatch={dispatch}
                onAsk={handleAsk}
            />
        )}
        
        {gameState.loreState.nodeId && (
            <LoreTooltip
                gameState={gameState}
                onClose={() => dispatch({type: 'CLEAR_LORE'})}
            />
        )}

      </div>
    </div>
  );
};

export default Simulation;