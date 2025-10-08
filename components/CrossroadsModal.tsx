import React from 'react';
import { CrossroadsEvent, GameAction, GameState } from '../types';

interface CrossroadsModalProps {
  event: CrossroadsEvent;
  dispatch: React.Dispatch<GameAction>;
}

const CrossroadsModal: React.FC<CrossroadsModalProps> = ({ event, dispatch }) => {
  const handleChoice = (choiceEffect: (gs: GameState) => GameState) => {
    dispatch({ type: 'RESOLVE_CROSSROADS', payload: { choiceEffect } });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[200]">
      <div className="bg-gray-900 border-2 border-amber-400 rounded-lg p-8 w-full max-w-2xl text-center shadow-2xl shadow-amber-500/20">
        <h2 className="text-3xl font-bold text-amber-300 glow-text mb-2">{event.title}</h2>
        <p className="text-lg text-gray-300 mb-6">{event.description}</p>
        
        <div className="flex justify-around items-stretch gap-4">
          <button 
            onClick={() => handleChoice(event.optionA.effect)}
            className="flex-1 bg-gray-800 hover:bg-purple-800/50 border border-purple-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            {event.optionA.text}
          </button>
          <div className="flex items-center text-amber-400 font-bold">OR</div>
          <button 
            onClick={() => handleChoice(event.optionB.effect)}
            className="flex-1 bg-gray-800 hover:bg-red-800/50 border border-red-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            {event.optionB.text}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossroadsModal;