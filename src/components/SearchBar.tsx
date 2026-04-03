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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

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
    const scored = schools
      .map((school) => {
        const name = `${school["School Name"] || ""} ${school["中文名稱"] || ""}`.toLowerCase();
        const englishName = `${school["English Name"] || ""} ${school["ENGLISH NAME"] || ""}`.toLowerCase();
        const score = scoreMatch(query, name, englishName);
        return { school, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 8).map((item) => item.school);
  }, [localQuery, schools]);

  function scoreMatch(query: string, name: string, englishName: string): number {
    if (!query) return 0;
    if (name === query || englishName === query) return 100;
    if (name.startsWith(query) || englishName.startsWith(query)) return 80;
    if (name.includes(query) || englishName.includes(query)) return 50;
    return 0;
  }

  const handleSelectSchool = (school: typeof schools[0]) => {
    setSelectedSchool(school);
    setLocalQuery('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Reset selectedIndex when dropdown is hidden
  React.useEffect(() => {
    if (!showDropdown) {
      setSelectedIndex(-1);
    }
  }, [showDropdown]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || matchingSchools.length === 0) {
      if (e.key === 'Escape') {
        setShowDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % matchingSchools.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + matchingSchools.length) % matchingSchools.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && matchingSchools[selectedIndex]) {
          handleSelectSchool(matchingSchools[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="absolute top-16 sm:top-20 left-2 right-2 z-40 flex flex-col gap-1.5 sm:gap-2 max-w-xl mx-auto md:max-w-lg">
      {/* Search Input */}
      <div className="rounded-2xl sm:rounded-3xl shadow-[0_12px_28px_rgba(2,6,23,0.5)] flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/98 border border-indigo-400/25">
        <Search className="text-slate-300 w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={language === 'zh' ? '搜尋學校...（例如：小學、Primary）' : 'Search school... (e.g., 小學, Primary)'}
          className="bg-transparent border-none outline-none flex-1 text-slate-100 placeholder:text-slate-500 font-semibold py-1 text-sm sm:text-base md:text-lg"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => localQuery.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-label={language === 'zh' ? '學校搜尋' : 'School search'}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? 'school-listbox' : undefined}
          aria-activedescendant={selectedIndex >= 0 ? `school-option-${selectedIndex}` : undefined}
        />
        {localQuery && (
          <button
            onClick={handleClearSearch}
            className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 flex-shrink-0"
            title={language === 'zh' ? '清除' : 'Clear'}
            aria-label={language === 'zh' ? '清除搜尋' : 'Clear search'}
          >
            <X className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {showDropdown && matchingSchools.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-700 bg-slate-900/95 max-h-48 sm:max-h-72 overflow-y-auto"
            id="school-listbox"
            role="listbox"
            aria-label={language === 'zh' ? '學校列表' : 'Schools list'}
          >
            {matchingSchools.map((school, index) => {
              const level = getSchoolLevelByLanguage(school, language);
              const levelBadge = getLevelBadgeColor(level);
              const isSelected = selectedSchool?.["School No."] === school["School No."];
              const isHighlighted = index === selectedIndex;

              return (
                <motion.button
                  key={school["School No."] || index}
                  id={`school-option-${index}`}
                  role="option"
                  aria-selected={isHighlighted || isSelected}
                  onClick={() => handleSelectSchool(school)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full px-2.5 sm:px-4 py-2 sm:py-3 border-b border-slate-700 text-left hover:bg-slate-800 transition-colors flex items-start gap-2 sm:gap-3 cursor-pointer group",
                    isHighlighted && "bg-slate-700",
                    isSelected && "bg-indigo-500/20"
                  )}
                  whileHover={{ backgroundColor: 'rgba(30,41,59,1)' }}
                >
                  {/* Level Badge */}
                  <div className={cn('w-7 sm:w-8 h-7 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-[10px] sm:text-xs border-2', levelBadge.bg, levelBadge.text, 'border-current/30')}>
                    {levelBadge.label}
                  </div>

                  {/* School Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 text-xs sm:text-sm truncate group-hover:text-indigo-300 transition-colors">
                      {getSchoolNameByLanguage(school, language)}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                      {getSchoolSecondaryNameByLanguage(school, language)}
                    </p>
                    <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5">
                      {getSchoolDistrictByLanguage(school, language)} · {getSchoolFinancingByLanguage(school, language)}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="text-indigo-400 flex-shrink-0 font-bold text-lg sm:text-base">✓</div>
                  )}
                </motion.button>
              );
            })}

            {matchingSchools.length > 0 && (
              <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-slate-800/50 text-[10px] sm:text-[11px] text-slate-300 text-center border-t border-slate-700">
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
