// Placeholder Images with Full Metadata
// These will be replaced with AI-generated images

// Style gradient generators for visual placeholders
const styleGradients = {
  contemporary_warm_minimal: 'linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 50%, #d4c4a8 100%)',
  contemporary_cool_minimal: 'linear-gradient(135deg, #e8eef4 0%, #d1dce6 50%, #b8c8d8 100%)',
  contemporary_warm_layered: 'linear-gradient(135deg, #e8d4b8 0%, #c9a962 50%, #a67c52 100%)',
  contemporary_cool_layered: 'linear-gradient(135deg, #b8c8d8 0%, #8fa4b8 50%, #667d94 100%)',
  traditional_warm_minimal: 'linear-gradient(135deg, #f0e4d4 0%, #d4c4a8 50%, #b8a888 100%)',
  traditional_cool_minimal: 'linear-gradient(135deg, #d8e0e8 0%, #b8c4d0 50%, #98a8b8 100%)',
  traditional_warm_layered: 'linear-gradient(135deg, #c9a962 0%, #8b6914 50%, #5c4a28 100%)',
  traditional_cool_layered: 'linear-gradient(135deg, #667d94 0%, #4a5d70 50%, #2d3d4d 100%)',
  transitional: 'linear-gradient(135deg, #d4c4a8 0%, #b8b8b8 50%, #a8b8c8 100%)',
  organic_modern: 'linear-gradient(135deg, #c8d4c0 0%, #a8b89c 50%, #889878 100%)',
  mediterranean: 'linear-gradient(135deg, #f0e4d0 0%, #d4b896 50%, #b89060 100%)',
  japanese: 'linear-gradient(135deg, #e8e4dc 0%, #d4cec4 50%, #c0b8ac 100%)',
  california: 'linear-gradient(135deg, #f8f4ec 0%, #e8dcc8 50%, #d8c8a8 100%)',
  scandinavian: 'linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 50%, #d8d8d8 100%)',
};

// Category definitions - ORDERED for client journey
// 1. Exterior Architecture → 2. Living Spaces → 3. Dining → 4. Kitchens → 
// 5. Family Areas → 6. Primary Bedrooms → 7. Primary Bathrooms → 
// 8. Guest Bedrooms → 9. Exterior Landscape → 10. Outdoor Living
const categoryOrder = [
  'exterior_architecture',
  'living_spaces',
  'dining_spaces',
  'kitchens',
  'family_areas',
  'primary_bedrooms',
  'primary_bathrooms',
  'guest_bedrooms',
  'exterior_landscape',
  'outdoor_living'
];

const subcategories = {
  exterior_architecture: ['facade', 'entry', 'aerial', 'dusk_shot'],
  living_spaces: ['great_room', 'formal_living', 'salon'],
  dining_spaces: ['formal_dining', 'casual_dining', 'breakfast_room'],
  kitchens: ['chef_kitchen', 'open_plan', 'catering_kitchen'],
  family_areas: ['family_room', 'media_room', 'game_room', 'home_bar'],
  primary_bedrooms: ['master_suite', 'sleeping_retreat', 'sitting_area'],
  primary_bathrooms: ['spa_suite', 'wet_room', 'his_hers'],
  guest_bedrooms: ['guest_suite', 'secondary_bedroom', 'staff_quarters'],
  exterior_landscape: ['arrival_sequence', 'swimming_pool', 'tennis_court', 'gardens', 'motor_court'],
  outdoor_living: ['terrace', 'loggia', 'pool_cabana', 'outdoor_kitchen']
};

// Generate a single placeholder image with full metadata
const generateImage = (id, category, subcategory, styleKey, styleValues) => {
  const gradient = styleGradients[styleKey] || styleGradients.transitional;
  
  return {
    id: `img_${id.toString().padStart(3, '0')}`,
    category,
    subcategory,
    styleKey,
    gradient,
    
    // Style axes (1-10)
    style_axes: {
      contemporary_traditional: styleValues.ct || 5,
      minimal_layered: styleValues.ml || 5,
      warm_cool: styleValues.wc || 5,
      organic_geometric: styleValues.og || 5,
      refined_eclectic: styleValues.re || 5
    },
    
    // Psychological dimensions
    psychological: {
      complexity: styleValues.complexity || 5,
      novelty: styleValues.novelty || 5,
      coherence: styleValues.coherence || 7,
      fascination: styleValues.fascination || 5,
      hominess: styleValues.hominess || 5
    },
    
    // Physical attributes
    physical: {
      primary_materials: styleValues.materials || ['oak', 'plaster', 'stone'],
      color_palette: styleValues.palette || 'warm_neutral',
      natural_light: styleValues.light || 7,
      scale_feeling: styleValues.scale || 'generous'
    },
    
    // Context
    context: {
      region_influence: styleValues.region || 'international_modern',
      budget_tier: 'ultra'
    },
    
    // Display label
    label: `${category.replace(/_/g, ' ')} - ${subcategory.replace(/_/g, ' ')}`,
    styleLabel: styleKey.replace(/_/g, ' ')
  };
};

