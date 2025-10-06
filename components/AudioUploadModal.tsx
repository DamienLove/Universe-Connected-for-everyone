import React, { useState } from 'react';
import { audioService } from '../services/AudioService';

interface AudioUploadModalProps {
  onClose: () => void;
}

const allKeys = audioService.getSoundKeys();
// The music tracks are now hardcoded, so we only show the SFX in the dev menu.
const sfxKeys = allKeys.filter(key => key !== 'background' && key !== 'theme_music');


const AudioUploadModal: React.FC<AudioUploadModalProps> = ({ onClose }) => {
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          localStorage.setItem(`custom_audio_${key}`, dataUrl);
          audioService.loadSound(key); // Reload the sound immediately
          setUploadedFiles(prev => ({...prev, [key]: file.name}));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = (key: string) => {
      localStorage.removeItem(`custom_audio_${key}`);
      audioService.loadSound(key); // Reload default
      setUploadedFiles(prev => ({...prev, [key]: 'Default'}));
  };

  const handleResetAll = () => {
      sfxKeys.forEach(key => {
          localStorage.removeItem(`custom_audio_${key}`);
      });
      audioService.loadAllSounds(); // Reload all defaults
      setUploadedFiles({});
  };
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const getLoadedFileName = (key: string) => {
      if (uploadedFiles[key]) return uploadedFiles[key];
      if (localStorage.getItem(`custom_audio_${key}`)) return 'Custom Sound';
      return 'Default';
  }

  const renderSoundRow = (key: string) => (
    <div key={key} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg border border-gray-700">
      <span className="capitalize text-gray-300">{key.replace(/_/g, ' ')}</span>
      <div className="flex items-center gap-2">
         <span className="text-sm text-gray-500 w-32 truncate text-right" title={getLoadedFileName(key)}>
            {getLoadedFileName(key)}
         </span>
         <button
            onClick={() => audioService.playSound(key)}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-bold py-1 px-3 rounded transition-colors"
            disabled={!localStorage.getItem(`custom_audio_${key}`)}
            title={localStorage.getItem(`custom_audio_${key}`) ? "Play Custom Sound" : "No custom sound to play"}
         >
            Play
         </button>
         <label className="bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold py-1 px-3 rounded cursor-pointer transition-colors">
            Upload
            <input
              type="file"
              className="hidden"
              accept=".mp3,.wav,.mpg,.ogg"
              onChange={(e) => handleFileChange(e, key)}
            />
         </label>
         <button 
            onClick={() => handleReset(key)} 
            className="bg-red-700 hover:bg-red-600 text-white text-sm font-bold py-1 px-3 rounded transition-colors"
            disabled={!localStorage.getItem(`custom_audio_${key}`)}
         >
            Reset
         </button>
      </div>
    </div>
  );

  return (
    <div className="settings-modal-backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal-content max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
            <h2 className="glow-text">Upload Custom Audio</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-teal-300 mt-6 mb-2 border-b border-teal-500/30 pb-1">Sound Effects</h3>
            <div className="space-y-2">{sfxKeys.map(renderSoundRow)}</div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
            <button onClick={handleResetAll} className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Reset All SFX to Default
            </button>
            <button onClick={onClose} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default AudioUploadModal;