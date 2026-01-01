import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TasteSession, TasteQuad, QuadSelection, CategoryProgress, AppView, StyleMetrics, PromptRecord, PromptStatus, GenerationMode, MatrixStats } from './types/tasteTypes';
import { 
  CATEGORIES, SESSION_CONFIG, getImageUrl, getSelectionCodes, getCodeValue, AS_LABELS, MP_LABELS, VD_LABELS,
  ALL_STYLES, ALL_STYLE_CODES, QUAD_STYLES, QUAD_STYLE_CODES,
  SHOWCASE_IMAGE_NUMBERS, IMAGE_VARIATIONS, STYLE_DESCRIPTIONS, CATEGORY_SCENE_DESCRIPTIONS,
  generateShowcaseFilename, generateQuadFilename, getQuadPosition, getStyleNameFromCode,
  generateShowcasePrompt, generateQuadPrompt, QUAD_MATRIX
} from './config/tasteConfig';
import { quads, categoryOrder, getQuadsByCategory, categories } from './data/quadMetadata';
import { TasteReportGenerator, ReportData, saveProfileToStorage, isCoupleAssessment, getPartnerClientId, getPartnerProfile } from './utils/reportGenerator';
import './App.css';

// Local constant for ArchiPrompt storage (defined locally, not imported)
const ARCHIPROMPT_STORAGE_KEY = 'n4s_archiprompt_data';

// Extended AppView to include 'admin' and 'prompt-architect'
type ExtendedAppView = AppView | 'admin' | 'prompt-architect';

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Quad enabled state management
const QUAD_STATE_KEY = 'n4s_quad_enabled_state';
const CLIENT_ID_KEY = 'n4s_client_id';

