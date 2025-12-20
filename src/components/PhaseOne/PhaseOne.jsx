import React from 'react';
import { useTaste } from '../../contexts/TasteContext';
import ProgressIndicator from '../shared/ProgressIndicator';
import DividerCard from '../shared/DividerCard';
import QuadCard from '../shared/QuadCard';

const PhaseOne = () => {
  const { 
    currentItem,
    quadCount,
    totalQuads,
    phase1Progress,
    recordQuadRanking,
    continuePastDivider
  } = useTaste();
  
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
          quadCount={currentItem.quadCount}
          onContinue={continuePastDivider}
        />
      </div>
    );
  }
  
  // Render quad card
  return (
    <div className="phase-one phase-one--quad">
      {/* Header */}
      <div className="phase-one__header">
        <div className="phase-one__title">
          <span className="phase-badge">Phase 1</span>
          <h2>Comparative Ranking</h2>
        </div>
        <ProgressIndicator 
          current={quadCount + 1} 
          total={totalQuads}
          percentage={phase1Progress}
        />
      </div>
      
      {/* Quad Card */}
      <QuadCard 
        quad={currentItem}
        onComplete={recordQuadRanking}
      />
    </div>
  );
};

export default PhaseOne;
