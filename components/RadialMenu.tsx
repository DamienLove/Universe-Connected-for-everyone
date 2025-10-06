import React from 'react';
import { GameNode, GameAction } from '../types';

interface RadialMenuProps {
    node: GameNode;
    dispatch: React.Dispatch<GameAction>;
    onAsk: (nodeId: string) => void;
}

const buttons = [
    { id: 'ask', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 1-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 1 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 1 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 1-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
    ), action: (dispatch: React.Dispatch<GameAction>, node: GameNode, onAsk: (nodeId: string) => void) => onAsk(node.id) },
];

const RadialMenu: React.FC<RadialMenuProps> = ({ node, dispatch, onAsk }) => {
    const radius = node.radius + 60; // Distance of buttons from the node's center
    const numButtons = buttons.length;
    const angleStep = (Math.PI * 2) / numButtons;

    return (
        <div 
            className="radial-menu-container"
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
        >
            {buttons.map((button, index) => {
                const angle = angleStep * index - (Math.PI / 2); // Start from top
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                    <button
                        key={button.id}
                        data-button-id={button.id}
                        className="radial-menu-button"
                        style={{
                            transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                            animationDelay: `${index * 50}ms`,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            button.action(dispatch, node, onAsk);
                        }}
                        title={button.id.charAt(0).toUpperCase() + button.id.slice(1)}
                    >
                        {button.icon}
                    </button>
                );
            })}
        </div>
    );
};

export default RadialMenu;