import React, { useState, useEffect, useCallback } from 'react';
import { TasteSession, TasteQuad, QuadSelection, CategoryProgress, AppView, StyleMetrics } from './types/tasteTypes';
import { CATEGORIES, SESSION_CONFIG, getImageUrl } from './config/tasteConfig';
import { quads, categoryOrder, getQuadsByCategory } from './data/quadMetadata';
import { TasteReportGenerator, ReportData, saveProfileToStorage, isCoupleAssessment, getPartnerClientId, getPartnerProfile } from './utils/reportGenerator';
import './App.css';

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Quad enabled state management
const QUAD_STATE_KEY = 'n4s_quad_enabled_state';
const CLIENT_ID_KEY = 'n4s_client_id';

// Code labels for display
const AS_LABELS: Record<string, string> = {
  'AS1': 'Ultra Modern', 'AS2': 'Modern', 'AS3': 'Modern Classic',
  'AS4': 'Transitional Modern', 'AS5': 'Transitional', 'AS6': 'Transitional Classic',
  'AS7': 'Classic', 'AS8': 'Traditional', 'AS9': 'Grand Traditional'
};

const MP_LABELS: Record<string, string> = {
  'MP1': 'Warm Earth', 'MP2': 'Warm', 'MP3': 'Warm Neutral',
  'MP4': 'Balanced Warm', 'MP5': 'Neutral', 'MP6': 'Balanced Cool',
  'MP7': 'Cool Neutral', 'MP8': 'Cool', 'MP9': 'Cool Crisp'
};

// Helper to extract numeric value from code (e.g., 'AS3' -> 3)
const getCodeValue = (code: string): number => {
  const match = code.match(/\d+/);
  return match ? parseInt(match[0], 10) : 5;
};

// Helper to get selection codes from quad metadata
const getSelectionCodes = (quadId: string, selectedIndex: number): { style: string, vd: string, mp: string, AS: string, VD: string, MP: string } | null => {
  const quad = quads[quadId];
  if (!quad || !quad.images || !quad.images[selectedIndex]) return null;
  const img = quad.images[selectedIndex];
  return {
    style: img.style || 'AS5',
    vd: img.vd || 'VD5',
    mp: img.mp || 'MP5',
    AS: img.style || 'AS5',
    VD: img.vd || 'VD5',
    MP: img.mp || 'MP5'
  };
};