// Generate the full placeholder library IN CLIENT JOURNEY ORDER
let imageId = 1;
export const placeholderImages = [];

// ===========================================
// 1. EXTERIOR ARCHITECTURE (First Impression)
// ===========================================
const exteriorArchStyles = [
  { key: 'contemporary_warm_minimal', ct: 2, ml: 2, wc: 4, materials: ['wood_siding', 'glass', 'concrete'], region: 'california_modern' },
  { key: 'contemporary_cool_minimal', ct: 1, ml: 1, wc: 7, materials: ['glass', 'steel', 'concrete'], region: 'international_modern' },
  { key: 'traditional_warm_layered', ct: 8, ml: 6, wc: 4, materials: ['stone', 'slate', 'copper'], region: 'english_country' },
  { key: 'mediterranean', ct: 7, ml: 5, wc: 3, materials: ['stucco', 'terracotta', 'iron'], region: 'mediterranean' },
  { key: 'transitional', ct: 5, ml: 4, wc: 5, materials: ['stone', 'glass', 'metal'], region: 'hamptons' },
  { key: 'organic_modern', ct: 3, ml: 3, wc: 5, materials: ['wood', 'glass', 'stone'], region: 'mountain_modern' },
];

exteriorArchStyles.forEach((style) => {
  subcategories.exterior_architecture.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'exterior_architecture', sub, style.key, style));
  });
});

// ===========================================
// 2. LIVING SPACES (Main Interior Anchor)
// ===========================================
const livingStyles = [
  { key: 'contemporary_warm_minimal', ct: 2, ml: 2, wc: 3, og: 5, re: 2, complexity: 3, materials: ['oak', 'plaster', 'limestone'], palette: 'warm_neutral', region: 'california_modern' },
  { key: 'contemporary_cool_minimal', ct: 2, ml: 2, wc: 7, og: 6, re: 2, complexity: 3, materials: ['concrete', 'glass', 'steel'], palette: 'cool_neutral', region: 'scandinavian' },
  { key: 'contemporary_warm_layered', ct: 3, ml: 7, wc: 3, og: 4, re: 5, complexity: 7, materials: ['walnut', 'leather', 'bronze'], palette: 'earth_tones', region: 'belgian_modern' },
  { key: 'traditional_warm_layered', ct: 8, ml: 8, wc: 3, og: 4, re: 6, complexity: 8, materials: ['mahogany', 'silk', 'marble'], palette: 'warm_neutral', region: 'english_traditional' },
  { key: 'transitional', ct: 5, ml: 5, wc: 5, og: 5, re: 5, complexity: 5, materials: ['oak', 'linen', 'stone'], palette: 'warm_neutral', region: 'international_modern' },
  { key: 'organic_modern', ct: 3, ml: 4, wc: 4, og: 2, re: 3, complexity: 5, materials: ['reclaimed_wood', 'plaster', 'bronze'], palette: 'earth_tones', region: 'japanese' },
];

livingStyles.forEach((style) => {
  subcategories.living_spaces.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'living_spaces', sub, style.key, style));
  });
});

// ===========================================
// 3. DINING SPACES
// ===========================================
const diningStyles = [
  { key: 'contemporary_warm_minimal', ct: 2, ml: 3, wc: 4, complexity: 4, materials: ['oak', 'bronze', 'linen'], palette: 'warm_neutral' },
  { key: 'contemporary_cool_minimal', ct: 2, ml: 2, wc: 7, complexity: 3, materials: ['marble', 'chrome', 'glass'], palette: 'cool_neutral' },
  { key: 'traditional_warm_layered', ct: 8, ml: 7, wc: 3, complexity: 7, materials: ['mahogany', 'crystal', 'silk'], palette: 'warm_neutral', region: 'english_traditional' },
  { key: 'mediterranean', ct: 6, ml: 6, wc: 3, complexity: 6, materials: ['reclaimed_wood', 'iron', 'terracotta'], palette: 'earth_tones', region: 'mediterranean' },
  { key: 'transitional', ct: 5, ml: 4, wc: 5, complexity: 5, materials: ['walnut', 'brass', 'velvet'], palette: 'warm_neutral' },
];

