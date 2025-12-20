import React, { useState, useCallback } from 'react';
import { useTaste } from '../../contexts/TasteContext';
import { Heart, Meh, X, ChevronUp } from 'lucide-react';
import ProgressIndicator from '../shared/ProgressIndicator';
import DividerCard from '../shared/DividerCard';

const PhaseOne = () => {
  const { 
    currentItem,
    imageCount,
    totalImages,
    phase1Progress,
    phase1Sequence,
    phase1Index,
    recordPhase1Choice,
    continuePastDivider
  } = useTaste();
  
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleChoice = useCallback((choice) => {
    if (isAnimating || !currentItem || currentItem.type !== 'image') return;
    
    // Set animation direction
    const directionMap = {
      love: 'right',
      ok: 'up',
      notForMe: 'left'
    };
    
    setSwipeDirection(directionMap[choice]);
    setIsAnimating(true);
    
    // Record choice after animation
    setTimeout(() => {
      recordPhase1Choice(choice);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentItem, recordPhase1Choice]);
  
  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentItem) return;
      
      if (currentItem.type === 'divider') {
        if (e.key === 'Enter' || e.key === ' ') {
          continuePastDivider();
        }
      } else {
        if (e.key === 'ArrowRight') handleChoice('love');
        if (e.key === 'ArrowUp') handleChoice('ok');
        if (e.key === 'ArrowLeft') handleChoice('notForMe');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleChoice, currentItem, continuePastDivider]);
  
  if (!currentItem) {
    return <div className="phase-one__loading">Loading...</div>;
  }
  
  // Render divider card
  if (currentItem.type === 'divider') {
    return (
      <div className="phase-one phase-one--divider">
        <DividerCard 
          category={currentItem.category}
          categoryIndex={currentItem.categoryIndex}
          totalCategories={currentItem.totalCategories}
          onContinue={continuePastDivider}
        />
      </div>
    );
  }
  
  // Get upcoming images for stack effect
  const upcomingImages = phase1Sequence
    .slice(phase1Index + 1, phase1Index + 4)
    .filter(item => item.type === 'image');
  
  return (
    <div className="phase-one">
      {/* Header */}
      <div className="phase-one__header">
        <div className="phase-one__title">
          <span className="phase-badge">Phase 1</span>
          <h2>Discovery</h2>
        </div>
        <ProgressIndicator 
          current={imageCount + 1} 
          total={totalImages}
          percentage={phase1Progress}
        />
      </div>
      
      {/* Current Category Label */}
      <div className="phase-one__category-label">
        {currentItem.category.replace(/_/g, ' ')}
      </div>
      
      {/* Instructions */}
      <p className="phase-one__instructions">
        Trust your gut reaction. Which images speak to you?
      </p>
      
      {/* Card Stack */}
      <div className="card-stack">
        {/* Background cards for depth effect */}
        {upcomingImages.slice(0, 2).map((img, idx) => (
          <div 
            key={img.id} 
            className="swipe-card swipe-card--background"
            style={{ 
              transform: `scale(${0.95 - idx * 0.03}) translateY(${(idx + 1) * 8}px)`,
              zIndex: 10 - idx
            }}
          >
            <div 
              className="swipe-card__image"
              style={{ background: img.gradient }}
            />
          </div>
        ))}
        
        {/* Active card */}
        <div 
          className={`swipe-card swipe-card--active ${swipeDirection ? `swipe-card--${swipeDirection}` : ''}`}
        >
          <div 
            className="swipe-card__image"
            style={{ background: currentItem.gradient }}
          >
            {/* Placeholder label */}
            <div className="swipe-card__placeholder-label">
              <span className="swipe-card__category">{currentItem.label}</span>
              <span className="swipe-card__style">{currentItem.styleLabel}</span>
            </div>
          </div>
          
          {/* Choice indicators */}
          <div className={`swipe-card__indicator swipe-card__indicator--love ${swipeDirection === 'right' ? 'visible' : ''}`}>
            <Heart size={48} />
            <span>Love</span>
          </div>
          <div className={`swipe-card__indicator swipe-card__indicator--ok ${swipeDirection === 'up' ? 'visible' : ''}`}>
            <ChevronUp size={48} />
            <span>OK</span>
          </div>
          <div className={`swipe-card__indicator swipe-card__indicator--not-for-me ${swipeDirection === 'left' ? 'visible' : ''}`}>
            <X size={48} />
            <span>Not for me</span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="phase-one__actions">
        <button 
          className="action-btn action-btn--not-for-me"
          onClick={() => handleChoice('notForMe')}
          disabled={isAnimating}
        >
          <X size={28} />
          <span>Not for me</span>
        </button>
        
        <button 
          className="action-btn action-btn--ok"
          onClick={() => handleChoice('ok')}
          disabled={isAnimating}
        >
          <ChevronUp size={28} />
          <span>OK</span>
        </button>
        
        <button 
          className="action-btn action-btn--love"
          onClick={() => handleChoice('love')}
          disabled={isAnimating}
        >
          <Heart size={28} />
          <span>Love</span>
        </button>
      </div>
      
      {/* Keyboard hints */}
      <div className="phase-one__hints">
        <span>← Not for me</span>
        <span>↑ OK</span>
        <span>→ Love</span>
      </div>
    </div>
  );
};

export default PhaseOne;