const loadQuadEnabledState = (): Record<string, boolean> => {
  const stored = localStorage.getItem(QUAD_STATE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const defaultState: Record<string, boolean> = {};
  Object.keys(quads).forEach(quadId => {
    defaultState[quadId] = quads[quadId].enabled;
  });
  return defaultState;
};

const saveQuadEnabledState = (state: Record<string, boolean>) => {
  localStorage.setItem(QUAD_STATE_KEY, JSON.stringify(state));
};

const getEnabledQuadsForCategory = (categoryId: string, enabledState: Record<string, boolean>): TasteQuad[] => {
  return getQuadsByCategory(categoryId).filter(q => enabledState[q.quadId] !== false);
};

const createNewSession = (enabledState: Record<string, boolean>): TasteSession => {
  const progress: Record<string, CategoryProgress> = {};
  categoryOrder.forEach(catId => {
    const categoryQuads = getEnabledQuadsForCategory(catId, enabledState);
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
  const [quadEnabledState, setQuadEnabledState] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [hoverPreview, setHoverPreview] = useState<{url: string, x: number, y: number} | null>(null);
  
  // Client ID state
  const [clientId, setClientId] = useState<string>(() => {
    return localStorage.getItem(CLIENT_ID_KEY) || '';
  });
  const [isEditingClientId, setIsEditingClientId] = useState(false);
  const [tempClientId, setTempClientId] = useState('');
  
  // Return URL for KYC redirect flow
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  // Load quad enabled state on mount
  useEffect(() => {
    const state = loadQuadEnabledState();
    setQuadEnabledState(state);
  }, []);

  // Check URL parameters for clientId and returnUrl from KYC Dashboard
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlClientId = urlParams.get('clientId');
    const urlReturnUrl = urlParams.get('returnUrl');
    
    if (urlClientId) {
      setClientId(urlClientId);
      localStorage.setItem(CLIENT_ID_KEY, urlClientId);
    }
    
    if (urlReturnUrl) {
      setReturnUrl(decodeURIComponent(urlReturnUrl));
    }
  }, []);

  // Load session on mount
  useEffect(() => {
    const existing = loadSession();
    if (existing && !existing.completedAt) {
      setSession(existing);
      if (existing.currentCategory && Object.keys(quadEnabledState).length > 0) {
        setCurrentQuads(getEnabledQuadsForCategory(existing.currentCategory, quadEnabledState));
      }
    }
  }, [quadEnabledState]);

  // Auto-save session
  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  // Save client ID when changed
  const saveClientId = (id: string) => {
    setClientId(id);
    localStorage.setItem(CLIENT_ID_KEY, id);
    setIsEditingClientId(false);
  };

  // Toggle quad enabled state
  const toggleQuad = (quadId: string) => {
    const newState = {
      ...quadEnabledState,
      [quadId]: !quadEnabledState[quadId]
    };
    setQuadEnabledState(newState);
    saveQuadEnabledState(newState);
  };

  // Toggle all quads in a category
  const toggleAllInCategory = (categoryId: string, enabled: boolean) => {
    const categoryQuads = getQuadsByCategory(categoryId);
    const newState = { ...quadEnabledState };
    categoryQuads.forEach(q => {
      newState[q.quadId] = enabled;
    });
    setQuadEnabledState(newState);
    saveQuadEnabledState(newState);
  };

  // Toggle category expansion in admin
  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Get counts for admin display
  const getEnabledCount = (categoryId: string) => {
    const categoryQuads = getQuadsByCategory(categoryId);
    return categoryQuads.filter(q => quadEnabledState[q.quadId] !== false).length;
  };

  const getTotalEnabledQuads = () => {
    return Object.values(quadEnabledState).filter(v => v !== false).length;
  };

  const getTotalQuads = () => {
    return Object.keys(quads).length;
  };

  // Helper to calculate metrics from a specific session (for redirect flow)
  const calculateStyleMetricsFromSession = (sess: TasteSession): StyleMetrics | null => {
    if (!sess) return null;
    
    let totalAS = 0, totalVD = 0, totalMP = 0, count = 0;
    const styleCounts: Record<string, number> = {};
    const materialCounts: Record<string, number> = {};

    Object.values(sess.progress).forEach(catProgress => {
      catProgress.selections.forEach(sel => {
        if (sel.selectedIndex >= 0 && sel.selectedIndex <= 3) {
          const codes = getSelectionCodes(sel.quadId, sel.selectedIndex);
          if (codes) {
            const asVal = getCodeValue(codes.AS);
            const vdVal = getCodeValue(codes.VD);
            const mpVal = getCodeValue(codes.MP);
            totalAS += asVal;
            totalVD += vdVal;
            totalMP += mpVal;
            count++;
            styleCounts[codes.AS] = (styleCounts[codes.AS] || 0) + 1;
            materialCounts[codes.MP] = (materialCounts[codes.MP] || 0) + 1;
          }
        }
      });
    });

    if (count === 0) return null;

    const regionPreferences: Record<string, number> = {};
    Object.entries(styleCounts).forEach(([code, cnt]) => {
      const label = AS_LABELS[code] || code;
      regionPreferences[label] = cnt;
    });
    
    const materialPreferences: Record<string, number> = {};
    Object.entries(materialCounts).forEach(([code, cnt]) => {
      const label = MP_LABELS[code] || code;
      materialPreferences[label] = cnt;
    });

    return {
      avgCT: totalAS / count,
      avgML: totalVD / count,
      avgWC: totalMP / count,
      regionPreferences,
      materialPreferences,
      styleLabel: totalAS / count < 4 ? 'Contemporary' : totalAS / count > 6 ? 'Traditional' : 'Transitional'
    };
  };

  const startExploration = () => {
    const newSession = createNewSession(quadEnabledState);
    setSession(newSession);
    setCurrentQuads(getEnabledQuadsForCategory(categoryOrder[0], quadEnabledState));
    setQuadStartTime(Date.now());
    setView('exploration');
  };

  const resumeExploration = () => {
    if (session?.currentCategory) {
      setCurrentQuads(getEnabledQuadsForCategory(session.currentCategory, quadEnabledState));
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
        const completedSession = { ...session, progress: updatedProgress, lastUpdatedAt: Date.now(), completedAt: Date.now() };
        setSession(completedSession);
        
        // If returnUrl exists, redirect back to KYC with profile data
        if (returnUrl) {
          const metrics = calculateStyleMetricsFromSession(completedSession);
          if (metrics) {
            const reportData: ReportData = {
              clientId: clientId || completedSession.sessionId,
              session: completedSession,
              metrics: {
                ...metrics,
                ctScale5: convertToFiveScale(metrics.avgCT),
                mlScale5: convertToFiveScale(metrics.avgML),
                wcScale5: convertToFiveScale(metrics.avgWC)
              },
              exportedAt: new Date().toISOString()
            };
            
            saveProfileToStorage(reportData);
            
            const encoded = btoa(encodeURIComponent(JSON.stringify(reportData)));
            window.location.href = `${returnUrl}#tasteProfile=${encoded}`;
            return;
          }
        }
        
        setView('analysis');
      } else {
        const nextCategory = categoryOrder[nextCatIndex];
        setSession({ ...session, progress: updatedProgress, currentCategory: nextCategory, currentQuadIndex: 0, lastUpdatedAt: Date.now() });
        setCurrentQuads(getEnabledQuadsForCategory(nextCategory, quadEnabledState));
        setView('category-complete');
      }
    } else {
      setSession({ ...session, progress: updatedProgress, currentQuadIndex: nextQuadIndex, lastUpdatedAt: Date.now() });
    }
    setQuadStartTime(Date.now());
  }, [session, currentQuads, quadStartTime, quadEnabledState, returnUrl, clientId]);

  const jumpToCategory = (categoryId: string) => {
    if (!session) return;
    const categoryQuads = getEnabledQuadsForCategory(categoryId, quadEnabledState);
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

  const openAdmin = () => {
    setView('admin');
  };

  const closeAdmin = () => {
    setView('welcome');
  };

  // Calculate style metrics from session
  const calculateStyleMetrics = (): StyleMetrics | null => {
    if (!session) return null;
    
    let totalAS = 0, totalVD = 0, totalMP = 0, count = 0;
    const styleCounts: Record<string, number> = {};
    const materialCounts: Record<string, number> = {};

    Object.values(session.progress).forEach(catProgress => {
      catProgress.selections.forEach(sel => {
        if (sel.selectedIndex >= 0 && sel.selectedIndex <= 3) {
          const codes = getSelectionCodes(sel.quadId, sel.selectedIndex);
          if (codes) {
            const asValue = getCodeValue(codes.style);
            const vdValue = getCodeValue(codes.vd);
            const mpValue = getCodeValue(codes.mp);
            
            totalAS += asValue;
            totalVD += vdValue;
            totalMP += mpValue;
            count++;
            
            const styleName = AS_LABELS[codes.style] || codes.style;
            styleCounts[styleName] = (styleCounts[styleName] || 0) + 1;
            
            const materialName = MP_LABELS[codes.mp] || codes.mp;
            materialCounts[materialName] = (materialCounts[materialName] || 0) + 1;
          }
        }
      });
    });

    if (count === 0) return null;
    
    const avgAS = totalAS / count;
    const avgVD = totalVD / count;
    const avgMP = totalMP / count;

    let styleLabel = '';
    if (avgAS <= 3) styleLabel = avgMP <= 5 ? 'Contemporary Warm' : 'Contemporary Cool';
    else if (avgAS <= 6) styleLabel = 'Transitional';
    else styleLabel = avgMP <= 5 ? 'Traditional Warm' : 'Traditional Classic';
    if (avgVD <= 3) styleLabel += ' Minimal';
    else if (avgVD >= 7) styleLabel += ' Layered';

    return { 
      avgCT: avgAS,
      avgML: avgVD,
      avgWC: avgMP,
      regionPreferences: styleCounts, 
      materialPreferences: materialCounts, 
      styleLabel 
    };
  };

  // Calculate metrics for a specific category
  const calculateCategoryMetrics = (categoryId: string): { avgAS: number, avgVD: number, avgMP: number } | null => {
    if (!session) return null;
    
    const catProgress = session.progress[categoryId];
    if (!catProgress || catProgress.selections.length === 0) return null;
    
    let totalAS = 0, totalVD = 0, totalMP = 0, count = 0;
    
    catProgress.selections.forEach(sel => {
      if (sel.selectedIndex >= 0 && sel.selectedIndex <= 3) {
        const codes = getSelectionCodes(sel.quadId, sel.selectedIndex);
        if (codes) {
          totalAS += getCodeValue(codes.style);
          totalVD += getCodeValue(codes.vd);
          totalMP += getCodeValue(codes.mp);
          count++;
        }
      }
    });
    
    if (count === 0) return null;
    
    return {
      avgAS: totalAS / count,
      avgVD: totalVD / count,
      avgMP: totalMP / count
    };
  };

  const renderMiniDNASlider = (label: string, value: number, leftLabel: string, rightLabel: string) => {
    const fiveScaleValue = convertToFiveScale(value);
    const percentage = ((value - 1) / 8) * 100;
    return (
      <div className="mini-dna-slider">
        <div className="mini-dna-header">
          <span className="mini-dna-label">{label}</span>
          <span className="mini-dna-value">{fiveScaleValue.toFixed(1)}</span>
        </div>
        <div className="mini-dna-track">
          <div className="mini-dna-indicator" style={{ left: `${percentage}%` }} />
        </div>
        <div className="mini-dna-labels"><span>{leftLabel}</span><span>{rightLabel}</span></div>
      </div>
    );
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

  const handleLogoClick = () => {
    if (view === 'admin') {
      setView('welcome');
    } else if (view === 'exploration') {
      window.location.href = 'https://home-5019238456.app-ionos.space';
    } else {
      setView('welcome');
    }
  };

  const renderSidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div 
          className="sidebar-logo" 
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
          title="Return to Welcome"
        >
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
      <div className="sidebar-footer">
        <button className="sidebar-admin-btn" onClick={openAdmin}>
          ⚙ Admin
        </button>
        {isAllComplete() && (
          <button className="sidebar-complete-btn" onClick={() => setView('analysis')}>Complete</button>
        )}
      </div>
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
        <div className="info-item"><span className="info-icon">🖼️</span><span>{getTotalEnabledQuads()} curated design quads</span></div>
        <div className="info-item"><span className="info-icon">📂</span><span>9 categories from architecture to outdoor living</span></div>
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

    const enabledQuadsInNextCat = getEnabledQuadsForCategory(session.currentCategory, quadEnabledState).length;

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
              <span className="quad-count">{enabledQuadsInNextCat} selections</span>
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={continueToNextCategory}>Continue to {category.name}</button>
      </div>
    );
  };

  const renderAdminContent = () => {
    const totalEnabled = getTotalEnabledQuads();
    const totalQuads = getTotalQuads();
    const disabledCount = totalQuads - totalEnabled;

    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin: Quad Management</h1>
          <button className="admin-back-btn" onClick={closeAdmin}>← Back</button>
        </div>

        <div className="admin-summary">
          <div className="admin-stat">
            <span className="admin-stat-label">Total Quads</span>
            <span className="admin-stat-value">{totalQuads}</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-label">Enabled Quads</span>
            <span className="admin-stat-value">{totalEnabled}</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-label">Disabled Quads</span>
            <span className={`admin-stat-value ${disabledCount > 0 ? 'warning' : ''}`}>{disabledCount}</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-label">Total Images</span>
            <span className="admin-stat-value">{totalEnabled * 4}</span>
          </div>
        </div>

        <div className="admin-categories">
          {categoryOrder.map(catId => {
            const cat = CATEGORIES[catId as keyof typeof CATEGORIES];
            const categoryQuads = getQuadsByCategory(catId);
            const enabledCount = getEnabledCount(catId);
            const isExpanded = expandedCategories[catId];

            return (
              <div key={catId} className="admin-category">
                <div className="admin-category-header" onClick={() => toggleCategoryExpand(catId)}>
                  <div>
                    <span className="admin-category-title">{cat.name}</span>
                    <span className="admin-category-count">
                      {' '}— <span className="enabled">{enabledCount}</span> of {categoryQuads.length} quads enabled ({enabledCount * 4} images)
                    </span>
                  </div>
                  <div className="admin-category-toggle">
                    <button 
                      className="admin-toggle-all-btn" 
                      onClick={(e) => { e.stopPropagation(); toggleAllInCategory(catId, true); }}
                    >
                      Enable All
                    </button>
                    <button 
                      className="admin-toggle-all-btn" 
                      onClick={(e) => { e.stopPropagation(); toggleAllInCategory(catId, false); }}
                    >
                      Disable All
                    </button>
                    <span className={`admin-expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="admin-quads-list">
                    {categoryQuads.map(quad => {
                      const isEnabled = quadEnabledState[quad.quadId] !== false;
                      return (
                        <div key={quad.quadId} className={`admin-quad-item ${!isEnabled ? 'disabled' : ''}`}>
                          <div className="admin-quad-images-list">
                            {[0, 1, 2, 3].map(idx => (
                              <div key={idx} className="admin-quad-image-row">
                                <div 
                                  className="admin-thumb-container"
                                  onMouseEnter={(e) => setHoverPreview({
                                    url: getImageUrl(quad.quadId, idx),
                                    x: e.clientX + 20,
                                    y: Math.min(e.clientY - 100, window.innerHeight - 320)
                                  })}
                                  onMouseMove={(e) => setHoverPreview({
                                    url: getImageUrl(quad.quadId, idx),
                                    x: e.clientX + 20,
                                    y: Math.min(e.clientY - 100, window.innerHeight - 320)
                                  })}
                                  onMouseLeave={() => setHoverPreview(null)}
                                >
                                  <img 
                                    src={getImageUrl(quad.quadId, idx)} 
                                    alt={`${quad.quadId}_${idx}`}
                                    className="admin-quad-thumb"
                                  />
                                </div>
                                <span className="admin-quad-filename">{quad.quadId}_{idx}.png</span>
                              </div>
                            ))}
                          </div>
                          <div className="admin-quad-right">
                            <div className="admin-quad-info">
                              <div className="admin-quad-title">{quad.title}</div>
                              <div className="admin-quad-subtitle">{quad.subtitle}</div>
                              <span className="admin-quad-id">{quad.quadId}</span>
                            </div>
                            <label className="toggle-switch">
                              <input 
                                type="checkbox" 
                                checked={isEnabled}
                                onChange={() => toggleQuad(quad.quadId)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
          
          {/* Client ID Section */}
          <div className="client-id-section">
            <div className="client-id-display">
              {isEditingClientId ? (
                <div className="client-id-edit">
                  <input 
                    type="text" 
                    value={tempClientId} 
                    onChange={(e) => setTempClientId(e.target.value)}
                    placeholder="e.g., Thornwood-P"
                    className="client-id-input"
                    autoFocus
                  />
                  <button className="btn-small" onClick={() => saveClientId(tempClientId)}>Save</button>
                  <button className="btn-small btn-cancel" onClick={() => setIsEditingClientId(false)}>Cancel</button>
                </div>
              ) : (
                <div className="client-id-view" onClick={() => { setTempClientId(clientId); setIsEditingClientId(true); }}>
                  <span className="client-id-label">Client ID:</span>
                  <span className="client-id-value">{clientId || 'Click to set'}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Report Actions */}
          <div className="report-actions-section">
            <h3>Export Your Profile</h3>
            
            {isCoupleAssessment(clientId || '') && (
              <div className="partner-status">
                {getPartnerProfile(clientId || '') ? (
                  <span className="partner-complete">✓ Partner profile available - Report will include alignment analysis</span>
                ) : (
                  <span className="partner-pending">ℹ Partner ({getPartnerClientId(clientId || '')}) has not completed Taste Exploration yet</span>
                )}
              </div>
            )}
            
            <div className="report-buttons">
              <button className="btn-report btn-view" onClick={async () => {
                const reportData: ReportData = {
                  clientId: clientId || session.sessionId,
                  session,
                  metrics: {
                    ...metrics,
                    ctScale5: convertToFiveScale(metrics.avgCT),
                    mlScale5: convertToFiveScale(metrics.avgML),
                    wcScale5: convertToFiveScale(metrics.avgWC)
                  }
                };
                saveProfileToStorage(reportData);
                const generator = new TasteReportGenerator(reportData);
                await generator.generate();
                generator.openInNewTab();
              }}>
                <span className="btn-icon">👁️</span>
                <span className="btn-text">View Report</span>
              </button>
              
              <button className="btn-report btn-download" onClick={async () => {
                const reportData: ReportData = {
                  clientId: clientId || session.sessionId,
                  session,
                  metrics: {
                    ...metrics,
                    ctScale5: convertToFiveScale(metrics.avgCT),
                    mlScale5: convertToFiveScale(metrics.avgML),
                    wcScale5: convertToFiveScale(metrics.avgWC)
                  }
                };
                saveProfileToStorage(reportData);
                const generator = new TasteReportGenerator(reportData);
                await generator.generate();
                generator.download(`N4S-Taste-Profile-${clientId || session.sessionId}.pdf`);
              }}>
                <span className="btn-icon">📥</span>
                <span className="btn-text">Download PDF</span>
              </button>
              
              <button className="btn-report btn-email" onClick={async () => {
                const reportData: ReportData = {
                  clientId: clientId || session.sessionId,
                  session,
                  metrics: {
                    ...metrics,
                    ctScale5: convertToFiveScale(metrics.avgCT),
                    mlScale5: convertToFiveScale(metrics.avgML),
                    wcScale5: convertToFiveScale(metrics.avgWC)
                  }
                };
                saveProfileToStorage(reportData);
                const generator = new TasteReportGenerator(reportData);
                await generator.generate();
                const subject = encodeURIComponent(`N4S Design Profile - ${clientId || 'Client'}`);
                const body = encodeURIComponent(`Please find attached my N4S Taste Profile report.\n\nClient ID: ${clientId || session.sessionId}\nGenerated: ${new Date().toLocaleDateString()}`);
                window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                generator.download(`N4S-Taste-Profile-${clientId || session.sessionId}.pdf`);
              }}>
                <span className="btn-icon">✉️</span>
                <span className="btn-text">Email Report</span>
              </button>
            </div>
          </div>
          
          <div className="session-actions">
            <button className="btn-secondary" onClick={() => { 
              localStorage.removeItem(`${SESSION_CONFIG.storageKeyPrefix}current_session`); 
              setSession(null); 
              setView('welcome'); 
            }}>Start New Session</button>
          </div>
          
          <div className="design-dna-section">
            <h3>Design DNA</h3>
            {renderDNASlider('Style Era', metrics.avgCT, 'Contemporary', 'Traditional')}
            {renderDNASlider('Material Complexity', metrics.avgML, 'Minimal', 'Layered')}
            {renderDNASlider('Mood Palette', metrics.avgWC, 'Warm', 'Cool')}
          </div>
          
          <div className="preferences-section">
            <div className="preference-card">
              <h3>Regional Influences</h3>
              <div className="preference-list">
                {topRegions.length > 0 ? topRegions.map(([region, count]) => (
                  <div key={region} className="preference-item">
                    <span className="preference-name">{region}</span>
                    <span className="preference-count">{count}</span>
                  </div>
                )) : (
                  <div className="preference-item empty">No selections recorded</div>
                )}
              </div>
            </div>
            <div className="preference-card">
              <h3>Material Preferences</h3>
              <div className="preference-tags">
                {topMaterials.length > 0 ? topMaterials.map(([material, count]) => (
                  <span key={material} className="preference-tag">{material} ({count})</span>
                )) : (
                  <span className="preference-tag empty">No selections recorded</span>
                )}
              </div>
            </div>
          </div>

          {/* Per-Category Design DNA Cards */}
          <div className="category-dna-section">
            <div className="category-dna-grid">
              {categoryOrder.map(catId => {
                const cat = CATEGORIES[catId as keyof typeof CATEGORIES];
                const catMetrics = calculateCategoryMetrics(catId);
                
                return (
                  <div key={catId} className="category-dna-card">
                    <div className="category-dna-header">
                      <span className="category-dna-name">{cat.name}</span>
                    </div>
                    <div className="category-dna-content">
                      <h4>Design DNA</h4>
                      {catMetrics ? (
                        <>
                          {renderMiniDNASlider('Style Era', catMetrics.avgAS, 'Contemporary', 'Traditional')}
                          {renderMiniDNASlider('Material Complexity', catMetrics.avgVD, 'Minimal', 'Layered')}
                          {renderMiniDNASlider('Mood Palette', catMetrics.avgMP, 'Warm', 'Cool')}
                        </>
                      ) : (
                        <p className="no-selections">No selections</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
            {view === 'admin' && renderAdminContent()}
          </div>
        </main>
      </div>
      {hoverPreview && (
        <div 
          className="admin-thumb-preview"
          style={{ 
            display: 'block',
            left: hoverPreview.x, 
            top: hoverPreview.y 
          }}
        >
          <img src={hoverPreview.url} alt="Preview" />
        </div>
      )}
    </div>
  );
};

export default App;
