import React from 'react';
import { MapPin, Navigation, Globe, Phone, Star } from 'lucide-react';
import { useStore } from '../store';
import { School } from '../types';
import {
  getSchoolNameByLanguage,
  getSchoolSecondaryNameByLanguage,
  getSchoolAddressByLanguage,
  getSchoolDistrictByLanguage,
  getSchoolFinancingByLanguage,
  getSchoolGenderByLanguage,
  getSchoolSessionByLanguage,
  getSchoolNetId,
  getLevelBadgeColor,
  getSchoolLevelByLanguage,
  getLocalizedDistrictLabel,
  getLocalizedFinancingLabel,
  getLocalizedGenderLabel,
  getLocalizedSessionLabel,
  AppLanguage,
} from '../utils';

const SchoolCard: React.FC<{ school: School; language: AppLanguage; isFavorited: boolean }> = ({ school, language, isFavorited }) => {
  const { setSelectedSchool, toggleFavorite } = useStore();
  const levelBadge = getLevelBadgeColor(getSchoolLevelByLanguage(school, 'en') || getSchoolLevelByLanguage(school, language));

  return (
    <div
      className="rounded-2xl bg-surface-container p-4 sm:p-5 cursor-pointer transition-colors hover:bg-surface-container-high active:scale-[0.99]"
      onClick={() => setSelectedSchool(school)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-medium text-xs ${levelBadge.bg} ${levelBadge.text}`}>
            {levelBadge.label}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-on-surface truncate">
              {getSchoolNameByLanguage(school, language)}
            </h3>
            <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">
              {getSchoolSecondaryNameByLanguage(school, language)}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(school['School No.']);
          }}
          className="p-1.5 text-primary transition-colors cursor-pointer flex-shrink-0"
        >
          <Star className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
          {getLocalizedDistrictLabel(school, language) || '-'}
        </span>
        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
          {getLocalizedFinancingLabel(school, language)}
        </span>
        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
          {getLocalizedGenderLabel(school, language)}
        </span>
        {getSchoolSessionByLanguage(school, 'en') && (
          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {getLocalizedSessionLabel(getSchoolSessionByLanguage(school, 'en'), language)}
          </span>
        )}
        {getSchoolNetId(school) && (
          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            {language === 'zh' ? `${getSchoolNetId(school)} 校網` : `Net ${getSchoolNetId(school)}`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-on-surface-variant mb-3">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{getSchoolAddressByLanguage(school, language)}</span>
      </div>

      <div className="flex gap-2">
        {school.Longitude && school.Latitude && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${school.Latitude},${school.Longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-on-primary py-2 rounded-full font-medium text-[10px] sm:text-xs"
          >
            <Navigation className="w-3 h-3" />
            {language === 'zh' ? '導航' : 'Directions'}
          </a>
        )}
        {school.Website && (
          <a
            href={school.Website.startsWith('http') ? school.Website : `https://${school.Website}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container-high text-on-surface py-2 rounded-full font-medium text-[10px] sm:text-xs"
          >
            <Globe className="w-3 h-3" />
            {language === 'zh' ? '網站' : 'Website'}
          </a>
        )}
        {school.Telephone && (
          <a
            href={`tel:${school.Telephone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container-high text-on-surface py-2 rounded-full font-medium text-[10px] sm:text-xs"
          >
            <Phone className="w-3 h-3" />
            {language === 'zh' ? '致電' : 'Call'}
          </a>
        )}
      </div>
    </div>
  );
};

const SchoolListView: React.FC = () => {
  const { filteredSchools, language, favorites } = useStore();

  const t = language === 'zh'
    ? { schools: '所學校', noResults: '沒有符合條件的學校', tryAdjusting: '請嘗試調整篩選條件' }
    : { schools: 'schools', noResults: 'No schools match your filters', tryAdjusting: 'Try adjusting your filters' };

  return (
    <div className="absolute inset-0 pt-40 sm:pt-44 md:pt-28 px-3 sm:px-4 md:px-6 pb-24 md:pb-8 overflow-y-auto overflow-x-hidden">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-on-surface-variant font-medium mb-3 sm:mb-4">
          {filteredSchools.length.toLocaleString()} {t.schools}
        </p>
        {filteredSchools.length === 0 ? (
          <div className="rounded-2xl bg-surface-container p-8 text-center">
            <p className="text-on-surface-variant font-medium">{t.noResults}</p>
            <p className="text-outline text-sm mt-1">{t.tryAdjusting}</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredSchools.map((school) => {
              const id = school['School No.'] || '';
              return (
                <SchoolCard
                  key={id || Math.random()}
                  school={school}
                  language={language}
                  isFavorited={favorites.includes(id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolListView;
