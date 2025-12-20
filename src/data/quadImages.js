// Quad-Based Image Library
// Each quad contains 4 variations on a theme, allowing comparative ranking

// Style gradient generators for visual placeholders
const styleGradients = {
  contemporary_warm_minimal: 'linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 50%, #d4c4a8 100%)',
  contemporary_cool_minimal: 'linear-gradient(135deg, #e8eef4 0%, #d1dce6 50%, #b8c8d8 100%)',
  contemporary_warm_layered: 'linear-gradient(135deg, #e8d4b8 0%, #c9a962 50%, #a67c52 100%)',
  contemporary_cool_layered: 'linear-gradient(135deg, #b8c8d8 0%, #8fa4b8 50%, #667d94 100%)',
  traditional_warm: 'linear-gradient(135deg, #c9a962 0%, #8b6914 50%, #5c4a28 100%)',
  traditional_cool: 'linear-gradient(135deg, #667d94 0%, #4a5d70 50%, #2d3d4d 100%)',
  transitional: 'linear-gradient(135deg, #d4c4a8 0%, #b8b8b8 50%, #a8b8c8 100%)',
  organic_modern: 'linear-gradient(135deg, #c8d4c0 0%, #a8b89c 50%, #889878 100%)',
  mediterranean: 'linear-gradient(135deg, #f0e4d0 0%, #d4b896 50%, #b89060 100%)',
  japanese: 'linear-gradient(135deg, #e8e4dc 0%, #d4cec4 50%, #c0b8ac 100%)',
};

// Variation descriptions for each position in a quad
const variationLabels = {
  minimal: 'Minimal',
  moderate: 'Moderate', 
  statement: 'Statement',
  grand: 'Grand',
  simple: 'Simple',
  refined: 'Refined',
  elaborate: 'Elaborate',
  ornate: 'Ornate',
  spare: 'Spare',
  curated: 'Curated',
  layered: 'Layered',
  rich: 'Rich',
  cool: 'Cool',
  neutral: 'Neutral',
  warm: 'Warm',
  earthy: 'Earthy'
};

