import React from 'react';
import { useTaste } from '../../contexts/TasteContext';
import { Check, ArrowRight } from 'lucide-react';
import ProgressIndicator from '../shared/ProgressIndicator';

const PhaseTwo = () => {
  const { 
    phase2Boards,
    phase2CurrentBoard,
    phase2Selections,
    currentBoard,
    togglePhase2Selection,
    nextBoard
  } = useTaste();
  
  if (!currentBoard) {
    return <div className="phase-two__loading">Preparing boards...</div>;
  }
  
  const currentSelections = phase2Selections[currentBoard.id] || [];
  const canProceed = currentSelections.length === 3;
  
  return (
    <div className="phase-two">
      {/* Header */}
      <div className="phase-two__header">
        <div className="phase-two__title">
          <span className="phase-badge">Phase 2</span>
          <h2>Refinement</h2>
        </div>
        <ProgressIndicator 
          current={phase2CurrentBoard + 1} 
          total={phase2Boards.length}
          percentage={Math.round(((phase2CurrentBoard + 1) / phase2Boards.length) * 100)}
        />
      </div>
      
      {/* Board Info */}
      <div className="phase-two__board-info">
        <h3>{currentBoard.title}</h3>
        <p>{currentBoard.description}</p>
        <div className="selection-counter">
          <span className={currentSelections.length >= 1 ? 'filled' : ''}>●</span>
          <span className={currentSelections.length >= 2 ? 'filled' : ''}>●</span>
          <span className={currentSelections.length >= 3 ? 'filled' : ''}>●</span>
          <span className="selection-counter__label">Select your top 3</span>
        </div>
      </div>
      
      {/* Image Grid */}
      <div className="board-grid">
        {currentBoard.images.map((image) => {
          const isSelected = currentSelections.includes(image.id);
          const selectionOrder = currentSelections.indexOf(image.id) + 1;
          
          return (
            <button
              key={image.id}
              className={`board-grid__item ${isSelected ? 'board-grid__item--selected' : ''}`}
              onClick={() => togglePhase2Selection(currentBoard.id, image.id)}
            >
              <div 
                className="board-grid__image"
                style={{ background: image.gradient }}
              >
                {/* Placeholder label */}
                <div className="board-grid__label">
                  <span>{image.subcategory?.replace('_', ' ')}</span>
                </div>
              </div>
              
              {isSelected && (
                <div className="board-grid__selected-badge">
                  <span>{selectionOrder}</span>
                </div>
              )}
              
              <div className="board-grid__overlay">
                {isSelected ? (
                  <Check size={32} />
                ) : (
                  <span className="board-grid__tap-hint">Tap to select</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Continue Button */}
      <div className="phase-two__actions">
        <button 
          className={`btn btn--primary btn--large ${canProceed ? '' : 'btn--disabled'}`}
          onClick={nextBoard}
          disabled={!canProceed}
        >
          {phase2CurrentBoard < phase2Boards.length - 1 ? (
            <>Next Board <ArrowRight size={20} /></>
          ) : (
            <>Continue <ArrowRight size={20} /></>
          )}
        </button>
        
        {!canProceed && (
          <p className="phase-two__hint">
            Select {3 - currentSelections.length} more image{3 - currentSelections.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default PhaseTwo;
