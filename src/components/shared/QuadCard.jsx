import React, { useState, useCallback } from 'react';
import { Check, RotateCcw } from 'lucide-react';

const QuadCard = ({ quad, onComplete, onReset }) => {
  const [rankings, setRankings] = useState({}); // { imageId: rank (1-4) }
  const [nextRank, setNextRank] = useState(1);
  
  const handleImageTap = useCallback((imageId) => {
    // If already ranked, allow re-tap to remove and reset subsequent
    if (rankings[imageId]) {
      const removedRank = rankings[imageId];
      const newRankings = {};
      
      // Keep only rankings lower than the removed one
      Object.entries(rankings).forEach(([id, rank]) => {
        if (rank < removedRank) {
          newRankings[id] = rank;
        }
      });
      
      setRankings(newRankings);
      setNextRank(removedRank);
      return;
    }
    
    // Add new ranking
    if (nextRank <= 4) {
      const newRankings = { ...rankings, [imageId]: nextRank };
      setRankings(newRankings);
      
      // Check if complete
      if (nextRank === 4) {
        // All ranked - trigger completion after brief delay for visual feedback
        setTimeout(() => {
          onComplete(newRankings);
        }, 400);
      }
      
      setNextRank(nextRank + 1);
    }
  }, [rankings, nextRank, onComplete]);
  
  const handleReset = useCallback(() => {
    setRankings({});
    setNextRank(1);
    if (onReset) onReset();
  }, [onReset]);
  
  const getRankLabel = (rank) => {
    switch(rank) {
      case 1: return '1st';
      case 2: return '2nd';
      case 3: return '3rd';
      case 4: return '4th';
      default: return '';
    }
  };
  
  const getRankClass = (rank) => {
    switch(rank) {
      case 1: return 'rank--first';
      case 2: return 'rank--second';
      case 3: return 'rank--third';
      case 4: return 'rank--fourth';
      default: return '';
    }
  };
  
  const rankedCount = Object.keys(rankings).length;
  const isComplete = rankedCount === 4;
  
  return (
    <div className="quad-card">
      {/* Header */}
      <div className="quad-card__header">
        <div className="quad-card__category">
          {quad.category.replace(/_/g, ' ')}
        </div>
        <h3 className="quad-card__title">{quad.displayTitle}</h3>
        <p className="quad-card__dimension">
          Comparing: <span>{quad.variationDimension.replace(/_/g, ' ')}</span>
        </p>
      </div>
      
      {/* Instructions */}
      <div className="quad-card__instructions">
        {rankedCount === 0 && (
          <p>Tap images in order of preference <span className="highlight">(1st choice first)</span></p>
        )}
        {rankedCount > 0 && rankedCount < 4 && (
          <p>Select your <span className="highlight">{getRankLabel(nextRank)} choice</span></p>
        )}
        {isComplete && (
          <p className="complete"><Check size={16} /> Rankings complete</p>
        )}
      </div>
      
      {/* Image Grid */}
      <div className="quad-card__grid">
        {quad.images.map((image) => {
          const rank = rankings[image.id];
          const isRanked = rank !== undefined;
          
          return (
            <div 
              key={image.id}
              className={`quad-card__image ${isRanked ? 'ranked' : ''} ${isRanked ? getRankClass(rank) : ''}`}
              onClick={() => handleImageTap(image.id)}
            >
              {/* Image placeholder */}
              <div 
                className="quad-card__image-inner"
                style={{ background: image.gradient }}
              >
                {/* Variation label */}
                <div className="quad-card__variation-label">
                  {image.variationLabel}
                </div>
                
                {/* Rank badge */}
                {isRanked && (
                  <div className={`quad-card__rank-badge ${getRankClass(rank)}`}>
                    {rank}
                  </div>
                )}
                
                {/* Tap indicator when not ranked */}
                {!isRanked && rankedCount < 4 && (
                  <div className="quad-card__tap-hint">
                    Tap to select
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Reset button */}
      {rankedCount > 0 && (
        <button 
          className="quad-card__reset"
          onClick={handleReset}
        >
          <RotateCcw size={16} />
          <span>Reset rankings</span>
        </button>
      )}
      
      {/* Progress dots */}
      <div className="quad-card__progress">
        {[1, 2, 3, 4].map((num) => (
          <span 
            key={num} 
            className={`progress-dot ${num <= rankedCount ? 'filled' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

export default QuadCard;
