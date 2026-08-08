import React from 'react';
import { Star } from 'lucide-react';
import { useStore } from '../store';
import { School } from '../types';
import { getDistance } from '../services';
import {
  getSchoolNameByLanguage,
  getSchoolSecondaryNameByLanguage,
  getLevelBadgeColor,
  getSchoolLevelByLanguage,
} from '../utils';

interface SchoolCardProps {
  school: School;
  isSelected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

export default function SchoolCard({ school, isSelected, onClick, style }: SchoolCardProps) {
  const { language, favorites, toggleFavorite, homeAddress } = useStore();

  const schoolId = school['School No.'] || '';
  const isFavorited = favorites.includes(schoolId);

  const levelForBadge = getSchoolLevelByLanguage(school, 'en') || getSchoolLevelByLanguage(school, language);
  const levelBadge = getLevelBadgeColor(levelForBadge);

  const lat = parseFloat(school.Latitude || (school as any).latitude || '');
  const lng = parseFloat(school.Longitude || (school as any).longitude || '');

  let distanceText: string | null = null;
  if (homeAddress && !isNaN(lat) && !isNaN(lng)) {
    const dist = getDistance(homeAddress.lat, homeAddress.lng, lat, lng);
    distanceText = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  }

  return (
    <div
      style={style}
      onClick={onClick}
      className={`p-3 rounded-xl border cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-outline/10 bg-surface-container hover:bg-surface-container-high'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">
            {getSchoolNameByLanguage(school, language)}
          </p>
          <p className="text-xs text-on-surface-variant truncate mt-0.5">
            {getSchoolSecondaryNameByLanguage(school, language)}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(schoolId);
          }}
          className="p-1 rounded-full hover:bg-surface-container-highest transition-colors flex-shrink-0"
          aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
        >
          <Star className={`w-4 h-4 ${isFavorited ? 'text-primary fill-primary' : 'text-on-surface-variant'}`} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${levelBadge.bg} ${levelBadge.text}`}>
          {levelBadge.label}
        </span>
        {distanceText && (
          <span className="text-[10px] text-on-surface-variant">
            {distanceText}
          </span>
        )}
      </div>
    </div>
  );
}
