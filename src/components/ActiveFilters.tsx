import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useStore } from '../store';

interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

export default function ActiveFilters() {
  const {
    language,
    levelFilter,
    genderFilter,
    financingTypeFilter,
    religionFilter,
    districtFilter,
    distanceFilter,
    activeSchoolNet,
    searchQuery,
    clearFilters,
    setLevelFilter,
    setGenderFilter,
    setFinancingTypeFilter,
    setReligionFilter,
    setDistrictFilter,
    setDistanceFilter,
    setActiveSchoolNet,
    setSearchQuery,
  } = useStore();

  const chips = useMemo<FilterChip[]>(() => {
    const result: FilterChip[] = [];
    const t = language === 'zh' ? {
      level: '級別',
      gender: '性別',
      financing: '資助',
      religion: '宗教',
      district: '地區',
      distance: '距離',
      net: '校網',
      search: '搜尋',
    } : {
      level: 'Level',
      gender: 'Gender',
      financing: 'Financing',
      religion: 'Religion',
      district: 'District',
      distance: 'Distance',
      net: 'Net',
      search: 'Search',
    };

    if (searchQuery) {
      result.push({
        id: 'search',
        label: `${t.search}: "${searchQuery}"`,
        onRemove: () => setSearchQuery(''),
      });
    }

    const defaultLevels = ['KINDERGARTEN', 'PRIMARY', 'SECONDARY'];
    const isNonDefaultLevels = !(levelFilter.length === 3 && defaultLevels.every(l => levelFilter.includes(l)));
    if (isNonDefaultLevels) {
      const levelLabels = levelFilter.map(l => {
        if (l.includes('KINDERGARTEN')) return language === 'zh' ? '幼稚園' : 'Kindergarten';
        if (l.includes('PRIMARY')) return language === 'zh' ? '小學' : 'Primary';
        if (l.includes('SECONDARY')) return language === 'zh' ? '中學' : 'Secondary';
        return l;
      }).join(', ');
      result.push({
        id: 'level',
        label: `${t.level}: ${levelLabels}`,
        onRemove: () => setLevelFilter(defaultLevels),
      });
    }

    if (genderFilter.length > 0) {
      result.push({
        id: 'gender',
        label: `${t.gender}: ${genderFilter.length}`,
        onRemove: () => setGenderFilter([]),
      });
    }

    if (financingTypeFilter.length > 0) {
      result.push({
        id: 'financing',
        label: `${t.financing}: ${financingTypeFilter.length}`,
        onRemove: () => setFinancingTypeFilter([]),
      });
    }

    if (religionFilter.length > 0) {
      result.push({
        id: 'religion',
        label: `${t.religion}: ${religionFilter.length}`,
        onRemove: () => setReligionFilter([]),
      });
    }

    if (districtFilter) {
      result.push({
        id: 'district',
        label: `${t.district}: ${districtFilter}`,
        onRemove: () => setDistrictFilter(null),
      });
    }

    if (distanceFilter) {
      result.push({
        id: 'distance',
        label: `${t.distance}: ≤${distanceFilter}km`,
        onRemove: () => setDistanceFilter(null),
      });
    }

    if (activeSchoolNet) {
      result.push({
        id: 'net',
        label: `${t.net}: ${activeSchoolNet}`,
        onRemove: () => setActiveSchoolNet(null),
      });
    }

    return result;
  }, [language, levelFilter, genderFilter, financingTypeFilter, religionFilter, districtFilter, distanceFilter, activeSchoolNet, searchQuery, setLevelFilter, setGenderFilter, setFinancingTypeFilter, setReligionFilter, setDistrictFilter, setDistanceFilter, setActiveSchoolNet, setSearchQuery]);

  if (chips.length === 0) return null;

  const t = language === 'zh' ? { clearAll: '全部清除' } : { clearAll: 'Clear All' };

  return (
    <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none">
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <motion.button
            key={chip.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={chip.onRemove}
            className="flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 cursor-pointer hover:bg-primary/30 transition-colors"
          >
            {chip.label}
            <X className="w-3 h-3" />
          </motion.button>
        ))}
      </AnimatePresence>
      {chips.length > 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={clearFilters}
          className="text-xs text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
        >
          {t.clearAll}
        </motion.button>
      )}
    </div>
  );
}
