import React, { useState, useEffect, useCallback } from 'react';
import { TasteSession, TasteQuad, QuadSelection, CategoryProgress, AppView, StyleMetrics } from './types/tasteTypes';
import { CATEGORIES, getOrderedCategories, SESSION_CONFIG, getImageUrl } from './config/tasteConfig';
import { quads, categoryOrder, getQuadsByCategory, getEnabledQuads } from './data/quadMetadata';
import './App.css';

// Generate unique session ID
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initialize empty session
const createNewSession = (): TasteSession => {
  const progress: Record<string, CategoryProgress> = {};
  
  categoryOrder.forEach(catId => {
    const categoryQuads = getQuadsByCategory(catId).filter(q => q.enabled);
    progress[catId] = {
      categoryId: catId,
      totalQuads: categoryQuads.length,
      completedQuads: 0,
      selections: []
    };
  });

  return {
    sessionId: generateSessionId(),
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
    progress,
    currentCategory: categoryOrder[0],
    currentQuadIndex: 0
  };
};

// Storage helpers
const saveSession = (session: TasteSession) => {
  localStorage.setItem(`${SESSION_CONFIG.storageKeyPrefix}current_session`, JSON.stringify(session));
};

const loadSession = (): TasteSession | null => {
  const stored = localStorage.getItem(`${SESSION_CONFIG.storageKeyPrefix}current_session`);
  return stored ? JSON.parse(stored) : null;
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('welcome');
  const [session, setSession] = useState<TasteSession | null>(null);
  const [currentQuads, setCurrentQuads] = useState<TasteQuad[]>([]);
  const [quadStartTime, setQuadStartTime] = useState<number>(Date.now());
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});

  // Load or create session
  useEffect(() => {
    const existing = loadSession();
    if (existing && !existing.completedAt) {
      setSession(existing);
      if (existing.currentCategory) {
        setCurrentQuads(getQuadsByCategory(existing.currentCategory).filter(q => q.enabled));
      }
    }
  }, []);

  // Auto-save session
  useEffect(() => {
    if (session) {
      saveSession(session);
    }
  }, [session]);

  // Start new exploration
  const startExploration = () => {
    const newSession = createNewSession();
    setSession(newSession);
    setCurrentQuads(getQuadsByCategory(categoryOrder[0]).filter(q => q.enabled));
    setQuadStartTime(Date.now());
    setView('exploration');
  };

  // Resume existing session
  const resumeExploration = () => {
    if (session?.currentCategory) {
      setCurrentQuads(getQuadsByCategory(session.currentCategory).filter(q => q.enabled));
      setQuadStartTime(Date.now());
      setView('exploration');
    }
  };

  // Handle image selection
  const handleSelection = useCallback((selectedIndex: number) => {
    if (!session || !session.currentCategory) return;

    const currentQuad = currentQuads[session.currentQuadIndex || 0];
    if (!currentQuad) return;

    const timeSpent = Date.now() - quadStartTime;
    const selection: QuadSelection = {
      quadId: currentQuad.quadId,
      selectedIndex,
      timestamp: Date.now(),
      timeSpent
    };

    // Update progress
    const updatedProgress = { ...session.progress };
    const catProgress = updatedProgress[session.currentCategory];
    catProgress.selections.push(selection);
    catProgress.completedQuads = catProgress.selections.length;

    const nextQuadIndex = (session.currentQuadIndex || 0) + 1;
    
    // Check if category is complete
    if (nextQuadIndex >= currentQuads.length) {
      // Move to next category or finish
      const currentCatIndex = categoryOrder.indexOf(session.currentCategory);
      const nextCatIndex = currentCatIndex + 1;

      if (nextCatIndex >= categoryOrder.length) {
        // All done!
        setSession({
          ...session,
          progress: updatedProgress,
          lastUpdatedAt: Date.now(),
          completedAt: Date.now()
        });
        setView('analysis');
      } else {
        // Next category
        const nextCategory = categoryOrder[nextCatIndex];
        const nextCategoryQuads = getQuadsByCategory(nextCategory).filter(q => q.enabled);
        
        setSession({
          ...session,
          progress: updatedProgress,
          currentCategory: nextCategory,
          currentQuadIndex: 0,
          lastUpdatedAt: Date.now()
        });
        setCurrentQuads(nextCategoryQuads);
        setView('category-complete');
      }
    } else {
      // Next quad in same category
      setSession({
        ...session,
        progress: updatedProgress,
        currentQuadIndex: nextQuadIndex,
        lastUpdatedAt: Date.now()
      });
    }

    setQuadStartTime(Date.now());
  }, [session, currentQuads, quadStartTime]);

  // Continue to next category
  const continueToNextCategory = () => {
    setQuadStartTime(Date.now());
    setView('exploration');
  };

  // Calculate style metrics
  const calculateStyleMetrics = (): StyleMetrics | null => {
    if (!session) return null;

    let totalCT = 0, totalML = 0, totalWC = 0, count = 0;
    const regionCounts: Record<string, number> = {};
    const materialCounts: Record<string, number> = {};

    Object.values(session.progress).forEach(catProgress => {
      catProgress.selections.forEach(sel => {
        const quad = quads[sel.quadId];
        if (quad && sel.selectedIndex >= 0) {
          totalCT += quad.metadata.ct;
          totalML += quad.metadata.ml;
          totalWC += quad.metadata.wc;
          count++;

          regionCounts[quad.metadata.region] = (regionCounts[quad.metadata.region] || 0) + 1;
          quad.metadata.materials.forEach(mat => {
            materialCounts[mat] = (materialCounts[mat] || 0) + 1;
          });
        }
      });
    });

    if (count === 0) return null;

    const avgCT = totalCT / count;
    const avgML = totalML / count;
    const avgWC = totalWC / count;

    // Determine style label
    let styleLabel = '';
    if (avgCT <= 3) {
      styleLabel = avgWC <= 4 ? 'Contemporary Warm' : 'Contemporary Cool';
    } else if (avgCT <= 6) {
      styleLabel = 'Transitional';
    } else {
      styleLabel = avgWC <= 4 ? 'Traditional Warm' : 'Traditional Classic';
    }

    if (avgML <= 3) {
      styleLabel += ' Minimal';
    } else if (avgML >= 7) {
      styleLabel += ' Layered';
    }

    return {
      avgCT,
      avgML,
      avgWC,
      regionPreferences: regionCounts,
      materialPreferences: materialCounts,
      styleLabel
    };
  };

  // Get current category info
  const getCurrentCategory = () => {
    if (!session?.currentCategory) return null;
    return CATEGORIES[session.currentCategory as keyof typeof CATEGORIES];
  };

  // Get progress percentage
  const getOverallProgress = () => {
    if (!session) return 0;
    let total = 0, completed = 0;
    Object.values(session.progress).forEach(p => {
      total += p.totalQuads;
      completed += p.completedQuads;
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Handle image load error
  const handleImageError = (quadId: string, index: number) => {
    setImageLoadErrors(prev => ({ ...prev, [`${quadId}_${index}`]: true }));
  };

  // Render welcome screen
  const renderWelcome = () => (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo">N4S</div>
        <h1>Taste Exploration</h1>
        <p className="welcome-subtitle">
          Discover your design preferences through a curated visual journey
        </p>
        
        <div className="welcome-info">
          <div className="info-item">
            <span className="info-icon">🖼️</span>
            <span>110 curated design quads</span>
          </div>
          <div className="info-item">
            <span className="info-icon">📂</span>
            <span>10 categories from living to landscape</span>
          </div>
          <div className="info-item">
            <span className="info-icon">⏱️</span>
            <span>Approximately 20-30 minutes</span>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="btn-primary" onClick={startExploration}>
            Begin Exploration
          </button>
          {session && !session.completedAt && (
            <button className="btn-secondary" onClick={resumeExploration}>
              Resume ({getOverallProgress()}% complete)
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render exploration screen
  const renderExploration = () => {
    if (!session || !session.currentCategory) return null;
    
    const currentQuad = currentQuads[session.currentQuadIndex || 0];
    const category = getCurrentCategory();
    const catProgress = session.progress[session.currentCategory];
    
    if (!currentQuad || !category) return null;

    return (
      <div className="exploration-screen">
        {/* Header */}
        <header className="exploration-header">
          <div className="header-left">
            <span className="category-icon">{category.icon}</span>
            <div className="category-info">
              <h2>{category.name}</h2>
              <span className="quad-counter">
                {(session.currentQuadIndex || 0) + 1} of {currentQuads.length}
              </span>
            </div>
          </div>
          <div className="header-right">
            <div className="overall-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${getOverallProgress()}%` }}
                />
              </div>
              <span className="progress-text">{getOverallProgress()}%</span>
            </div>
          </div>
        </header>

        {/* Quad Display */}
        <div className="quad-container">
          <div className="quad-title">
            <h3>{currentQuad.title}</h3>
            <span className="quad-subtitle">{currentQuad.subtitle}</span>
          </div>
          
          <div className="quad-grid">
            {[0, 1, 2, 3].map(index => {
              const imageKey = `${currentQuad.quadId}_${index}`;
              const hasError = imageLoadErrors[imageKey];
              
              return (
                <button
                  key={index}
                  className="quad-image-btn"
                  onClick={() => handleSelection(index)}
                  disabled={hasError}
                >
                  {hasError ? (
                    <div className="image-error">
                      <span>Image unavailable</span>
                    </div>
                  ) : (
                    <img
                      src={getImageUrl(currentQuad.quadId, index)}
                      alt={`${currentQuad.title} option ${index + 1}`}
                      loading="lazy"
                      onError={() => handleImageError(currentQuad.quadId, index)}
                    />
                  )}
                  <div className="image-overlay">
                    <span className="select-label">Select</span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="selection-hint">
            Click the image that best represents your preference
          </p>
        </div>

        {/* Skip option */}
        <div className="skip-container">
          <button className="btn-skip" onClick={() => handleSelection(-1)}>
            Skip this quad
          </button>
        </div>
      </div>
    );
  };

  // Render category complete screen
  const renderCategoryComplete = () => {
    if (!session?.currentCategory) return null;
    
    const category = getCurrentCategory();
    const prevCatIndex = categoryOrder.indexOf(session.currentCategory) - 1;
    const prevCategory = prevCatIndex >= 0 
      ? CATEGORIES[categoryOrder[prevCatIndex] as keyof typeof CATEGORIES] 
      : null;
    
    if (!category) return null;

    return (
      <div className="category-complete-screen">
        <div className="complete-content">
          <div className="complete-icon">✓</div>
          {prevCategory && (
            <h2>{prevCategory.name} Complete!</h2>
          )}
          <p className="complete-progress">
            {getOverallProgress()}% of exploration complete
          </p>
          
          <div className="next-category">
            <span className="next-label">Next Category</span>
            <div className="next-category-info">
              <span className="category-icon large">{category.icon}</span>
              <div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span className="quad-count">
                  {session.progress[session.currentCategory].totalQuads} selections
                </span>
              </div>
            </div>
          </div>

          <button className="btn-primary" onClick={continueToNextCategory}>
            Continue to {category.name}
          </button>
        </div>
      </div>
    );
  };

  // Render analysis screen
  const renderAnalysis = () => {
    const metrics = calculateStyleMetrics();
    if (!session || !metrics) return null;

    // Get top regions
    const topRegions = Object.entries(metrics.regionPreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Get top materials
    const topMaterials = Object.entries(metrics.materialPreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return (
      <div className="analysis-screen">
        <header className="analysis-header">
          <h1>Your Design Profile</h1>
          <p className="analysis-subtitle">
            Based on your selections across {categoryOrder.length} categories
          </p>
        </header>

        <div className="analysis-content">
          {/* Style Label */}
          <div className="style-label-card">
            <h2>{metrics.styleLabel}</h2>
            <p>Your overall design aesthetic</p>
          </div>

          {/* Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Contemporary ↔ Traditional</div>
              <div className="metric-bar">
                <div 
                  className="metric-indicator" 
                  style={{ left: `${((metrics.avgCT - 1) / 8) * 100}%` }}
                />
              </div>
              <div className="metric-ends">
                <span>Contemporary</span>
                <span>{metrics.avgCT.toFixed(1)}</span>
                <span>Traditional</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Minimal ↔ Layered</div>
              <div className="metric-bar">
                <div 
                  className="metric-indicator" 
                  style={{ left: `${((metrics.avgML - 1) / 8) * 100}%` }}
                />
              </div>
              <div className="metric-ends">
                <span>Minimal</span>
                <span>{metrics.avgML.toFixed(1)}</span>
                <span>Layered</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Warm ↔ Cool</div>
              <div className="metric-bar">
                <div 
                  className="metric-indicator" 
                  style={{ left: `${((metrics.avgWC - 1) / 8) * 100}%` }}
                />
              </div>
              <div className="metric-ends">
                <span>Warm</span>
                <span>{metrics.avgWC.toFixed(1)}</span>
                <span>Cool</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="preferences-section">
            <div className="preference-card">
              <h3>Regional Influences</h3>
              <div className="preference-list">
                {topRegions.map(([region, count]) => (
                  <div key={region} className="preference-item">
                    <span className="preference-name">{region.replace(/_/g, ' ')}</span>
                    <span className="preference-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="preference-card">
              <h3>Material Preferences</h3>
              <div className="preference-tags">
                {topMaterials.map(([material, count]) => (
                  <span key={material} className="preference-tag">
                    {material.replace(/_/g, ' ')} ({count})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="analysis-actions">
            <button className="btn-primary" onClick={() => {
              // Export results
              const data = {
                session,
                metrics,
                exportedAt: new Date().toISOString()
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `taste-profile-${session.sessionId}.json`;
              link.click();
            }}>
              Export Results
            </button>
            <button className="btn-secondary" onClick={() => {
              localStorage.removeItem(`${SESSION_CONFIG.storageKeyPrefix}current_session`);
              setSession(null);
              setView('welcome');
            }}>
              Start New Session
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="app">
      {view === 'welcome' && renderWelcome()}
      {view === 'exploration' && renderExploration()}
      {view === 'category-complete' && renderCategoryComplete()}
      {view === 'analysis' && renderAnalysis()}
    </div>
  );
};

export default App;
