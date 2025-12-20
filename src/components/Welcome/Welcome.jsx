import React, { useState } from 'react';
import { useTaste } from '../../contexts/TasteContext';
import { Sparkles, Users, User, ArrowRight, Clock } from 'lucide-react';

const Welcome = () => {
  const { startSession } = useTaste();
  const [selectedMode, setSelectedMode] = useState(null);
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    if (mode === 'together') {
      setShowNameInput(false);
    } else {
      setShowNameInput(true);
    }
  };
  
  const handleStart = () => {
    startSession(selectedMode, name);
  };
  
  return (
    <div className="welcome">
      <div className="welcome__container">
        {/* Logo & Title */}
        <div className="welcome__header">
          <div className="welcome__logo">
            <Sparkles size={40} />
          </div>
          <h1 className="welcome__title">Taste Exploration</h1>
          <p className="welcome__subtitle">Discover Your Design DNA</p>
        </div>
        
        {/* Introduction */}
        <div className="welcome__intro">
          <p>
            This experience reveals your aesthetic preferences through images rather than words. 
            There are no right or wrong answers — only your authentic reactions.
          </p>
          <div className="welcome__timing">
            <Clock size={18} />
            <span>Approximately 15-20 minutes</span>
          </div>
        </div>
        
        {/* Mode Selection */}
        <div className="welcome__modes">
          <h2 className="welcome__section-title">How would you like to proceed?</h2>
          
          <div className="mode-cards">
            <button 
              className={`mode-card ${selectedMode === 'together' ? 'mode-card--selected' : ''}`}
              onClick={() => handleModeSelect('together')}
            >
              <div className="mode-card__icon">
                <Users size={32} />
              </div>
              <h3>Together</h3>
              <p>Complete as a couple, collaborating on choices</p>
            </button>
            
            <button 
              className={`mode-card ${selectedMode === 'principal' ? 'mode-card--selected' : ''}`}
              onClick={() => handleModeSelect('principal')}
            >
              <div className="mode-card__icon">
                <User size={32} />
              </div>
              <h3>Principal</h3>
              <p>Primary decision-maker completing independently</p>
            </button>
            
            <button 
              className={`mode-card ${selectedMode === 'secondary' ? 'mode-card--selected' : ''}`}
              onClick={() => handleModeSelect('secondary')}
            >
              <div className="mode-card__icon">
                <User size={32} />
              </div>
              <h3>Secondary</h3>
              <p>Co-decision-maker completing independently</p>
            </button>
          </div>
        </div>
        
        {/* Name Input (for individual modes) */}
        {showNameInput && (
          <div className="welcome__name-input">
            <label htmlFor="participant-name">Your Name (optional)</label>
            <input
              id="participant-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
            />
          </div>
        )}
        
        {/* What to Expect */}
        <div className="welcome__phases">
          <h2 className="welcome__section-title">What to Expect</h2>
          
          <div className="phase-preview">
            <div className="phase-preview__item">
              <span className="phase-preview__number">1</span>
              <div className="phase-preview__content">
                <h4>Discovery</h4>
                <p>Swipe through images: Love, OK, or Not for me</p>
              </div>
            </div>
            
            <div className="phase-preview__item">
              <span className="phase-preview__number">2</span>
              <div className="phase-preview__content">
                <h4>Refinement</h4>
                <p>Select your top 3 favorites from curated boards</p>
              </div>
            </div>
            
            <div className="phase-preview__item">
              <span className="phase-preview__number">3</span>
              <div className="phase-preview__content">
                <h4>Resolution</h4>
                <p>Quick choices between pairs to clarify preferences</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Start Button */}
        <div className="welcome__actions">
          <button 
            className="btn btn--primary btn--large"
            onClick={handleStart}
            disabled={!selectedMode}
          >
            Begin Exploration
            <ArrowRight size={20} />
          </button>
          
          <p className="welcome__tip">
            Trust your instincts — quick reactions often reveal the truest preferences
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
