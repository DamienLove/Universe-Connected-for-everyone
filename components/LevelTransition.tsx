import React, { useEffect } from 'react';
import { GameAction, GameState } from '../types';

interface LevelTransitionProps {
  levelState: GameState['levelTransitionState'];
  zoomLevel: number;
  dispatch: React.Dispatch<GameAction>;
}

const ZOOM_ANIMATION_DURATION = 3000; // 3 seconds, must match CSS animation

const LevelTransition: React.FC<LevelTransitionProps> = ({ levelState, zoomLevel, dispatch }) => {

  useEffect(() => {
    if (levelState === 'zooming') {
      const timer = setTimeout(() => {
        dispatch({ type: 'COMPLETE_LEVEL_TRANSITION' });
      }, ZOOM_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [levelState, dispatch]);

  if (levelState !== 'cleared') {
    // This component is active but invisible during the zoom to handle the completion callback.
    // It also handles the overlay to prevent user input during the animation.
    return levelState === 'zooming' ? <div className="fixed inset-0 z-[199]" /> : null;
  }

  const handleTranscend = () => {
    dispatch({ type: 'START_LEVEL_TRANSITION' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[200]">
      <div className="text-center p-8 bg-gray-900 border-2 border-teal-400 rounded-lg shadow-2xl shadow-teal-500/20 animate-fade-in-slow">
        <h2 className="text-4xl font-bold text-teal-300 glow-text mb-2">Sector Connected</h2>
        <p className="text-xl text-gray-300 mb-6">
          You have woven all worlds in this sector into your network. <br/> Your consciousness is ready to expand.
        </p>
        <button
          onClick={handleTranscend}
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-lg text-2xl transition-transform transform hover:scale-105"
        >
          Transcend
        </button>
      </div>
    </div>
  );
};

export default LevelTransition;
