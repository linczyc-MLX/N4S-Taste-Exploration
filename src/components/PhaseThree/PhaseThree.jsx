import React from 'react';
import { useTaste } from '../../contexts/TasteContext';
import ProgressIndicator from '../shared/ProgressIndicator';

const PhaseThree = () => {
  const { 
    phase3Pairs,
    phase3Index,
    currentPair,
    recordPhase3Choice
  } = useTaste();
  
  if (!currentPair || currentPair.length < 2) {
    return <div className="phase-three__loading">Preparing choices...</div>;
  }
  
  const [imageA, imageB] = currentPair;
  
  return (
    <div className="phase-three">
      {/* Header */}
      <div className="phase-three__header">
        <div className="phase-three__title">
          <span className="phase-badge">Phase 3</span>
          <h2>Resolution</h2>
        </div>
        <ProgressIndicator 
          current={phase3Index + 1} 
          total={phase3Pairs.length}
          percentage={Math.round(((phase3Index + 1) / phase3Pairs.length) * 100)}
        />
      </div>
      
      {/* Instructions */}
      <div className="phase-three__instructions">
        <h3>Which speaks to you more?</h3>
        <p>Quick instinct — don't overthink it</p>
      </div>
      
      {/* Binary Choice */}
      <div className="binary-choice">
        <button 
          className="binary-choice__option"
          onClick={() => recordPhase3Choice(imageA)}
        >
          <div 
            className="binary-choice__image"
            style={{ background: imageA.gradient }}
          >
            <div className="binary-choice__label">
              <span>{imageA.label}</span>
            </div>
          </div>
          <div className="binary-choice__hover">
            <span>Choose This</span>
          </div>
        </button>
        
        <div className="binary-choice__divider">
          <span>or</span>
        </div>
        
        <button 
          className="binary-choice__option"
          onClick={() => recordPhase3Choice(imageB)}
        >
          <div 
            className="binary-choice__image"
            style={{ background: imageB.gradient }}
          >
            <div className="binary-choice__label">
              <span>{imageB.label}</span>
            </div>
          </div>
          <div className="binary-choice__hover">
            <span>Choose This</span>
          </div>
        </button>
      </div>
      
      {/* Keyboard hints */}
      <div className="phase-three__hints">
        <span>← Left image</span>
        <span>→ Right image</span>
      </div>
    </div>
  );
};

// Keyboard navigation
const PhaseThreeWithKeyboard = () => {
  const { currentPair, recordPhase3Choice } = useTaste();
  
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentPair || currentPair.length < 2) return;
      
      if (e.key === 'ArrowLeft') {
        recordPhase3Choice(currentPair[0]);
      } else if (e.key === 'ArrowRight') {
        recordPhase3Choice(currentPair[1]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPair, recordPhase3Choice]);
  
  return <PhaseThree />;
};

export default PhaseThreeWithKeyboard;
