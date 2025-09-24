import React from 'react';

interface SplashScreenProps {
  onStartGame: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStartGame }) => {
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
      
      <div className="relative z-10 animate-fade-in-slow">
        <h1 className="text-5xl md:text-7xl font-bold text-teal-300 glow-text mb-4">
          Universe Connected for Everyone
        </h1>
        <p className="text-xl md:text-2xl text-purple-300 mb-8">
          An interactive experience based on the novel by Damien Nichols
        </p>
        <blockquote className="text-lg text-gray-400 italic border-l-4 border-purple-500 pl-4 max-w-2xl mx-auto mb-12">
          "The cosmos is not a spectator sport. It demands participation."
        </blockquote>
        <button
          onClick={onStartGame}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-lg text-2xl shadow-lg shadow-purple-500/50 transition-transform transform hover:scale-105 animate-pulse"
        >
          Begin Journey
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;