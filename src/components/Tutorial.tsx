
import React, { useEffect, useState } from 'react';
import { GameAction } from '../types';
import { TUTORIAL_STEPS } from './constants';

interface TutorialProps {
  step: number;
  dispatch: React.Dispatch<GameAction>;
}

const Tutorial: React.FC<TutorialProps> = ({ step, dispatch }) => {
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const currentStep = TUTORIAL_STEPS[step];

  useEffect(() => {
    if (!currentStep?.highlight) {
      setHighlightStyle({ display: 'none' });
      return;
    }

    const updateHighlight = () => {
      const element = document.querySelector(currentStep.highlight) as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        // For full screen highlight, just cover the whole viewport
        if (currentStep.highlight === '.simulation-container') {
            setHighlightStyle({
                display: 'block', top: '0', left: '0', width: '100vw', height: '100vh',
                borderRadius: '0',
            });
        } else {
             setHighlightStyle({
                display: 'block',
                top: `${rect.top - 4}px`,
                left: `${rect.left - 4}px`,
                width: `${rect.width + 8}px`,
                height: `${rect.height + 8}px`,
                borderRadius: '8px',
             });
        }
      } else {
         // If we are looking for a transient element (like the aim indicator), don't hide, just wait.
         if(currentStep.highlight !== '#aim-indicator' && currentStep.highlight !== '#power-meter-container') {
            setHighlightStyle({ display: 'none' });
         }
      }
    };
    
    updateHighlight();
    const interval = setInterval(updateHighlight, 100);
    return () => clearInterval(interval);

  }, [currentStep]);

  if (!currentStep) return null;
  
  const handleClose = () => {
    dispatch({ type: 'ADVANCE_TUTORIAL', payload: { forceEnd: true } });
  }
  
  const showEndButton = step === TUTORIAL_STEPS.length - 1;

  return (
    <>
      <div className="tutorial-highlight" style={highlightStyle} />
      <div className="tutorial-box">
        <button onClick={handleClose} className="absolute top-2 right-3 text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        <p className="text-lg text-gray-200" dangerouslySetInnerHTML={{ __html: currentStep.text }} />
        {showEndButton && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleClose}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded"
            >
              Begin
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Tutorial;