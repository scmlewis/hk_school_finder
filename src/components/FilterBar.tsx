import React, { useState } from 'react';
import { MapPin, Locate, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../store';
import { getSchoolFinancingByLanguage, getSchoolGenderByLanguage, getSchoolReligionByLanguage } from '../utils';

const FilterBar: React.FC = () => {
  const {
    schools,
    levelFilter,
    setLevelFilter,
    userLocation,
    setUserLocation,
    distanceFilter,
    setDistanceFilter,
    genderFilter,
    setGenderFilter,
    financingTypeFilter,
    setFinancingTypeFilter,
    religionFilter,
    setReligionFilter,
    clearFilters,
    language,
  } = useStore();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const t = language === 'zh'
    ? {
        title: '篩選',
        level: '學校級別',
        distance: '距離範圍',
        gender: '學生性別',
        financing: '資助種類',
        religion: '宗教',
        all: '全部',
        locate: '我的位置',
        updateLocation: '更新我的位置',
        locating: '定位中...',
        locationDetected: '已偵測位置',
        filtersBtn: '篩選',
        tips: '💡 建議先用學校級別和地區關鍵字，再搭配宗教/資助類別縮小結果。',
        noLimit: '不限',
        notApplicable: '不適用',
        clearFilters: '清除篩選',
      }
    : {
        title: 'Filters',
        level: 'School Level',
        distance: 'Distance Radius',
        gender: 'Student Gender',
        financing: 'Financing Type',
        religion: 'Religion',
        all: 'All',
        locate: 'Locate Me',
        updateLocation: 'Update Location',
        locating: 'Locating...',
        locationDetected: 'Location detected',
        filtersBtn: 'Filters',
        tips: '💡 Start with level + keyword search, then narrow with religion/financing filters.',
        noLimit: 'No Limit',
        notApplicable: 'Not Applicable',
        clearFilters: 'Clear Filters',
      };

  const normalizeFilterKey = (value: string): string => {
    const upper = value.trim().toUpperCase();
    if (!upper) return '';
    if (
      upper === 'N.A.' ||
      upper === 'N/A' ||
      upper === 'NA' ||
      upper === 'NOT APPLICABLE' ||
      upper === '不適用'
    ) {
      return 'NOT_APPLICABLE';
    }
    return upper;
  };

  const buildCanonicalOptions = (values: string[]) => {
    const map = new Map<string, string>();
    values.forEach((raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const key = normalizeFilterKey(trimmed);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, key === 'NOT_APPLICABLE' ? t.notApplicable : trimmed);
      }
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (a === 'NOT_APPLICABLE') return 1;
        if (b === 'NOT_APPLICABLE') return -1;
        return a.localeCompare(b, 'en');
      })
      .map(([value, label]) => ({ value, label }));
  };

  const buildGenderOptions = (values: string[]) => {
    const keySet = new Set<string>();

    values.forEach((raw) => {
      const upper = raw.trim().toUpperCase();
      if (!upper) return;
      if (upper.includes('BOY') || upper === '男') keySet.add('BOYS');
      else if (upper.includes('GIRL') || upper === '女') keySet.add('GIRLS');
      else if (upper.includes('CO-ED') || upper.includes('COED') || upper.includes('MIXED') || upper === '男女') keySet.add('CO-ED');
      else if (
        upper === 'N.A.' ||
        upper === 'N/A' ||
        upper === 'NA' ||
        upper === 'NOT APPLICABLE' ||
        upper === '不適用'
      ) keySet.add('NOT_APPLICABLE');
      else keySet.add(upper);
    });

    const ordered = ['BOYS', 'GIRLS', 'CO-ED'];
    const localizedLabel: Record<string, string> = {
      'BOYS': language === 'zh' ? '男' : 'BOYS',
      'GIRLS': language === 'zh' ? '女' : 'GIRLS',
      'CO-ED': language === 'zh' ? '男女' : 'CO-ED',
      'NOT_APPLICABLE': t.notApplicable,
    };

    const leading = ordered
      .filter((key) => keySet.has(key))
      .map((key) => ({ value: key, label: localizedLabel[key] }));

    const remaining = Array.from(keySet)
      .filter((key) => !ordered.includes(key) && key !== 'NOT_APPLICABLE')
      .sort((a, b) => a.localeCompare(b, 'en'))
      .map((key) => ({ value: key, label: localizedLabel[key] || key }));

    const trailing = keySet.has('NOT_APPLICABLE')
      ? [{ value: 'NOT_APPLICABLE', label: t.notApplicable }]
      : [];

    return [...leading, ...remaining, ...trailing];
  };

  const toggleLevel = (level: string) => {
    setLevelFilter(
      levelFilter.includes(level)
        ? levelFilter.filter(l => l !== level)
        : [...levelFilter, level]
    );
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setDistanceFilter(3); // Default to 3km when location is obtained
        setIsLocating(false);
        console.log('Location found:', latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(error.message || 'Unable to get location');
        setIsLocating(false);
      },
      {
        timeout: 10000,
        enableHighAccuracy: false
      }
    );
  };

  const levelOptions = [
    { label: language === 'zh' ? '幼稚園' : 'Kindergarten', value: 'KINDERGARTEN', color: '#ec4899' },
    { label: language === 'zh' ? '小學' : 'Primary', value: 'PRIMARY', color: '#3b82f6' },
    { label: language === 'zh' ? '中學' : 'Secondary', value: 'SECONDARY', color: '#10b981' }
  ];

  const distanceOptions = [
    { label: '1 km', value: 1 },
    { label: '3 km', value: 3 },
    { label: '5 km', value: 5 },
    { label: t.noLimit, value: null }
  ];

  const uniqueGenders = React.useMemo(() => {
    const values = new Set<string>();
    schools.forEach((school) => {
      const v = getSchoolGenderByLanguage(school, language).trim();
      if (v) values.add(v);
    });
    return buildGenderOptions(Array.from(values));
  }, [schools, language]);

  const uniqueFinancingTypes = React.useMemo(() => {
    const values = new Set<string>();
    schools.forEach((school) => {
      const v = getSchoolFinancingByLanguage(school, language).trim();
      if (v) values.add(v);
    });
    return buildCanonicalOptions(Array.from(values));
  }, [schools, language]);

  const uniqueReligions = React.useMemo(() => {
    const values = new Set<string>();
    schools.forEach((school) => {
      const v = getSchoolReligionByLanguage(school, language).trim();
      if (v) values.add(v);
    });
    return buildCanonicalOptions(Array.from(values));
  }, [schools, language]);

  const panelContent = (
    <div className="p-2.5 sm:p-3 md:p-4 space-y-2.5 sm:space-y-3 md:space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            >
              {t.clearFilters}
            </button>
          </div>

          {/* School Level Filter */}
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-300 uppercase mb-1.5 sm:mb-2">{t.level}</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {levelOptions.map(({ label, value, color }) => (
                <button
                  key={value}
                  onClick={() => toggleLevel(value)}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all min-h-8 sm:min-h-10 cursor-pointer ${
                    levelFilter.includes(value)
                      ? 'text-white shadow-md'
                      : 'text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95'
                  }`}
                  style={levelFilter.includes(value) ? { backgroundColor: color } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Filter */}
          {userLocation && (
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-300 uppercase mb-1.5 sm:mb-2">{t.distance}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {distanceOptions.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setDistanceFilter(value)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all min-h-8 sm:min-h-10 cursor-pointer ${
                      distanceFilter === value
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-900/40'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-300 uppercase mb-1.5 sm:mb-2">{t.gender}</p>
            <select
              value={genderFilter ?? ''}
              onChange={(e) => setGenderFilter(e.target.value || null)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm text-slate-100 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="">{t.all}</option>
              {uniqueGenders.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-300 uppercase mb-1.5 sm:mb-2">{t.financing}</p>
            <select
              value={financingTypeFilter ?? ''}
              onChange={(e) => setFinancingTypeFilter(e.target.value || null)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm text-slate-100 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="">{t.all}</option>
              {uniqueFinancingTypes.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-300 uppercase mb-1.5 sm:mb-2">{t.religion}</p>
            <select
              value={religionFilter ?? ''}
              onChange={(e) => setReligionFilter(e.target.value || null)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm text-slate-100 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="">{t.all}</option>
              {uniqueReligions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Locate Me Button */}
          <div>
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                isLocating
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : userLocation
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white active:scale-95'
              }`}
            >
              <Locate className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              {isLocating ? t.locating : userLocation ? t.updateLocation : t.locate}
            </button>
          </div>

          {/* Location Status */}
          {userLocation && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <MapPin className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-emerald-300 font-medium">{t.locationDetected}</p>
              </div>
            </div>
          )}

          {locationError && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2">
              <p className="text-xs sm:text-sm text-red-300 font-medium">{locationError}</p>
            </div>
          )}

          {/* Info text */}
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-2 sm:mt-3">
            {t.tips}
          </p>
      </div>
  );

  return (
    <>
      <div className="hidden md:block absolute top-20 right-3 z-20 max-w-sm w-full mx-2 md:mx-0">
        <div className="rounded-3xl shadow-2xl border border-slate-700 overflow-hidden bg-slate-900/95">
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/70">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">{t.title}</p>
          </div>
          {panelContent}
        </div>
      </div>

      <div className="md:hidden absolute top-32 sm:top-36 right-2 sm:right-3 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="h-10 sm:h-12 px-3 sm:px-4 rounded-lg sm:rounded-xl bg-slate-900/98 border border-indigo-400/25 text-slate-100 shadow-[0_16px_40px_rgba(2,6,23,0.55)] flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:border-indigo-400/40 transition-colors active:scale-95"
        >
          <SlidersHorizontal className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          <span className="text-sm sm:text-base font-semibold">{t.filtersBtn}</span>
        </button>
      </div>

      {isMobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            className="fixed inset-0 z-40 bg-black/45"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-3 pb-2 sm:pb-3">
            <div className="bg-slate-900 border border-slate-700 rounded-t-xl sm:rounded-t-2xl rounded-b-xl sm:rounded-b-2xl overflow-hidden shadow-2xl max-h-[75vh]">
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-700">
                <p className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide uppercase">{t.title}</p>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
              </div>
              <div className="max-h-[calc(75vh-50px)] overflow-y-auto p-2 sm:p-3">
                <div className="rounded-lg sm:rounded-2xl border border-slate-700 bg-slate-900/95">
                  {panelContent}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FilterBar;
