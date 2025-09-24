import React from 'react';
import { GameAction } from '../types';

export const useGameLoop = (dispatch: React.Dispatch<GameAction>, dimensions: { width: number; height: number }) => {
  // FIX: Initialize useRef with null to provide an argument and fix the compile error.
  const animationFrameId = React.useRef<number | null>(null);

  const loop = React.useCallback(() => {
    dispatch({ type: 'TICK', payload: { width: dimensions.width, height: dimensions.height } });
    animationFrameId.current = requestAnimationFrame(loop);
  }, [dispatch, dimensions.width, dimensions.height]);

  React.useEffect(() => {
    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [loop]);
};
