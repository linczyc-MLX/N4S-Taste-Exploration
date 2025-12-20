// Profile Calculator
// Transforms user choices into derived taste profile

export const calculateProfile = ({ phase1Results, phase2Selections, phase3Results, phase2Boards }) => {
  const { love, ok, notForMe } = phase1Results;
  
  // Weight images by preference: love=3, ok=1, notForMe=-1
  const weightedImages = [
    ...love.map(img => ({ ...img, weight: 3 })),
    ...ok.map(img => ({ ...img, weight: 1 })),
    ...notForMe.map(img => ({ ...img, weight: -1 }))
  ];
  
  // Calculate style axes
  const styleProfile = calculateStyleAxes(weightedImages);
  
  // Calculate complexity profile
  const complexityProfile = calculateComplexityProfile(weightedImages.filter(img => img.weight > 0));
  
  // Extract material affinities
  const materialProfile = calculateMaterialProfile(love, notForMe);
  
  // Determine color preferences
  const colorProfile = calculateColorProfile(weightedImages.filter(img => img.weight > 0));
  
  // Space preferences
  const spaceProfile = calculateSpaceProfile(weightedImages.filter(img => img.weight > 0));
  
  // Calculate confidence scores
  const confidence = calculateConfidence(weightedImages);
  
  // Derive style tags
  const styleTags = deriveStyleTags(styleProfile);
  
  return {
    style_profile: {
      ...styleProfile,
      style_tags: styleTags,
      confidence
    },
    complexity_profile: complexityProfile,
    material_profile: materialProfile,
    color_profile: colorProfile,
    space_profile: spaceProfile,
    
    // Raw data for export
    raw_data: {
      phase1: {
        images_shown: love.length + ok.length + notForMe.length,
        love: love.map(img => img.id),
        ok: ok.map(img => img.id),
        notForMe: notForMe.map(img => img.id)
      },
      phase2: phase2Selections,
      phase3: phase3Results
    }
  };
};

// Calculate weighted average for style axes
const calculateStyleAxes = (weightedImages) => {
  const axes = {
    contemporary_traditional: 0,
    minimal_layered: 0,
    warm_cool: 0,
    organic_geometric: 0,
    refined_eclectic: 0
  };
  
  let totalWeight = 0;
  
  weightedImages.forEach(img => {
    if (img.weight > 0 && img.style_axes) {
      Object.keys(axes).forEach(axis => {
        axes[axis] += (img.style_axes[axis] || 5) * img.weight;
      });
      totalWeight += img.weight;
    }
  });
  
  if (totalWeight > 0) {
    Object.keys(axes).forEach(axis => {
      axes[axis] = Math.round((axes[axis] / totalWeight) * 10) / 10;
    });
  }
  
  return axes;
};

// Calculate complexity preferences (Berlyne)
const calculateComplexityProfile = (positiveImages) => {
  if (positiveImages.length === 0) {
    return {
      optimal_complexity: 5,
      complexity_range: [3, 7],
      complexity_consistency: 0.5,
      novelty_tolerance: 5,
      coherence_preference: 7
    };
  }
  
  const complexities = positiveImages
    .filter(img => img.psychological)
    .map(img => img.psychological.complexity || 5);
  
  const novelties = positiveImages
    .filter(img => img.psychological)
    .map(img => img.psychological.novelty || 5);
    
  const coherences = positiveImages
    .filter(img => img.psychological)
    .map(img => img.psychological.coherence || 7);
  
  const avgComplexity = complexities.reduce((a, b) => a + b, 0) / complexities.length;
  const minComplexity = Math.min(...complexities);
  const maxComplexity = Math.max(...complexities);
  
  // Calculate consistency (lower std dev = higher consistency)
  const variance = complexities.reduce((sum, c) => sum + Math.pow(c - avgComplexity, 2), 0) / complexities.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, Math.min(1, 1 - (stdDev / 5)));
  
  return {
    optimal_complexity: Math.round(avgComplexity * 10) / 10,
    complexity_range: [
      Math.round(Math.max(1, avgComplexity - stdDev) * 10) / 10,
      Math.round(Math.min(10, avgComplexity + stdDev) * 10) / 10
    ],
    complexity_consistency: Math.round(consistency * 100) / 100,
    novelty_tolerance: Math.round((novelties.reduce((a, b) => a + b, 0) / novelties.length) * 10) / 10,
    coherence_preference: Math.round((coherences.reduce((a, b) => a + b, 0) / coherences.length) * 10) / 10
  };
};

