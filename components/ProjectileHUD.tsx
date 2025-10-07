import React from 'react';
import { GameNode, ProjectionState } from '../types';
import { WorldTransform } from '../hooks/useWorldScale';

interface ProjectileHUDProps {
  playerNode: GameNode | undefined;
  projectionState: ProjectionState;
  transform: WorldTransform;
  aimAssistTargetId: string | null;
  nodes: GameNode[];
}

const AIM_LINE_LENGTH = 3000;
const POWER_BAR_WIDTH = 100;
const POWER_BAR_HEIGHT = 12;

const ProjectileHUD: React.FC<ProjectileHUDProps> = ({
  playerNode,
  projectionState,
  transform,
  aimAssistTargetId,
  nodes,
}) => {
  if (!playerNode || (projectionState.playerState !== 'AIMING_DIRECTION' && projectionState.playerState !== 'AIMING_POWER')) {
    return null;
  }

  const playerScreenX = playerNode.x * transform.scale + transform.x;
  const playerScreenY = playerNode.y * transform.scale + transform.y;

  let aimAngle = projectionState.aimAngle;

  // Snap aim line to assist target
  if (aimAssistTargetId) {
    const targetNode = nodes.find(n => n.id === aimAssistTargetId);
    if (targetNode) {
      aimAngle = Math.atan2(targetNode.y - playerNode.y, targetNode.x - playerNode.x);
    }
  }

  const lineEndX = playerScreenX + Math.cos(aimAngle) * AIM_LINE_LENGTH;
  const lineEndY = playerScreenY + Math.sin(aimAngle) * AIM_LINE_LENGTH;

  const powerBarX = playerScreenX - POWER_BAR_WIDTH / 2;
  const powerBarY = playerScreenY + (playerNode.radius * transform.scale) + 15;

  return (
    <div className="projectile-hud-container">
      <svg className="projectile-hud-svg">
        {(projectionState.playerState === 'AIMING_DIRECTION' || projectionState.playerState === 'AIMING_POWER') && (
          <line
            className="aim-line"
            x1={playerScreenX}
            y1={playerScreenY}
            x2={lineEndX}
            y2={lineEndY}
            style={{ opacity: aimAssistTargetId ? 1 : 0.5 }}
          />
        )}
        {projectionState.playerState === 'AIMING_POWER' && (
          <g transform={`translate(${powerBarX}, ${powerBarY})`}>
            <rect className="power-bar-bg" width={POWER_BAR_WIDTH} height={POWER_BAR_HEIGHT} rx={3} />
            <rect
              className="power-bar-fill"
              width={(projectionState.power / 100) * POWER_BAR_WIDTH}
              height={POWER_BAR_HEIGHT}
              rx={3}
            />
            <text
              x={POWER_BAR_WIDTH / 2}
              y={POWER_BAR_HEIGHT / 2 + 1}
              className="power-bar-text"
              dominantBaseline="middle"
            >
              {`${Math.round(projectionState.power)}%`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default ProjectileHUD;