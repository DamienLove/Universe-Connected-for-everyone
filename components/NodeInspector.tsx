import React from 'react';
import { GameState, GameAction, GameNode } from '../types';

interface NodeInspectorProps {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const getNodeInspectorData = (node: GameNode, gameState: GameState) => {
    const data: { label: string; value: string }[] = [];
    data.push({ label: 'Type', value: node.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) });
    data.push({ label: 'Radius', value: `${node.radius.toFixed(0)} units` });

    switch (node.type) {
        case 'star':
            data.push({ label: 'Energy Output', value: '0.5 / tick' });
            break;
        case 'life_seed':
        case 'sentient_colony':
            let biomassOutput = 0.2;
            if (gameState.unlockedUpgrades.has('cellular_specialization')) {
                biomassOutput += 0.5;
            }
            data.push({ label: 'Biomass Output', value: `${biomassOutput.toFixed(1)} / tick` });
            break;
    }
    
    if (node.connections.length > 0) {
        const connectionNames = node.connections
            .map(id => gameState.nodes.find(n => n.id === id)?.label || 'Unknown')
            .join(', ');
        data.push({ label: 'Connections', value: connectionNames });
    }

    return data;
};


const NodeInspector: React.FC<NodeInspectorProps> = ({ gameState, dispatch }) => {
  const selectedNode = gameState.nodes.find(n => n.id === gameState.selectedNodeId);

  const handleClose = () => {
    dispatch({ type: 'SELECT_NODE', payload: { nodeId: null } });
  };

  const inspectorData = selectedNode ? getNodeInspectorData(selectedNode, gameState) : [];

  const classNames = `node-image ${selectedNode?.type} ${selectedNode?.hasLife ? 'hasLife' : ''}`;

  return (
    <div className={`node-inspector-panel ${selectedNode ? 'visible' : ''}`}>
      {selectedNode && (
        <>
          <button onClick={handleClose} className="node-inspector-close">&times;</button>
          
          <div className="node-inspector-header">
            <div className="node-inspector-image-container">
              {selectedNode.imageUrl ? (
                <div
                  className={classNames}
                  style={{ backgroundImage: `url(${selectedNode.imageUrl})` }}
                />
              ) : (
                 <div className={classNames} />
              )}
            </div>
            <h2 className="glow-text">{selectedNode.label}</h2>
            <p>{selectedNode.type.replace(/_/g, ' ')}</p>
          </div>

          <div className="node-inspector-body">
            <h3 className="section-title">Analysis</h3>
            <ul className="stats-list">
              {inspectorData.map(item => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default NodeInspector;