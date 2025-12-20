# N4S Taste Exploration

**Task Code:** P1.C.3  
**Module:** C (FYI - Find Your Inspiration)  
**Phase:** P1 (Ask the Right Questions)

## Overview

A client-facing visual preference elicitation module for the N4S ultra-luxury residential advisory platform. Uses **comparative ranking methodology** with image quads to derive nuanced aesthetic profiles without requiring clients to articulate preferences verbally.

## Key Innovation: Quad-Based Ranking

Instead of swiping individual images (love/ok/not), clients **rank 4 images at a time**. Each quad shows 4 variations on a theme - for example, 4 different entry door treatments ranging from minimal to grand.

**Why this is better:**
- **Comparative judgment** is more reliable than absolute judgment
- **Captures nuance** - within "contemporary entry doors," do they prefer minimal or statement?
- **More data per interaction** - one quad = ranking of 4 images
- **Faster completion** - 36 quads vs 144 individual swipes
- **Richer insights** - we know what they prefer *within* each variation dimension

## Three-Phase Methodology

### Phase 1: Comparative Ranking (Quads)
- 36 quads presented (144 images total)
- Each quad = 4 variations on a theme
- Client taps images in order of preference (1st through 4th)
- Organized by category with divider cards between sections

**Categories (in client journey order):**
1. Exterior Architecture (6 quads)
2. Living Spaces (6 quads)
3. Dining Spaces (4 quads)
4. Kitchens (4 quads)
5. Family Areas (3 quads)
6. Primary Bedrooms (3 quads)
7. Primary Bathrooms (3 quads)
8. Guest Bedrooms (2 quads)
9. Exterior Landscape (4 quads)
10. Outdoor Living (3 quads)

**Variation Dimensions Captured:**
- material_warmth
- door_treatment
- formality_level
- ornamentation
- complexity
- glazing_ratio
- layering
- warmth
- period_influence
- natural_influence
- regional_intensity
- cabinet_style
- comfort_level
- luxury_level
- spa_intensity
- minimalism
- pool_style
- enclosure
- indoor_outdoor_connection

### Phase 2: Refinement (Board Selection)
- 4 curated boards generated from top-ranked images
- Client selects top 3 from each board
- Forces prioritization among favorites

### Phase 3: Resolution (Binary Choice)
- 6 "This or That" pairs
- Resolves detected preference tensions:
  - Warmth (Cool vs Warm)
  - Complexity (Minimal vs Layered)
  - Period (Contemporary vs Traditional)
  - Formality (Casual vs Formal)
  - Nature (Architectural vs Organic)
  - Ornamentation (Restrained vs Decorative)

## Profile Output

The generated profile includes:

### Style Axes (5 dimensions, 1-10 scale)
- Contemporary ↔ Traditional
- Minimal ↔ Layered
- Warm ↔ Cool
- Organic ↔ Geometric
- Refined ↔ Eclectic

Each with confidence score based on ranking consistency.

### Variation Preferences
Unique insight from quad comparisons - shows which end of each variation dimension client prefers (e.g., "door_treatment: prefers minimal, 78% strength").

### Complexity Calibration
- Optimal complexity level
- Acceptable range
- Consistency score

### Material Affinities
- Primary affinities (strongly preferred)
- Secondary affinities (also liked)
- Aversions (consistently ranked low)

### Style Tags
Auto-derived labels: "contemporary", "warm_palette", "minimal", etc.

## Divider Cards

Before each category, a full-screen divider card appears showing:
- Category icon and title
- Description of what they'll be evaluating
- Progress indicator (Category X of 10)
- Number of quads in the category
- Reminder of the ranking interaction
- "Begin [Category]" button

## Technical Stack

- React 18
- Context API for state management
- Lucide React icons
- CSS custom properties
- Mobile-first responsive design

## Deployment (IONOS Deploy Now)

1. Push to GitHub repository
2. IONOS auto-deploys with these settings:
   - Build commands: `npm install` then `CI=false npm run build`
   - Output directory: `build`

## File Structure

```
src/
├── components/
│   ├── Welcome/
│   ├── PhaseOne/         # Quad ranking + dividers
│   ├── PhaseTwo/         # Board selection
│   ├── PhaseThree/       # Binary choice
│   ├── Completion/       # Profile display
│   └── shared/
│       ├── DividerCard.jsx
│       ├── QuadCard.jsx  # The 4-image ranking component
│       └── ProgressIndicator.jsx
├── contexts/
│   └── TasteContext.jsx  # State management
├── data/
│   └── quadImages.js     # Image quads with metadata
├── utils/
│   └── profileCalculator.js  # Ranking → profile algorithm
└── styles/
    └── index.css
```

## Keyboard Shortcuts

- **Enter/Space** - Continue past divider cards
- Images are tapped (no keyboard shortcuts for ranking)

## Data Flow

```
Quad Rankings → Weighted Analysis → Style Axes
                                  → Variation Preferences
                                  → Material Affinities
                                  → Complexity Profile
                          ↓
Phase 2 Selections → Priority Refinement
                          ↓
Phase 3 Choices → Tension Resolution
                          ↓
                   Final Profile (JSON export)
```

## Ranking Weight Algorithm

```javascript
const RANK_WEIGHTS = {
  1: 4.0,   // 1st choice - strong positive signal
  2: 2.5,   // 2nd choice - positive signal
  3: 1.0,   // 3rd choice - neutral
  4: 0.25   // 4th choice - slight negative signal
};
```

## Next Steps

- P1.C.2: Generate 144 AI images (36 quads × 4 images)
- P2.C.1: Integrate with FYI architect matching
- P2.C.2: Multi-stakeholder divergence reporting

---

*N4S Taste Exploration v4.0 - Quad Ranking Edition*
