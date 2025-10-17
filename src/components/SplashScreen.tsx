import React, { useState, useEffect } from 'react';
import { GameAction, GameState } from '../types';
import SettingsModal from './SettingsModal';
import CreditsModal from './CreditsModal';
import AudioUploadModal from './AudioUploadModal';
import { audioService } from '../services/AudioService';

interface SplashScreenProps {
  onStartGame: () => void;
  onLoadGame: () => void;
  dispatch: React.Dispatch<GameAction>;
  settings: GameState['settings'];
}

const SAVE_GAME_KEY = 'universe-connected-save';

const SplashScreen: React.FC<SplashScreenProps> = ({ onStartGame, onLoadGame, dispatch, settings }) => {
  const [modal, setModal] = useState<'options' | 'credits' | 'audio' | null>(null);
  const [hasSaveGame, setHasSaveGame] = useState(false);

  useEffect(() => {
    // Check for a save game and start theme music
    setHasSaveGame(localStorage.getItem(SAVE_GAME_KEY) !== null);
    audioService.userInteraction().then(() => {
        audioService.playThemeMusic();
    });
  }, []);
  
  const handleStartGameWithMusic = () => {
      audioService.stopThemeMusic();
      onStartGame();
  };
  
  const handleLoadGameWithMusic = () => {
      audioService.stopThemeMusic();
      onLoadGame();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-center p-4 splash-screen">
      <div className="absolute inset-0 particle-container">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="particle particle-neutral" style={{
            '--size': `${Math.random() * 2 + 1}px`,
            '--duration': `${Math.random() * 40 + 30}s`,
            '--delay': `${Math.random() * -60}s`,
            '--x-start': `${Math.random() * 100}vw`,
            '--y-start': `${Math.random() * 100}vh`,
            '--x-end': `${Math.random() * 100}vw`,
            '--y-end': `${Math.random() * 100}vh`,
          } as React.CSSProperties} />
        ))}
      </div>
      
      <div className="splash-nebula"></div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4">
          <div className="animate-fade-in-slow mb-8 text-center">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-teal-300 glow-text mb-4">
              Universe Connected for Everyone
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-purple-300">
              An interactive experience by Damien Nichols
              </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
              <button
                style={{ animationDelay: '1s' }}
                onClick={handleStartGameWithMusic}
                className="w-full text-2xl font-bold py-3 px-8 rounded-lg splash-menu-button splash-menu-item"
              >
                New Game
              </button>
              <button
                style={{ animationDelay: '1.2s' }}
                onClick={handleLoadGameWithMusic}
                disabled={!hasSaveGame}
                className="w-full text-2xl font-bold py-3 px-8 rounded-lg splash-menu-button splash-menu-item"
              >
                Load Game
              </button>
              <button
                style={{ animationDelay: '1.4s' }}
                onClick={() => setModal('options')}
                className="w-full text-2xl font-bold py-3 px-8 rounded-lg splash-menu-button splash-menu-item"
              >
                Options
              </button>
              <button
               style={{ animationDelay: '1.6s' }}
                onClick={() => setModal('credits')}
                className="w-full text-2xl font-bold py-3 px-8 rounded-lg splash-menu-button splash-menu-item"
              >
                Credits
              </button>
          </div>
      </div>
      
      <div className="absolute bottom-4 left-4 z-20">
         <button
            style={{ animationDelay: '1.8s' }}
            onClick={() => setModal('audio')}
            className="dev-menu-button splash-menu-item"
          >
            Dev Menu
          </button>
      </div>
      
      {modal === 'options' && <SettingsModal settings={settings} dispatch={dispatch} onClose={() => setModal(null)} />}
      {modal === 'credits' && <CreditsModal onClose={() => setModal(null)} />}
      {modal === 'audio' && <AudioUploadModal onClose={() => setModal(null)} />}

    </div>
  );
};

export default SplashScreen;