diningStyles.forEach((style) => {
  subcategories.dining_spaces.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'dining_spaces', sub, style.key, style));
  });
});

// ===========================================
// 4. KITCHENS
// ===========================================
const kitchenStyles = [
  { key: 'contemporary_warm_minimal', ct: 2, ml: 2, wc: 4, complexity: 4, materials: ['oak', 'marble', 'brass'], palette: 'warm_neutral' },
  { key: 'contemporary_cool_minimal', ct: 2, ml: 2, wc: 7, complexity: 3, materials: ['white_lacquer', 'stainless', 'quartz'], palette: 'pure_white' },
  { key: 'contemporary_warm_layered', ct: 3, ml: 6, wc: 3, complexity: 6, materials: ['walnut', 'bronze', 'granite'], palette: 'earth_tones' },
  { key: 'traditional_warm_layered', ct: 8, ml: 7, wc: 3, complexity: 7, materials: ['cherry', 'marble', 'brass'], palette: 'warm_neutral' },
  { key: 'transitional', ct: 5, ml: 4, wc: 5, complexity: 5, materials: ['painted_wood', 'quartz', 'nickel'], palette: 'greige' },
];

kitchenStyles.forEach((style) => {
  subcategories.kitchens.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'kitchens', sub, style.key, style));
  });
});

// ===========================================
// 5. FAMILY AREAS (NEW)
// ===========================================
const familyStyles = [
  { key: 'contemporary_warm_minimal', ct: 2, ml: 3, wc: 3, complexity: 4, hominess: 8, materials: ['oak', 'leather', 'wool'], palette: 'warm_neutral', region: 'california_modern' },
  { key: 'contemporary_cool_layered', ct: 2, ml: 6, wc: 6, complexity: 6, hominess: 6, materials: ['walnut', 'velvet', 'steel'], palette: 'cool_neutral' },
  { key: 'traditional_warm_layered', ct: 7, ml: 7, wc: 3, complexity: 7, hominess: 9, materials: ['mahogany', 'leather', 'brass'], palette: 'warm_neutral', region: 'english_country' },
  { key: 'transitional', ct: 5, ml: 5, wc: 5, complexity: 5, hominess: 7, materials: ['oak', 'linen', 'bronze'], palette: 'warm_neutral' },
  { key: 'organic_modern', ct: 3, ml: 4, wc: 4, complexity: 5, hominess: 8, materials: ['reclaimed_wood', 'wool', 'stone'], palette: 'earth_tones' },
];

familyStyles.forEach((style) => {
  subcategories.family_areas.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'family_areas', sub, style.key, style));
  });
});

// ===========================================
// 6. PRIMARY BEDROOMS
// ===========================================
const bedroomStyles = [
  { key: 'contemporary_warm_minimal', ct: 2, ml: 2, wc: 3, hominess: 7, materials: ['oak', 'linen', 'plaster'], palette: 'warm_neutral' },
  { key: 'contemporary_cool_minimal', ct: 2, ml: 2, wc: 7, hominess: 5, materials: ['walnut', 'cotton', 'glass'], palette: 'cool_neutral' },
  { key: 'traditional_warm_layered', ct: 8, ml: 8, wc: 3, hominess: 9, materials: ['mahogany', 'silk', 'velvet'], palette: 'warm_neutral' },
  { key: 'organic_modern', ct: 3, ml: 4, wc: 4, hominess: 8, materials: ['reclaimed_wood', 'wool', 'stone'], palette: 'earth_tones' },
  { key: 'japanese', ct: 3, ml: 2, wc: 5, hominess: 7, materials: ['cedar', 'paper', 'tatami'], palette: 'warm_neutral' },
];

bedroomStyles.forEach((style) => {
  subcategories.primary_bedrooms.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'primary_bedrooms', sub, style.key, style));
  });
});

