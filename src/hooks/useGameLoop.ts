import React from 'react';
import { GameAction, WorldTransform } from '../types';

export const useGameLoop = (dispatch: React.Dispatch<GameAction>, dimensions: { width: number; height: number }, isPaused: boolean, transform: WorldTransform) => {
  const animationFrameId = React.useRef<number | null>(null);

  const loop = React.useCallback(() => {
    if (!isPaused) {
      dispatch({ type: 'TICK', payload: { width: dimensions.width, height: dimensions.height, transform } });
    }
    animationFrameId.current = requestAnimationFrame(loop);
  }, [dispatch, dimensions.width, dimensions.height, isPaused, transform]);

  React.useEffect(() => {
    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [loop]);
};