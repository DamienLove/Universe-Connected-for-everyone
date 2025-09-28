import React, { useEffect } from 'react';

interface MilestoneVisualProps {
  milestoneId: string;
  onComplete: () => void;
}

const MILESTONE_DURATION: { [key: string]: number } = {
  default: 6000,
  the_great_zoom_out: 14000, // A much longer, more cinematic duration
};

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
  the_great_zoom_out: (
    <div className="milestone-scene bg-black">
      <div className="w-full h-full flex items-center justify-center zoom-out-container">
        <div className="w-64 h-64 rounded-full bg-blue-500 shadow-[0_0_100px_20px_#4299e1] relative">
            {/* Fake galaxy inside */}
            <div className="absolute w-2 h-2 bg-yellow-200 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
      <div className="absolute inset-0 bg-purple-500 rounded-full opacity-0 particle-zoom-in"></div>
      <h2 className="milestone-title opacity-0" style={{ animation: 'fadeInSlow 4s 9s forwards' }}>The universe is a holographic projection of entangled consciousness.</h2>
    </div>
  )
};

const MilestoneVisual: React.FC<MilestoneVisualProps> = ({ milestoneId, onComplete }) => {
  const visualContent = visuals[milestoneId];
  const duration = MILESTONE_DURATION[milestoneId] || MILESTONE_DURATION.default;

  useEffect(() => {
    // If an unknown milestone ID is passed, complete immediately to avoid getting stuck.
    if (!visualContent) {
      onComplete();
      return;
    }

    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [visualContent, onComplete, duration]);

  if (!visualContent) {
    return null;
  }

  return (
    <div className="milestone-container" style={{ animationDuration: `${duration/1000 - 1}s, 1s`, animationDelay: `0s, ${duration/1000 -1}s`}}>
      {visualContent}
    </div>
  );
};

export default MilestoneVisual;