const loadQuadEnabledState = (): Record<string, boolean> => {
  const stored = localStorage.getItem(QUAD_STATE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Default: all quads enabled
  const defaultState: Record<string, boolean> = {};
  Object.keys(quads).forEach(quadId => {
    defaultState[quadId] = quads[quadId].enabled;
  });
  return defaultState;
};

const saveQuadEnabledState = (state: Record<string, boolean>) => {
  localStorage.setItem(QUAD_STATE_KEY, JSON.stringify(state));
};

// Get enabled quads for a category using custom state
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
  const [view, setView] = useState<ExtendedAppView>('welcome');
  const [previousView, setPreviousView] = useState<ExtendedAppView>('welcome');
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
  
  // ArchiPrompt state
  const [apMode, setApMode] = useState<GenerationMode>('quad');
  const [apSelectedStyle, setApSelectedStyle] = useState<string>('Modern Classic');
  const [apSelectedImageNum, setApSelectedImageNum] = useState<string>('01');
  const [apSelectedCategory, setApSelectedCategory] = useState<string>('EA');
  const [apSelectedQuadNum, setApSelectedQuadNum] = useState<string>('001');
  const [apSelectedPosition, setApSelectedPosition] = useState<number>(0);
  const [apPromptData, setApPromptData] = useState<Record<string, PromptRecord>>({});
  const [apCurrentPrompt, setApCurrentPrompt] = useState<PromptRecord | null>(null);
  const [apActiveTab, setApActiveTab] = useState<'generate' | 'checklist'>('generate');
  const [apUploadModalOpen, setApUploadModalOpen] = useState(false);
  const [apUploadFilename, setApUploadFilename] = useState('');
  const [apUploadUrl, setApUploadUrl] = useState('');
  const [apIsUploading, setApIsUploading] = useState(false);
  const [apToast, setApToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Load ArchiPrompt data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ARCHIPROMPT_STORAGE_KEY);
    if (stored) {
      try {
        setApPromptData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse ArchiPrompt data:', e);
      }
    }
  }, []);

  // Save ArchiPrompt data to localStorage
  useEffect(() => {
    if (Object.keys(apPromptData).length > 0) {
      localStorage.setItem(ARCHIPROMPT_STORAGE_KEY, JSON.stringify(apPromptData));
    }
  }, [apPromptData]);

  // Auto-hide toast
  useEffect(() => {
    if (apToast) {
      const timer = setTimeout(() => setApToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [apToast]);

  // Computed filename code
  const apFilenameCode = useMemo(() => {
    if (apMode === 'showcase-exterior' || apMode === 'showcase-interior') {
      const type = apMode === 'showcase-exterior' ? 'exterior' : 'interior';
      return generateShowcaseFilename(type, ALL_STYLE_CODES[apSelectedStyle], apSelectedImageNum);
    } else {
      const pos = getQuadPosition(apSelectedQuadNum, apSelectedPosition);
      if (!pos) return '';
      return generateQuadFilename(apSelectedCategory, apSelectedQuadNum, apSelectedPosition, pos.style, pos.vd, pos.mp);
    }
  }, [apMode, apSelectedStyle, apSelectedImageNum, apSelectedCategory, apSelectedQuadNum, apSelectedPosition]);

  // Computed stats
  const apStats = useMemo((): MatrixStats => {
    const records = Object.values(apPromptData);
    return {
      total: 198, // 54 showcase + 144 quad
      pending: records.filter(r => r.status === 'pending').length,
      inMidjourney: records.filter(r => r.status === 'in_midjourney').length,
      selected: records.filter(r => r.status === 'selected').length,
      uploaded: records.filter(r => r.status === 'uploaded').length,
    };
  }, [apPromptData]);

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

  // ============================================
  // ARCHIPROMPT FUNCTIONS
  // ============================================

  const STATUS_CYCLE: PromptStatus[] = ['not_generated', 'pending', 'in_midjourney', 'selected', 'uploaded'];

  const apShowToast = (message: string, type: 'success' | 'error' = 'success') => {
    setApToast({ message, type });
  };

  const apCopyToClipboard = (text: string, label: string = 'Text') => {
    navigator.clipboard.writeText(text);
    apShowToast(`${label} copied to clipboard`);
  };

  const apGeneratePrompt = () => {
    let promptText = '';
    let record: PromptRecord;
    const now = Date.now();

    if (apMode === 'showcase-exterior' || apMode === 'showcase-interior') {
      const type = apMode === 'showcase-exterior' ? 'exterior' : 'interior';
      promptText = generateShowcasePrompt(type, apSelectedStyle, apSelectedImageNum);
      record = {
        filenameCode: apFilenameCode,
        mode: apMode,
        style: ALL_STYLE_CODES[apSelectedStyle],
        imageNum: apSelectedImageNum,
        promptText,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
    } else {
      const pos = getQuadPosition(apSelectedQuadNum, apSelectedPosition);
      if (!pos) return;
      const styleName = getStyleNameFromCode(pos.style);
      promptText = generateQuadPrompt(apSelectedCategory, styleName, pos.vd, pos.mp);
      record = {
        filenameCode: apFilenameCode,
        mode: 'quad',
        category: apSelectedCategory,
        quadNum: apSelectedQuadNum,
        position: apSelectedPosition,
        style: pos.style,
        visualDensity: pos.vd,
        moodPalette: pos.mp,
        promptText,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
    }

    setApPromptData(prev => ({ ...prev, [apFilenameCode]: record }));
    setApCurrentPrompt(record);
    apShowToast(`Prompt generated: ${apFilenameCode}`);
  };

  const apBatchGenerate = () => {
    const now = Date.now();
    const newRecords: Record<string, PromptRecord> = {};

    if (apMode === 'showcase-exterior' || apMode === 'showcase-interior') {
      const type = apMode === 'showcase-exterior' ? 'exterior' : 'interior';
      ALL_STYLES.forEach(style => {
        SHOWCASE_IMAGE_NUMBERS.forEach(imgNum => {
          const filename = generateShowcaseFilename(type, ALL_STYLE_CODES[style], imgNum);
          const promptText = generateShowcasePrompt(type, style, imgNum);
          newRecords[filename] = {
            filenameCode: filename,
            mode: apMode,
            style: ALL_STYLE_CODES[style],
            imageNum: imgNum,
            promptText,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          };
        });
      });
      apShowToast(`Generated 27 ${type} prompts`);
    } else {
      // Generate all 16 for selected category
      ['001', '002', '003', '004'].forEach(quadNum => {
        [0, 1, 2, 3].forEach(position => {
          const pos = getQuadPosition(quadNum, position);
          if (!pos) return;
          const filename = generateQuadFilename(apSelectedCategory, quadNum, position, pos.style, pos.vd, pos.mp);
          const styleName = getStyleNameFromCode(pos.style);
          const promptText = generateQuadPrompt(apSelectedCategory, styleName, pos.vd, pos.mp);
          newRecords[filename] = {
            filenameCode: filename,
            mode: 'quad',
            category: apSelectedCategory,
            quadNum,
            position,
            style: pos.style,
            visualDensity: pos.vd,
            moodPalette: pos.mp,
            promptText,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          };
        });
      });
      apShowToast(`Generated 16 prompts for ${apSelectedCategory}`);
    }

    setApPromptData(prev => ({ ...prev, ...newRecords }));
  };

  const apCycleStatus = (filename: string) => {
    const existing = apPromptData[filename];
    const currentStatus = existing?.status || 'not_generated';
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

    if (existing) {
      setApPromptData(prev => ({
        ...prev,
        [filename]: { ...existing, status: nextStatus, updatedAt: Date.now() }
      }));
    } else {
      // Create a minimal record if it doesn't exist
      setApPromptData(prev => ({
        ...prev,
        [filename]: {
          filenameCode: filename,
          mode: 'quad',
          style: '',
          promptText: '',
          status: nextStatus,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      }));
    }
    apShowToast(`${filename} → ${nextStatus.replace(/_/g, ' ')}`);
  };

  const apOpenUploadModal = (filename: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setApUploadFilename(filename);
      setApUploadUrl('');
      setApUploadModalOpen(true);
    } else {
      apCycleStatus(filename);
    }
  };

  const apHandleUpload = async () => {
    if (!apUploadUrl || !apUploadFilename) return;
    setApIsUploading(true);

    // For now, just mark as uploaded and store the URL
    // In production, this would upload to Cloudinary
    setApPromptData(prev => ({
      ...prev,
      [apUploadFilename]: {
        ...(prev[apUploadFilename] || {
          filenameCode: apUploadFilename,
          mode: 'quad',
          style: '',
          promptText: '',
          createdAt: Date.now(),
        }),
        status: 'uploaded',
        cloudinaryUrl: apUploadUrl,
        updatedAt: Date.now(),
      }
    }));

    setApIsUploading(false);
    setApUploadModalOpen(false);
    apShowToast(`Uploaded: ${apUploadFilename}`);
  };

  const apGetStatusForFile = (filename: string): PromptStatus => {
    return apPromptData[filename]?.status || 'not_generated';
  };

  const apExportCsv = () => {
    const records = Object.values(apPromptData);
    if (records.length === 0) {
      apShowToast('No data to export', 'error');
      return;
    }
    const headers = ['filename', 'mode', 'category', 'style', 'status', 'promptText', 'cloudinaryUrl'];
    const rows = records.map(r => [
      r.filenameCode, r.mode, r.category || '', r.style, r.status, `"${r.promptText.replace(/"/g, '""')}"`, r.cloudinaryUrl || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archiprompt-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    apShowToast('CSV exported');
  };

  const apExportJson = () => {
    const records = Object.values(apPromptData);
    if (records.length === 0) {
      apShowToast('No data to export', 'error');
      return;
    }
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archiprompt-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    apShowToast('JSON exported');
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
          // Build the profile data for export
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
            
            // Save locally as well
            saveProfileToStorage(reportData);
            
            // Encode and redirect
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
    setPreviousView(view);
    setView('admin');
  };

  const closeAdmin = () => {
    // Fallback to welcome if previousView is also admin or undefined
    const targetView = (previousView && previousView !== 'admin' && previousView !== 'prompt-architect') 
      ? previousView 
      : 'welcome';
    setView(targetView);
  };

  // Fixed calculateStyleMetrics - derives values from actual selection codes
  const calculateStyleMetrics = (): StyleMetrics | null => {
    if (!session) return null;
    
    let totalAS = 0, totalVD = 0, totalMP = 0, count = 0;
    const styleCounts: Record<string, number> = {};
    const materialCounts: Record<string, number> = {};

    Object.values(session.progress).forEach(catProgress => {
      catProgress.selections.forEach(sel => {
        // Only count actual image selections (0-3), not "all work" (-1) or "none appeal" (-2)
        if (sel.selectedIndex >= 0 && sel.selectedIndex <= 3) {
          const codes = getSelectionCodes(sel.quadId, sel.selectedIndex);
          if (codes) {
            // Extract numeric values from codes
            const asValue = getCodeValue(codes.style); // AS1→1, AS3→3, AS6→6, AS9→9
            const vdValue = getCodeValue(codes.vd);    // VD1→1, VD3→3, VD6→6, VD9→9
            const mpValue = getCodeValue(codes.mp);    // MP1→1, MP3→3, MP6→6, MP9→9
            
            totalAS += asValue;
            totalVD += vdValue;
            totalMP += mpValue;
            count++;
            
            // Count style preferences (Regional Influences)
            const styleName = AS_LABELS[codes.style] || codes.style;
            styleCounts[styleName] = (styleCounts[styleName] || 0) + 1;
            
            // Count material preferences
            const materialName = MP_LABELS[codes.mp] || codes.mp;
            materialCounts[materialName] = (materialCounts[materialName] || 0) + 1;
          }
        }
      });
    });

    if (count === 0) return null;
    
    const avgAS = totalAS / count;  // Style Era: 1=Contemporary, 9=Traditional
    const avgVD = totalVD / count;  // Material Complexity: 1=Minimal, 9=Layered
    const avgMP = totalMP / count;  // Mood Palette: 1=Warm, 9=Cool

    // Determine overall style label
    let styleLabel = '';
    if (avgAS <= 3) styleLabel = avgMP <= 5 ? 'Contemporary Warm' : 'Contemporary Cool';
    else if (avgAS <= 6) styleLabel = 'Transitional';
    else styleLabel = avgMP <= 5 ? 'Traditional Warm' : 'Traditional Classic';
    if (avgVD <= 3) styleLabel += ' Minimal';
    else if (avgVD >= 7) styleLabel += ' Layered';

    return { 
      avgCT: avgAS,  // CT = Contemporary/Traditional = AS
      avgML: avgVD,  // ML = Minimal/Layered = VD
      avgWC: avgMP,  // WC = Warm/Cool = MP
      regionPreferences: styleCounts, 
      materialPreferences: materialCounts, 
      styleLabel 
    };
  };

  // Calculate metrics for a specific category only
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

  // Handle N4S logo click - different behavior based on current view
  const handleLogoClick = () => {
    if (view === 'admin' || view === 'prompt-architect') {
      // From Admin or Prompt Architect, go back to welcome
      setView('welcome');
    } else if (view === 'exploration') {
      // From Taste Exploration (4 images), go to KYC Design Preferences page
      window.location.href = 'https://home-5019238456.app-ionos.space';
    } else {
      // Default: go to welcome
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

        <div className="admin-footer">
          <button 
            className="pa-launch-btn"
            onClick={() => { setPreviousView('admin'); setView('prompt-architect'); }}
          >
            ✨ Prompt Architect
          </button>
        </div>
      </div>
    );
  };

  // ============================================
  // ARCHIPROMPT UI RENDERING
  // ============================================

  const AP_CATEGORY_OPTIONS = Object.values(categories).map(c => ({ code: c.code, label: c.name }));
  const QUAD_NUMS = ['001', '002', '003', '004'];

  const STATUS_COLORS: Record<PromptStatus, string> = {
    'not_generated': 'ap-status-not-generated',
    'pending': 'ap-status-pending',
    'in_midjourney': 'ap-status-midjourney',
    'selected': 'ap-status-selected',
    'uploaded': 'ap-status-uploaded',
  };

  const renderArchiPromptContent = () => (
    <div className="archiprompt-container">
      {/* Toast Notification */}
      {apToast && (
        <div className={`ap-toast ${apToast.type}`}>
          {apToast.message}
        </div>
      )}

      {/* Upload Modal */}
      {apUploadModalOpen && (
        <div className="ap-modal-overlay" onClick={() => setApUploadModalOpen(false)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h3>Upload Image</h3>
              <button className="ap-modal-close" onClick={() => setApUploadModalOpen(false)}>×</button>
            </div>
            <div className="ap-modal-body">
              <p className="ap-modal-filename">{apUploadFilename}</p>
              <input
                type="text"
                className="ap-input"
                placeholder="Paste Midjourney image URL..."
                value={apUploadUrl}
                onChange={e => setApUploadUrl(e.target.value)}
                autoFocus
              />
            </div>
            <div className="ap-modal-footer">
              <button className="ap-btn-secondary" onClick={() => setApUploadModalOpen(false)}>Cancel</button>
              <button 
                className="ap-btn-primary" 
                onClick={apHandleUpload}
                disabled={!apUploadUrl || apIsUploading}
              >
                {apIsUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="ap-header">
        <div className="ap-header-left">
          <div className="ap-logo">
            <span className="ap-logo-icon">📐</span>
            <div>
              <h1>ARCHI<span className="ap-logo-light">PROMPT</span></h1>
              <p className="ap-logo-subtitle">N4S Image Generator</p>
            </div>
          </div>
        </div>
        <div className="ap-header-stats">
          <span className="ap-stat uploaded">✓ {apStats.uploaded}</span>
          <span className="ap-stat pending">⏳ {apStats.pending}</span>
          <span className="ap-stat total">{apStats.uploaded + apStats.pending + apStats.inMidjourney + apStats.selected} / {apStats.total}</span>
        </div>
        <div className="ap-header-actions">
          <button className="ap-btn-small" onClick={apExportCsv}>📊 CSV</button>
          <button className="ap-btn-small" onClick={apExportJson}>📦 JSON</button>
          <button className="ap-btn-back" onClick={() => setView(previousView)}>← Back</button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="ap-tabs">
        <button 
          className={`ap-tab ${apActiveTab === 'generate' ? 'active' : ''}`}
          onClick={() => setApActiveTab('generate')}
        >
          Generate Prompts
        </button>
        <button 
          className={`ap-tab ${apActiveTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setApActiveTab('checklist')}
        >
          Progress Checklist
        </button>
      </div>

      {/* Generate Tab */}
      {apActiveTab === 'generate' && (
        <div className="ap-generate-layout">
          {/* Controls Panel */}
          <div className="ap-controls-panel">
            <div className="ap-section">
              <label className="ap-label">Generation Mode</label>
              <div className="ap-mode-grid">
                {[
                  { mode: 'showcase-exterior' as GenerationMode, label: 'AS Exterior', desc: '27 images', icon: '🏛️' },
                  { mode: 'showcase-interior' as GenerationMode, label: 'AS Interior', desc: '27 images', icon: '🏠' },
                  { mode: 'quad' as GenerationMode, label: 'Taste Quads', desc: '144 images', icon: '⊞' },
                ].map(({ mode, label, desc, icon }) => (
                  <button
                    key={mode}
                    className={`ap-mode-btn ${apMode === mode ? 'active' : ''}`}
                    onClick={() => setApMode(mode)}
                  >
                    <span className="ap-mode-icon">{icon}</span>
                    <span className="ap-mode-label">{label}</span>
                    <span className="ap-mode-desc">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filename Display */}
            <div className="ap-filename-display">
              <span className="ap-filename-label">Filename Code</span>
              <div className="ap-filename-value">
                <code>{apFilenameCode || '---'}</code>
                <button 
                  className="ap-copy-btn"
                  onClick={() => apFilenameCode && apCopyToClipboard(apFilenameCode, 'Filename')}
                  disabled={!apFilenameCode}
                >
                  📋
                </button>
              </div>
            </div>

            {/* Showcase Mode Controls */}
            {(apMode === 'showcase-exterior' || apMode === 'showcase-interior') && (
              <>
                <div className="ap-section">
                  <label className="ap-label">Architectural Style</label>
                  <div className="ap-style-list">
                    {ALL_STYLES.map(style => (
                      <button
                        key={style}
                        className={`ap-style-btn ${apSelectedStyle === style ? 'active' : ''}`}
                        onClick={() => setApSelectedStyle(style)}
                      >
                        <span>{style}</span>
                        <span className="ap-style-code">{ALL_STYLE_CODES[style]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ap-section">
                  <label className="ap-label">Image Variation</label>
                  <div className="ap-image-num-grid">
                    {SHOWCASE_IMAGE_NUMBERS.map(num => (
                      <button
                        key={num}
                        className={`ap-img-num-btn ${apSelectedImageNum === num ? 'active' : ''}`}
                        onClick={() => setApSelectedImageNum(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="ap-hint">{IMAGE_VARIATIONS[apSelectedImageNum]}</p>
                </div>
              </>
            )}

            {/* Quad Mode Controls */}
            {apMode === 'quad' && (
              <>
                <div className="ap-section">
                  <label className="ap-label">Category</label>
                  <div className="ap-category-grid">
                    {AP_CATEGORY_OPTIONS.map(cat => (
                      <button
                        key={cat.code}
                        className={`ap-cat-btn ${apSelectedCategory === cat.code ? 'active' : ''}`}
                        onClick={() => setApSelectedCategory(cat.code)}
                      >
                        <span className="ap-cat-code">{cat.code}</span>
                        <span className="ap-cat-label">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ap-section">
                  <label className="ap-label">Quad Number</label>
                  <div className="ap-quad-num-grid">
                    {QUAD_NUMS.map(num => (
                      <button
                        key={num}
                        className={`ap-quad-num-btn ${apSelectedQuadNum === num ? 'active' : ''}`}
                        onClick={() => setApSelectedQuadNum(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ap-section">
                  <label className="ap-label">Position (0-3)</label>
                  <div className="ap-position-grid">
                    {[0, 1, 2, 3].map(pos => {
                      const posData = getQuadPosition(apSelectedQuadNum, pos);
                      return (
                        <button
                          key={pos}
                          className={`ap-position-btn ${apSelectedPosition === pos ? 'active' : ''}`}
                          onClick={() => setApSelectedPosition(pos)}
                        >
                          <span className="ap-pos-num">{pos}</span>
                          {posData && (
                            <span className="ap-pos-codes">
                              {posData.style} / {posData.vd} / {posData.mp}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Generate Buttons */}
            <div className="ap-generate-actions">
              <button className="ap-btn-generate" onClick={apGeneratePrompt}>
                ✨ Generate Prompt
              </button>
              <button className="ap-btn-batch" onClick={apBatchGenerate}>
                ⊞ {apMode === 'quad' ? `Generate All 16 for ${apSelectedCategory}` : `Generate All 27 ${apMode.replace('showcase-', '')}`}
              </button>
            </div>

            <p className="ap-params-note">
              All prompts include: <code>--ar 4:5 --style raw --v 7</code>
            </p>
          </div>

          {/* Results Panel */}
          <div className="ap-results-panel">
            <h2>Generated Prompt</h2>
            {apCurrentPrompt ? (
              <div className="ap-prompt-card">
                <div className="ap-prompt-badges">
                  <span className="ap-badge primary">{apCurrentPrompt.filenameCode}</span>
                  <span className="ap-badge">{apCurrentPrompt.mode}</span>
                  {apCurrentPrompt.category && <span className="ap-badge">{apCurrentPrompt.category}</span>}
                </div>
                <div className="ap-prompt-text">
                  {apCurrentPrompt.promptText}
                </div>
                <div className="ap-prompt-actions">
                  <button 
                    className="ap-btn-copy"
                    onClick={() => apCopyToClipboard(apCurrentPrompt.filenameCode, 'Filename')}
                  >
                    📋 Code
                  </button>
                  <button 
                    className="ap-btn-copy primary"
                    onClick={() => apCopyToClipboard(apCurrentPrompt.promptText, 'Prompt')}
                  >
                    📋 Prompt
                  </button>
                </div>
              </div>
            ) : (
              <div className="ap-empty-state">
                <span className="ap-empty-icon">✨</span>
                <h3>Ready to Create</h3>
                <p>Configure your settings and click Generate.</p>
              </div>
            )}

            {/* Recent History */}
            {Object.keys(apPromptData).length > 0 && (
              <div className="ap-history">
                <h3>Recent Generations</h3>
                <div className="ap-history-list">
                  {Object.values(apPromptData)
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, 10)
                    .map(record => (
                      <div 
                        key={record.filenameCode}
                        className="ap-history-item"
                        onClick={() => apCopyToClipboard(record.promptText, 'Prompt')}
                      >
                        <span className="ap-history-filename">{record.filenameCode}</span>
                        <span className={`ap-history-status ${STATUS_COLORS[record.status]}`}>
                          {record.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checklist Tab */}
      {apActiveTab === 'checklist' && (
        <div className="ap-checklist">
          <div className="ap-checklist-instructions">
            <strong>Click</strong> any cell to cycle status. <strong>Ctrl+Click</strong> to upload from URL.
          </div>

          {/* Stats Cards */}
          <div className="ap-stats-grid">
            <div className="ap-stat-card total"><span className="ap-stat-num">{apStats.total}</span><span className="ap-stat-label">Total</span></div>
            <div className="ap-stat-card pending"><span className="ap-stat-num">{apStats.pending}</span><span className="ap-stat-label">Pending</span></div>
            <div className="ap-stat-card midjourney"><span className="ap-stat-num">{apStats.inMidjourney}</span><span className="ap-stat-label">In MJ</span></div>
            <div className="ap-stat-card selected"><span className="ap-stat-num">{apStats.selected}</span><span className="ap-stat-label">Selected</span></div>
            <div className="ap-stat-card uploaded"><span className="ap-stat-num">{apStats.uploaded}</span><span className="ap-stat-label">Uploaded</span></div>
          </div>

          {/* Showcase Exterior */}
          <div className="ap-matrix-section">
            <h3>🏛️ AS Exterior Showcase (27 images)</h3>
            <div className="ap-matrix-table">
              <div className="ap-matrix-header">
                <div className="ap-matrix-style-col">Style</div>
                <div className="ap-matrix-img-col">01</div>
                <div className="ap-matrix-img-col">02</div>
                <div className="ap-matrix-img-col">03</div>
              </div>
              {ALL_STYLES.map(style => (
                <div key={style} className="ap-matrix-row">
                  <div className="ap-matrix-style-col">
                    <span className="ap-matrix-style-name">{style}</span>
                    <span className="ap-matrix-style-code">{ALL_STYLE_CODES[style]}</span>
                  </div>
                  {SHOWCASE_IMAGE_NUMBERS.map(imgNum => {
                    const filename = generateShowcaseFilename('exterior', ALL_STYLE_CODES[style], imgNum);
                    const status = apGetStatusForFile(filename);
                    return (
                      <div 
                        key={imgNum}
                        className={`ap-matrix-cell ${STATUS_COLORS[status]}`}
                        onClick={(e) => apOpenUploadModal(filename, e)}
                        title={filename}
                      >
                        {status === 'uploaded' ? '✓' : status === 'not_generated' ? '○' : '◐'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Showcase Interior */}
          <div className="ap-matrix-section">
            <h3>🏠 AS Interior Showcase (27 images)</h3>
            <div className="ap-matrix-table">
              <div className="ap-matrix-header">
                <div className="ap-matrix-style-col">Style</div>
                <div className="ap-matrix-img-col">01</div>
                <div className="ap-matrix-img-col">02</div>
                <div className="ap-matrix-img-col">03</div>
              </div>
              {ALL_STYLES.map(style => (
                <div key={style} className="ap-matrix-row">
                  <div className="ap-matrix-style-col">
                    <span className="ap-matrix-style-name">{style}</span>
                    <span className="ap-matrix-style-code">{ALL_STYLE_CODES[style]}</span>
                  </div>
                  {SHOWCASE_IMAGE_NUMBERS.map(imgNum => {
                    const filename = generateShowcaseFilename('interior', ALL_STYLE_CODES[style], imgNum);
                    const status = apGetStatusForFile(filename);
                    return (
                      <div 
                        key={imgNum}
                        className={`ap-matrix-cell ${STATUS_COLORS[status]}`}
                        onClick={(e) => apOpenUploadModal(filename, e)}
                        title={filename}
                      >
                        {status === 'uploaded' ? '✓' : status === 'not_generated' ? '○' : '◐'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Quad Categories */}
          {AP_CATEGORY_OPTIONS.map(cat => (
            <div key={cat.code} className="ap-matrix-section">
              <h3>⊞ {cat.label} ({cat.code}) - 16 images</h3>
              <div className="ap-matrix-table">
                <div className="ap-matrix-header">
                  <div className="ap-matrix-quad-col">Quad</div>
                  <div className="ap-matrix-img-col">Pos 0</div>
                  <div className="ap-matrix-img-col">Pos 1</div>
                  <div className="ap-matrix-img-col">Pos 2</div>
                  <div className="ap-matrix-img-col">Pos 3</div>
                </div>
                {QUAD_NUMS.map(quadNum => (
                  <div key={quadNum} className="ap-matrix-row">
                    <div className="ap-matrix-quad-col">{quadNum}</div>
                    {[0, 1, 2, 3].map(pos => {
                      const posData = getQuadPosition(quadNum, pos);
                      if (!posData) return <div key={pos} className="ap-matrix-cell">-</div>;
                      const filename = generateQuadFilename(cat.code, quadNum, pos, posData.style, posData.vd, posData.mp);
                      const status = apGetStatusForFile(filename);
                      return (
                        <div 
                          key={pos}
                          className={`ap-matrix-cell ${STATUS_COLORS[status]}`}
                          onClick={(e) => apOpenUploadModal(filename, e)}
                          title={filename}
                        >
                          {status === 'uploaded' ? '✓' : status === 'not_generated' ? '○' : '◐'}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
            
            {/* Partner status indicator for couples */}
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
                // Save profile for partner detection
                saveProfileToStorage(reportData);
                // Generator will auto-detect partner from localStorage
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
                // Save profile for partner detection
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
                // Save profile for partner detection
                saveProfileToStorage(reportData);
                const generator = new TasteReportGenerator(reportData);
                await generator.generate();
                const base64 = generator.getBase64();
                // Open mailto with subject line - user will need to attach PDF manually
                const subject = encodeURIComponent(`N4S Design Profile - ${clientId || 'Client'}`);
                const body = encodeURIComponent(`Please find attached my N4S Taste Profile report.\n\nClient ID: ${clientId || session.sessionId}\nGenerated: ${new Date().toLocaleDateString()}`);
                window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                // Also trigger download so user has the file to attach
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
            {view === 'prompt-architect' && renderArchiPromptContent()}
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
