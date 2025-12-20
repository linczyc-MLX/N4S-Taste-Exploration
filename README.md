# N4S Taste Exploration

**Task Code:** P1.C.3  
**Module:** C (FYI - Find Your Inspiration)  
**Phase:** P1 (Ask the Right Questions)

## Overview

A client-facing visual preference elicitation module for the N4S ultra-luxury residential advisory platform. Uses image-based methodology to derive aesthetic profiles without requiring clients to articulate preferences verbally.

## Three-Phase Methodology

### Phase 1: Discovery (Swipe)
- **Divider cards** introduce each category before images appear
- 60 images presented in category order (not random)
- Client swipes: **Love** (right), **OK** (up), **Not for me** (left)
- Fast, intuitive, gut-reaction based
- Keyboard shortcuts: Arrow keys

**Category Order (with dividers):**
1. Exterior Architecture
2. Living Spaces
3. Dining Spaces
4. Kitchens
5. Family Areas
6. Primary Bedrooms
7. Primary Bathrooms
8. Guest Bedrooms
9. Exterior Landscape
10. Outdoor Living

### Phase 2: Refinement (Board Selection)
- 4 curated boards generated from Phase 1 results
- Each board contains 9-12 images
- Client selects top 3 from each board
- Forces prioritization

### Phase 3: Resolution (Binary Choice)
- 6 "This or That" pairs
- Resolves detected contradictions
- Quick instinct decisions

## Divider Cards

Before each category, a full-screen divider card appears showing:
- Category icon and title
- Description of what they'll be evaluating
- Progress indicator (Category X of 10)
- Reminder of the swipe actions
- "Begin [Category]" button

This orients the client and creates natural pauses in the experience.

## Derived Profile Output

The app calculates and exports:

1. **Style Profile**
   - 5 axes: Contemporary↔Traditional, Minimal↔Layered, Warm↔Cool, Organic↔Geometric, Refined↔Eclectic
   - Confidence scores per axis
   - Derived style tags

2. **Complexity Profile** (Berlyne)
   - Optimal complexity level
   - Acceptable complexity range
   - Coherence preference

3. **Material Affinities**
   - Primary affinities (drawn to)
   - Secondary affinities
   - Aversions (less drawn to)

4. **Color Profile**
   - Primary palette
   - Color temperature
   - Accent tolerance

## Session Modes

- **Together**: Couple completing collaboratively
- **Principal**: Primary decision-maker independently
- **Secondary**: Co-decision-maker independently

## Technology

- React 18
- Context API for state management
- CSS with CSS Variables for theming
- Mobile-responsive design
- Keyboard navigation support

## Deployment to IONOS

### Create New Repository
1. Create new GitHub repo: `N4S-Taste-Exploration`
2. Upload contents of `taste-exploration` folder to root

### IONOS Deploy Now Settings
| Setting | Value |
|---------|-------|
| Command 1 | `npm install` |
| Command 2 | `CI=false npm run build` |
| Output path | `build` |
| Workflow | Do not prefill workflow |

## Current Status

**✅ Complete:**
- Welcome screen with mode selection
- Phase 1: Swipe interface with animations
- Phase 2: Board selection grid
- Phase 3: Binary choice interface
- Completion: Profile visualization and export
- Progress tracking throughout
- Keyboard navigation
- Mobile responsive

**🔲 Pending:**
- Replace placeholder images with AI-generated library
- Integration with Master FYI module
- Multi-stakeholder divergence report

## Placeholder Images

Currently uses gradient backgrounds with style labels. Each "image" carries full metadata for profile calculation:

- Style axes (5 dimensions)
- Psychological dimensions (Berlyne & Coburn)
- Materials
- Color palette
- Regional influence
- Budget tier

Once AI images are generated, simply update the `placeholderImages.js` file with actual image URLs.

## File Structure

```
taste-exploration/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx
│   ├── index.js
│   ├── components/
│   │   ├── Welcome/
│   │   ├── PhaseOne/       (Swipe)
│   │   ├── PhaseTwo/       (Board Selection)
│   │   ├── PhaseThree/     (Binary Choice)
│   │   ├── Completion/     (Profile Display)
│   │   └── shared/
│   ├── contexts/
│   │   └── TasteContext.jsx
│   ├── data/
│   │   └── placeholderImages.js
│   ├── utils/
│   │   └── profileCalculator.js
│   └── styles/
│       └── index.css
└── package.json
```

## Export Format

Profile data can be exported as JSON for integration with Master FYI:

```json
{
  "style_profile": {
    "contemporary_traditional": 6.4,
    "minimal_layered": 3.8,
    "style_tags": ["contemporary", "minimal", "warm_palette"],
    "confidence": { ... }
  },
  "complexity_profile": { ... },
  "material_profile": { ... },
  "color_profile": { ... },
  "sessionMetadata": {
    "completedAt": "2025-12-20T...",
    "mode": "principal",
    "durationMinutes": 18
  },
  "raw_data": {
    "phase1": { "love": [...], "ok": [...], "notForMe": [...] },
    "phase2": { ... },
    "phase3": { ... }
  }
}
```

---

*N4S - Not4Sale | Ultra-Luxury Residential Advisory Platform*
