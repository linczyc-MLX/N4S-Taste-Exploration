/**
 * Profile Calculator for Quad-Based Ranking System
 * 
 * Uses comparative rankings (1st through 4th) to derive:
 * - Style axes preferences
 * - Dimension preferences (what varies within quads)
 * - Complexity calibration
 * - Material affinities
 * - Overall taste profile
 */

// Weight multipliers for rankings
const RANK_WEIGHTS = {
  1: 4.0,  // 1st choice gets highest weight
  2: 2.5,  // 2nd choice
  3: 1.0,  // 3rd choice
  4: 0.25  // 4th choice (slight negative signal)
};

/**
 * Calculate weighted average for a dimension based on rankings
 */
const calculateWeightedDimension = (quadResults, dimensionKey) => {
  let weightedSum = 0;
  let totalWeight = 0;
  
  quadResults.forEach(result => {
    result.images.forEach(image => {
      const rank = result.rankings[image.id];
      if (rank && image.style_axes && image.style_axes[dimensionKey] !== undefined) {
        const weight = RANK_WEIGHTS[rank];
        weightedSum += image.style_axes[dimensionKey] * weight;
        totalWeight += weight;
      }
    });
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 5;
};

/**
 * Analyze variation dimension preferences
 * When a quad varies on "door_treatment", what end of the spectrum does client prefer?
 */
const analyzeVariationPreferences = (quadResults) => {
  const preferences = {};
  
  quadResults.forEach(result => {
    const dimension = result.variationDimension;
    
    if (!preferences[dimension]) {
      preferences[dimension] = {
        dimension,
        samples: [],
        preferredEnd: null,
        strength: 0
      };
    }
    
    // Find 1st and 4th choice values
    result.images.forEach(image => {
      const rank = result.rankings[image.id];
      if (rank === 1 || rank === 4) {
        preferences[dimension].samples.push({
          rank,
          value: image.variationValue,
          label: image.variationLabel
        });
      }
    });
  });
  
  // Analyze each dimension
  Object.keys(preferences).forEach(dim => {
    const pref = preferences[dim];
    const firstChoices = pref.samples.filter(s => s.rank === 1);
    const lastChoices = pref.samples.filter(s => s.rank === 4);
    
    if (firstChoices.length > 0 && lastChoices.length > 0) {
      const avgFirst = firstChoices.reduce((sum, s) => sum + s.value, 0) / firstChoices.length;
      const avgLast = lastChoices.reduce((sum, s) => sum + s.value, 0) / lastChoices.length;
      
      pref.preferredEnd = avgFirst < avgLast ? 'low' : 'high';
      pref.strength = Math.abs(avgFirst - avgLast) / 10; // Normalize to 0-1
      pref.averagePreferred = avgFirst;
    }
  });
  
  return preferences;
};

/**
 * Extract material preferences from rankings
 */
const analyzeMaterialPreferences = (quadResults) => {
  const materialScores = {};
  
  quadResults.forEach(result => {
    result.images.forEach(image => {
      const rank = result.rankings[image.id];
      const weight = RANK_WEIGHTS[rank] || 0;
      
      if (image.physical && image.physical.primary_materials) {
        image.physical.primary_materials.forEach(material => {
          if (!materialScores[material]) {
            materialScores[material] = { total: 0, count: 0 };
          }
          materialScores[material].total += weight;
          materialScores[material].count += 1;
        });
      }
    });
  });
  
  // Calculate average scores
  const materials = Object.entries(materialScores)
    .map(([material, data]) => ({
      material,
      score: data.total / data.count,
      frequency: data.count
    }))
    .sort((a, b) => b.score - a.score);
  
  return {
    primary: materials.filter(m => m.score > 2.5).slice(0, 5),
    secondary: materials.filter(m => m.score >= 1.5 && m.score <= 2.5).slice(0, 5),
    aversions: materials.filter(m => m.score < 1.0).slice(0, 3)
  };
};

/**
 * Analyze complexity preferences from psychological attributes
 */
const analyzeComplexityPreference = (quadResults) => {
  let complexitySum = 0;
  let totalWeight = 0;
  const complexityValues = [];
  
  quadResults.forEach(result => {
    result.images.forEach(image => {
      const rank = result.rankings[image.id];
      const weight = RANK_WEIGHTS[rank] || 0;
      
      const complexity = image.psychological?.complexity || 
                         image.physical?.ornamentation_level || 
                         5;
      
      if (rank === 1 || rank === 2) {
        complexityValues.push(complexity);
      }
      
      complexitySum += complexity * weight;
      totalWeight += weight;
    });
  });
  
  const optimalComplexity = totalWeight > 0 ? complexitySum / totalWeight : 5;
  
  // Calculate consistency (how tight is their preference?)
  const variance = complexityValues.length > 0 
    ? complexityValues.reduce((sum, v) => sum + Math.pow(v - optimalComplexity, 2), 0) / complexityValues.length
    : 0;
  
  return {
    optimal: Math.round(optimalComplexity * 10) / 10,
    range: {
      min: Math.max(1, Math.round((optimalComplexity - Math.sqrt(variance)) * 10) / 10),
      max: Math.min(10, Math.round((optimalComplexity + Math.sqrt(variance)) * 10) / 10)
    },
    consistency: Math.max(0, 1 - (Math.sqrt(variance) / 5)) // 0-1 scale
  };
};

/**
 * Integrate Phase 3 resolution choices
 */
const integratePhase3 = (phase3Results, baseProfile) => {
  const adjustments = {};
  
  phase3Results.forEach(result => {
    const { dimension, choice } = result;
    
    switch(dimension) {
      case 'warmth':
        adjustments.warm_cool = choice === 'A' ? 
          Math.min(baseProfile.styleAxes.warm_cool.value + 1, 10) : 
          Math.max(baseProfile.styleAxes.warm_cool.value - 1, 1);
        break;
      case 'complexity':
        adjustments.minimal_layered = choice === 'A' ?
          Math.max(baseProfile.styleAxes.minimal_layered.value - 1, 1) :
          Math.min(baseProfile.styleAxes.minimal_layered.value + 1, 10);
        break;
      case 'period':
        adjustments.contemporary_traditional = choice === 'A' ?
          Math.max(baseProfile.styleAxes.contemporary_traditional.value - 1, 1) :
          Math.min(baseProfile.styleAxes.contemporary_traditional.value + 1, 10);
        break;
      case 'formality':
        adjustments.formality = choice === 'B' ? 'formal' : 'casual';
        break;
      case 'nature':
        adjustments.organic_geometric = choice === 'B' ?
          Math.max(baseProfile.styleAxes.organic_geometric.value - 1, 1) :
          Math.min(baseProfile.styleAxes.organic_geometric.value + 1, 10);
        break;
      case 'ornamentation':
        adjustments.ornamentation_preference = choice === 'B' ? 'decorative' : 'restrained';
        break;
    }
  });
  
  return adjustments;
};

/**
 * Generate style tags from profile
 */
const generateStyleTags = (profile) => {
  const tags = [];
  
  // Period tags
  if (profile.styleAxes.contemporary_traditional.value <= 3) {
    tags.push('contemporary');
  } else if (profile.styleAxes.contemporary_traditional.value >= 7) {
    tags.push('traditional');
  } else {
    tags.push('transitional');
  }
  
  // Complexity tags
  if (profile.styleAxes.minimal_layered.value <= 3) {
    tags.push('minimal');
  } else if (profile.styleAxes.minimal_layered.value >= 7) {
    tags.push('layered');
  }
  
  // Temperature tags
  if (profile.styleAxes.warm_cool.value <= 3) {
    tags.push('warm_palette');
  } else if (profile.styleAxes.warm_cool.value >= 7) {
    tags.push('cool_palette');
  }
  
  // Organic/geometric
  if (profile.styleAxes.organic_geometric.value <= 3) {
    tags.push('organic');
  } else if (profile.styleAxes.organic_geometric.value >= 7) {
    tags.push('geometric');
  }
  
  return tags;
};

/**
 * Main profile calculation function
 */
export const calculateProfile = (phase1Results, phase2Selections, phase3Results, phase2Boards) => {
  // 1. Calculate style axes from quad rankings
  const styleAxes = {
    contemporary_traditional: {
      value: calculateWeightedDimension(phase1Results, 'contemporary_traditional'),
      confidence: 0.8,
      label: 'Period Preference'
    },
    minimal_layered: {
      value: calculateWeightedDimension(phase1Results, 'minimal_layered'),
      confidence: 0.8,
      label: 'Complexity Preference'
    },
    warm_cool: {
      value: calculateWeightedDimension(phase1Results, 'warm_cool'),
      confidence: 0.8,
      label: 'Temperature Preference'
    },
    organic_geometric: {
      value: calculateWeightedDimension(phase1Results, 'organic_geometric'),
      confidence: 0.7,
      label: 'Form Preference'
    },
    refined_eclectic: {
      value: calculateWeightedDimension(phase1Results, 'refined_eclectic'),
      confidence: 0.6,
      label: 'Curatedness'
    }
  };
  
  // Round values
  Object.keys(styleAxes).forEach(key => {
    styleAxes[key].value = Math.round(styleAxes[key].value * 10) / 10;
  });
  
  // 2. Analyze variation preferences (what they prefer within quads)
  const variationPreferences = analyzeVariationPreferences(phase1Results);
  
  // 3. Analyze material preferences
  const materialProfile = analyzeMaterialPreferences(phase1Results);
  
  // 4. Analyze complexity calibration
  const complexityProfile = analyzeComplexityPreference(phase1Results);
  
  // 5. Build base profile
  const baseProfile = {
    styleAxes,
    variationPreferences,
    materialProfile,
    complexityProfile
  };
  
  // 6. Integrate Phase 3 resolutions
  const phase3Adjustments = integratePhase3(phase3Results, baseProfile);
  
  // Apply adjustments
  if (phase3Adjustments.warm_cool) {
    styleAxes.warm_cool.value = phase3Adjustments.warm_cool;
    styleAxes.warm_cool.confidence = 0.95;
  }
  if (phase3Adjustments.minimal_layered) {
    styleAxes.minimal_layered.value = phase3Adjustments.minimal_layered;
    styleAxes.minimal_layered.confidence = 0.95;
  }
  if (phase3Adjustments.contemporary_traditional) {
    styleAxes.contemporary_traditional.value = phase3Adjustments.contemporary_traditional;
    styleAxes.contemporary_traditional.confidence = 0.95;
  }
  if (phase3Adjustments.organic_geometric) {
    styleAxes.organic_geometric.value = phase3Adjustments.organic_geometric;
    styleAxes.organic_geometric.confidence = 0.9;
  }
  
  // 7. Generate final profile
  const finalProfile = {
    // Identification
    generatedAt: new Date().toISOString(),
    methodology: 'quad_ranking_v1',
    
    // Style Axes
    styleAxes,
    
    // Style Tags
    styleTags: generateStyleTags({ styleAxes }),
    
    // Complexity Calibration
    complexity: complexityProfile,
    
    // Material Preferences
    materials: materialProfile,
    
    // Detailed Variation Preferences
    variationPreferences: Object.values(variationPreferences).filter(v => v.strength > 0.2),
    
    // Phase 3 Resolutions
    resolutions: phase3Results,
    
    // Additional attributes
    formality: phase3Adjustments.formality || 'moderate',
    ornamentation: phase3Adjustments.ornamentation_preference || 'balanced',
    
    // Quad count for confidence
    sampleSize: phase1Results.length,
    
    // Raw data for export
    rawData: {
      phase1Results,
      phase2Selections,
      phase3Results
    }
  };
  
  return finalProfile;
};

export default calculateProfile;
