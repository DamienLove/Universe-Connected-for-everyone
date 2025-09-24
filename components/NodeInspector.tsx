import React, { useState, useEffect } from 'react';
import { GameNode, Chapter } from '../types';
import { getGeminiLoreForNode } from '../services/geminiService';

interface NodeInspectorProps {
  node: GameNode;
  chapter: Chapter;
  onClose: () => void;
}

const NodeInspector: React.FC<NodeInspectorProps> = ({ node, chapter, onClose }) => {
    const [lore, setLore] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Reset lore when the selected node changes
    useEffect(() => {
        setLore("");
    }, [node.id]);

    const handleAsk = async () => {
        setIsLoading(true);
        try {
            const newLore = await getGeminiLoreForNode(node, chapter);
            setLore(newLore);
        } catch (error) {
            setLore("The cosmos remains silent for now...");
        } finally {
            setIsLoading(false);
        }
    };
    
    const nodeTypeFormatted = node.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div 
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-gray-900/80 backdrop-blur-sm border border-teal-500 rounded-lg p-4 w-80 z-20 pointer-events-auto"
            onClick={e => e.stopPropagation()} // Prevent clicks inside from closing the panel
        >
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-teal-300">{node.label}</h3>
                 <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Type: {nodeTypeFormatted}</p>

            <div className="bg-gray-800/50 p-3 rounded min-h-[100px]">
                {isLoading ? (
                    <p className="text-gray-400 italic text-center py-4">Contacting the Universal Consciousness...</p>
                ) : lore ? (
                     <blockquote className="text-teal-200 italic border-l-2 border-teal-400 pl-3 text-sm">
                        {lore}
                    </blockquote>
                ) : (
                    <p className="text-gray-500 text-sm text-center py-4">Select "Ask" to receive insight.</p>
                )}
            </div>

            <button
                onClick={handleAsk}
                disabled={isLoading}
                className="mt-4 w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
                {isLoading ? "Awaiting..." : "Ask the Universal Consciousness"}
            </button>
        </div>
    );
};

export default NodeInspector;