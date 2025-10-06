import React from 'react';
import { Upgrade, GameState } from './types';
import { UPGRADES } from './components/constants';
import UpgradeCard from './components/UpgradeCard';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onPurchase: (upgrade: Upgrade, imageUrl?: string) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, gameState, onPurchase }) => {
  if (!isOpen) return null;

  // This logic is passed to the card component to determine button state.
  const isPurchaseable = (upgrade: Upgrade): boolean => {
    const hasEnoughResources = 
      (upgrade.cost.energy === undefined || gameState.energy >= upgrade.cost.energy) &&
      (upgrade.cost.knowledge === undefined || gameState.knowledge >= upgrade.cost.knowledge) &&
      (upgrade.cost.unity === undefined || gameState.unity >= upgrade.cost.unity) &&
      (upgrade.cost.complexity === undefined || gameState.complexity >= upgrade.cost.complexity) &&
      (upgrade.cost.data === undefined || gameState.data >= upgrade.cost.data);
      
    const meetsKarmaReq = upgrade.karmaRequirement ? upgrade.karmaRequirement(gameState.karma) : true;
    
    const meetsPrereqs = (upgrade.prerequisites || []).length === 0 || 
                         (upgrade.prerequisites || []).every(p => gameState.unlockedUpgrades.has(p));

    const isUnlocked = gameState.unlockedUpgrades.has(upgrade.id);
    const inChapter = upgrade.chapter <= gameState.currentChapter;
    const isExclusive = (upgrade.exclusiveWith || []).some(ex => gameState.unlockedUpgrades.has(ex));

    return hasEnoughResources && meetsKarmaReq && meetsPrereqs && !isUnlocked && inChapter && !isExclusive;
  };
  
  const getVisibleUpgrades = () => {
    return UPGRADES.filter(u => {
        // Must be in the current chapter or an earlier one
        if (u.chapter > gameState.currentChapter) {
            return false;
        }
        
        const isUnlocked = gameState.unlockedUpgrades.has(u.id);
        
        // If it's already unlocked, always show it.
        if (isUnlocked) {
            return true;
        }

        // If not unlocked, check if all prerequisites are met.
        const prereqs = u.prerequisites || [];
        const hasAllPrereqs = prereqs.every(p => gameState.unlockedUpgrades.has(p));
        
        return hasAllPrereqs;
    });
  }
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    // If the click is on the backdrop itself and not a child element, close the modal.
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-purple-500 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-300 glow-text">Knowledge Web</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="space-y-4">
          {getVisibleUpgrades().map(upgrade => (
            <UpgradeCard 
              key={upgrade.id}
              upgrade={upgrade}
              gameState={gameState}
              onPurchase={onPurchase}
              isPurchaseable={isPurchaseable}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;