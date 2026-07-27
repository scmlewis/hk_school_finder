import React from 'react';
import { X, MapPin, GitCompare } from 'lucide-react';
import { useStore } from '../store';
import {
  getSchoolNameByLanguage,
  getSchoolSecondaryNameByLanguage,
  getSchoolLevelByLanguage,
  getLevelBadgeColor,
  getLocalizedGenderLabel,
  getLocalizedDistrictLabel,
  getLocalizedReligionLabel,
  getSchoolSessionByLanguage,
  getLocalizedSessionLabel,
} from '../utils';

interface CompareViewProps {
  onBack: () => void;
}

const CompareView: React.FC<CompareViewProps> = ({ onBack }) => {
  const {
    schools,
    comparisonList,
    removeFromComparison,
    clearComparison,
    language,
    setSelectedSchool,
    homeAddress,
  } = useStore();

  const t = language === 'zh'
    ? {
        title: '學校比較',
        empty: '從地圖新增學校以進行比較',
        hint: '在學校詳情卡點擊比較',
        backToMap: '返回地圖',
        clearAll: '清除比較',
        addAnother: '新增另一所學校',
        level: '學校級別',
        gender: '學生性別',
        district: '地區',
        religion: '宗教',
        session: '授課時間',
        schoolType: '學校類別',
        directions: '導航',
        noValue: '未提供',
      }
    : {
        title: 'Compare Schools',
        empty: 'Add schools from the map to compare them',
        hint: 'Tap Compare on any school detail card',
        backToMap: 'Back to Map',
        clearAll: 'Clear Comparison',
        addAnother: 'Add another school',
        level: 'Level',
        gender: 'Gender',
        district: 'District',
        religion: 'Religion',
        session: 'Session',
        schoolType: 'School Type',
        directions: 'Directions',
        noValue: 'N/A',
      };

  const comparedSchools = schools.filter((s) => comparisonList.includes(s['School No.']));
  const rows = [
    { label: t.level, getValue: (s: any) => {
      const level = getSchoolLevelByLanguage(s, language);
      const badge = getLevelBadgeColor(level);
      return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>;
    }},
    { label: t.gender, getValue: (s: any) => getLocalizedGenderLabel(s, language) || t.noValue },
    { label: t.district, getValue: (s: any) => getLocalizedDistrictLabel(s, language) || t.noValue },
    { label: t.religion, getValue: (s: any) => getLocalizedReligionLabel(s, language) || t.noValue },
    { label: t.session, getValue: (s: any) => getLocalizedSessionLabel(getSchoolSessionByLanguage(s, 'en'), language) || t.noValue },
    { label: t.schoolType, getValue: (s: any) => {
      const raw = s['School Type'] || '';
      if (!raw) return t.noValue;
      if (language === 'zh') {
        const map: Record<string, string> = {
          'Aided': '資助',
          'Government': '政府',
          'Private': '私立',
          'Direct Subsidy': '直資',
        };
        const key = Object.keys(map).find((k) => raw.includes(k));
        return key ? `${map[key]}${raw.replace(key, '').trim()}` : raw;
      }
      return raw;
    }},
  ];

  if (comparedSchools.length === 0) {
    return (
      <div className="absolute inset-0 pt-40 sm:pt-44 md:pt-28 px-3 sm:px-4 md:px-6 pb-6 md:pb-8 overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl bg-surface-container p-8 text-center">
            <GitCompare className="w-12 h-12 text-on-surface-variant mx-auto mb-3" />
            <p className="text-on-surface-variant font-medium">{t.empty}</p>
            <p className="text-outline text-sm mt-1">{t.hint}</p>
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-full font-medium text-sm cursor-pointer"
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
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-surface-container p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-on-surface">{t.title}</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                {comparedSchools.length} {language === 'zh' ? '所學校已選擇' : 'schools selected'}
              </p>
            </div>
            <div className="flex gap-2">
              {comparedSchools.length < 2 && (
                <button
                  onClick={onBack}
                  className="px-3 py-1.5 bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-full text-xs font-medium cursor-pointer"
                >
                  {t.addAnother}
                </button>
              )}
              <button
                onClick={clearComparison}
                className="px-3 py-1.5 bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-full text-xs font-medium cursor-pointer"
              >
                {t.clearAll}
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        {comparedSchools.length >= 1 && (
          <div className="rounded-2xl bg-surface-container overflow-hidden">
            {/* School Headers */}
            <div className={`grid ${comparedSchools.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} divide-x divide-outline-variant`}>
              {comparedSchools.map((school) => {
                const level = getSchoolLevelByLanguage(school, language);
                const badge = getLevelBadgeColor(level);
                return (
                  <div key={school['School No.']} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-medium text-xs ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </div>
                        <div className="min-w-0">
                          <h3
                            className="text-sm sm:text-base font-semibold text-on-surface truncate cursor-pointer hover:underline"
                            onClick={() => setSelectedSchool(school)}
                          >
                            {getSchoolNameByLanguage(school, language)}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-on-surface-variant truncate">
                            {getSchoolSecondaryNameByLanguage(school, language)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromComparison(school['School No.'])}
                        className="p-1 text-on-surface-variant hover:text-error transition-colors cursor-pointer flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {school.Longitude && school.Latitude && (
                      <a
                        href={homeAddress
                          ? `https://www.google.com/maps/dir/?api=1&origin=${homeAddress.lat},${homeAddress.lng}&destination=${school.Latitude},${school.Longitude}`
                          : `https://www.google.com/maps/dir/?api=1&destination=${school.Latitude},${school.Longitude}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-primary hover:underline"
                      >
                        <MapPin className="w-3 h-3" />
                        {t.directions}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comparison Rows */}
            <div className="divide-y divide-outline-variant border-t border-outline-variant">
              {rows.map((row, i) => (
                <div key={i} className={`grid ${comparedSchools.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${i % 2 === 0 ? 'bg-surface-container-high/30' : ''}`}>
                  {comparedSchools.map((school) => (
                    <div key={school['School No.']} className="px-4 py-3">
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-0.5">{row.label}</p>
                      <p className="text-xs sm:text-sm text-on-surface font-medium break-words">{row.getValue(school)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareView;
