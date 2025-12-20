import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { calculateProfile } from '../utils/profileCalculator';
import quads, { categoryOrder, getQuadsByCategory } from '../data/quadImages';

const TasteContext = createContext();

export const useTaste = () => {
  const context = useContext(TasteContext);
  if (!context) {
    throw new Error('useTaste must be used within TasteProvider');
  }
  return context;
};

// Build sequence with dividers before each category
const buildPhase1Sequence = () => {
  const sequence = [];
  const quadsByCategory = getQuadsByCategory();
  
  categoryOrder.forEach((category, categoryIndex) => {
    const categoryQuads = quadsByCategory[category] || [];
    
    if (categoryQuads.length > 0) {
      // Add divider before category
      sequence.push({
        type: 'divider',
        category: category,
        categoryIndex: categoryIndex,
        totalCategories: categoryOrder.filter(c => (quadsByCategory[c] || []).length > 0).length,
        quadCount: categoryQuads.length
      });
      
      // Add quads for this category
      categoryQuads.forEach((quad) => {
        sequence.push({
          type: 'quad',
          ...quad
        });
      });
    }
  });
  
  return sequence;
};

export const TasteProvider = ({ children }) => {
  // Session metadata
  const [sessionMode, setSessionMode] = useState(null); // 'together' | 'principal' | 'secondary'
  const [participantName, setParticipantName] = useState('');
  const [startTime, setStartTime] = useState(null);
  
  // Current phase: 'welcome' | 'phase1' | 'phase2' | 'phase3' | 'complete'
  const [currentPhase, setCurrentPhase] = useState('welcome');
  
  // Phase 1: Quad rankings
  const [phase1Sequence, setPhase1Sequence] = useState([]);
  const [phase1Index, setPhase1Index] = useState(0);
  const [phase1Results, setPhase1Results] = useState([]); // Array of { quadId, rankings: { imageId: rank } }
  const [quadCount, setQuadCount] = useState(0); // Completed quads
  const [totalQuads, setTotalQuads] = useState(0);
  
  // Phase 2: Board selection (curated from top-ranked images)
  const [phase2Boards, setPhase2Boards] = useState([]);
  const [phase2CurrentBoard, setPhase2CurrentBoard] = useState(0);
  const [phase2Selections, setPhase2Selections] = useState({});
  
  // Phase 3: Resolution pairs
  const [phase3Pairs, setPhase3Pairs] = useState([]);
  const [phase3Index, setPhase3Index] = useState(0);
  const [phase3Results, setPhase3Results] = useState([]);
  
  // Final profile
  const [derivedProfile, setDerivedProfile] = useState(null);
  
  // Start session
  const startSession = useCallback((mode, name = '') => {
    setSessionMode(mode);
    setParticipantName(name);
    initializePhase1();
  }, []);
  
  // Initialize Phase 1
  const initializePhase1 = useCallback(() => {
    const sequence = buildPhase1Sequence();
    const quadsInSequence = sequence.filter(item => item.type === 'quad').length;
    
    setPhase1Sequence(sequence);
    setPhase1Index(0);
    setPhase1Results([]);
    setQuadCount(0);
    setTotalQuads(quadsInSequence);
    setStartTime(new Date());
    setCurrentPhase('phase1');
  }, []);
  
  // Get current item (could be divider or quad)
  const currentItem = phase1Sequence[phase1Index];
  
  // Continue past a divider card
  const continuePastDivider = useCallback(() => {
    if (phase1Index < phase1Sequence.length - 1) {
      setPhase1Index(prev => prev + 1);
    }
  }, [phase1Index, phase1Sequence.length]);
  
  // Record quad ranking and move to next
  const recordQuadRanking = useCallback((rankings) => {
    const currentQuad = phase1Sequence[phase1Index];
    
    if (currentQuad.type !== 'quad') return;
    
    // Store the ranking result
    const result = {
      quadId: currentQuad.quadId,
      category: currentQuad.category,
      subcategory: currentQuad.subcategory,
      variationDimension: currentQuad.variationDimension,
      rankings: rankings, // { imageId: rank (1-4) }
      images: currentQuad.images // Include image data for profile calculation
    };
    
    setPhase1Results(prev => [...prev, result]);
    setQuadCount(prev => prev + 1);
    
    // Move to next item or complete phase
    if (phase1Index < phase1Sequence.length - 1) {
      setPhase1Index(prev => prev + 1);
    } else {
      // Phase 1 complete - generate boards for Phase 2
      setTimeout(() => completePhase1(), 300);
    }
  }, [phase1Index, phase1Sequence]);
  
  // Complete Phase 1 and generate Phase 2 boards
  const completePhase1 = useCallback(() => {
    // Get top-ranked images (rank 1 and 2) from all quads
    const topImages = [];
    
    phase1Results.forEach(result => {
      result.images.forEach(image => {
        const rank = result.rankings[image.id];
        if (rank === 1 || rank === 2) {
          topImages.push({
            ...image,
            rank,
            category: result.category,
            quadId: result.quadId
          });
        }
      });
    });
    
    // Generate 4 themed boards from top images
    const boards = generateBoards(topImages);
    setPhase2Boards(boards);
    setPhase2CurrentBoard(0);
    setPhase2Selections({});
    setCurrentPhase('phase2');
  }, [phase1Results]);
  
  // Generate themed boards for Phase 2
  const generateBoards = (topImages) => {
    // Group by broad themes
    const boards = [
      {
        id: 'board_1',
        title: 'Interiors',
        description: 'Your top living space preferences',
        images: topImages.filter(img => 
          ['living_spaces', 'dining_spaces', 'family_areas'].includes(img.category)
        ).slice(0, 9)
      },
      {
        id: 'board_2', 
        title: 'Private Spaces',
        description: 'Bedrooms and bathrooms',
        images: topImages.filter(img => 
          ['primary_bedrooms', 'primary_bathrooms', 'guest_bedrooms'].includes(img.category)
        ).slice(0, 9)
      },
      {
        id: 'board_3',
        title: 'Kitchen & Function',
        description: 'Culinary and utility spaces',
        images: topImages.filter(img => 
          ['kitchens'].includes(img.category)
        ).slice(0, 9)
      },
      {
        id: 'board_4',
        title: 'Exteriors & Landscape',
        description: 'Architecture and outdoor living',
        images: topImages.filter(img => 
          ['exterior_architecture', 'exterior_landscape', 'outdoor_living'].includes(img.category)
        ).slice(0, 9)
      }
    ].filter(board => board.images.length >= 3); // Only include boards with enough images
    
    return boards;
  };
  
  // Toggle Phase 2 selection
  const togglePhase2Selection = useCallback((imageId) => {
    const boardId = phase2Boards[phase2CurrentBoard]?.id;
    if (!boardId) return;
    
    setPhase2Selections(prev => {
      const boardSelections = prev[boardId] || [];
      
      if (boardSelections.includes(imageId)) {
        // Remove selection
        return {
          ...prev,
          [boardId]: boardSelections.filter(id => id !== imageId)
        };
      } else if (boardSelections.length < 3) {
        // Add selection (max 3)
        return {
          ...prev,
          [boardId]: [...boardSelections, imageId]
        };
      }
      
      return prev;
    });
  }, [phase2CurrentBoard, phase2Boards]);
  
  // Move to next board
  const nextBoard = useCallback(() => {
    if (phase2CurrentBoard < phase2Boards.length - 1) {
      setPhase2CurrentBoard(prev => prev + 1);
    } else {
      completePhase2();
    }
  }, [phase2CurrentBoard, phase2Boards.length]);
  
  // Complete Phase 2 and generate Phase 3 pairs
  const completePhase2 = useCallback(() => {
    // Generate resolution pairs based on detected tensions
    const pairs = generateResolutionPairs();
    setPhase3Pairs(pairs);
    setPhase3Index(0);
    setPhase3Results([]);
    setCurrentPhase('phase3');
  }, [phase1Results, phase2Selections]);
  
  // Generate resolution pairs for Phase 3
  const generateResolutionPairs = () => {
    // Find dimensions where rankings show mixed preferences
    // For now, generate standard pairs based on common tensions
    const standardPairs = [
      {
        id: 'pair_1',
        dimension: 'warmth',
        question: 'Overall temperature preference?',
        optionA: { label: 'Cool & Crisp', value: 'cool', gradient: 'linear-gradient(135deg, #e8eef4 0%, #b8c8d8 100%)' },
        optionB: { label: 'Warm & Inviting', value: 'warm', gradient: 'linear-gradient(135deg, #f5e6d3 0%, #c9a962 100%)' }
      },
      {
        id: 'pair_2',
        dimension: 'complexity',
        question: 'Visual complexity preference?',
        optionA: { label: 'Clean & Minimal', value: 'minimal', gradient: 'linear-gradient(135deg, #f8f8f8 0%, #e0e0e0 100%)' },
        optionB: { label: 'Rich & Layered', value: 'layered', gradient: 'linear-gradient(135deg, #d4c4a8 0%, #8b6914 100%)' }
      },
      {
        id: 'pair_3',
        dimension: 'period',
        question: 'Design period preference?',
        optionA: { label: 'Contemporary', value: 'contemporary', gradient: 'linear-gradient(135deg, #e8eef4 0%, #667d94 100%)' },
        optionB: { label: 'Traditional', value: 'traditional', gradient: 'linear-gradient(135deg, #c9a962 0%, #5c4a28 100%)' }
      },
      {
        id: 'pair_4',
        dimension: 'formality',
        question: 'Formality level?',
        optionA: { label: 'Relaxed & Casual', value: 'casual', gradient: 'linear-gradient(135deg, #c8d4c0 0%, #889878 100%)' },
        optionB: { label: 'Refined & Formal', value: 'formal', gradient: 'linear-gradient(135deg, #2d3d4d 0%, #1a1a2e 100%)' }
      },
      {
        id: 'pair_5',
        dimension: 'nature',
        question: 'Nature connection?',
        optionA: { label: 'Architectural', value: 'architectural', gradient: 'linear-gradient(135deg, #b8c8d8 0%, #4a5d70 100%)' },
        optionB: { label: 'Organic & Natural', value: 'organic', gradient: 'linear-gradient(135deg, #c8d4c0 0%, #6b8e4e 100%)' }
      },
      {
        id: 'pair_6',
        dimension: 'ornamentation',
        question: 'Detail preference?',
        optionA: { label: 'Restrained', value: 'restrained', gradient: 'linear-gradient(135deg, #e8e4dc 0%, #c0b8ac 100%)' },
        optionB: { label: 'Decorative', value: 'decorative', gradient: 'linear-gradient(135deg, #c9a962 0%, #8b6914 100%)' }
      }
    ];
    
    return standardPairs;
  };
  
  // Record Phase 3 choice
  const recordPhase3Choice = useCallback((choice) => {
    const currentPair = phase3Pairs[phase3Index];
    
    setPhase3Results(prev => [...prev, {
      pairId: currentPair.id,
      dimension: currentPair.dimension,
      choice: choice // 'A' or 'B'
    }]);
    
    if (phase3Index < phase3Pairs.length - 1) {
      setPhase3Index(prev => prev + 1);
    } else {
      completeExploration();
    }
  }, [phase3Index, phase3Pairs]);
  
  // Complete exploration and calculate profile
  const completeExploration = useCallback(() => {
    const profile = calculateProfile(phase1Results, phase2Selections, phase3Results, phase2Boards);
    setDerivedProfile(profile);
    setCurrentPhase('complete');
  }, [phase1Results, phase2Selections, phase3Results, phase2Boards]);
  
  // Reset everything
  const resetExploration = useCallback(() => {
    setSessionMode(null);
    setParticipantName('');
    setStartTime(null);
    setCurrentPhase('welcome');
    setPhase1Sequence([]);
    setPhase1Index(0);
    setPhase1Results([]);
    setQuadCount(0);
    setTotalQuads(0);
    setPhase2Boards([]);
    setPhase2CurrentBoard(0);
    setPhase2Selections({});
    setPhase3Pairs([]);
    setPhase3Index(0);
    setPhase3Results([]);
    setDerivedProfile(null);
  }, []);
  
  // Calculate progress
  const phase1Progress = useMemo(() => {
    return totalQuads > 0 ? Math.round((quadCount / totalQuads) * 100) : 0;
  }, [quadCount, totalQuads]);
  
  const value = {
    // State
    currentPhase,
    sessionMode,
    participantName,
    
    // Phase 1
    phase1Sequence,
    phase1Index,
    phase1Results,
    currentItem,
    quadCount,
    totalQuads,
    phase1Progress,
    
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
    recordQuadRanking,
    continuePastDivider,
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

export default TasteContext;
