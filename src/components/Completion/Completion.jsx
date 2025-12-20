import React from 'react';
import { useTaste } from '../../contexts/TasteContext';
import { CheckCircle, Download, RotateCcw, Share2 } from 'lucide-react';

const Completion = () => {
  const { derivedProfile, resetExploration } = useTaste();
  
  if (!derivedProfile) {
    return <div className="completion__loading">Calculating your profile...</div>;
  }
  
  const { style_profile, complexity_profile, material_profile, color_profile } = derivedProfile;
  
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
        <p>Based on {derivedProfile.raw_data.phase1.images_shown} image responses</p>
      </div>
      
      {/* Style Axes Visualization */}
      <div className="completion__section">
        <h2>Design DNA</h2>
        <div className="style-axes-display">
          {Object.entries(style_profile).filter(([key]) => 
            !['style_tags', 'confidence'].includes(key)
          ).map(([axis, value]) => (
            <div key={axis} className="axis-row">
              <div className="axis-row__labels">
                <span>{axis.split('_')[0]}</span>
                <span>{axis.split('_')[1]}</span>
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
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Style Tags */}
      <div className="completion__section">
        <h2>Your Style</h2>
        <div className="style-tags">
          {style_profile.style_tags.map(tag => (
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
                  left: `${(complexity_profile.complexity_range[0] / 10) * 100}%`,
                  width: `${((complexity_profile.complexity_range[1] - complexity_profile.complexity_range[0]) / 10) * 100}%`
                }}
              />
              <div 
                className="complexity-meter__optimal"
                style={{ left: `${(complexity_profile.optimal_complexity / 10) * 100}%` }}
              />
            </div>
            <div className="complexity-meter__labels">
              <span>Simple</span>
              <span>Complex</span>
            </div>
          </div>
          <div className="complexity-stats">
            <div className="stat">
              <span className="stat__value">{complexity_profile.optimal_complexity.toFixed(1)}</span>
              <span className="stat__label">Optimal Complexity</span>
            </div>
            <div className="stat">
              <span className="stat__value">{complexity_profile.coherence_preference.toFixed(1)}</span>
              <span className="stat__label">Coherence Need</span>
            </div>
            <div className="stat">
              <span className="stat__value">{Math.round(complexity_profile.complexity_consistency * 100)}%</span>
              <span className="stat__label">Consistency</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Material Affinities */}
      <div className="completion__section">
        <h2>Material Affinities</h2>
        <div className="materials-display">
          <div className="materials-group">
            <h4>Drawn To</h4>
            <div className="material-chips">
              {material_profile.primary_affinities.map(mat => (
                <span key={mat} className="material-chip material-chip--positive">
                  {mat.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
          {material_profile.aversions.length > 0 && (
            <div className="materials-group">
              <h4>Less Drawn To</h4>
              <div className="material-chips">
                {material_profile.aversions.map(mat => (
                  <span key={mat} className="material-chip material-chip--negative">
                    {mat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Color Profile */}
      <div className="completion__section">
        <h2>Color Palette</h2>
        <div className="color-display">
          <div className="color-primary">
            <span className="color-swatch" data-palette={color_profile.primary_palette}></span>
            <span>{color_profile.primary_palette.replace(/_/g, ' ')}</span>
          </div>
          <div className="color-details">
            <span>Temperature: {color_profile.color_temperature < 5 ? 'Warm' : 'Cool'}</span>
            <span>Saturation: {color_profile.saturation_preference}</span>
          </div>
        </div>
      </div>
      
      {/* Session Info */}
      <div className="completion__session-info">
        <p>
          Completed {new Date(derivedProfile.sessionMetadata.completedAt).toLocaleDateString()} 
          {' '}in {derivedProfile.sessionMetadata.durationMinutes} minutes
          {derivedProfile.sessionMetadata.participant && ` by ${derivedProfile.sessionMetadata.participant}`}
        </p>
      </div>
      
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
