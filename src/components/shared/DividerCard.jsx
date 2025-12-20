import React from 'react';
import { 
  Building2, 
  Sofa, 
  UtensilsCrossed, 
  ChefHat, 
  Tv, 
  Bed, 
  Bath, 
  BedDouble,
  TreePine,
  Sun
} from 'lucide-react';

// Category metadata for divider cards
const categoryInfo = {
  exterior_architecture: {
    title: 'Exterior Architecture',
    description: 'The first impression. How do you want your home to present itself to the world?',
    icon: Building2,
    color: '#1a365d'
  },
  living_spaces: {
    title: 'Living Spaces',
    description: 'The heart of the home. Where life happens and guests are welcomed.',
    icon: Sofa,
    color: '#2c5282'
  },
  dining_spaces: {
    title: 'Dining Spaces',
    description: 'Where meals become moments. From intimate dinners to grand celebrations.',
    icon: UtensilsCrossed,
    color: '#285e61'
  },
  kitchens: {
    title: 'Kitchens',
    description: 'The culinary hub. Professional performance meets personal style.',
    icon: ChefHat,
    color: '#2d3748'
  },
  family_areas: {
    title: 'Family Areas',
    description: 'Relaxed living. Media rooms, game rooms, and spaces for unwinding.',
    icon: Tv,
    color: '#44337a'
  },
  primary_bedrooms: {
    title: 'Primary Bedrooms',
    description: 'Your private retreat. A sanctuary for rest and rejuvenation.',
    icon: Bed,
    color: '#553c9a'
  },
  primary_bathrooms: {
    title: 'Primary Bathrooms',
    description: 'Spa-like wellness. Where daily rituals become luxurious experiences.',
    icon: Bath,
    color: '#319795'
  },
  guest_bedrooms: {
    title: 'Guest Accommodations',
    description: 'Hospitality refined. Ensuring guests feel as welcome as you do.',
    icon: BedDouble,
    color: '#3182ce'
  },
  exterior_landscape: {
    title: 'Exterior Landscape',
    description: 'The grounds. Arrival sequences, pools, courts, and gardens.',
    icon: TreePine,
    color: '#276749'
  },
  outdoor_living: {
    title: 'Outdoor Living',
    description: 'Indoor-outdoor connection. Where architecture meets nature.',
    icon: Sun,
    color: '#c9a962'
  }
};

const DividerCard = ({ category, categoryIndex, totalCategories, quadCount, onContinue }) => {
  const info = categoryInfo[category];
  
  if (!info) return null;
  
  const IconComponent = info.icon;
  
  return (
    <div className="divider-card">
      <div className="divider-card__content">
        {/* Progress indicator */}
        <div className="divider-card__progress">
          <span>Category {categoryIndex + 1} of {totalCategories}</span>
          <div className="divider-card__progress-dots">
            {Array.from({ length: totalCategories }).map((_, idx) => (
              <span 
                key={idx} 
                className={`divider-card__dot ${idx <= categoryIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
        
        {/* Icon */}
        <div 
          className="divider-card__icon"
          style={{ backgroundColor: info.color }}
        >
          <IconComponent size={48} />
        </div>
        
        {/* Title & Description */}
        <h2 className="divider-card__title">{info.title}</h2>
        <p className="divider-card__description">{info.description}</p>
        
        {/* Quad count indicator */}
        {quadCount && (
          <div className="divider-card__quad-count">
            {quadCount} comparison{quadCount !== 1 ? 's' : ''} in this category
          </div>
        )}
        
        {/* Instructions */}
        <div className="divider-card__instructions">
          <p>You'll see 4 images at a time. Rank them by tapping in order of preference:</p>
          <div className="divider-card__actions-preview">
            <span className="action-preview action-preview--first">1st</span>
            <span className="action-preview action-preview--second">2nd</span>
            <span className="action-preview action-preview--third">3rd</span>
            <span className="action-preview action-preview--fourth">4th</span>
          </div>
        </div>
        
        {/* Continue Button */}
        <button 
          className="divider-card__continue"
          onClick={onContinue}
        >
          Begin {info.title}
        </button>
      </div>
    </div>
  );
};

export { categoryInfo };
export default DividerCard;
