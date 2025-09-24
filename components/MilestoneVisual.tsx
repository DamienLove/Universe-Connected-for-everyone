import React, { useEffect } from 'react';

interface MilestoneVisualProps {
  milestoneId: string;
  onComplete: () => void;
}

const MILESTONE_DURATION = 6000; // 6 seconds

const visuals: { [key: string]: React.ReactNode } = {
  spark_of_life: (
    <div className="milestone-scene starfield">
        <div className="comet" style={{ top: `50%`, animationDelay: `0s` }}></div>
        <div className="impact-flash" style={{ top: 'calc(50% + 5vh)', left: '10vw' }}></div>
        <h2 className="milestone-title">The seeds of life arrive from distant stars.</h2>
    </div>
  ),
  panspermia: (
    <div className="milestone-scene starfield">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="comet" style={{ top: `${10 + Math.random() * 60}%`, animationDelay: `${i * 0.6}s` }}></div>
        ))}
        <h2 className="milestone-title">The seeds of life arrive from distant stars.</h2>
    </div>
  ),
  mycorrhizal_networks: (
    <div className="milestone-scene earthy">
        <div className="network-line" style={{ transform: 'rotate(20deg)', animationDelay: '0s' }}></div>
        <div className="network-line" style={{ transform: 'rotate(-30deg) scaleX(-1)', animationDelay: '0.5s' }}></div>
        <div className="network-line" style={{ transform: 'rotate(70deg)', animationDelay: '1s' }}></div>
        <div className="network-line" style={{ transform: 'rotate(-80deg) scaleX(-1)', animationDelay: '1.2s' }}></div>
        <h2 className="milestone-title">A silent, planetary intelligence awakens.</h2>
    </div>
  ),
};

const MilestoneVisual: React.FC<MilestoneVisualProps> = ({ milestoneId, onComplete }) => {
  const visualContent = visuals[milestoneId];

  useEffect(() => {
    // If an unknown milestone ID is passed, complete immediately to avoid getting stuck.
    if (!visualContent) {
      onComplete();
      return;
    }

    const timer = setTimeout(onComplete, MILESTONE_DURATION);
    return () => clearTimeout(timer);
  }, [visualContent, onComplete]);

  if (!visualContent) {
    return null;
  }

  return (
    <div className="milestone-container">
      {visualContent}
    </div>
  );
};

export default MilestoneVisual;
