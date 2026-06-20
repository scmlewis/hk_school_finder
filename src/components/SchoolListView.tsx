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
  localizeDistrictValue,
  localizeFinancingValue,
  localizeGenderValue,
  getLocalizedSessionLabel,
  AppLanguage,
} from '../utils';

const SchoolCard: React.FC<{ school: School; language: AppLanguage; isFavorited: boolean }> = ({ school, language, isFavorited }) => {
  const { setSelectedSchool, toggleFavorite } = useStore();
  const levelBadge = getLevelBadgeColor(getSchoolLevelByLanguage(school, 'en') || getSchoolLevelByLanguage(school, language));

  return (
    <div
      className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 sm:p-4 hover:border-indigo-500/40 transition-all cursor-pointer active:scale-[0.98]"
      onClick={() => setSelectedSchool(school)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${levelBadge.bg} ${levelBadge.text}`}>
          {levelBadge.label}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-slate-100 truncate">{getSchoolNameByLanguage(school, language)}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(school['School No.']);
              }}
              className="flex-shrink-0 p-0.5 cursor-pointer"
            >
              <Star className={`w-4 h-4 ${isFavorited ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
            </button>
          </div>
          <p className="text-xs text-slate-400 truncate mb-1.5">{getSchoolSecondaryNameByLanguage(school, language)}</p>
          <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
            <span className="bg-slate-700/60 px-1.5 py-0.5 rounded">
              {localizeDistrictValue(getSchoolDistrictByLanguage(school, 'en'), language)}
            </span>
            <span className="bg-slate-700/60 px-1.5 py-0.5 rounded">
              {localizeFinancingValue(getSchoolFinancingByLanguage(school, 'en'), language)}
            </span>
            <span className="bg-slate-700/60 px-1.5 py-0.5 rounded">
              {localizeGenderValue(getSchoolGenderByLanguage(school, 'en'), language)}
            </span>
            {getSchoolSessionByLanguage(school, 'en') && (
              <span className="bg-slate-700/60 px-1.5 py-0.5 rounded">
                {getLocalizedSessionLabel(getSchoolSessionByLanguage(school, 'en'), language)}
              </span>
            )}
            {getSchoolNetId(school) && (
              <span className="bg-slate-700/60 px-1.5 py-0.5 rounded">
                {language === 'zh' ? `${getSchoolNetId(school)} 校網` : `Net ${getSchoolNetId(school)}`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-slate-700/40">
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[160px]">{getSchoolAddressByLanguage(school, language)}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {school.Longitude && school.Latitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${school.Latitude},${school.Longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-slate-700/60 text-slate-400 hover:text-indigo-400 transition-colors"
              title={language === 'zh' ? '導航' : 'Directions'}
            >
              <Navigation className="w-3 h-3" />
            </a>
          )}
          {school.Website && (
            <a
              href={school.Website.startsWith('http') ? school.Website : `https://${school.Website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-slate-700/60 text-slate-400 hover:text-indigo-400 transition-colors"
              title={language === 'zh' ? '網站' : 'Website'}
            >
              <Globe className="w-3 h-3" />
            </a>
          )}
          {school.Telephone && (
            <a
              href={`tel:${school.Telephone}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-slate-700/60 text-slate-400 hover:text-indigo-400 transition-colors"
              title={language === 'zh' ? '致電' : 'Call'}
            >
              <Phone className="w-3 h-3" />
            </a>
          )}
        </div>
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
    <div className="absolute inset-0 z-10 overflow-y-auto bg-slate-900 pt-16 sm:pt-20 pb-20 md:pb-4">
      <div className="px-2 sm:px-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-semibold text-slate-300">
            {filteredSchools.length.toLocaleString()} {t.schools}
          </p>
        </div>
        {filteredSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400 text-sm font-medium mb-1">{t.noResults}</p>
            <p className="text-slate-500 text-xs">{t.tryAdjusting}</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
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
