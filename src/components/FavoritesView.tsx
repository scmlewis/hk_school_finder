import React from 'react';
import { Star, MapPin, Globe, Phone } from 'lucide-react';
import { useStore } from '../store';
import {
  getSchoolNameByLanguage,
  getSchoolSecondaryNameByLanguage,
  getSchoolAddressByLanguage,
  getLevelBadgeColor,
  getLocalizedFinancingLabel,
  getLocalizedDistrictLabel,
  getSchoolLevelByLanguage,
} from '../utils';

interface FavoritesViewProps {
  onBack: () => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ onBack }) => {
  const { schools, favorites, toggleFavorite, setSelectedSchool, language } = useStore();

  const t = language === 'zh'
    ? {
        title: '收藏的學校',
        empty: '尚未收藏任何學校',
        hint: '在學校詳情頁點擊 ☆ 即可收藏',
        backToMap: '返回地圖',
        remove: '移除',
      }
    : {
        title: 'Favorite Schools',
        empty: 'No favorites yet',
        hint: 'Tap ☆ on any school detail to save it here',
        backToMap: 'Back to Map',
        remove: 'Remove',
      };

  const favoriteSchools = schools.filter((s) => favorites.includes(s['School No.']));

  if (favoriteSchools.length === 0) {
    return (
      <div className="absolute inset-0 pt-40 sm:pt-44 md:pt-28 px-3 sm:px-4 md:px-6 pb-6 md:pb-8 overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/90 shadow-[0_12px_36px_rgba(2,6,23,0.45)] p-8 text-center">
            <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">{t.empty}</p>
            <p className="text-slate-500 text-sm mt-1">{t.hint}</p>
            <button
              onClick={() => onBack}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {t.backToMap}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pt-40 sm:pt-44 md:pt-28 px-3 sm:px-4 md:px-6 pb-6 md:pb-8 overflow-y-auto overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/90 shadow-[0_12px_36px_rgba(2,6,23,0.45)] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{t.title}</h2>
              <p className="text-sm text-slate-400 mt-1">{favoriteSchools.length} {language === 'zh' ? '所學校' : 'schools'}</p>
            </div>
            <button
              onClick={() => onBack}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {t.backToMap}
            </button>
          </div>
        </div>

        {favoriteSchools.map((school) => {
          const level = getSchoolLevelByLanguage(school, language);
          const levelBadge = getLevelBadgeColor(level);
          return (
            <div
              key={school['School No.']}
              className="rounded-2xl border border-slate-700 bg-slate-900/90 shadow-[0_8px_24px_rgba(2,6,23,0.35)] p-4 sm:p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs border-2 ${levelBadge.bg} ${levelBadge.text} border-current/30`}>
                    {levelBadge.label}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                      {getSchoolNameByLanguage(school, language)}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                      {getSchoolSecondaryNameByLanguage(school, language)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(school['School No.'])}
                  className="p-1.5 text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer flex-shrink-0"
                  title={t.remove}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  {getLocalizedDistrictLabel(school, language) || '-'}
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  {getLocalizedFinancingLabel(school, language)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 mb-3">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{getSchoolAddressByLanguage(school, language)}</span>
              </div>

              <div className="flex gap-2">
                {school.Longitude && school.Latitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${school.Latitude},${school.Longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 text-white py-2 rounded-xl font-bold text-[10px] sm:text-xs hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    <MapPin className="w-3 h-3" />
                    {language === 'zh' ? '導航' : 'Directions'}
                  </a>
                )}
                {school.Website && (
                  <a
                    href={school.Website.startsWith('http') ? school.Website : `https://${school.Website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 text-white py-2 rounded-xl font-bold text-[10px] sm:text-xs hover:bg-orange-600 transition-all active:scale-95"
                  >
                    <Globe className="w-3 h-3" />
                    {language === 'zh' ? '網站' : 'Website'}
                  </a>
                )}
                {school.Telephone && (
                  <a
                    href={`tel:${school.Telephone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-100 py-2 rounded-xl font-bold text-[10px] sm:text-xs hover:bg-slate-700 transition-all active:scale-95"
                  >
                    <Phone className="w-3 h-3" />
                    {language === 'zh' ? '致電' : 'Call'}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FavoritesView;
