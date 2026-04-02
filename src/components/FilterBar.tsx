import React, { useState } from 'react';
import { MapPin, Locate, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../store';
import { getSchoolFinancingByLanguage, getSchoolGenderByLanguage, getSchoolReligionByLanguage, getSchoolDistrictByLanguage } from '../utils';

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
    districtFilter,
    setDistrictFilter,
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
        district: '地區',
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
        district: 'District',
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
      upper === '不適用' ||
      upper === '無'
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
      // Apply small defensive fixes for known garbled Chinese values
      let corrected = trimmed;
      if (language === 'zh') {
        if (corrected === '基督��') corrected = '基督教';
        if (corrected === '不適���' || corrected === '不��用') corrected = '不適用';
      }
      const key = normalizeFilterKey(corrected);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, key === 'NOT_APPLICABLE' ? t.notApplicable : corrected);
      }
    });

    // Canonical order to keep English and Chinese lists aligned
    const canonicalOrder = [
      'BUDDHISM',
      'CATHOLICISM',
      'CONFUCIANISM',
      'CONFUCIANISM,BUDDHISM & TAOISM',
      'ISLAM',
      'PROTESTANTISM / CHRISTIANITY',
      'SIKH',
      'TAOISM',
      'OTHERS'
    ];

    return Array.from(map.entries())
      .sort(([a, labelA], [b, labelB]) => {
        // Always push NOT_APPLICABLE to the end
        if (a === 'NOT_APPLICABLE') return 1;
        if (b === 'NOT_APPLICABLE') return -1;

        const idxA = canonicalOrder.indexOf(a);
        const idxB = canonicalOrder.indexOf(b);

        // If both have canonical positions, respect that ordering
        if (idxA >= 0 && idxB >= 0) return idxA - idxB;
        // If only one has a canonical position, it comes first
        if (idxA >= 0 && idxB < 0) return -1;
        if (idxA < 0 && idxB >= 0) return 1;

        // Neither is in canonical list: sort by displayed label locale-aware
        const locale = language === 'zh' ? 'zh' : 'en';
        return String(labelA).localeCompare(String(labelB), locale, { sensitivity: 'base' });
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
    // Prevent deselecting the last remaining level — ensure at least one level is always active
    if (levelFilter.includes(level)) {
      if (levelFilter.length <= 1) {
        return; // ignore attempt to deselect the last level
      }
      setLevelFilter(levelFilter.filter(l => l !== level));
    } else {
      setLevelFilter([...levelFilter, level]);
    }
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

  const uniqueDistricts = React.useMemo(() => {
    // Build a bilingual map of districts from the dataset (deduplicated)
    const map: Record<string, { en?: string; zh?: string }> = {};

    schools.forEach((school) => {
      const en = getSchoolDistrictByLanguage(school, 'en').trim();
      const zh = getSchoolDistrictByLanguage(school, 'zh').trim();
      const keyEn = normalizeFilterKey(en);
      const keyZh = normalizeFilterKey(zh);
      const canonicalKey = keyEn || keyZh;
      if (!canonicalKey) return;
      if (!map[canonicalKey]) map[canonicalKey] = {};
      if (en) map[canonicalKey].en = en;
      if (zh) map[canonicalKey].zh = zh;
    });

    // Small fallback translation map for common HK districts (EN -> ZH)
    const fallbackEnToZh: Record<string, string> = {
      'CENTRAL AND WESTERN': '中西區',
      'WAN CHAI': '灣仔',
      'EASTERN': '東區',
      'SOUTHERN': '南區',
      'ISLANDS': '離島',
      'YAU TSIM MONG': '油尖旺',
      'KOWLOON CITY': '九龍城',
      'SHAM SHUI PO': '深水埗',
      'WONG TAI SIN': '黃大仙',
      'KWUN TONG': '觀塘',
      'TSUEN WAN': '荃灣',
      'KWAI TSING': '葵青',
      'TUEN MUN': '屯門',
      'YUEN LONG': '元朗',
      'NORTH': '北區',
      'TAI PO': '大埔',
      'SHA TIN': '沙田',
      'SAI KUNG': '西貢'
    };

    // ensure both en/zh labels exist where possible using fallbacks
    Object.keys(map).forEach((k) => {
      const entry = map[k];
      if (!entry.en && entry.zh) {
        // try reverse lookup in fallback
        const match = Object.entries(fallbackEnToZh).find(([, v]) => normalizeFilterKey(v) === k);
        if (match) entry.en = match[0];
      }
      if (!entry.zh && entry.en) {
        const maybe = fallbackEnToZh[normalizeFilterKey(entry.en)];
        if (maybe) entry.zh = maybe;
      }
    });

    // Define ordered groups with canonical member order (use EN keys as canonical)
    const groups = [
      { key: 'HK_ISLAND', label: { en: '---HONG KONG ISLAND---', zh: '---港島---' }, members: ['CENTRAL AND WESTERN', 'WAN CHAI', 'EASTERN', 'SOUTHERN'] },
      { key: 'KOWLOON', label: { en: '---KOWLOON---', zh: '---九龍---' }, members: ['YAU TSIM MONG', 'KOWLOON CITY', 'SHAM SHUI PO', 'WONG TAI SIN', 'KWUN TONG'] },
      { key: 'NEW_TERRITORIES', label: { en: '---NEW TERRITORIES---', zh: '---新界---' }, members: ['TSUEN WAN', 'KWAI TSING', 'TUEN MUN', 'YUEN LONG', 'NORTH', 'TAI PO', 'SHA TIN', 'SAI KUNG'] },
      { key: 'ISLANDS', label: { en: '---ISLANDS---', zh: '---離島---' }, members: ['ISLANDS'] }
    ];

    const added = new Set<string>();
    const result: Array<{ value: string; label: string; disabled?: boolean }> = [];

    // Insert groups in order, adding members if present in map
    groups.forEach((g) => {
      // check if group has any members in dataset
      const groupMembersPresent = g.members.some((m) => map[normalizeFilterKey(m)]);
      if (!groupMembersPresent) return;

      result.push({ value: `__SEP__${g.key}`, label: language === 'zh' ? g.label.zh : g.label.en, disabled: true });

      g.members.forEach((m) => {
        const key = normalizeFilterKey(m);
        const entry = map[key];
        if (entry && !added.has(key)) {
          const label = language === 'zh' ? (entry.zh || entry.en) : (entry.en || entry.zh);
          result.push({ value: key, label });
          added.add(key);
        }
      });
    });

    // Append any remaining districts not covered by groups, sorted by label
    const remaining = Object.keys(map).filter(k => !added.has(k)).map(k => ({ value: k, label: language === 'zh' ? (map[k].zh || map[k].en) : (map[k].en || map[k].zh) }));
    remaining.sort((a, b) => a.label.localeCompare(b.label, language === 'zh' ? 'zh' : 'en'));
    result.push(...remaining);

    return result;
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
              {/* All selector */}
              {(() => {
                const allLevels = ['KINDERGARTEN', 'PRIMARY', 'SECONDARY'];
                const isAllSelected = allLevels.every(l => levelFilter.includes(l));
                return (
                  <button
                    key="ALL_LEVELS"
                    onClick={() => setLevelFilter(allLevels)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all min-h-8 sm:min-h-10 cursor-pointer ${
                      isAllSelected
                        ? 'text-white shadow-md bg-slate-700'
                        : 'text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95'
                    }`}
                  >
                    {language === 'zh' ? '全部' : 'All'}
                  </button>
                );
              })()}

              {levelOptions.map(({ label, value, color }) => {
                const isActive = levelFilter.includes(value);
                const isLast = isActive && levelFilter.length === 1;
                return (
                  <button
                    key={value}
                    onClick={() => toggleLevel(value)}
                    disabled={isLast}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all min-h-8 sm:min-h-10 ${
                      isLast ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    } ${isActive ? 'text-white shadow-md' : 'text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95'}`}
                    style={isActive ? { backgroundColor: color } : undefined}
                  >
                    {label}
                  </button>
                );
              })}
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
            <p className="text-[10px] sm:text-xs font-semibold text-slate-300 uppercase mb-1.5 sm:mb-2">{t.district}</p>
            <select
              value={districtFilter ?? ''}
              onChange={(e) => setDistrictFilter(e.target.value || null)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm text-slate-100 cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="">{t.all}</option>
              {uniqueDistricts.map((option) => (
                <option key={option.value} value={option.value} disabled={(option as any).disabled}>{option.label}</option>
              ))}
            </select>
          </div>

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