// Category order for client journey
export const categoryOrder = [
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

// Generate a quad with 4 variations
const createQuad = (quadId, category, subcategory, baseStyle, variationDimension, variations) => {
  const baseGradient = styleGradients[baseStyle] || styleGradients.transitional;
  
  return {
    quadId,
    category,
    subcategory,
    baseStyle,
    variationDimension, // What differs across the 4 images (e.g., 'door_treatment', 'ornamentation', 'material_warmth')
    displayTitle: `${category.replace(/_/g, ' ')} - ${subcategory.replace(/_/g, ' ')}`.replace(/\b\w/g, l => l.toUpperCase()),
    images: variations.map((v, idx) => ({
      id: `${quadId}-${String.fromCharCode(65 + idx)}`, // A, B, C, D
      quadId,
      position: idx,
      variationLabel: v.label,
      gradient: adjustGradient(baseGradient, v.gradientShift || 0),
      
      // Style axes (1-10) - base values modified by variation
      style_axes: {
        contemporary_traditional: v.ct ?? 5,
        minimal_layered: v.ml ?? 5,
        warm_cool: v.wc ?? 5,
        organic_geometric: v.og ?? 5,
        refined_eclectic: v.re ?? 5
      },
      
      // Variation-specific dimension value
      variationValue: v.value, // 1-10 scale for the varying dimension
      
      // Physical attributes
      physical: {
        primary_materials: v.materials || ['oak', 'stone', 'glass'],
        ornamentation_level: v.ornamentation ?? 5,
        scale_impression: v.scale || 'generous'
      },
      
      // Psychological
      psychological: {
        complexity: v.complexity ?? 5,
        formality: v.formality ?? 5
      }
    }))
  };
};

// Adjust gradient based on variation (slight color shifts)
const adjustGradient = (baseGradient, shift) => {
  if (shift === 0) return baseGradient;
  // For now, return base - in production, would calculate color shifts
  return baseGradient;
};

// ===========================================
// QUAD LIBRARY
// ===========================================

export const quads = [];

// ===========================================
// EXTERIOR ARCHITECTURE (6 Quads)
// ===========================================

quads.push(createQuad(
  'EA-001', 'exterior_architecture', 'facade', 'contemporary_warm_minimal',
  'material_warmth',
  [
    { label: 'Cool Minimal', value: 2, ct: 2, ml: 2, wc: 7, materials: ['concrete', 'glass', 'steel'], complexity: 3 },
    { label: 'Warm Minimal', value: 4, ct: 2, ml: 2, wc: 4, materials: ['wood', 'glass', 'limestone'], complexity: 3 },
    { label: 'Warm Natural', value: 6, ct: 3, ml: 3, wc: 3, materials: ['wood', 'stone', 'copper'], complexity: 4 },
    { label: 'Rich Warm', value: 8, ct: 4, ml: 5, wc: 2, materials: ['wood', 'stone', 'bronze'], complexity: 5 }
  ]
));

quads.push(createQuad(
  'EA-002', 'exterior_architecture', 'entry', 'contemporary_warm_minimal',
  'door_treatment',
  [
    { label: 'Minimal', value: 2, ct: 2, ml: 2, ornamentation: 1, formality: 3, materials: ['oak', 'glass'] },
    { label: 'Refined', value: 4, ct: 3, ml: 3, ornamentation: 3, formality: 5, materials: ['oak', 'bronze', 'limestone'] },
    { label: 'Statement', value: 7, ct: 4, ml: 5, ornamentation: 5, formality: 7, materials: ['walnut', 'brass', 'stone'] },
    { label: 'Grand', value: 9, ct: 6, ml: 7, ornamentation: 8, formality: 9, materials: ['mahogany', 'iron', 'marble'] }
  ]
));

quads.push(createQuad(
  'EA-003', 'exterior_architecture', 'facade', 'traditional_warm',
  'formality_level',
  [
    { label: 'Relaxed Traditional', value: 3, ct: 6, ml: 4, formality: 4, materials: ['stone', 'wood', 'copper'] },
    { label: 'Classic', value: 5, ct: 7, ml: 5, formality: 6, materials: ['limestone', 'slate', 'iron'] },
    { label: 'Formal', value: 7, ct: 8, ml: 6, formality: 8, materials: ['limestone', 'copper', 'lead'] },
    { label: 'Grand Estate', value: 9, ct: 9, ml: 7, formality: 10, materials: ['marble', 'bronze', 'slate'] }
  ]
));

quads.push(createQuad(
  'EA-004', 'exterior_architecture', 'entry', 'mediterranean',
  'ornamentation',
  [
    { label: 'Simple Med', value: 2, ct: 5, ml: 3, ornamentation: 2, materials: ['stucco', 'wood', 'iron'] },
    { label: 'Classic Med', value: 4, ct: 6, ml: 5, ornamentation: 4, materials: ['stucco', 'terracotta', 'iron'] },
    { label: 'Detailed', value: 7, ct: 7, ml: 6, ornamentation: 7, materials: ['stone', 'terracotta', 'bronze'] },
    { label: 'Ornate Villa', value: 9, ct: 8, ml: 8, ornamentation: 9, materials: ['carved_stone', 'iron', 'terracotta'] }
  ]
));

quads.push(createQuad(
  'EA-005', 'exterior_architecture', 'aerial', 'contemporary_warm_minimal',
  'complexity',
  [
    { label: 'Single Volume', value: 2, complexity: 2, ml: 2, materials: ['wood', 'glass'] },
    { label: 'Linked Volumes', value: 4, complexity: 4, ml: 3, materials: ['wood', 'glass', 'stone'] },
    { label: 'Compound', value: 6, complexity: 6, ml: 5, materials: ['wood', 'stone', 'copper'] },
    { label: 'Estate Complex', value: 8, complexity: 8, ml: 7, materials: ['varied'] }
  ]
));

quads.push(createQuad(
  'EA-006', 'exterior_architecture', 'dusk_shot', 'transitional',
  'glazing_ratio',
  [
    { label: 'Solid Dominant', value: 3, materials: ['stone', 'wood'], complexity: 4 },
    { label: 'Balanced', value: 5, materials: ['stone', 'glass', 'wood'], complexity: 5 },
    { label: 'Glass Forward', value: 7, materials: ['glass', 'steel', 'stone'], complexity: 5 },
    { label: 'Maximum Glass', value: 9, materials: ['glass', 'steel'], complexity: 4 }
  ]
));

// ===========================================
// LIVING SPACES (6 Quads)
// ===========================================

quads.push(createQuad(
  'LS-001', 'living_spaces', 'great_room', 'contemporary_warm_minimal',
  'layering',
  [
    { label: 'Spare', value: 2, ml: 2, complexity: 2, materials: ['oak', 'plaster', 'linen'] },
    { label: 'Curated', value: 4, ml: 4, complexity: 4, materials: ['oak', 'limestone', 'leather'] },
    { label: 'Layered', value: 6, ml: 6, complexity: 6, materials: ['walnut', 'stone', 'velvet'] },
    { label: 'Rich', value: 8, ml: 8, complexity: 8, materials: ['walnut', 'marble', 'silk'] }
  ]
));

quads.push(createQuad(
  'LS-002', 'living_spaces', 'formal_living', 'transitional',
  'formality',
  [
    { label: 'Relaxed', value: 3, formality: 3, ct: 4, materials: ['oak', 'linen', 'wool'] },
    { label: 'Comfortable', value: 5, formality: 5, ct: 5, materials: ['walnut', 'velvet', 'brass'] },
    { label: 'Refined', value: 7, formality: 7, ct: 6, materials: ['mahogany', 'silk', 'marble'] },
    { label: 'Formal', value: 9, formality: 9, ct: 7, materials: ['mahogany', 'damask', 'gilt'] }
  ]
));

quads.push(createQuad(
  'LS-003', 'living_spaces', 'great_room', 'contemporary_cool_minimal',
  'warmth',
  [
    { label: 'Cool', value: 8, wc: 8, materials: ['concrete', 'glass', 'steel'] },
    { label: 'Cool Neutral', value: 6, wc: 6, materials: ['white_oak', 'glass', 'chrome'] },
    { label: 'Warm Neutral', value: 4, wc: 4, materials: ['oak', 'linen', 'bronze'] },
    { label: 'Warm', value: 2, wc: 2, materials: ['walnut', 'leather', 'brass'] }
  ]
));

quads.push(createQuad(
  'LS-004', 'living_spaces', 'salon', 'traditional_warm',
  'period_influence',
  [
    { label: 'Updated Classic', value: 4, ct: 6, ml: 4, materials: ['oak', 'linen', 'brass'] },
    { label: 'Traditional', value: 6, ct: 7, ml: 6, materials: ['mahogany', 'velvet', 'marble'] },
    { label: 'Period', value: 8, ct: 8, ml: 7, materials: ['mahogany', 'silk', 'gilt'] },
    { label: 'Grand Period', value: 10, ct: 9, ml: 8, materials: ['mahogany', 'damask', 'crystal'] }
  ]
));

quads.push(createQuad(
  'LS-005', 'living_spaces', 'great_room', 'organic_modern',
  'natural_influence',
  [
    { label: 'Subtle Natural', value: 3, og: 3, materials: ['oak', 'linen', 'stone'] },
    { label: 'Natural Modern', value: 5, og: 4, materials: ['reclaimed_wood', 'wool', 'bronze'] },
    { label: 'Organic', value: 7, og: 2, materials: ['live_edge_wood', 'clay', 'copper'] },
    { label: 'Biophilic', value: 9, og: 1, materials: ['raw_wood', 'stone', 'plants'] }
  ]
));

quads.push(createQuad(
  'LS-006', 'living_spaces', 'formal_living', 'mediterranean',
  'regional_intensity',
  [
    { label: 'Light Med', value: 3, ct: 5, complexity: 4, materials: ['plaster', 'terracotta', 'linen'] },
    { label: 'Classic Med', value: 5, ct: 6, complexity: 5, materials: ['stucco', 'terracotta', 'iron'] },
    { label: 'Villa Style', value: 7, ct: 7, complexity: 6, materials: ['stone', 'terracotta', 'wood'] },
    { label: 'Full Med', value: 9, ct: 8, complexity: 7, materials: ['carved_stone', 'tile', 'iron'] }
  ]
));

// ===========================================
// DINING SPACES (4 Quads)
// ===========================================

quads.push(createQuad(
  'DS-001', 'dining_spaces', 'formal_dining', 'contemporary_warm_minimal',
  'formality',
  [
    { label: 'Casual Elegant', value: 3, formality: 3, materials: ['oak', 'linen', 'brass'] },
    { label: 'Relaxed Formal', value: 5, formality: 5, materials: ['walnut', 'leather', 'bronze'] },
    { label: 'Formal', value: 7, formality: 7, materials: ['walnut', 'velvet', 'marble'] },
    { label: 'Grand Formal', value: 9, formality: 9, materials: ['ebony', 'silk', 'crystal'] }
  ]
));

quads.push(createQuad(
  'DS-002', 'dining_spaces', 'casual_dining', 'transitional',
  'warmth',
  [
    { label: 'Cool', value: 7, wc: 7, materials: ['white_oak', 'chrome', 'glass'] },
    { label: 'Neutral', value: 5, wc: 5, materials: ['oak', 'nickel', 'linen'] },
    { label: 'Warm', value: 3, wc: 3, materials: ['walnut', 'brass', 'leather'] },
    { label: 'Rich Warm', value: 1, wc: 1, materials: ['mahogany', 'bronze', 'velvet'] }
  ]
));

quads.push(createQuad(
  'DS-003', 'dining_spaces', 'breakfast_room', 'traditional_warm',
  'ornamentation',
  [
    { label: 'Simple', value: 2, ornamentation: 2, ct: 6, materials: ['painted_wood', 'cotton', 'brass'] },
    { label: 'Classic', value: 4, ornamentation: 4, ct: 7, materials: ['cherry', 'chintz', 'porcelain'] },
    { label: 'Detailed', value: 6, ornamentation: 6, ct: 7, materials: ['mahogany', 'toile', 'silver'] },
    { label: 'Ornate', value: 8, ornamentation: 8, ct: 8, materials: ['mahogany', 'damask', 'crystal'] }
  ]
));

quads.push(createQuad(
  'DS-004', 'dining_spaces', 'formal_dining', 'mediterranean',
  'rusticity',
  [
    { label: 'Refined Med', value: 2, complexity: 4, materials: ['painted_wood', 'linen', 'iron'] },
    { label: 'Classic Med', value: 4, complexity: 5, materials: ['wood', 'terracotta', 'iron'] },
    { label: 'Rustic Med', value: 6, complexity: 6, materials: ['reclaimed_wood', 'terracotta', 'iron'] },
    { label: 'Full Rustic', value: 8, complexity: 7, materials: ['antique_wood', 'stone', 'iron'] }
  ]
));

// ===========================================
// KITCHENS (4 Quads)
// ===========================================

quads.push(createQuad(
  'KT-001', 'kitchens', 'chef_kitchen', 'contemporary_warm_minimal',
  'cabinet_style',
  [
    { label: 'Flat Panel', value: 2, ml: 2, ct: 2, materials: ['oak', 'quartz', 'brass'] },
    { label: 'Subtle Detail', value: 4, ml: 3, ct: 3, materials: ['oak', 'marble', 'brass'] },
    { label: 'Shaker', value: 6, ml: 4, ct: 5, materials: ['painted_wood', 'marble', 'nickel'] },
    { label: 'Raised Panel', value: 8, ml: 6, ct: 7, materials: ['cherry', 'marble', 'brass'] }
  ]
));

quads.push(createQuad(
  'KT-002', 'kitchens', 'open_plan', 'transitional',
  'warmth',
  [
    { label: 'Cool Modern', value: 7, wc: 7, materials: ['white_lacquer', 'quartz', 'chrome'] },
    { label: 'Neutral', value: 5, wc: 5, materials: ['gray_painted', 'quartz', 'nickel'] },
    { label: 'Warm', value: 3, wc: 3, materials: ['oak', 'marble', 'brass'] },
    { label: 'Rich Warm', value: 1, wc: 1, materials: ['walnut', 'granite', 'bronze'] }
  ]
));

quads.push(createQuad(
  'KT-003', 'kitchens', 'chef_kitchen', 'traditional_warm',
  'ornamentation',
  [
    { label: 'Simple Traditional', value: 2, ornamentation: 2, materials: ['painted_wood', 'marble', 'brass'] },
    { label: 'Classic', value: 4, ornamentation: 4, materials: ['glazed_wood', 'marble', 'brass'] },
    { label: 'Detailed', value: 6, ornamentation: 6, materials: ['carved_wood', 'marble', 'copper'] },
    { label: 'Ornate', value: 8, ornamentation: 8, materials: ['carved_wood', 'marble', 'brass_inlay'] }
  ]
));

quads.push(createQuad(
  'KT-004', 'kitchens', 'catering_kitchen', 'contemporary_cool_minimal',
  'professional_level',
  [
    { label: 'Home Chef', value: 3, complexity: 4, materials: ['stainless', 'quartz', 'oak'] },
    { label: 'Serious Cook', value: 5, complexity: 5, materials: ['stainless', 'marble', 'walnut'] },
    { label: 'Professional', value: 7, complexity: 6, materials: ['stainless', 'zinc', 'oak'] },
    { label: 'Restaurant Grade', value: 9, complexity: 7, materials: ['stainless', 'concrete', 'metal'] }
  ]
));

// ===========================================
// FAMILY AREAS (3 Quads)
// ===========================================

quads.push(createQuad(
  'FA-001', 'family_areas', 'family_room', 'transitional',
  'comfort_level',
  [
    { label: 'Refined Comfort', value: 3, ml: 3, formality: 5, materials: ['oak', 'linen', 'wool'] },
    { label: 'Relaxed', value: 5, ml: 4, formality: 4, materials: ['oak', 'leather', 'cotton'] },
    { label: 'Casual', value: 7, ml: 5, formality: 3, materials: ['reclaimed_wood', 'denim', 'sisal'] },
    { label: 'Ultra Casual', value: 9, ml: 6, formality: 2, materials: ['mixed_wood', 'canvas', 'jute'] }
  ]
));

quads.push(createQuad(
  'FA-002', 'family_areas', 'media_room', 'contemporary_warm_layered',
  'luxury_level',
  [
    { label: 'Comfortable', value: 4, complexity: 4, materials: ['fabric', 'wood', 'wool'] },
    { label: 'Upscale', value: 6, complexity: 5, materials: ['velvet', 'walnut', 'brass'] },
    { label: 'Luxury', value: 8, complexity: 6, materials: ['leather', 'walnut', 'bronze'] },
    { label: 'Ultimate', value: 10, complexity: 7, materials: ['leather', 'ebony', 'suede'] }
  ]
));

quads.push(createQuad(
  'FA-003', 'family_areas', 'game_room', 'traditional_warm',
  'formality',
  [
    { label: 'Casual Game', value: 3, formality: 3, materials: ['oak', 'leather', 'brass'] },
    { label: 'Club Style', value: 5, formality: 5, materials: ['mahogany', 'leather', 'brass'] },
    { label: 'Refined Club', value: 7, formality: 7, materials: ['mahogany', 'leather', 'bronze'] },
    { label: 'Gentlemen\'s Club', value: 9, formality: 9, materials: ['mahogany', 'leather', 'gilt'] }
  ]
));

// ===========================================
// PRIMARY BEDROOMS (3 Quads)
// ===========================================

quads.push(createQuad(
  'PB-001', 'primary_bedrooms', 'master_suite', 'contemporary_warm_minimal',
  'warmth',
  [
    { label: 'Cool Serene', value: 7, wc: 7, materials: ['white_oak', 'linen', 'chrome'] },
    { label: 'Neutral', value: 5, wc: 5, materials: ['oak', 'linen', 'nickel'] },
    { label: 'Warm', value: 3, wc: 3, materials: ['walnut', 'cashmere', 'brass'] },
    { label: 'Cozy Warm', value: 1, wc: 1, materials: ['walnut', 'velvet', 'bronze'] }
  ]
));

quads.push(createQuad(
  'PB-002', 'primary_bedrooms', 'sleeping_retreat', 'organic_modern',
  'natural_influence',
  [
    { label: 'Subtle Natural', value: 3, og: 4, materials: ['oak', 'linen', 'stone'] },
    { label: 'Natural', value: 5, og: 3, materials: ['teak', 'cotton', 'clay'] },
    { label: 'Organic', value: 7, og: 2, materials: ['reclaimed_wood', 'wool', 'earth'] },
    { label: 'Full Wabi-Sabi', value: 9, og: 1, materials: ['raw_wood', 'hemp', 'plaster'] }
  ]
));

quads.push(createQuad(
  'PB-003', 'primary_bedrooms', 'master_suite', 'traditional_warm',
  'luxury_level',
  [
    { label: 'Classic Comfort', value: 4, complexity: 4, materials: ['cherry', 'cotton', 'brass'] },
    { label: 'Traditional Luxury', value: 6, complexity: 6, materials: ['mahogany', 'silk', 'crystal'] },
    { label: 'Grand', value: 8, complexity: 7, materials: ['mahogany', 'damask', 'gilt'] },
    { label: 'Palatial', value: 10, complexity: 8, materials: ['ebony', 'silk', 'gold_leaf'] }
  ]
));

// ===========================================
// PRIMARY BATHROOMS (3 Quads)
// ===========================================

quads.push(createQuad(
  'BTH-001', 'primary_bathrooms', 'spa_suite', 'contemporary_warm_minimal',
  'spa_intensity',
  [
    { label: 'Clean Modern', value: 3, complexity: 3, materials: ['marble', 'glass', 'chrome'] },
    { label: 'Spa Touch', value: 5, complexity: 4, materials: ['travertine', 'teak', 'brass'] },
    { label: 'Full Spa', value: 7, complexity: 5, materials: ['stone', 'teak', 'bronze'] },
    { label: 'Resort Spa', value: 9, complexity: 6, materials: ['onyx', 'teak', 'gold'] }
  ]
));

quads.push(createQuad(
  'BTH-002', 'primary_bathrooms', 'wet_room', 'japanese',
  'minimalism',
  [
    { label: 'Minimal', value: 2, ml: 2, complexity: 2, materials: ['stone', 'cedar', 'copper'] },
    { label: 'Refined', value: 4, ml: 3, complexity: 3, materials: ['stone', 'hinoki', 'bronze'] },
    { label: 'Layered', value: 6, ml: 5, complexity: 4, materials: ['stone', 'wood', 'brass'] },
    { label: 'Detailed', value: 8, ml: 6, complexity: 5, materials: ['marble', 'teak', 'gold'] }
  ]
));

quads.push(createQuad(
  'BTH-003', 'primary_bathrooms', 'his_hers', 'traditional_warm',
  'formality',
  [
    { label: 'Relaxed Classic', value: 3, formality: 3, materials: ['marble', 'painted_wood', 'nickel'] },
    { label: 'Traditional', value: 5, formality: 5, materials: ['marble', 'mahogany', 'brass'] },
    { label: 'Formal', value: 7, formality: 7, materials: ['marble', 'mahogany', 'gold'] },
    { label: 'Grand', value: 9, formality: 9, materials: ['onyx', 'mahogany', 'gilt'] }
  ]
));

// ===========================================
// GUEST BEDROOMS (2 Quads)
// ===========================================

quads.push(createQuad(
  'GB-001', 'guest_bedrooms', 'guest_suite', 'transitional',
  'warmth',
  [
    { label: 'Cool Fresh', value: 7, wc: 7, materials: ['white_oak', 'linen', 'chrome'] },
    { label: 'Neutral', value: 5, wc: 5, materials: ['oak', 'cotton', 'nickel'] },
    { label: 'Warm', value: 3, wc: 3, materials: ['walnut', 'linen', 'brass'] },
    { label: 'Cozy', value: 1, wc: 1, materials: ['walnut', 'wool', 'bronze'] }
  ]
));

quads.push(createQuad(
  'GB-002', 'guest_bedrooms', 'secondary_bedroom', 'contemporary_warm_minimal',
  'personality',
  [
    { label: 'Neutral Elegant', value: 3, complexity: 3, materials: ['oak', 'linen', 'brass'] },
    { label: 'Subtle Character', value: 5, complexity: 4, materials: ['oak', 'textured_fabric', 'brass'] },
    { label: 'Distinct', value: 7, complexity: 5, materials: ['walnut', 'pattern_fabric', 'bronze'] },
    { label: 'Bold Character', value: 9, complexity: 6, materials: ['mixed_wood', 'bold_fabric', 'mixed_metal'] }
  ]
));

// ===========================================
// EXTERIOR LANDSCAPE (4 Quads)
// ===========================================

quads.push(createQuad(
  'EL-001', 'exterior_landscape', 'arrival_sequence', 'transitional',
  'formality',
  [
    { label: 'Natural Arrival', value: 2, formality: 2, materials: ['gravel', 'native_plants'] },
    { label: 'Curated', value: 4, formality: 4, materials: ['stone', 'ornamental_grass'] },
    { label: 'Formal', value: 6, formality: 6, materials: ['pavers', 'boxwood'] },
    { label: 'Grand Estate', value: 8, formality: 8, materials: ['cobblestone', 'allée_trees'] }
  ]
));

quads.push(createQuad(
  'EL-002', 'exterior_landscape', 'swimming_pool', 'contemporary_warm_minimal',
  'pool_style',
  [
    { label: 'Geometric', value: 2, og: 7, materials: ['concrete', 'stone', 'glass_tile'] },
    { label: 'Clean Lines', value: 4, og: 6, materials: ['stone', 'teak', 'pebble'] },
    { label: 'Organic Edge', value: 6, og: 4, materials: ['natural_stone', 'wood', 'plants'] },
    { label: 'Natural Pool', value: 8, og: 2, materials: ['boulders', 'native_plants', 'gravel'] }
  ]
));

quads.push(createQuad(
  'EL-003', 'exterior_landscape', 'gardens', 'traditional_warm',
  'formality',
  [
    { label: 'Naturalistic', value: 2, formality: 2, materials: ['native_plants', 'meadow'] },
    { label: 'Cottage', value: 4, formality: 4, materials: ['perennials', 'roses', 'gravel'] },
    { label: 'Structured', value: 6, formality: 6, materials: ['boxwood', 'roses', 'gravel'] },
    { label: 'Formal Parterre', value: 8, formality: 8, materials: ['boxwood', 'topiary', 'gravel'] }
  ]
));

quads.push(createQuad(
  'EL-004', 'exterior_landscape', 'motor_court', 'transitional',
  'scale',
  [
    { label: 'Intimate', value: 3, scale: 'intimate', materials: ['gravel', 'planting'] },
    { label: 'Comfortable', value: 5, scale: 'comfortable', materials: ['pavers', 'hedges'] },
    { label: 'Generous', value: 7, scale: 'generous', materials: ['stone', 'specimen_trees'] },
    { label: 'Grand', value: 9, scale: 'monumental', materials: ['cobblestone', 'fountain'] }
  ]
));

// ===========================================
// OUTDOOR LIVING (3 Quads)
// ===========================================

quads.push(createQuad(
  'OL-001', 'outdoor_living', 'terrace', 'contemporary_warm_minimal',
  'indoor_outdoor_connection',
  [
    { label: 'Distinct Outdoor', value: 3, materials: ['stone', 'teak', 'fabric'] },
    { label: 'Transitional', value: 5, materials: ['stone', 'wood', 'upholstery'] },
    { label: 'Extended Living', value: 7, materials: ['same_as_interior', 'outdoor_fabric'] },
    { label: 'Seamless Flow', value: 9, materials: ['matching_floors', 'luxury_outdoor'] }
  ]
));

quads.push(createQuad(
  'OL-002', 'outdoor_living', 'loggia', 'mediterranean',
  'enclosure',
  [
    { label: 'Open Loggia', value: 2, materials: ['stone', 'iron', 'terracotta'] },
    { label: 'Partial Cover', value: 4, materials: ['stone', 'wood_beams', 'fabric'] },
    { label: 'Covered Outdoor', value: 6, materials: ['stone', 'timber', 'plaster'] },
    { label: 'Enclosed Veranda', value: 8, materials: ['stone', 'glass', 'iron'] }
  ]
));

quads.push(createQuad(
  'OL-003', 'outdoor_living', 'pool_cabana', 'transitional',
  'luxury_level',
  [
    { label: 'Simple Shade', value: 3, complexity: 3, materials: ['wood', 'fabric', 'stone'] },
    { label: 'Pool House', value: 5, complexity: 5, materials: ['wood', 'stone', 'teak'] },
    { label: 'Luxury Cabana', value: 7, complexity: 6, materials: ['stone', 'teak', 'brass'] },
    { label: 'Resort Cabana', value: 9, complexity: 7, materials: ['stone', 'mahogany', 'bronze'] }
  ]
));

// Export total count
export const totalQuads = quads.length;
export const totalImages = quads.length * 4;

// Get quads organized by category
export const getQuadsByCategory = () => {
  const byCategory = {};
  categoryOrder.forEach(cat => {
    byCategory[cat] = quads.filter(q => q.category === cat);
  });
  return byCategory;
};

export default quads;