// ===========================================
// 7. PRIMARY BATHROOMS
// ===========================================
const bathroomStyles = [
  { key: 'contemporary_warm_minimal', ct: 2, ml: 2, wc: 4, materials: ['travertine', 'oak', 'brass'], light: 9 },
  { key: 'contemporary_cool_minimal', ct: 2, ml: 2, wc: 8, materials: ['marble', 'glass', 'chrome'], light: 8 },
  { key: 'traditional_warm_layered', ct: 7, ml: 6, wc: 4, materials: ['marble', 'mahogany', 'brass'], light: 7 },
  { key: 'organic_modern', ct: 3, ml: 3, wc: 5, materials: ['stone', 'teak', 'bronze'], light: 8 },
  { key: 'japanese', ct: 3, ml: 2, wc: 5, materials: ['cedar', 'stone', 'copper'], light: 7 },
];

bathroomStyles.forEach((style) => {
  subcategories.primary_bathrooms.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'primary_bathrooms', sub, style.key, style));
  });
});

// ===========================================
// 8. GUEST BEDROOMS (NEW)
// ===========================================
const guestBedroomStyles = [
  { key: 'contemporary_warm_minimal', ct: 2, ml: 3, wc: 4, hominess: 7, materials: ['oak', 'linen', 'plaster'], palette: 'warm_neutral' },
  { key: 'contemporary_cool_minimal', ct: 2, ml: 2, wc: 6, hominess: 6, materials: ['walnut', 'cotton', 'glass'], palette: 'cool_neutral' },
  { key: 'traditional_warm_layered', ct: 7, ml: 6, wc: 3, hominess: 8, materials: ['cherry', 'linen', 'brass'], palette: 'warm_neutral' },
  { key: 'transitional', ct: 5, ml: 4, wc: 5, hominess: 7, materials: ['oak', 'cotton', 'nickel'], palette: 'warm_neutral' },
];

guestBedroomStyles.forEach((style) => {
  subcategories.guest_bedrooms.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'guest_bedrooms', sub, style.key, style));
  });
});

// ===========================================
// 9. EXTERIOR LANDSCAPE (Pools, Tennis, Gardens)
// ===========================================
const landscapeStyles = [
  { key: 'california', ct: 3, ml: 3, wc: 5, materials: ['stone', 'native_plants'], region: 'california_modern', scale: 'generous' },
  { key: 'mediterranean', ct: 6, ml: 5, wc: 4, materials: ['stone', 'terracotta'], region: 'mediterranean', scale: 'grand' },
  { key: 'traditional_warm_layered', ct: 7, ml: 6, wc: 4, materials: ['boxwood', 'gravel'], region: 'english_country', scale: 'estate' },
  { key: 'contemporary_cool_minimal', ct: 2, ml: 2, wc: 6, materials: ['concrete', 'ornamental_grass'], region: 'international_modern', scale: 'generous' },
  { key: 'organic_modern', ct: 3, ml: 4, wc: 5, materials: ['native_stone', 'wildflowers'], region: 'pacific_northwest', scale: 'comfortable' },
  { key: 'japanese', ct: 4, ml: 3, wc: 5, materials: ['gravel', 'moss', 'bamboo'], region: 'japanese_modern', scale: 'intimate' },
];

landscapeStyles.forEach((style) => {
  subcategories.exterior_landscape.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'exterior_landscape', sub, style.key, style));
  });
});

// ===========================================
// 10. OUTDOOR LIVING (Connection to Interior)
// ===========================================
const outdoorStyles = [
  { key: 'contemporary_warm_minimal', ct: 2, ml: 3, wc: 4, materials: ['teak', 'concrete', 'stone'], region: 'california_modern' },
  { key: 'contemporary_cool_minimal', ct: 2, ml: 2, wc: 6, materials: ['metal', 'concrete', 'glass'], region: 'miami_modern' },
  { key: 'mediterranean', ct: 6, ml: 6, wc: 3, materials: ['terracotta', 'stone', 'iron'], region: 'mediterranean' },
  { key: 'transitional', ct: 5, ml: 4, wc: 5, materials: ['stone', 'wood', 'fabric'], region: 'hamptons' },
  { key: 'organic_modern', ct: 3, ml: 4, wc: 4, materials: ['reclaimed_wood', 'stone', 'copper'], region: 'pacific_northwest' },
];

outdoorStyles.forEach((style) => {
  subcategories.outdoor_living.forEach(sub => {
    placeholderImages.push(generateImage(imageId++, 'outdoor_living', sub, style.key, style));
  });
});

