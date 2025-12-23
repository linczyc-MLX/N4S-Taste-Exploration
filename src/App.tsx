import React, { useState, useEffect, useCallback } from 'react';
import { TasteSession, TasteQuad, QuadSelection, CategoryProgress, AppView, StyleMetrics } from './types/tasteTypes';
import { CATEGORIES, getOrderedCategories, SESSION_CONFIG, getImageUrl } from './config/tasteConfig';
import { quads, categoryOrder, getQuadsByCategory, getEnabledQuads } from './data/quadMetadata';
import './App.css';

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

const saveSession = (session: TasteSession) => {
  localStorage.setItem(`${SESSION_CONFIG.storageKeyPrefix}current_session`, JSON.stringify(session));
};

const loadSession = (): TasteSession | null => {
  const stored = localStorage.getItem(`${SESSION_CONFIG.storageKeyPrefix}current_session`);
  return stored ? JSON.parse(stored) : null;
};

const convertToFiveScale = (value: number): number => {
  return Math.round(((value - 1) / 8) * 5 * 10) / 10;
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('welcome');
  const [session, setSession] = useState<TasteSession | null>(null);
  const [currentQuads, setCurrentQuads] = useState<TasteQuad[]>([]);
  const [quadStartTime, setQuadStartTime] = useState<number>(Date.now());
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const existing = loadSession();
    if (existing && !existing.completedAt) {
      setSession(existing);
      if (existing.currentCategory) {
        setCurrentQuads(getQuadsByCategory(existing.currentCategory).filter(q => q.enabled));
      }
    }
  }, []);

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  const startExploration = () => {
    const newSession = createNewSession();
    setSession(newSession);
    setCurrentQuads(getQuadsByCategory(categoryOrder[0]).filter(q => q.enabled));
    setQuadStartTime(Date.now());
    setView('exploration');
  };

  const resumeExploration = () => {
    if (session?.currentCategory) {
      setCurrentQuads(getQuadsByCategory(session.currentCategory).filter(q => q.enabled));
      setQuadStartTime(Date.now());
      setView('exploration');
    }
  };

  const handleSelection = useCallback((selectedIndex: number) => {
    if (!session || !session.currentCategory) return;
    const currentQuad = currentQuads[session.currentQuadIndex || 0];
    if (!currentQuad) return;

    const selection: QuadSelection = {
      quadId: currentQuad.quadId,
      selectedIndex,
      timestamp: Date.now(),
      timeSpent: Date.now() - quadStartTime
    };

    const updatedProgress = { ...session.progress };
    const catProgress = updatedProgress[session.currentCategory];
    catProgress.selections.push(selection);
    catProgress.completedQuads = catProgress.selections.length;

    const nextQuadIndex = (session.currentQuadIndex || 0) + 1;
    
    if (nextQuadIndex >= currentQuads.length) {
      const currentCatIndex = categoryOrder.indexOf(session.currentCategory);
      const nextCatIndex = currentCatIndex + 1;

      if (nextCatIndex >= categoryOrder.length) {
        setSession({ ...session, progress: updatedProgress, lastUpdatedAt: Date.now(), completedAt: Date.now() });
        setView('analysis');
      } else {
        const nextCategory = categoryOrder[nextCatIndex];
        setSession({ ...session, progress: updatedProgress, currentCategory: nextCategory, currentQuadIndex: 0, lastUpdatedAt: Date.now() });
        setCurrentQuads(getQuadsByCategory(nextCategory).filter(q => q.enabled));
        setView('category-complete');
      }
    } else {
      setSession({ ...session, progress: updatedProgress, currentQuadIndex: nextQuadIndex, lastUpdatedAt: Date.now() });
    }
    setQuadStartTime(Date.now());
  }, [session, currentQuads, quadStartTime]);

  const jumpToCategory = (categoryId: string) => {
    if (!session) return;
    const categoryQuads = getQuadsByCategory(categoryId).filter(q => q.enabled);
    const progress = session.progress[categoryId];
    setSession({ ...session, currentCategory: categoryId, currentQuadIndex: Math.min(progress.completedQuads, categoryQuads.length - 1), lastUpdatedAt: Date.now() });
    setCurrentQuads(categoryQuads);
    setQuadStartTime(Date.now());
    setView('exploration');
  };

  const continueToNextCategory = () => {
    setQuadStartTime(Date.now());
    setView('exploration');
  };

  const calculateStyleMetrics = (): StyleMetrics | null => {
    if (!session) return null;
    let totalCT = 0, totalML = 0, totalWC = 0, count = 0;
    const regionCounts: Record<string, number> = {};
    const materialCounts: Record<string, number> = {};

    Object.values(session.progress).forEach(catProgress => {
      catProgress.selections.forEach(sel => {
        const quad = quads[sel.quadId];
        if (!quad) return;
        if (sel.selectedIndex >= -1 && sel.selectedIndex !== -2) {
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

    let styleLabel = '';
    if (avgCT <= 3) styleLabel = avgWC <= 4 ? 'Contemporary Warm' : 'Contemporary Cool';
    else if (avgCT <= 6) styleLabel = 'Transitional';
    else styleLabel = avgWC <= 4 ? 'Traditional Warm' : 'Traditional Classic';
    if (avgML <= 3) styleLabel += ' Minimal';
    else if (avgML >= 7) styleLabel += ' Layered';

    return { avgCT, avgML, avgWC, regionPreferences: regionCounts, materialPreferences: materialCounts, styleLabel };
  };

  const getCurrentCategory = () => {
    if (!session?.currentCategory) return null;
    return CATEGORIES[session.currentCategory as keyof typeof CATEGORIES];
  };

  const getOverallProgress = () => {
    if (!session) return 0;
    let total = 0, completed = 0;
    Object.values(session.progress).forEach(p => { total += p.totalQuads; completed += p.completedQuads; });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const isAllComplete = () => {
    if (!session) return false;
    return categoryOrder.every(catId => session.progress[catId].completedQuads >= session.progress[catId].totalQuads);
  };

  const isCategoryComplete = (categoryId: string) => {
    if (!session) return false;
    return session.progress[categoryId].completedQuads >= session.progress[categoryId].totalQuads;
  };

  const handleImageError = (quadId: string, index: number) => {
    setImageLoadErrors(prev => ({ ...prev, [`${quadId}_${index}`]: true }));
  };

  const renderSidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">📋</span>
          <span>N4S</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {categoryOrder.map(catId => {
          const cat = CATEGORIES[catId as keyof typeof CATEGORIES];
          const isComplete = session ? isCategoryComplete(catId) : false;
          const isActive = session?.currentCategory === catId && view === 'exploration';
          return (
            <div key={catId} className={`sidebar-item ${isActive ? 'active' : ''}`} onClick={() => session && jumpToCategory(catId)}>
              <span className="sidebar-item-name">{cat.name}</span>
              {isComplete && <span className="sidebar-item-check">☑</span>}
            </div>
          );
        })}
      </nav>
      {isAllComplete() && (
        <div className="sidebar-footer">
          <button className="sidebar-complete-btn" onClick={() => setView('analysis')}>Complete</button>
        </div>
      )}
    </aside>
  );

  const renderHeader = () => (
    <header className="top-banner">
      <div className="banner-left">
        <div className="banner-title">Welcome to N4S</div>
        <div className="banner-subtitle">Ultra-Luxury Residential Advisory Platform</div>
      </div>
      <div className="banner-right">Taste Exploration</div>
    </header>
  );

  const renderWelcomeContent = () => (
    <div className="welcome-container">
      <h1>Begin Your Design Journey</h1>
      <p className="welcome-subtitle">Discover your design preferences through a curated visual journey</p>
      <div className="welcome-info">
        <div className="info-item"><span className="info-icon">🖼️</span><span>110 curated design quads</span></div>
        <div className="info-item"><span className="info-icon">📂</span><span>10 categories from living to landscape</span></div>
        <div className="info-item"><span className="info-icon">⏱️</span><span>Approximately 20-30 minutes</span></div>
      </div>
      <div className="welcome-actions">
        <button className="btn-primary" onClick={startExploration}>Begin Exploration</button>
        {session && !session.completedAt && (
          <button className="btn-secondary" onClick={resumeExploration}>Resume ({getOverallProgress()}% complete)</button>
        )}
      </div>
    </div>
  );

  const renderExplorationContent = () => {
    if (!session || !session.currentCategory) return null;
    const currentQuad = currentQuads[session.currentQuadIndex || 0];
    const category = getCurrentCategory();
    if (!currentQuad || !category) return null;

    return (
      <>
        <div className="category-header">
          <h2 className="category-title">{category.name}</h2>
          <span className="category-counter">{(session.currentQuadIndex || 0) + 1} of {currentQuads.length}</span>
        </div>
        <div className="exploration-content">
          <div className="quad-header">
            <h3 className="quad-style-title">{currentQuad.title}</h3>
            <p className="quad-space-type">{currentQuad.subtitle}</p>
          </div>
          <div className="quad-grid">
            {[0, 1, 2, 3].map(index => {
              const hasError = imageLoadErrors[`${currentQuad.quadId}_${index}`];
              return (
                <button key={index} className="quad-image-btn" onClick={() => handleSelection(index)} disabled={hasError}>
                  {hasError ? (
                    <div className="image-error"><span>Image unavailable</span></div>
                  ) : (
                    <img src={getImageUrl(currentQuad.quadId, index)} alt={`Option ${index + 1}`} onError={() => handleImageError(currentQuad.quadId, index)} />
                  )}
                  <div className="image-overlay"><span className="select-label">Select</span></div>
                </button>
              );
            })}
          </div>
          <div className="quad-footer">
            <p className="selection-hint">Click the image that best represents your preference</p>
            <div className="skip-buttons">
              <button className="btn-outline-success" onClick={() => handleSelection(-1)}>All of these work for me</button>
              <span className="skip-divider">or</span>
              <button className="btn-outline-danger" onClick={() => handleSelection(-2)}>None of these appeal to me</button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderCategoryCompleteContent = () => {
    if (!session?.currentCategory) return null;
    const category = getCurrentCategory();
    const prevCatIndex = categoryOrder.indexOf(session.currentCategory) - 1;
    const prevCategory = prevCatIndex >= 0 ? CATEGORIES[categoryOrder[prevCatIndex] as keyof typeof CATEGORIES] : null;
    if (!category) return null;

    return (
      <div className="category-complete-container">
        <div className="complete-icon">✓</div>
        {prevCategory && <h2>{prevCategory.name} Complete!</h2>}
        <p className="complete-progress">{getOverallProgress()}% of exploration complete</p>
        <div className="next-category">
          <span className="next-label">Next Category</span>
          <div className="next-category-info">
            <span className="category-icon">{category.icon}</span>
            <div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <span className="quad-count">{session.progress[session.currentCategory].totalQuads} selections</span>
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={continueToNextCategory}>Continue to {category.name}</button>
      </div>
    );
  };

  const renderDNASlider = (label: string, value: number, leftLabel: string, rightLabel: string) => {
    const fiveScaleValue = convertToFiveScale(value);
    const percentage = ((value - 1) / 8) * 100;
    return (
      <div className="dna-slider">
        <div className="dna-slider-header">
          <span className="dna-slider-label">{label}</span>
          <span className="dna-slider-value">{fiveScaleValue.toFixed(1)}</span>
        </div>
        <div className="dna-slider-track">
          <div className="dna-slider-indicator" style={{ left: `${percentage}%` }} />
        </div>
        <div className="dna-slider-labels"><span>{leftLabel}</span><span>{rightLabel}</span></div>
        <div className="dna-scale-numbers"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
      </div>
    );
  };

  const renderAnalysisContent = () => {
    const metrics = calculateStyleMetrics();
    if (!session || !metrics) return null;
    const topRegions = Object.entries(metrics.regionPreferences).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topMaterials = Object.entries(metrics.materialPreferences).sort((a, b) => b[1] - a[1]).slice(0, 8);

    return (
      <div className="analysis-container">
        <div className="analysis-inner">
          <header className="analysis-header">
            <h1>Your Design Profile</h1>
            <p className="analysis-subtitle">Based on your selections across {categoryOrder.length} categories</p>
          </header>
          <div className="style-label-card">
            <h2>{metrics.styleLabel}</h2>
            <p>Your overall design aesthetic</p>
          </div>
          <div className="design-dna-section">
            <h3>Design DNA</h3>
            {renderDNASlider('Style Era', metrics.avgCT, 'Contemporary', 'Traditional')}
            {renderDNASlider('Material Complexity', metrics.avgML, 'Minimal', 'Layered')}
            {renderDNASlider('Color Temperature', metrics.avgWC, 'Warm', 'Cool')}
          </div>
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
                  <span key={material} className="preference-tag">{material.replace(/_/g, ' ')} ({count})</span>
                ))}
              </div>
            </div>
          </div>
          <div className="analysis-actions">
            <button className="btn-primary" onClick={() => {
              const exportData = { session, metrics: { ...metrics, ctScale5: convertToFiveScale(metrics.avgCT), mlScale5: convertToFiveScale(metrics.avgML), wcScale5: convertToFiveScale(metrics.avgWC) }, exportedAt: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `taste-profile-${session.sessionId}.json`;
              link.click();
            }}>Export Results</button>
            <button className="btn-secondary" onClick={() => { localStorage.removeItem(`${SESSION_CONFIG.storageKeyPrefix}current_session`); setSession(null); setView('welcome'); }}>Start New Session</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="app-layout">
        {renderSidebar()}
        <main className="main-content">
          {renderHeader()}
          <div className="page-content">
            {view === 'welcome' && renderWelcomeContent()}
            {view === 'exploration' && renderExplorationContent()}
            {view === 'category-complete' && renderCategoryCompleteContent()}
            {view === 'analysis' && renderAnalysisContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
