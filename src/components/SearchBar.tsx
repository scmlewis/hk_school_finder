import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { cn, getLevelBadgeColor, getSchoolDistrictByLanguage, getSchoolFinancingByLanguage, getSchoolNameByLanguage, getSchoolSecondaryNameByLanguage, getSchoolLevelByLanguage, localizeDistrictValue, localizeFinancingValue } from '../utils';

const SearchBar: React.FC = () => {
  const { 
    schools,
    searchQuery, 
    setSearchQuery, 
    setSelectedSchool,
    selectedSchool,
    language,
    filterBarOpen,
    setFilterBarOpen,
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
    <div className="absolute top-16 sm:top-20 left-2 z-40 flex flex-col gap-1.5 sm:gap-2 max-w-md w-full">
      <div className="rounded-2xl flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-surface-container-high shadow-lg border border-outline/10">
        <Search className="text-on-surface-variant w-4 sm:w-5 h-4 sm:h-5 mr-2 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder={language === 'zh' ? '搜尋學校...' : 'Search school...'}
          className="bg-transparent border-none outline-none flex-1 text-on-surface placeholder:text-on-surface-variant font-medium py-1 text-sm sm:text-base"
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
            className="p-1.5 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant flex-shrink-0"
            title={language === 'zh' ? '清除' : 'Clear'}
            aria-label={language === 'zh' ? '清除搜尋' : 'Clear search'}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="w-px h-5 bg-outline/20 mx-1 flex-shrink-0" />
        <button
          onClick={() => {
            setShowDropdown(false);
            setFilterBarOpen(!filterBarOpen);
          }}
          className={cn(
            "p-1.5 rounded-full transition-colors flex-shrink-0",
            filterBarOpen
              ? "bg-primary text-on-primary"
              : "hover:bg-surface-container-highest text-on-surface-variant"
          )}
          title={language === 'zh' ? '篩選' : 'Filters'}
          aria-label={language === 'zh' ? '篩選學校' : 'Filter schools'}
          aria-expanded={filterBarOpen}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showDropdown && !filterBarOpen && matchingSchools.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl overflow-hidden border border-outline-variant bg-surface-container max-h-48 sm:max-h-72 overflow-y-auto"
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
                    "w-full px-2.5 sm:px-4 py-2 sm:py-3 border-b border-outline-variant/50 text-left transition-colors flex items-start gap-2 sm:gap-3 cursor-pointer group",
                    isHighlighted && "bg-surface-container-high",
                    isSelected && "bg-primary/10"
                  )}
                >
                  <div className={cn('w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-[10px] sm:text-xs', levelBadge.bg, levelBadge.text)}>
                    {levelBadge.label}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-on-surface text-xs sm:text-sm truncate group-hover:text-primary transition-colors">
                      {getSchoolNameByLanguage(school, language)}
                    </p>
                    <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">
                      {getSchoolSecondaryNameByLanguage(school, language)}
                    </p>
                    <p className="text-[9px] sm:text-[11px] text-outline mt-0.5">
                      {localizeDistrictValue(getSchoolDistrictByLanguage(school, 'en'), language)} · {localizeFinancingValue(getSchoolFinancingByLanguage(school, 'en'), language)}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="text-primary flex-shrink-0 font-semibold text-lg sm:text-base">✓</div>
                  )}
                </motion.button>
              );
            })}

            {matchingSchools.length > 0 && (
              <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-surface-container-high text-[10px] sm:text-[11px] text-on-surface-variant text-center border-t border-outline-variant/50">
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
