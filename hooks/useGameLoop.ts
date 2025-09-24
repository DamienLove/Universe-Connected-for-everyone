import React from 'react';
import { GameAction } from '../types';

export const useGameLoop = (dispatch: React.Dispatch<GameAction>, dimensions: { width: number; height: number }) => {
  React.useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', payload: { width: dimensions.width, height: dimensions.height } });
    }, 30); // Game ticks every 30ms for smoother, faster animation

    return () => clearInterval(interval);
  }, [dispatch, dimensions.width, dimensions.height]);
};