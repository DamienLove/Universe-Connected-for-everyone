import React, { useEffect, useState } from 'react';
import { GameAction } from '../types';
import { TUTORIAL_STEPS } from '../constants';

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
        setHighlightStyle({
          display: 'block',
          top: `${rect.top - 4}px`,
          left: `${rect.left - 4}px`,
          width: `${rect.width + 8}px`,
          height: `${rect.height + 8}px`,
        });
      } else {
         setHighlightStyle({ display: 'none' });
      }
    };
    
    updateHighlight();
    const interval = setInterval(updateHighlight, 100);
    return () => clearInterval(interval);

  }, [currentStep]);

  if (!currentStep) return null;

  const handleNext = () => {
    dispatch({ type: 'ADVANCE_TUTORIAL' });
  };
  
  const handleClose = () => {
    dispatch({ type: 'ADVANCE_TUTORIAL', payload: { forceEnd: true } });
  }
  
  // FIX: Simplified logic now that the parent component hides the tutorial during milestones.
  const showNextButton = step > 1;

  return (
    <>
      <div className="tutorial-highlight" style={highlightStyle} />
      <div className="tutorial-box">
        <button onClick={handleClose} className="absolute top-2 right-3 text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        <p className="text-lg text-gray-200" dangerouslySetInnerHTML={{ __html: currentStep.text }} />
        {showNextButton && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleNext}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded"
            >
              {step === TUTORIAL_STEPS.length - 1 ? 'Begin' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Tutorial;