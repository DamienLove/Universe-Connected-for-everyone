import React from 'react';

interface CreditsModalProps {
  onClose: () => void;
}

const CreditsModal: React.FC<CreditsModalProps> = ({ onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-modal-backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal-content text-center">
        <div className="flex justify-between items-center mb-4">
            <h2 className="glow-text w-full">Credits</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl leading-none -ml-8">&times;</button>
        </div>
        
        <div className="space-y-4 text-lg text-gray-300">
            <p>Based on the novel <br/> <strong className="text-teal-300">'Universe Connected for Everyone'</strong></p>
            <p>by <strong className="text-purple-300">Damien Nichols</strong></p>
            <div className="pt-4 mt-4 border-t border-gray-700">
                <p>Interactive Experience <br/> Developed by an AI Agent</p>
            </div>
        </div>
        
        <div className="mt-8 text-center">
            <button onClick={onClose} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreditsModal;
