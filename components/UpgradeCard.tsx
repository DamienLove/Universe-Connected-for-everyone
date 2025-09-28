import React, { useState, useEffect } from 'react';
import { Upgrade, GameState } from '../types';
import { getGeminiFlavorText, generateNodeImage } from '../services/geminiService';

interface UpgradeCardProps {
  upgrade: Upgrade;
  gameState: GameState;
  onPurchase: (upgrade: Upgrade, imageUrl?: string) => void;
  isPurchaseable: (upgrade: Upgrade) => boolean;
}

const getNodeImagePrompt = (nodeType: 'star' | 'rocky_planet'): string => {
    switch (nodeType) {
        case 'star':
            return "Clean vector art, a vibrant newborn star, glowing with yellow and orange plasma flares, simple bold shapes, against a deep space background, cel shaded, high contrast, 4k, HD, cinematic lighting.";
        case 'rocky_planet':
            return "Clean vector art of a barren, rocky exoplanet, shades of terracotta and grey, detailed with craters and canyons, simple bold shapes, against a deep space background with a distant nebula, cel shaded, high contrast, 4k, HD.";
    }
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ upgrade, gameState, onPurchase, isPurchaseable }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [flavorText, setFlavorText] = useState<string>('');
  const [isLoadingFlavorText, setIsLoadingFlavorText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    if (isExpanded && !flavorText && !isLoadingFlavorText) {
      setIsLoadingFlavorText(true);
      getGeminiFlavorText(upgrade.title)
        .then(text => {
          setFlavorText(text);
        })
        .catch(err => {
          console.error(err);
          setFlavorText('"The archives are silent on this matter..."');
        })
        .finally(() => {
          setIsLoadingFlavorText(false);
        });
    }
  }, [isExpanded, flavorText, isLoadingFlavorText, upgrade.title]);

  const handlePurchase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPurchaseable(upgrade)) return;

    if (upgrade.generatesNodeType) {
        setIsGeneratingImage(true);
        try {
            const prompt = getNodeImagePrompt(upgrade.generatesNodeType);
            const imageUrl = await generateNodeImage(prompt);
            onPurchase(upgrade, imageUrl);
        } catch (error) {
            console.error("Failed to generate node image:", error);
            // Purchase without an image as a fallback
            onPurchase(upgrade);
        } finally {
            setIsGeneratingImage(false);
        }
    } else {
        onPurchase(upgrade);
    }
  };

  const unlocked = gameState.unlockedUpgrades.has(upgrade.id);
  const canBuy = isPurchaseable(upgrade);
  const exclusiveLock = (upgrade.exclusiveWith || []).some(ex => gameState.unlockedUpgrades.has(ex));

  const renderCost = (cost: Upgrade['cost']) => {
    const costString = Object.entries(cost)
      .map(([resource, value]) => `${value?.toLocaleString()} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`)
      .join(', ');
    return `Cost: ${costString}`;
  };
  
  const buttonText = () => {
      if (unlocked) return 'Unlocked';
      if (exclusiveLock) return 'Path Not Chosen';
      if (isGeneratingImage) return 'Generating...';
      return 'Unlock';
  }

  return (
    <div 
      data-tutorial-id={upgrade.id}
      className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
        unlocked ? 'bg-green-800/50 border-green-600' : 'bg-gray-800/80 border-gray-600 hover:border-purple-500'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-teal-300">{upgrade.title}</h3>
          <p className="text-gray-400 mt-1">{upgrade.description}</p>
        </div>
        <button
          onClick={handlePurchase}
          disabled={!canBuy || unlocked || exclusiveLock || isGeneratingImage}
          className={`px-4 py-2 rounded transition-colors ml-4 whitespace-nowrap ${
            unlocked ? 'bg-gray-600 cursor-not-allowed' :
            exclusiveLock ? 'bg-red-900 text-gray-500 cursor-not-allowed' :
            canBuy ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {buttonText()}
        </button>
      </div>

      <div className="mt-2 flex justify-between items-center text-sm">
        <span className="text-yellow-400">{renderCost(upgrade.cost)}</span>
        <div className="text-xs text-right text-gray-500">
           <p>Chapter: {upgrade.chapter + 1}</p>
          {upgrade.prerequisites && upgrade.prerequisites.length > 0 && (
            <p>Requires: {(upgrade.prerequisites || []).map(p => p.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(' AND ')}</p>
          )}
          {upgrade.karmaRequirementText && (
            <p className="text-purple-400">{upgrade.karmaRequirementText}</p>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          {isLoadingFlavorText && <p className="text-gray-500 italic">Recalling passages from 'Universe Connected for Everyone'...</p>}
          {flavorText && !isLoadingFlavorText && (
            <blockquote className="text-purple-300 italic border-l-2 border-purple-400 pl-3">
              {flavorText}
              <cite className="block text-right text-purple-400/80 not-italic mt-1">— Universe Connected for Everyone</cite>
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
};

export default UpgradeCard;
