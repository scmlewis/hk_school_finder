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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSchool(null)}
            className="fixed inset-0 z-40 bg-black/60"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg max-h-[90vh] md:max-h-screen overflow-y-auto w-full"
          >
            <div className="rounded-t-2xl p-4 sm:p-5 md:p-6 pb-8 sm:pb-9 md:pb-10 bg-surface-container">
              <div className="w-10 h-1 sm:w-12 sm:h-1.5 bg-outline-variant rounded-full mx-auto mb-4 sm:mb-5 md:mb-6" />
            
            <div className="flex justify-between items-start mb-3 sm:mb-4 md:mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-semibold text-on-surface leading-tight">
                    {getSchoolNameByLanguage(selectedSchool, language)}
                  </h2>
                  {(() => {
                    const levelForBadge = getSchoolLevelByLanguage(selectedSchool, 'en') || getSchoolLevelByLanguage(selectedSchool, language);
                    const levelBadge = getLevelBadgeColor(levelForBadge);
                    return (
                      <span className={`text-xs font-medium px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full ${levelBadge.bg} ${levelBadge.text} flex-shrink-0`}>
                        {levelBadge.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
                  {getSchoolSecondaryNameByLanguage(selectedSchool, language)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSchool(null)}
                className="p-1.5 sm:p-2 bg-surface-container-high rounded-full text-on-surface-variant transition-colors cursor-pointer flex-shrink-0 ml-2"
              >
                <X className="w-4 sm:w-5 h-4 sm:h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-surface-container-high rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-0.5 sm:mb-1">{t.type}</p>
                <p className="text-xs sm:text-sm font-medium text-on-surface">{getLocalizedFinancingLabel(selectedSchool, language)}</p>
              </div>
              <div className="bg-surface-container-high rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-0.5 sm:mb-1">{t.gender}</p>
                <p className="text-xs sm:text-sm font-medium text-on-surface">{getLocalizedGenderLabel(selectedSchool, language)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
              <div className="bg-surface-container-high rounded-lg sm:rounded-xl p-2.5 sm:p-3 transition-colors">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-0.5 sm:mb-1">{t.level}</p>
                <p className="text-xs font-medium text-on-surface break-words leading-snug">{getLocalizedLevelLabel(selectedSchool, language)}</p>
              </div>
              <div className="bg-surface-container-high rounded-lg sm:rounded-xl p-2.5 sm:p-3 transition-colors">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-0.5 sm:mb-1">{t.district}</p>
                <p className="text-xs font-medium text-on-surface break-words leading-snug">{getLocalizedDistrictLabel(selectedSchool, language) || '-'}</p>
              </div>
              <div className="bg-surface-container-high rounded-lg sm:rounded-xl p-2.5 sm:p-3 transition-colors">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-0.5 sm:mb-1">{t.religion}</p>
                <p className="text-xs font-medium text-on-surface break-words leading-snug">{getLocalizedReligionLabel(selectedSchool, language) || t.noReligion}</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-surface-container-high rounded-lg sm:rounded-xl text-on-surface-variant flex-shrink-0">
                  <MapPin className="w-4 sm:w-5 h-4 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-on-surface font-medium leading-relaxed">
                    {getSchoolAddressByLanguage(selectedSchool, language)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                {selectedSchool.Longitude && selectedSchool.Latitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSchool.Latitude},${selectedSchool.Longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-primary text-on-primary py-2 sm:py-2.5 rounded-full font-medium text-[10px] sm:text-xs"
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
                    className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-surface-container-high text-on-surface py-2 sm:py-2.5 rounded-full font-medium text-[10px] sm:text-xs"
                  >
                    <Globe className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    {t.website}
                  </a>
                )}
                {selectedSchool.Telephone && (
                  <a
                    href={`tel:${selectedSchool.Telephone}`}
                    className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-surface-container-high text-on-surface py-2 sm:py-2.5 rounded-full font-medium text-[10px] sm:text-xs"
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
                  className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 bg-surface-container-high text-on-surface py-2 sm:py-2.5 rounded-full font-medium text-[10px] sm:text-xs"
                >
                  <Share2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  {t.share}
                </button>
                <button
                  onClick={() => toggleFavorite(selectedSchool['School No.'])}
                  className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-2 sm:py-2.5 rounded-full font-medium text-[10px] sm:text-xs transition-colors ${
                    isFavorited
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  <Star className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>
            <div className="mt-4 sm:mt-5">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <Train className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-on-surface-variant" />
                <p className="text-xs sm:text-sm font-medium text-on-surface">{t.nearbyMtr}</p>
              </div>
              {nearbyStations.length > 0 ? (
                <div className="space-y-1.5 sm:space-y-2">
                  {nearbyStations.map((station) => {
                    const walkMin = Math.max(1, Math.round(station.distance / 0.075));
                    return (
                      <div key={station.nameEn} className="flex items-center justify-between bg-surface-container-high rounded-lg sm:rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-surface-container flex items-center justify-center">
                            <Train className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-on-surface-variant" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-on-surface">{language === 'zh' ? station.name : station.nameEn}</p>
                            <p className="text-[10px] sm:text-xs text-on-surface-variant">{language === 'zh' ? station.nameEn : station.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] sm:text-xs font-medium text-on-surface">{station.distance.toFixed(1)} {t.km}</p>
                          <p className="text-[9px] sm:text-[10px] text-on-surface-variant">~{walkMin} {t.minutes} {t.walk}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] sm:text-xs text-on-surface-variant italic">{t.noMtr}</p>
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