// Extract material preferences
const calculateMaterialProfile = (loved, disliked) => {
  const materialCounts = {};
  const aversionCounts = {};
  
  loved.forEach(img => {
    if (img.physical && img.physical.primary_materials) {
      img.physical.primary_materials.forEach(mat => {
        materialCounts[mat] = (materialCounts[mat] || 0) + 1;
      });
    }
  });
  
  disliked.forEach(img => {
    if (img.physical && img.physical.primary_materials) {
      img.physical.primary_materials.forEach(mat => {
        aversionCounts[mat] = (aversionCounts[mat] || 0) + 1;
      });
    }
  });
  
  // Sort by frequency
  const sortedAffinities = Object.entries(materialCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([mat]) => mat);
    
  const sortedAversions = Object.entries(aversionCounts)
    .filter(([mat]) => !materialCounts[mat] || aversionCounts[mat] > materialCounts[mat])
    .sort((a, b) => b[1] - a[1])
    .map(([mat]) => mat);
  
  return {
    primary_affinities: sortedAffinities.slice(0, 5),
    secondary_affinities: sortedAffinities.slice(5, 10),
    aversions: sortedAversions.slice(0, 5)
  };
};

// Determine color palette preferences
const calculateColorProfile = (positiveImages) => {
  const paletteCounts = {};
  let totalWarmCool = 0;
  
  positiveImages.forEach(img => {
    if (img.physical && img.physical.color_palette) {
      paletteCounts[img.physical.color_palette] = (paletteCounts[img.physical.color_palette] || 0) + 1;
    }
    if (img.style_axes) {
      totalWarmCool += img.style_axes.warm_cool || 5;
    }
  });
  
  const primaryPalette = Object.entries(paletteCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'warm_neutral';
  
  const avgWarmCool = positiveImages.length > 0 
    ? totalWarmCool / positiveImages.length 
    : 5;
  
  return {
    primary_palette: primaryPalette,
    accent_tolerance: avgWarmCool < 4 ? 'warm_accents' : avgWarmCool > 6 ? 'cool_accents' : 'neutral',
    color_temperature: Math.round(avgWarmCool * 10) / 10,
    saturation_preference: 'muted' // Default for ultra-luxury
  };
};

// Calculate space preferences
const calculateSpaceProfile = (positiveImages) => {
  const scales = { intimate: 0, comfortable: 0, generous: 0, grand: 0, monumental: 0 };
  let totalLight = 0;
  
  positiveImages.forEach(img => {
    if (img.physical) {
      const scale = img.physical.scale_feeling || 'generous';
      scales[scale] = (scales[scale] || 0) + 1;
      totalLight += img.physical.natural_light || 7;
    }
  });
  
  const preferredScale = Object.entries(scales)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'generous';
  
  return {
    scale_comfort: preferredScale,
    natural_light_importance: Math.round((totalLight / Math.max(1, positiveImages.length)) * 10) / 10,
    openness: 7 // Would need specific data to calculate
  };
};

// Calculate confidence scores based on consistency
const calculateConfidence = (weightedImages) => {
  const positive = weightedImages.filter(img => img.weight > 0);
  
  if (positive.length < 5) {
    return {
      contemporary_traditional: 0.5,
      minimal_layered: 0.5,
      warm_cool: 0.5,
      organic_geometric: 0.5,
      refined_eclectic: 0.5
    };
  }
  
  const confidence = {};
  const axes = ['contemporary_traditional', 'minimal_layered', 'warm_cool', 'organic_geometric', 'refined_eclectic'];
  
  axes.forEach(axis => {
    const values = positive
      .filter(img => img.style_axes)
      .map(img => img.style_axes[axis] || 5);
    
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      confidence[axis] = Math.round(Math.max(0.3, Math.min(1, 1 - (stdDev / 4))) * 100) / 100;
    } else {
      confidence[axis] = 0.5;
    }
  });
  
  return confidence;
};

// Derive style tags from axes
const deriveStyleTags = (styleAxes) => {
  const tags = [];
  
  // Contemporary vs Traditional
  if (styleAxes.contemporary_traditional < 3) {
    tags.push('ultra_contemporary');
  } else if (styleAxes.contemporary_traditional < 5) {
    tags.push('contemporary');
  } else if (styleAxes.contemporary_traditional > 7) {
    tags.push('traditional');
  } else {
    tags.push('transitional');
  }
  
  // Minimal vs Layered
  if (styleAxes.minimal_layered < 4) {
    tags.push('minimal');
  } else if (styleAxes.minimal_layered > 6) {
    tags.push('layered');
  }
  
  // Warm vs Cool
  if (styleAxes.warm_cool < 4) {
    tags.push('warm_palette');
  } else if (styleAxes.warm_cool > 6) {
    tags.push('cool_palette');
  }
  
  // Organic vs Geometric
  if (styleAxes.organic_geometric < 4) {
    tags.push('organic_forms');
  } else if (styleAxes.organic_geometric > 6) {
    tags.push('geometric');
  }
  
  // Refined vs Eclectic
  if (styleAxes.refined_eclectic < 4) {
    tags.push('highly_curated');
  } else if (styleAxes.refined_eclectic > 6) {
    tags.push('eclectic');
  }
  
  return tags;
};

export default calculateProfile;
