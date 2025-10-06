import React from 'react';
import { GameAction, GameState } from '../types';

interface SettingsModalProps {
  settings: GameState['settings'];
  dispatch: React.Dispatch<GameAction>;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, dispatch, onClose }) => {

  const handleSettingChange = (key: keyof GameState['settings'], value: string | number | boolean) => {
    dispatch({ type: 'CHANGE_SETTING', payload: { key, value } });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-modal-backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal-content">
        <div className="flex justify-between items-center mb-4">
            <h2 className="glow-text">Options</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="sfx-volume">SFX Volume: {Math.round(settings.sfxVolume * 100)}%</label>
            <input
              id="sfx-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.sfxVolume}
              onChange={(e) => handleSettingChange('sfxVolume', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="music-volume">Music Volume: {Math.round(settings.musicVolume * 100)}%</label>
            <input
              id="music-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.musicVolume}
              onChange={(e) => handleSettingChange('musicVolume', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="colorblind-mode">Colorblind Mode</label>
            <select
              id="colorblind-mode"
              value={settings.colorblindMode}
              onChange={(e) => handleSettingChange('colorblindMode', e.target.value)}
            >
              <option value="none">None</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="protanopia">Protanopia</option>
              <option value="tritanopia">Tritanopia</option>
            </select>
          </div>
          
          <div>
            <label className="flex justify-between items-center cursor-pointer">
              <span className="text-indigo-300">Enable Aim Assist</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.aimAssist}
                  onChange={(e) => handleSettingChange('aimAssist', e.target.checked)}
                />
                <div className="w-14 h-8 bg-gray-600 rounded-full peer-checked:bg-purple-600 transition-colors"></div>
                <div className="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform peer-checked:translate-x-6"></div>
              </div>
            </label>
          </div>

        </div>
        
        <div className="mt-8 text-center">
            <button onClick={onClose} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg">
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;