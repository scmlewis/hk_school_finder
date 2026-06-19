import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Phone, MapPin, Train, Navigation, Share2, Star } from 'lucide-react';
import { useStore } from '../store';
import { MTR_STATIONS, getDistance } from '../services';
import { School } from '../types';
import {
  getSchoolAddressByLanguage,
  getSchoolNameByLanguage,
  getSchoolSecondaryNameByLanguage,
  getLevelBadgeColor,
  getLocalizedFinancingLabel,
  getLocalizedGenderLabel,
  getLocalizedReligionLabel,
  getLocalizedLevelLabel,
  getLocalizedDistrictLabel,
  getSchoolLevelByLanguage,
} from '../utils';

const MAX_MTR_DISTANCE_KM = 1.5;

const BottomSheet: React.FC = () => {
  const { selectedSchool, setSelectedSchool, language, favorites, toggleFavorite } = useStore();

  const t = language === 'zh'
    ? {
        type: '資助種類',
        gender: '學生性別',
        level: '學校級別',
        district: '地區',
        religion: '宗教',
        noReligion: '未提供',
        website: '學校網站',
        call: '致電學校',
        directions: '導航',
        share: '分享',
        nearbyMtr: '附近港鐵站',
        noMtr: '附近無港鐵站',
        walk: '步行',
        km: '公里',
        minutes: '分鐘',
      }
    : {
        type: 'Type',
        gender: 'Gender',
        level: 'School Level',
        district: 'District',
        religion: 'Religion',
        noReligion: 'Not Provided',
        website: 'Visit Website',
        call: 'Call School',
        directions: 'Directions',
        share: 'Share',
        nearbyMtr: 'Nearby MTR Stations',
        noMtr: 'No nearby MTR stations',
        walk: 'walk',
        km: 'km',
        minutes: 'min',
      };

  const nearbyStations = useMemo(() => {
    if (!selectedSchool) return [];
    const lat = parseFloat(selectedSchool.Latitude || (selectedSchool as any).latitude || '');
    const lng = parseFloat(selectedSchool.Longitude || (selectedSchool as any).longitude || '');
    if (isNaN(lat) || isNaN(lng)) return [];

    return MTR_STATIONS
      .map((station) => ({
        ...station,
        distance: getDistance(lat, lng, station.lat, station.lng),
      }))
      .filter((s) => s.distance <= MAX_MTR_DISTANCE_KM)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [selectedSchool]);

  const isFavorited = selectedSchool ? favorites.includes(selectedSchool['School No.']) : false;

  return (
    <AnimatePresence>
      {selectedSchool && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSchool(null)}
            className="fixed inset-0 z-40 bg-black/45"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg max-h-[90vh] md:max-h-screen overflow-y-auto w-full"
          >
            <div className="rounded-t-[40px] shadow-2xl p-4 sm:p-5 md:p-6 pb-8 sm:pb-9 md:pb-10 border-t border-slate-700 bg-slate-900/95">
              <div className="w-10 h-1 sm:w-12 sm:h-1.5 bg-slate-600 rounded-full mx-auto mb-4 sm:mb-5 md:mb-6" />
            
            <div className="flex justify-between items-start mb-3 sm:mb-4 md:mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-slate-100 leading-tight">
                    {getSchoolNameByLanguage(selectedSchool, language)}
                  </h2>
                  {(() => {
                    // Use English canonical value for badge detection, but show localized level text elsewhere
                    const levelForBadge = getSchoolLevelByLanguage(selectedSchool, 'en') || getSchoolLevelByLanguage(selectedSchool, language);
                    const levelBadge = getLevelBadgeColor(levelForBadge);
                    return (
                      <span className={`text-xs font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border-2 ${levelBadge.bg} ${levelBadge.text} border-current/40 flex-shrink-0`}>
                        {levelBadge.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  {getSchoolSecondaryNameByLanguage(selectedSchool, language)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSchool(null)}
                className="p-1.5 sm:p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer flex-shrink-0 ml-2"
              >
                <X className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
              {/* Financing Type */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-indigo-400/20">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-indigo-300 font-bold mb-0.5 sm:mb-1">{t.type}</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-200">{getLocalizedFinancingLabel(selectedSchool, language)}</p>
              </div>
              {/* Gender */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-purple-400/20">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-purple-300 font-bold mb-0.5 sm:mb-1 flex items-center gap-1">{t.gender}</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-200">{getLocalizedGenderLabel(selectedSchool, language)}</p>
              </div>
            </div>

            {/* Additional Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
              {/* School Level */}
              <div className="bg-slate-800/60 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-slate-700/50 hover:border-slate-600 transition-colors">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5 sm:mb-1">{t.level}</p>
                <p className="text-xs font-semibold text-slate-200 break-words leading-snug">{getLocalizedLevelLabel(selectedSchool, language)}</p>
              </div>
              {/* District */}
              <div className="bg-slate-800/60 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-slate-700/50 hover:border-slate-600 transition-colors">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5 sm:mb-1">{t.district}</p>
                <p className="text-xs font-semibold text-slate-200 break-words leading-snug">{getLocalizedDistrictLabel(selectedSchool, language) || '-'}</p>
              </div>
              {/* Religion */}
              <div className="bg-slate-800/60 rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-slate-700/50 hover:border-slate-600 transition-colors">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5 sm:mb-1">{t.religion}</p>
                <p className="text-xs font-semibold text-slate-200 break-words leading-snug">{getLocalizedReligionLabel(selectedSchool, language) || t.noReligion}</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-indigo-500/15 rounded-lg sm:rounded-xl text-indigo-300 flex-shrink-0">
                  <MapPin className="w-4 sm:w-5 h-4 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                    {getSchoolAddressByLanguage(selectedSchool, language)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                {selectedSchool.Longitude && selectedSchool.Latitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSchool.Latitude},${selectedSchool.Longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-emerald-500 text-white py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    <Navigation className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    {t.directions}
                  </a>
                )}
                {selectedSchool.Website && (
                  <a
                    href={selectedSchool.Website.startsWith('http') ? selectedSchool.Website : `https://${selectedSchool.Website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-orange-500 text-white py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs hover:bg-orange-600 transition-all active:scale-95"
                  >
                    <Globe className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    {t.website}
                  </a>
                )}
                {selectedSchool.Telephone && (
                  <a
                    href={`tel:${selectedSchool.Telephone}`}
                    className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-slate-800 border border-slate-700 text-slate-100 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs hover:bg-slate-700 transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    {t.call}
                  </a>
                )}
                <button
                  onClick={() => {
                    const url = `${window.location.origin}?school=${selectedSchool['School No.'] || ''}`;
                    if (navigator.share) {
                      navigator.share({ title: getSchoolNameByLanguage(selectedSchool, language), url });
                    } else {
                      navigator.clipboard.writeText(url);
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-slate-800 border border-slate-700 text-slate-100 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs hover:bg-slate-700 transition-all active:scale-95"
                >
                  <Share2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  {t.share}
                </button>
                <button
                  onClick={() => toggleFavorite(selectedSchool['School No.'])}
                  className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-[10px] sm:text-xs transition-all active:scale-95 ${
                    isFavorited
                      ? 'bg-yellow-500 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700'
                  }`}
                >
                  <Star className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>
            {/* Nearby MTR Stations */}
            <div className="mt-4 sm:mt-5">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <Train className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-red-400" />
                <p className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">{t.nearbyMtr}</p>
              </div>
              {nearbyStations.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2">
                  {nearbyStations.map((station) => {
                    const walkMin = Math.max(1, Math.round(station.distance / 0.075));
                    return (
                      <div key={station.nameEn} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-lg sm:rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-red-500/15 flex items-center justify-center">
                            <Train className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-100">{language === 'zh' ? station.name : station.nameEn}</p>
                            <p className="text-[10px] sm:text-xs text-slate-400">{language === 'zh' ? station.nameEn : station.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] sm:text-xs font-bold text-slate-200">{station.distance.toFixed(1)} {t.km}</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-400">~{walkMin} {t.minutes} {t.walk}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] sm:text-xs text-slate-500 italic">{t.noMtr}</p>
              )}
            </div>
            </div>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
