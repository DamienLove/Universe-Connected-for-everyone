import React, { useEffect } from 'react';

interface MilestoneVisualProps {
  milestoneId: string;
  onComplete: () => void;
}

const MILESTONE_DURATION = 6000; // 6 seconds

const visuals: { [key: string]: React.ReactNode } = {
  spark_of_life: (
    <div className="milestone-scene deep-sea-bg">
      {/* Vents & Plumes */}
      <div className="vent-plume" style={{ left: '20%', transformOrigin: 'bottom center' }}></div>
      <div className="vent-plume" style={{ left: '50%', animationDelay: '1s', height: '100%' }}></div>
      <div className="vent-plume" style={{ left: '75%', transformOrigin: 'bottom right' }}></div>
      
      {/* Bubbles */}
      {Array.from({ length: 50 }).map((_, i) => {
        const duration = Math.random() * 5 + 4; // 4-9 seconds
        const delay = Math.random() * 5;
        const size = Math.random() * 8 + 2;
        const left = Math.random() * 100;
        const sway = `${(Math.random() - 0.5) * 100}px`;
        return (
          <div key={i} className="bubble" style={{
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            '--sway': sway,
          } as React.CSSProperties}></div>
        );
      })}
      
      <h2 className="milestone-title">Life stirs in the abyssal depths.</h2>
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