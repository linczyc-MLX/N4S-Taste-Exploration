import React, { createContext, useContext, useState, useCallback } from 'react';
import { calculateProfile } from '../utils/profileCalculator';
import { placeholderImages, generateBoards } from '../data/placeholderImages';

const TasteContext = createContext();

export const useTaste = () => {
  const context = useContext(TasteContext);
  if (!context) {
    throw new Error('useTaste must be used within TasteProvider');
  }
  return context;
};

export const TasteProvider = ({ children }) => {
  // Session metadata
  const [sessionMode, setSessionMode] = useState(null); // 'together' | 'principal' | 'secondary'
  const [participantName, setParticipantName] = useState('');
  const [startTime, setStartTime] = useState(null);
  
  // Current phase: 'welcome' | 'phase1' | 'phase2' | 'phase3' | 'complete'
  const [currentPhase, setCurrentPhase] = useState('welcome');
  
  // Phase 1: Swipe results
  const [phase1Images, setPhase1Images] = useState([]);
  const [phase1Index, setPhase1Index] = useState(0);
  const [phase1Results, setPhase1Results] = useState({
    love: [],
    ok: [],
    notForMe: []
  });
  
  // Phase 2: Board selection results
  const [phase2Boards, setPhase2Boards] = useState([]);
  const [phase2CurrentBoard, setPhase2CurrentBoard] = useState(0);
  const [phase2Selections, setPhase2Selections] = useState({});
  
  // Phase 3: Binary choice results
  const [phase3Pairs, setPhase3Pairs] = useState([]);
  const [phase3Index, setPhase3Index] = useState(0);
  const [phase3Results, setPhase3Results] = useState([]);
  
  // Derived profile
  const [derivedProfile, setDerivedProfile] = useState(null);
  
  // Initialize Phase 1
  const initializePhase1 = useCallback(() => {
    // Images are already in client journey order (exterior architecture first, etc.)
    // Select images maintaining category order, but with variety within each category
    const selected = placeholderImages.slice(0, 54); // First 54 images in defined order
    setPhase1Images(selected);
    setPhase1Index(0);
    setPhase1Results({ love: [], ok: [], notForMe: [] });
    setStartTime(new Date());
    setCurrentPhase('phase1');
  }, []);
  
  // Record Phase 1 choice
  const recordPhase1Choice = useCallback((choice) => {
    const currentImage = phase1Images[phase1Index];
    
    setPhase1Results(prev => ({
      ...prev,
      [choice]: [...prev[choice], currentImage]
    }));
    
    // Move to next image or complete phase
    if (phase1Index < phase1Images.length - 1) {
      setPhase1Index(prev => prev + 1);
    } else {
      // Phase 1 complete - generate boards for Phase 2
      completePhase1();
    }
  }, [phase1Index, phase1Images]);
  
  // Complete Phase 1 and set up Phase 2
  const completePhase1 = useCallback(() => {
    // Generate curated boards based on Phase 1 results
    const boards = generateBoards(phase1Results);
    setPhase2Boards(boards);
    setPhase2CurrentBoard(0);
    setPhase2Selections({});
    setCurrentPhase('phase2');
  }, [phase1Results]);
  
  // Record Phase 2 selection
  const togglePhase2Selection = useCallback((boardId, imageId) => {
    setPhase2Selections(prev => {
      const boardSelections = prev[boardId] || [];
      
      if (boardSelections.includes(imageId)) {
        // Deselect
        return {
          ...prev,
          [boardId]: boardSelections.filter(id => id !== imageId)
        };
      } else if (boardSelections.length < 3) {
        // Select (max 3)
        return {
          ...prev,
          [boardId]: [...boardSelections, imageId]
        };
      }
      return prev;
    });
  }, []);
  
  // Move to next board or Phase 3
  const nextBoard = useCallback(() => {
    if (phase2CurrentBoard < phase2Boards.length - 1) {
      setPhase2CurrentBoard(prev => prev + 1);
    } else {
      // Phase 2 complete - set up Phase 3 if needed
      completePhase2();
    }
  }, [phase2CurrentBoard, phase2Boards]);
  
  // Complete Phase 2 and set up Phase 3
  const completePhase2 = useCallback(() => {
    // Generate binary pairs to resolve contradictions
    // For now, create 6 pairs from loved images
    const lovedImages = phase1Results.love;
    const pairs = [];
    
    if (lovedImages.length >= 2) {
      // Create pairs from images with divergent styles
      for (let i = 0; i < Math.min(6, Math.floor(lovedImages.length / 2)); i++) {
        const idx1 = i * 2;
        const idx2 = i * 2 + 1;
        if (lovedImages[idx1] && lovedImages[idx2]) {
          pairs.push([lovedImages[idx1], lovedImages[idx2]]);
        }
      }
    }
    
    if (pairs.length > 0) {
      setPhase3Pairs(pairs);
      setPhase3Index(0);
      setPhase3Results([]);
      setCurrentPhase('phase3');
    } else {
      // Skip Phase 3 if not enough data
      completeExploration();
    }
  }, [phase1Results]);
  
  // Record Phase 3 choice
  const recordPhase3Choice = useCallback((selectedImage) => {
    const currentPair = phase3Pairs[phase3Index];
    
    setPhase3Results(prev => [...prev, {
      pair: currentPair.map(img => img.id),
      selected: selectedImage.id
    }]);
    
    if (phase3Index < phase3Pairs.length - 1) {
      setPhase3Index(prev => prev + 1);
    } else {
      completeExploration();
    }
  }, [phase3Index, phase3Pairs]);
  
  // Complete exploration and calculate profile
  const completeExploration = useCallback(() => {
    const profile = calculateProfile({
      phase1Results,
      phase2Selections,
      phase3Results,
      phase2Boards
    });
    
    setDerivedProfile({
      ...profile,
      sessionMetadata: {
        completedAt: new Date().toISOString(),
        mode: sessionMode,
        participant: participantName,
        durationMinutes: Math.round((new Date() - startTime) / 60000),
        device: navigator.userAgent.includes('iPad') ? 'iPad' : 
                navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
      }
    });
    
    setCurrentPhase('complete');
  }, [phase1Results, phase2Selections, phase3Results, phase2Boards, sessionMode, participantName, startTime]);
  
  // Start session
  const startSession = useCallback((mode, name = '') => {
    setSessionMode(mode);
    setParticipantName(name);
    initializePhase1();
  }, [initializePhase1]);
  
  // Reset everything
  const resetExploration = useCallback(() => {
    setSessionMode(null);
    setParticipantName('');
    setStartTime(null);
    setCurrentPhase('welcome');
    setPhase1Images([]);
    setPhase1Index(0);
    setPhase1Results({ love: [], ok: [], notForMe: [] });
    setPhase2Boards([]);
    setPhase2CurrentBoard(0);
    setPhase2Selections({});
    setPhase3Pairs([]);
    setPhase3Index(0);
    setPhase3Results([]);
    setDerivedProfile(null);
  }, []);
  
  const value = {
    // State
    currentPhase,
    sessionMode,
    participantName,
    
    // Phase 1
    phase1Images,
    phase1Index,
    phase1Results,
    currentImage: phase1Images[phase1Index],
    phase1Progress: phase1Images.length > 0 
      ? Math.round((phase1Index / phase1Images.length) * 100) 
      : 0,
    
    // Phase 2
    phase2Boards,
    phase2CurrentBoard,
    phase2Selections,
    currentBoard: phase2Boards[phase2CurrentBoard],
    
    // Phase 3
    phase3Pairs,
    phase3Index,
    phase3Results,
    currentPair: phase3Pairs[phase3Index],
    
    // Profile
    derivedProfile,
    
    // Actions
    startSession,
    recordPhase1Choice,
    togglePhase2Selection,
    nextBoard,
    recordPhase3Choice,
    resetExploration,
    completePhase1,
    completePhase2
  };
  
  return (
    <TasteContext.Provider value={value}>
      {children}
    </TasteContext.Provider>
  );
};
