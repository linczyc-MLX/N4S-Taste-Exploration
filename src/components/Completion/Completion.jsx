import React from 'react';
import { useTaste } from '../../contexts/TasteContext';
import { CheckCircle, Download, RotateCcw, TrendingUp, Layers } from 'lucide-react';

const Completion = () => {
  const { derivedProfile, resetExploration } = useTaste();
  
  if (!derivedProfile) {
    return <div className="completion__loading">Calculating your profile...</div>;
  }
  
  const { styleAxes, styleTags, complexity, materials, variationPreferences, sampleSize } = derivedProfile;
  
  // Format axis value to descriptive text
  const getAxisDescription = (axis, value) => {
    const descriptions = {
      contemporary_traditional: value < 4 ? 'Contemporary' : value > 6 ? 'Traditional' : 'Transitional',
      minimal_layered: value < 4 ? 'Minimal' : value > 6 ? 'Layered' : 'Balanced',
      warm_cool: value < 4 ? 'Warm' : value > 6 ? 'Cool' : 'Neutral',
      organic_geometric: value < 4 ? 'Organic' : value > 6 ? 'Geometric' : 'Mixed',
      refined_eclectic: value < 4 ? 'Refined' : value > 6 ? 'Eclectic' : 'Curated'
    };
    return descriptions[axis] || 'Balanced';
  };
  
  // Get axis display names
  const getAxisDisplayName = (axis) => {
    const names = {
      contemporary_traditional: ['Contemporary', 'Traditional'],
      minimal_layered: ['Minimal', 'Layered'],
      warm_cool: ['Warm', 'Cool'],
      organic_geometric: ['Organic', 'Geometric'],
      refined_eclectic: ['Refined', 'Eclectic']
    };
    return names[axis] || [axis.split('_')[0], axis.split('_')[1]];
  };
  
  // Export profile data
  const handleExport = () => {
    const dataStr = JSON.stringify(derivedProfile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taste-profile-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="completion">
      {/* Success Header */}
      <div className="completion__header">
        <div className="completion__success-icon">
          <CheckCircle size={64} />
        </div>
        <h1>Your Taste Profile</h1>
        <p>Based on {sampleSize} comparative rankings</p>
      </div>
      
      {/* Style Axes Visualization */}
      <div className="completion__section">
        <h2>Design DNA</h2>
        <div className="style-axes-display">
          {Object.entries(styleAxes).map(([axis, data]) => {
            const [leftLabel, rightLabel] = getAxisDisplayName(axis);
            const value = data.value;
            
            return (
              <div key={axis} className="axis-row">
                <div className="axis-row__labels">
                  <span>{leftLabel}</span>
                  <span>{rightLabel}</span>
                </div>
                <div className="axis-row__track">
                  <div 
                    className="axis-row__marker"
                    style={{ left: `${(value / 10) * 100}%` }}
                  >
                    <span className="axis-row__value">{value.toFixed(1)}</span>
                  </div>
                  <div className="axis-row__fill" style={{ width: `${(value / 10) * 100}%` }} />
                </div>
                <div className="axis-row__description">
                  {getAxisDescription(axis, value)}
                  {data.confidence >= 0.9 && <span className="confidence-badge">High Confidence</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Style Tags */}
      <div className="completion__section">
        <h2>Your Style</h2>
        <div className="style-tags">
          {styleTags.map(tag => (
            <span key={tag} className="style-tag">
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
      
      {/* Complexity Profile */}
      <div className="completion__section">
        <h2>Complexity Calibration</h2>
        <div className="complexity-display">
          <div className="complexity-meter">
            <div className="complexity-meter__track">
              <div 
                className="complexity-meter__range"
                style={{ 
                  left: `${(complexity.range.min / 10) * 100}%`,
                  width: `${((complexity.range.max - complexity.range.min) / 10) * 100}%`
                }}
              />
              <div 
                className="complexity-meter__optimal"
                style={{ left: `${(complexity.optimal / 10) * 100}%` }}
              />
            </div>
            <div className="complexity-meter__labels">
              <span>Simple</span>
              <span>Complex</span>
            </div>
          </div>
          <div className="complexity-stats">
            <div className="stat">
              <span className="stat__value">{complexity.optimal}</span>
              <span className="stat__label">Optimal Level</span>
            </div>
            <div className="stat">
              <span className="stat__value">{complexity.range.min} - {complexity.range.max}</span>
              <span className="stat__label">Comfort Range</span>
            </div>
            <div className="stat">
              <span className="stat__value">{Math.round(complexity.consistency * 100)}%</span>
              <span className="stat__label">Consistency</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Material Affinities */}
      <div className="completion__section">
        <h2>Material Affinities</h2>
        <div className="materials-display">
          {materials.primary.length > 0 && (
            <div className="materials-group">
              <h4>Drawn To</h4>
              <div className="material-chips">
                {materials.primary.map(mat => (
                  <span key={mat.material} className="material-chip material-chip--positive">
                    {mat.material.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          {materials.secondary.length > 0 && (
            <div className="materials-group">
              <h4>Also Like</h4>
              <div className="material-chips">
                {materials.secondary.slice(0, 4).map(mat => (
                  <span key={mat.material} className="material-chip material-chip--neutral">
                    {mat.material.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          {materials.aversions.length > 0 && (
            <div className="materials-group">
              <h4>Less Drawn To</h4>
              <div className="material-chips">
                {materials.aversions.map(mat => (
                  <span key={mat.material} className="material-chip material-chip--negative">
                    {mat.material.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Variation Preferences - Unique insight from quad comparisons */}
      {variationPreferences && variationPreferences.length > 0 && (
        <div className="completion__section">
          <h2>Detailed Preferences</h2>
          <p className="section-subtitle">What your comparative rankings revealed</p>
          <div className="variation-preferences">
            {variationPreferences.slice(0, 6).map(pref => (
              <div key={pref.dimension} className="variation-pref">
                <div className="variation-pref__header">
                  <Layers size={16} />
                  <span>{pref.dimension.replace(/_/g, ' ')}</span>
                </div>
                <div className="variation-pref__indicator">
                  <div className="variation-pref__bar">
                    <div 
                      className="variation-pref__fill"
                      style={{ width: `${(pref.averagePreferred / 10) * 100}%` }}
                    />
                  </div>
                  <span className="variation-pref__label">
                    {pref.preferredEnd === 'low' ? 'Prefer subtle' : 'Prefer bold'}
                  </span>
                </div>
                <div className="variation-pref__strength">
                  Strength: {Math.round(pref.strength * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Phase 3 Resolutions */}
      {derivedProfile.resolutions && derivedProfile.resolutions.length > 0 && (
        <div className="completion__section">
          <h2>Your Decisions</h2>
          <div className="resolutions-display">
            {derivedProfile.resolutions.map(res => (
              <div key={res.pairId} className="resolution-item">
                <span className="resolution-dimension">{res.dimension}</span>
                <span className="resolution-choice">
                  {res.choice === 'A' ? '←' : '→'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="completion__actions">
        <button className="btn btn--primary" onClick={handleExport}>
          <Download size={18} />
          Export Profile
        </button>
        <button className="btn btn--secondary" onClick={resetExploration}>
          <RotateCcw size={18} />
          Start Over
        </button>
      </div>
      
      {/* Next Steps */}
      <div className="completion__next-steps">
        <h3>What's Next?</h3>
        <p>
          Your taste profile will be used to match you with architects and interior designers 
          whose work aligns with your aesthetic preferences. Your N4S advisor will review these 
          results and discuss them with you in your next session.
        </p>
      </div>
    </div>
  );
};

export default Completion;
