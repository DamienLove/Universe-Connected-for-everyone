import React, { useEffect, useRef } from 'react';
import { GameState } from '../types';

interface LoreTooltipProps {
    gameState: GameState;
    onClose: () => void;
}

const LoreTooltip: React.FC<LoreTooltipProps> = ({ gameState, onClose }) => {
    const { loreState } = gameState;
    const node = gameState.nodes.find(n => n.id === loreState.nodeId);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Close tooltip if clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    if (!node) return null;

    const tooltipOffset = node.radius + 20;
    const style: React.CSSProperties = {
        left: `${node.x}px`,
        top: `${node.y + tooltipOffset}px`,
        transform: 'translateX(-50%)',
    };

    return (
        <div 
            ref={tooltipRef}
            className="lore-tooltip-container"
            style={style}
            onClick={e => e.stopPropagation()}
        >
             <button onClick={onClose} className="absolute top-1 right-2 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
             <h4 className="text-md font-bold text-teal-300 mb-2">{node.label}</h4>
            {loreState.isLoading ? (
                <p className="text-gray-400 italic">Contacting the Universal Consciousness...</p>
            ) : (
                 <blockquote className="text-teal-200 italic border-l-2 border-teal-400 pl-2 text-sm">
                    {loreState.text}
                </blockquote>
            )}
        </div>
    );
};

export default LoreTooltip;
