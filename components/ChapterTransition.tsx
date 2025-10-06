import React, { useEffect } from 'react';
import { GameAction } from '../types';
import { CHAPTERS } from './constants';

interface ChapterTransitionProps {
  chapterId: number;
  dispatch: React.Dispatch<GameAction>;
}

const TRANSITION_DURATION = 8000; // 8 seconds total duration

const GasEntity = () => (
    <>
        {Array.from({ length: 50 }).map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 100 + 50;
            return (
                <div key={i} className="gas-particle" style={{
                    top: '50%', left: '50%',
                    width: `${Math.random() * 10 + 5}px`,
                    height: `${Math.random() * 10 + 5}px`,
                    '--color-a': 'rgba(200, 220, 255, 0.8)',
                    '--x-start': `${Math.cos(angle) * dist}%`,
                    '--y-start': `${Math.sin(angle) * dist}%`,
                    '--s-start': `${Math.random() * 0.5 + 0.5}`,
                    '--s-end': '0.1',
                    '--o-end': 0,
                    animationDelay: `${Math.random() * 0.5}s`,
                } as React.CSSProperties} />
            );
        })}
    </>
);

const renderEntity = (type: 'gas' | 'single' | 'multi' | 'universal') => {
    switch(type) {
        case 'single':
            return <div className="entity-single-core" />;
        case 'multi':
            return (
                <>
                    <div className="entity-multi-node" />
                    <div className="entity-multi-node" />
                    <div className="entity-multi-node" />
                </>
            );
        case 'universal':
             return (
                <div className="entity-universal-galaxy">
                    <div className="arm" style={{ transform: 'scale(0.8) rotate(20deg)', animationDelay: '-2s' }} />
                    <div className="arm" style={{ transform: 'scale(0.6) rotate(45deg)', animationDelay: '-5s' }} />
                    <div className="arm" style={{ transform: 'scale(1) rotate(90deg)', animationDelay: '0s' }} />
                </div>
            );
        default:
            return null;
    }
}


const ChapterTransition: React.FC<ChapterTransitionProps> = ({ chapterId, dispatch }) => {
  const chapter = CHAPTERS.find(c => c.id === chapterId);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'END_CHAPTER_TRANSITION' });
    }, TRANSITION_DURATION);

    return () => clearTimeout(timer);
  }, [dispatch]);

  if (!chapter) {
    // Failsafe in case of invalid chapter ID
    dispatch({ type: 'END_CHAPTER_TRANSITION' });
    return null;
  }

  return (
    <div className="chapter-transition-backdrop">
        <div className="chapter-entity-container" style={{ color: '#a855f7' }}>
            <GasEntity />
            {renderEntity(chapter.entityType)}
        </div>
      
        <blockquote className="chapter-quote">
            "{chapter.quote}"
        </blockquote>
    </div>
  );
};

export default ChapterTransition;