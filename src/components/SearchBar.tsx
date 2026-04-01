import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { cn, getLevelBadgeColor, getSchoolDistrictByLanguage, getSchoolFinancingByLanguage, getSchoolNameByLanguage, getSchoolSecondaryNameByLanguage, getSchoolLevelByLanguage } from '../utils';

const SearchBar: React.FC = () => {
  const { 
    schools,
    searchQuery, 
    setSearchQuery, 
    setSelectedSchool,
    selectedSchool,
    language,
  } = useStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
      setShowDropdown(localQuery.length > 0); // Show dropdown when typing
    }, 200);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  // Get matching schools for autocomplete
  const matchingSchools = useMemo(() => {
    if (!localQuery.trim()) return [];
    
    const query = localQuery.toLowerCase();
    return schools
      .filter(school => {
        const name = `${school["School Name"] || ''} ${school["中文名稱"] || ''}`.toLowerCase();
        const englishName = `${school["English Name"] || ''} ${school["ENGLISH NAME"] || ''}`.toLowerCase();
        return name.includes(query) || englishName.includes(query);
      })
      .slice(0, 8); // Show top 8 results
  }, [localQuery, schools]);

  const handleSelectSchool = (school: typeof schools[0]) => {
    setSelectedSchool(school);
    setLocalQuery('');
    setShowDropdown(false);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className="absolute top-20 left-3 right-3 z-40 flex flex-col gap-2 max-w-xl mx-auto md:max-w-lg">
      {/* Search Input */}
      <div className="rounded-3xl shadow-[0_12px_28px_rgba(2,6,23,0.5)] flex items-center px-4 py-2.5 bg-slate-900/98 border border-indigo-400/25">
        <Search className="text-slate-300 w-5 h-5 mr-3 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={language === 'zh' ? '搜尋學校...（例如：小學、Primary）' : 'Search school... (e.g., 小學, Primary)'}
          className="bg-transparent border-none outline-none flex-1 text-slate-100 placeholder:text-slate-500 font-semibold py-1 text-base md:text-lg"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => localQuery.length > 0 && setShowDropdown(true)}
        />
        {localQuery && (
          <button
            onClick={handleClearSearch}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 flex-shrink-0"
            title={language === 'zh' ? '清除' : 'Clear'}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {showDropdown && matchingSchools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="rounded-3xl shadow-2xl overflow-hidden border border-slate-700 bg-slate-900/95 max-h-72 overflow-y-auto"
          >
            {matchingSchools.map((school, index) => {
              const level = getSchoolLevelByLanguage(school, language);
              const levelBadge = getLevelBadgeColor(level);
              const isSelected = selectedSchool?.["School No."] === school["School No."];

              return (
                <motion.button
                  key={school["School No."] || index}
                  onClick={() => handleSelectSchool(school)}
                  className={cn(
                    "w-full px-4 py-3 border-b border-slate-700 text-left hover:bg-slate-800 transition-colors flex items-start gap-3 cursor-pointer group",
                    isSelected && "bg-indigo-500/20"
                  )}
                  whileHover={{ backgroundColor: 'rgba(30,41,59,1)' }}
                >
                  {/* Level Badge */}
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs border-2', levelBadge.bg, levelBadge.text, 'border-current/30')}>
                    {levelBadge.label}
                  </div>

                  {/* School Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 text-sm truncate group-hover:text-indigo-300 transition-colors">
                      {getSchoolNameByLanguage(school, language)}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {getSchoolSecondaryNameByLanguage(school, language)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {getSchoolDistrictByLanguage(school, language)} · {getSchoolFinancingByLanguage(school, language)}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="text-indigo-400 flex-shrink-0 font-bold">✓</div>
                  )}
                </motion.button>
              );
            })}

            {matchingSchools.length > 0 && (
              <div className="px-4 py-2 bg-slate-800/50 text-[11px] text-slate-300 text-center border-t border-slate-700">
                {language === 'zh'
                  ? `顯示 ${matchingSchools.length} 個結果`
                  : `Showing ${matchingSchools.length} result${matchingSchools.length !== 1 ? 's' : ''}`}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
