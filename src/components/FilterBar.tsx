import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Locate, SlidersHorizontal, X, BookmarkPlus, Check, Home } from 'lucide-react';
import { useStore } from '../store';
import { getSchoolFinancingByLanguage, getSchoolGenderByLanguage, getSchoolReligionByLanguage, getSchoolDistrictByLanguage, localizeFinancingValue, localizeReligionValue, localizeDistrictValue, localizeGenderValue } from '../utils';

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
    filterPresets,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    homeAddress,
    setHomeAddress,
    filterBarOpen,
    setFilterBarOpen,
  } = useStore();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isPresetInputOpen, setIsPresetInputOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isHomeInputOpen, setIsHomeInputOpen] = useState(false);
  const [homeInput, setHomeInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autocomplete search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!homeInput.trim() || homeInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      try {
        const input = homeInput.trim();
        const enQuery = zhToEnAddress[input] || input;
        const query = encodeURIComponent(enQuery);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`,
          { headers: { 'User-Agent': 'HKSchoolFinder/1.0' } }
        );
        const results = await res.json();
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [homeInput]);

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
        savePreset: '儲存篩選',
        presetName: '篩選名稱',
        noPresets: '尚未儲存篩選',
        setHome: '設置住家位置',
        useCurrentLocation: '使用目前位置',
        searchHome: '輸入地址或地區',
        findAddress: '搜尋',
        homeSet: '住家位置已設定',
        clearHome: '清除',
        geocodingError: '找不到地址',
        geocodingLoading: '搜尋中...',
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
        savePreset: 'Save Preset',
        presetName: 'Preset name',
        noPresets: 'No saved presets',
        setHome: 'Set Home Location',
        useCurrentLocation: 'Use current location',
        searchHome: 'Search address or area',
        findAddress: 'Find',
        homeSet: 'Home location set',
        clearHome: 'Clear',
        geocodingError: 'Address not found',
        geocodingLoading: 'Searching...',
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
      let corrected = trimmed;
      if (language === 'zh') {
        if (corrected === '基督��') corrected = '基督教';
        if (corrected === '不適���' || corrected === '不��用') corrected = '不適用';
      }
      let key = '';
      if (language === 'zh') {
        const zhNormalized = corrected.replace(/[\s\uFEFF\u00A0\u200B-\u200D]/g, '').normalize('NFKC');

        const zhToCanonical: Record<string, string> = {
          '佛教': 'BUDDHISM',
          '天主教': 'CATHOLICISM',
          '孔教': 'CONFUCIANISM',
          '儒釋道三教': 'CONFUCIANISM,BUDDHISM & TAOISM',
          '伊斯蘭教': 'ISLAM',
          '基督教': 'PROTESTANTISM / CHRISTIANITY',
          '錫克教': 'SIKH',
          '道教': 'TAOISM',
          '其他': 'OTHERS'
        };

        if (zhToCanonical[zhNormalized]) {
          key = zhToCanonical[zhNormalized];
        } else if (zhNormalized === '其他。' || zhNormalized === '其他：' || zhNormalized === '其他:') {
          key = 'OTHERS';
        }
      }
      if (!key) {
        key = normalizeFilterKey(corrected);
      }
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, key === 'NOT_APPLICABLE' ? t.notApplicable : corrected);
      }
    });

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

    const added = new Set<string>();
    const result: Array<{ value: string; label: string }> = [];

    canonicalOrder.forEach((canonKey) => {
      if (map.has(canonKey) && !added.has(canonKey)) {
        result.push({ value: canonKey, label: map.get(canonKey)! });
        added.add(canonKey);
      }
    });

    const remaining = Array.from(map.entries())
      .filter(([key]) => key !== 'NOT_APPLICABLE' && !added.has(key))
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, language === 'zh' ? 'zh' : 'en'));

    result.push(...remaining);

    if (map.has('NOT_APPLICABLE')) {
      result.push({ value: 'NOT_APPLICABLE', label: map.get('NOT_APPLICABLE')! });
    }

    return result;
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
    if (levelFilter.includes(level)) {
      if (levelFilter.length <= 1) {
        return;
      }
      setLevelFilter(levelFilter.filter(l => l !== level));
    } else {
      setLevelFilter([...levelFilter, level]);
    }
  };

  const toggleMultiFilter = (value: string, current: string[], setter: (v: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
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
        setUserLocation({ lat: latitude, lng: longitude });
        setDistanceFilter(3);
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

  const zhToEnAddress: Record<string, string> = {
    '銅鑼灣': 'Causeway Bay, Hong Kong',
    '旺角': 'Mong Kok, Hong Kong',
    '尖沙咀': 'Tsim Sha Tsui, Hong Kong',
    '中環': 'Central, Hong Kong',
    '灣仔': 'Wan Chai, Hong Kong',
    '上環': 'Sheung Wan, Hong Kong',
    '西營盤': 'Sai Ying Pun, Hong Kong',
    '北角': 'North Point, Hong Kong',
    '鰂魚涌': 'Quarry Bay, Hong Kong',
    '太古城': 'Tai Koo Shing, Hong Kong',
    '沙田': 'Sha Tin, Hong Kong',
    '大埔': 'Tai Po, Hong Kong',
    '屯門': 'Tuen Mun, Hong Kong',
    '元朗': 'Yuen Long, Hong Kong',
    '荃灣': 'Tsuen Wan, Hong Kong',
    '葵涌': 'Kwai Chung, Hong Kong',
    '觀塘': 'Kwun Tong, Hong Kong',
    '九龍城': 'Kowloon City, Hong Kong',
    '黃大仙': 'Wong Tai Sin, Hong Kong',
    '深水埗': 'Sham Shui Po, Hong Kong',
    '油尖旺': 'Yau Tsim Mong, Hong Kong',
    '將軍澳': 'Tseung Kwan O, Hong Kong',
    '馬鞍山': 'Ma On Shan, Hong Kong',
    '東涌': 'Tung Chung, Hong Kong',
    '薄扶林': 'Pok Fu Lam, Hong Kong',
    '香港仔': 'Aberdeen, Hong Kong',
    '赤柱': 'Stanley, Hong Kong',
    '淺水灣': 'Repulse Bay, Hong Kong',
    '西貢': 'Sai Kung, Hong Kong',
    '紅磡': 'Hung Hom, Hong Kong',
    '土瓜灣': 'To Kwa Wan, Hong Kong',
    '鑽石山': 'Diamond Hill, Hong Kong',
    '石硤尾': 'Shek Kip Mei, Hong Kong',
    '九龍塘': 'Kowloon Tong, Hong Kong',
    '何文田': 'Ho Man Tin, Hong Kong',
    '青衣': 'Tsing Yi, Hong Kong',
    '天水圍': 'Tin Shui Wai, Hong Kong',
    '粉嶺': 'Fanling, Hong Kong',
    '上水': 'Sheung Shui, Hong Kong',
    '沙頭角': 'Sha Tau Kok, Hong Kong',
    '大圍': 'Tai Wai, Hong Kong',
    '石門': 'Shek Mun, Hong Kong',
    '火炭': 'Fo Tan, Hong Kong',
    '馬料水': 'Ma Liu Shui, Hong Kong',
  };

  const handleSetHomeFromAddress = async () => {
    if (!homeInput.trim()) return;
    setIsGeocoding(true);
    setGeocodingError(null);
    try {
      const input = homeInput.trim();
      // Try Chinese-to-English mapping first for common HK locations
      const enQuery = zhToEnAddress[input] || input;
      const query = encodeURIComponent(enQuery);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'User-Agent': 'HKSchoolFinder/1.0' } }
      );
      const results = await res.json();
      if (results.length > 0) {
        setHomeAddress({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
        setIsHomeInputOpen(false);
        setHomeInput('');
      } else {
        setGeocodingError(t.geocodingError);
      }
    } catch {
      setGeocodingError(t.geocodingError);
    } finally {
      setIsGeocoding(false);
    }
  };

  const selectSuggestion = (s: { display_name: string; lat: string; lon: string }) => {
    setHomeAddress({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setIsHomeInputOpen(false);
    setHomeInput('');
    setSuggestions([]);
  };

  const handleSetHomeFromLocation = () => {
    if (!navigator.geolocation) return;
    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setHomeAddress({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsGeocoding(false);
        setIsHomeInputOpen(false);
      },
      () => {
        setGeocodingError(t.geocodingError);
        setIsGeocoding(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const levelOptions = [
    { label: language === 'zh' ? '幼稚園' : 'Kindergarten', value: 'KINDERGARTEN', color: '#be185d' },
    { label: language === 'zh' ? '小學' : 'Primary', value: 'PRIMARY', color: '#1d4ed8' },
    { label: language === 'zh' ? '中學' : 'Secondary', value: 'SECONDARY', color: '#047857' }
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

  const buildFinancingOptions = (values: string[]) => {
    const map = new Map<string, string>();
    const toCanonical: Record<string, string> = {
      '私立': 'PRIVATE',
      '直資': 'DIRECT SUBSIDY',
      '政府': 'GOVERNMENT',
      '資助': 'AIDED',
      '英基': 'ENGLISH SCHOOLS FOUNDATION',
      'PRIVATE': 'PRIVATE',
      'PRIVATE INDEPENDENT': 'PRIVATE',
      'PRIVATE INDEPENDENT SCH SCHEME': 'PRIVATE',
      'DIRECT SUBSIDY': 'DIRECT SUBSIDY',
      'DIRECT SUBSIDY SCHEME': 'DIRECT SUBSIDY',
      'GOVERNMENT': 'GOVERNMENT',
      'AIDED': 'AIDED',
      'SUBVENTED': 'AIDED',
      'AIDED / SUBVENTED': 'AIDED',
      'CAPUT': 'AIDED',
      'ENGLISH SCHOOLS FOUNDATION': 'ENGLISH SCHOOLS FOUNDATION',
    };

    values.forEach((raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      let corrected = trimmed;
      if (corrected === '基督��') corrected = '基督教';
      if (corrected === '不適���' || corrected === '不��用') corrected = '不適用';

      const normalized = corrected.trim().toUpperCase();

      let key = toCanonical[normalized] || '';
      if (!key) {
        key = normalizeFilterKey(corrected);
      }
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, key === 'NOT_APPLICABLE' ? t.notApplicable : corrected);
      }
    });

    const canonicalOrder = [
      'PRIVATE',
      'DIRECT SUBSIDY',
      'GOVERNMENT',
      'AIDED',
      'ENGLISH SCHOOLS FOUNDATION',
    ];

    const added = new Set<string>();
    const result: Array<{ value: string; label: string }> = [];

    canonicalOrder.forEach((canonKey) => {
      if (map.has(canonKey) && !added.has(canonKey)) {
        result.push({ value: canonKey, label: map.get(canonKey)! });
        added.add(canonKey);
      }
    });

    const remaining = Array.from(map.entries())
      .filter(([key]) => key !== 'NOT_APPLICABLE' && !added.has(key))
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, language === 'zh' ? 'zh' : 'en'));

    result.push(...remaining);

    if (map.has('NOT_APPLICABLE')) {
      result.push({ value: 'NOT_APPLICABLE', label: map.get('NOT_APPLICABLE')! });
    }

    return result;
  };

  const uniqueFinancingTypes = React.useMemo(() => {
    const values = new Set<string>();
    schools.forEach((school) => {
      const v = getSchoolFinancingByLanguage(school, language).trim();
      if (v) values.add(v);
    });
    return buildFinancingOptions(Array.from(values));
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

    Object.keys(map).forEach((k) => {
      const entry = map[k];
      if (!entry.en && entry.zh) {
        const match = Object.entries(fallbackEnToZh).find(([, v]) => normalizeFilterKey(v) === k);
        if (match) entry.en = match[0];
      }
      if (!entry.zh && entry.en) {
        const maybe = fallbackEnToZh[normalizeFilterKey(entry.en)];
        if (maybe) entry.zh = maybe;
      }
    });

    const groups = [
      { key: 'HK_ISLAND', label: { en: '---HONG KONG ISLAND---', zh: '---港島---' }, members: ['CENTRAL AND WESTERN', 'WAN CHAI', 'EASTERN', 'SOUTHERN'] },
      { key: 'KOWLOON', label: { en: '---KOWLOON---', zh: '---九龍---' }, members: ['YAU TSIM MONG', 'KOWLOON CITY', 'SHAM SHUI PO', 'WONG TAI SIN', 'KWUN TONG'] },
      { key: 'NEW_TERRITORIES', label: { en: '---NEW TERRITORIES---', zh: '---新界---' }, members: ['TSUEN WAN', 'KWAI TSING', 'TUEN MUN', 'YUEN LONG', 'NORTH', 'TAI PO', 'SHA TIN', 'SAI KUNG'] },
      { key: 'ISLANDS', label: { en: '---ISLANDS---', zh: '---離島---' }, members: ['ISLANDS'] }
    ];

    const added = new Set<string>();
    const result: Array<{ value: string; label: string; disabled?: boolean }> = [];

    groups.forEach((g) => {
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

    const remaining = Object.keys(map).filter(k => !added.has(k)).map(k => ({ value: k, label: language === 'zh' ? (map[k].zh || map[k].en) : (map[k].en || map[k].zh) }));
    remaining.sort((a, b) => a.label.localeCompare(b.label, language === 'zh' ? 'zh' : 'en'));
    result.push(...remaining);

    return result;
  }, [schools, language]);

  const genderLocalizedLabels: Record<string, string> = {
    'BOYS': language === 'zh' ? '男' : 'Boys',
    'GIRLS': language === 'zh' ? '女' : 'Girls',
    'CO-ED': language === 'zh' ? '男女' : 'Co-ed',
    'NOT_APPLICABLE': t.notApplicable,
  };

  const financingLocalizedLabels: Record<string, string> = {};
  uniqueFinancingTypes.forEach(opt => {
    financingLocalizedLabels[opt.value] = language === 'zh' ? localizeFinancingValue(opt.label, language) : opt.label;
  });

  const religionLocalizedLabels: Record<string, string> = {};
  uniqueReligions.forEach(opt => {
    religionLocalizedLabels[opt.value] = language === 'zh' ? localizeReligionValue(opt.label, language) : opt.label;
  });

  const pillButtonClass = (isActive: boolean) =>
    `px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all min-h-8 sm:min-h-10 cursor-pointer ${
      isActive
        ? 'text-on-primary shadow-md bg-primary'
        : 'text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest active:scale-95'
    }`;

  const panelContent = (
    <div className="p-2.5 sm:p-3 md:p-4 space-y-2.5 sm:space-y-3 md:space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer active:scale-95"
            >
              {t.clearFilters}
            </button>
          </div>

          {/* Filter Presets */}
          <div className="border-t border-outline-variant pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase">
                {language === 'zh' ? '篩選預設' : 'Filter Presets'}
              </p>
              <button
                type="button"
                onClick={() => setIsPresetInputOpen(!isPresetInputOpen)}
                className="text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-1"
              >
                <BookmarkPlus className="w-3 h-3" />
                {t.savePreset}
              </button>
            </div>

            {isPresetInputOpen && (
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder={t.presetName}
                  className="flex-1 bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface placeholder:text-outline"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && presetName.trim()) {
                      saveFilterPreset(presetName.trim());
                      setPresetName('');
                      setIsPresetInputOpen(false);
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (presetName.trim()) {
                      saveFilterPreset(presetName.trim());
                      setPresetName('');
                      setIsPresetInputOpen(false);
                    }
                  }}
                  className="p-1.5 bg-primary text-on-primary rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPresetInputOpen(false);
                    setPresetName('');
                  }}
                  className="p-1.5 bg-surface-container-high text-on-surface-variant rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {filterPresets.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {filterPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-1 bg-surface-container-high rounded-lg pl-2.5 pr-1 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => loadFilterPreset(preset.id)}
                      className="text-[10px] sm:text-xs font-medium text-on-surface hover:text-primary transition-colors cursor-pointer"
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFilterPreset(preset.id)}
                      className="p-0.5 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] sm:text-[10px] text-outline italic">{t.noPresets}</p>
            )}
          </div>

          {/* School Level Filter */}
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase mb-1.5 sm:mb-2">{t.level}</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(() => {
                const allLevels = ['KINDERGARTEN', 'PRIMARY', 'SECONDARY'];
                const isAllSelected = allLevels.every(l => levelFilter.includes(l));
                return (
                  <button
                    key="ALL_LEVELS"
                    onClick={() => setLevelFilter(allLevels)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all min-h-8 sm:min-h-10 cursor-pointer ${
                      isAllSelected
                        ? 'text-on-surface shadow-md bg-surface-container-highest'
                        : 'text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest active:scale-95'
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
                    } ${isActive ? 'text-on-primary shadow-md' : 'text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest active:scale-95'}`}
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
              <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase mb-1.5 sm:mb-2">{t.distance}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {distanceOptions.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setDistanceFilter(value)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-[10px] sm:text-xs transition-all min-h-8 sm:min-h-10 cursor-pointer ${
                      distanceFilter === value
                        ? 'bg-primary text-on-primary shadow-md'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest active:scale-95'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase mb-1.5 sm:mb-2">{t.district}</p>
            <select
              value={districtFilter ?? ''}
              onChange={(e) => setDistrictFilter(e.target.value || null)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm text-on-surface cursor-pointer hover:border-outline transition-colors"
            >
              <option value="">{t.all}</option>
              {uniqueDistricts.map((option) => (
                <option key={option.value} value={option.value} disabled={(option as any).disabled}>
                  {(option as any).disabled ? option.label : (language === 'zh' ? localizeDistrictValue(option.label, language) : option.label)}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter - Multi-select */}
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase mb-1.5 sm:mb-2">{t.gender}</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {uniqueGenders.map(({ value, label }) => {
                const isActive = genderFilter.includes(value);
                const localizedLabel = genderLocalizedLabels[value] || label;
                return (
                  <button
                    key={value}
                    onClick={() => toggleMultiFilter(value, genderFilter, setGenderFilter)}
                    className={pillButtonClass(isActive)}
                  >
                    {localizedLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financing Type Filter - Multi-select */}
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase mb-1.5 sm:mb-2">{t.financing}</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {uniqueFinancingTypes.map(({ value, label }) => {
                const isActive = financingTypeFilter.includes(value);
                const localizedLabel = financingLocalizedLabels[value] || label;
                return (
                  <button
                    key={value}
                    onClick={() => toggleMultiFilter(value, financingTypeFilter, setFinancingTypeFilter)}
                    className={pillButtonClass(isActive)}
                  >
                    {localizedLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Religion Filter - Multi-select */}
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase mb-1.5 sm:mb-2">{t.religion}</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {uniqueReligions.map(({ value, label }) => {
                const isActive = religionFilter.includes(value);
                const localizedLabel = religionLocalizedLabels[value] || label;
                return (
                  <button
                    key={value}
                    onClick={() => toggleMultiFilter(value, religionFilter, setReligionFilter)}
                    className={pillButtonClass(isActive)}
                  >
                    {localizedLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locate Me Button */}
          <div>
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                isLocating
                  ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                  : userLocation
                  ? 'bg-secondary-container text-on-secondary-container active:scale-95'
                  : 'bg-primary text-on-primary active:scale-95'
              }`}
            >
              <Locate className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              {isLocating ? t.locating : userLocation ? t.updateLocation : t.locate}
            </button>
          </div>

          {/* Location Status */}
          {userLocation && (
            <div className="bg-secondary-container/20 border border-secondary-container/30 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <MapPin className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-secondary-container flex-shrink-0" />
                <p className="text-xs sm:text-sm text-secondary-container font-medium">{t.locationDetected}</p>
              </div>
            </div>
          )}

          {locationError && (
            <div className="bg-error-container/20 border border-error-container/30 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2">
              <p className="text-xs sm:text-sm text-error font-medium">{locationError}</p>
            </div>
          )}

          {/* Home Address */}
          <div>
            <button
              onClick={() => setIsHomeInputOpen(!isHomeInputOpen)}
              className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:scale-95"
            >
              <Home className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              {homeAddress ? t.homeSet : t.setHome}
            </button>

            {isHomeInputOpen && !homeAddress && (
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSetHomeFromLocation}
                  disabled={isGeocoding}
                  className="w-full py-2 rounded-lg font-medium text-xs bg-primary text-on-primary cursor-pointer disabled:opacity-50"
                >
                  {isGeocoding ? t.geocodingLoading : t.useCurrentLocation}
                </button>
                <div className="relative">
                  <input
                    type="text"
                    value={homeInput}
                    onChange={(e) => { setHomeInput(e.target.value); setGeocodingError(null); }}
                    placeholder={t.searchHome}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface placeholder:text-outline"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && suggestions.length > 0) {
                        selectSuggestion(suggestions[0]);
                      }
                    }}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectSuggestion(s)}
                          className="w-full text-left px-2.5 py-2 text-[10px] sm:text-xs text-on-surface hover:bg-surface-container-highest border-b border-outline-variant/30 last:border-0 cursor-pointer"
                        >
                          {s.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {geocodingError && (
                  <p className="text-[10px] sm:text-xs text-error">{geocodingError}</p>
                )}
              </div>
            )}

            {homeAddress && (
              <div className="mt-2 flex items-center justify-between bg-secondary-container/20 border border-secondary-container/30 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-secondary-container" />
                  <p className="text-[10px] sm:text-xs text-secondary-container font-medium">
                    {homeAddress.lat.toFixed(4)}, {homeAddress.lng.toFixed(4)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHomeAddress(null)}
                  className="text-[10px] sm:text-xs text-error hover:underline cursor-pointer"
                >
                  {t.clearHome}
                </button>
              </div>
            )}
          </div>

          {/* Info text */}
          <p className="text-[9px] sm:text-[10px] text-outline mt-2 sm:mt-3">
            {t.tips}
          </p>
      </div>
  );

  return (
    <>
      {filterBarOpen && (
        <div className="hidden md:block absolute top-24 sm:top-28 left-2 z-30 max-w-xs w-full">
            <div className="rounded-2xl shadow-2xl border border-outline-variant overflow-hidden bg-surface-container">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-high flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t.title}</p>
              <button
                onClick={() => setFilterBarOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                aria-label={language === 'zh' ? '關閉篩選' : 'Close filters'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {panelContent}
          </div>
        </div>
      )}

      {filterBarOpen && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            className="fixed inset-0 z-40 bg-black/45 md:hidden"
            onClick={() => setFilterBarOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-3 pb-2 sm:pb-3">
            <div className="bg-surface-container border border-outline-variant rounded-t-2xl rounded-b-2xl overflow-hidden shadow-2xl max-h-[75vh]">
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-outline-variant bg-surface-container-high">
                <p className="text-xs sm:text-sm font-bold text-on-surface tracking-wide uppercase">{t.title}</p>
                <button
                  type="button"
                  onClick={() => setFilterBarOpen(false)}
                  className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
              </div>
              <div className="max-h-[calc(75vh-50px)] overflow-y-auto p-2 sm:p-3">
                <div className="rounded-2xl border border-outline-variant bg-surface-container">
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