// Generate boards based on Phase 1 results
export const generateBoards = (phase1Results) => {
  const { love, ok } = phase1Results;
  const allPositive = [...love, ...ok];
  
  if (allPositive.length < 12) {
    // Not enough data - return generic boards
    return getDefaultBoards();
  }
  
  // Analyze style tendencies
  const avgAxes = {
    contemporary_traditional: 0,
    minimal_layered: 0,
    warm_cool: 0
  };
  
  allPositive.forEach(img => {
    avgAxes.contemporary_traditional += img.style_axes.contemporary_traditional;
    avgAxes.minimal_layered += img.style_axes.minimal_layered;
    avgAxes.warm_cool += img.style_axes.warm_cool;
  });
  
  Object.keys(avgAxes).forEach(key => {
    avgAxes[key] = avgAxes[key] / allPositive.length;
  });
  
  // Generate themed boards based on detected preferences
  const boards = [];
  
  // Board 1: Primary detected style
  const primaryStyle = avgAxes.contemporary_traditional < 5 ? 'contemporary' : 'traditional';
  const primaryTemp = avgAxes.warm_cool < 5 ? 'warm' : 'cool';
  boards.push({
    id: 'board_1',
    title: `${primaryStyle.charAt(0).toUpperCase() + primaryStyle.slice(1)} ${primaryTemp.charAt(0).toUpperCase() + primaryTemp.slice(1)}`,
    description: 'Images aligned with your primary preferences',
    images: allPositive
      .filter(img => 
        (primaryStyle === 'contemporary' ? img.style_axes.contemporary_traditional < 5 : img.style_axes.contemporary_traditional >= 5) &&
        (primaryTemp === 'warm' ? img.style_axes.warm_cool < 5 : img.style_axes.warm_cool >= 5)
      )
      .slice(0, 12)
  });
  
  // Board 2: Alternative exploration
  boards.push({
    id: 'board_2',
    title: 'Materials & Textures',
    description: 'Focus on material preferences',
    images: allPositive
      .filter(img => img.category === 'materials_textures' || img.physical.natural_light > 6)
      .slice(0, 12)
  });
  
  // Board 3: Complexity range
  const preferredComplexity = allPositive.reduce((sum, img) => sum + img.psychological.complexity, 0) / allPositive.length;
  boards.push({
    id: 'board_3',
    title: preferredComplexity < 5 ? 'Refined Simplicity' : 'Rich & Layered',
    description: 'Exploring visual density preferences',
    images: allPositive
      .filter(img => 
        preferredComplexity < 5 
          ? img.psychological.complexity < 5 
          : img.psychological.complexity >= 5
      )
      .slice(0, 12)
  });
  
  // Board 4: Regional influence
  boards.push({
    id: 'board_4',
    title: 'Regional Character',
    description: 'Exploring place-based aesthetics',
    images: allPositive
      .filter(img => img.context.region_influence !== 'international_modern')
      .slice(0, 12)
  });
  
  // Fill any short boards with placeholders
  boards.forEach(board => {
    while (board.images.length < 9) {
      const randomImg = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
      if (!board.images.find(img => img.id === randomImg.id)) {
        board.images.push(randomImg);
      }
    }
    board.images = board.images.slice(0, 12);
  });
  
  return boards;
};

const getDefaultBoards = () => {
  return [
    {
      id: 'board_1',
      title: 'Contemporary Warmth',
      description: 'Clean lines with warm materials',
      images: placeholderImages.filter(img => 
        img.style_axes.contemporary_traditional < 4 && img.style_axes.warm_cool < 5
      ).slice(0, 12)
    },
    {
      id: 'board_2',
      title: 'Traditional Elegance',
      description: 'Classic proportions and rich details',
      images: placeholderImages.filter(img => 
        img.style_axes.contemporary_traditional > 6
      ).slice(0, 12)
    },
    {
      id: 'board_3',
      title: 'Organic Modern',
      description: 'Natural forms and materials',
      images: placeholderImages.filter(img => 
        img.style_axes.organic_geometric < 4
      ).slice(0, 12)
    },
    {
      id: 'board_4',
      title: 'Minimal Refinement',
      description: 'Spare and intentional',
      images: placeholderImages.filter(img => 
        img.style_axes.minimal_layered < 4
      ).slice(0, 12)
    }
  ];
};

export default placeholderImages;
