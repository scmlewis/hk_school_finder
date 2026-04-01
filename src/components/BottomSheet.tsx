import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Phone, MapPin } from 'lucide-react';
import { useStore } from '../store';
import { getSchoolAddressByLanguage, getSchoolDistrictByLanguage, getSchoolFinancingByLanguage, getSchoolGenderByLanguage, getSchoolLevelByLanguage, getSchoolNameByLanguage, getSchoolReligionByLanguage, getSchoolSecondaryNameByLanguage, getLevelBadgeColor } from '../utils';

const BottomSheet: React.FC = () => {
  const { selectedSchool, setSelectedSchool, language } = useStore();

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
      };

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
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg max-h-[90vh] md:max-h-screen overflow-y-auto"
          >
            <div className="rounded-t-[40px] shadow-2xl p-6 pb-10 border-t border-slate-700 bg-slate-900/95">
              <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-6" />
            
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-display font-bold text-slate-100 leading-tight">
                    {getSchoolNameByLanguage(selectedSchool, language)}
                  </h2>
                  {(() => {
                    const level = getSchoolLevelByLanguage(selectedSchool, language);
                    const levelBadge = getLevelBadgeColor(level);
                    return (
                      <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full border-2 ${levelBadge.bg} ${levelBadge.text} border-current/40`}>
                        {levelBadge.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  {getSchoolSecondaryNameByLanguage(selectedSchool, language)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSchool(null)}
                className="p-2 bg-slate-800 rounded-full text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Financing Type */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 rounded-2xl p-3 border border-indigo-400/20">
                <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold mb-1">{t.type}</p>
                <p className="text-sm font-semibold text-slate-200">{getSchoolFinancingByLanguage(selectedSchool, language)}</p>
              </div>
              {/* Gender */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-3 border border-purple-400/20">
                <p className="text-[10px] uppercase tracking-wider text-purple-300 font-bold mb-1 flex items-center gap-1">{t.gender}</p>
                <p className="text-sm font-semibold text-slate-200">{getSchoolGenderByLanguage(selectedSchool, language)}</p>
              </div>
            </div>

            {/* Additional Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {/* School Level */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 hover:border-slate-600 transition-colors">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{t.level}</p>
                <p className="text-xs font-semibold text-slate-200 break-words leading-snug">{getSchoolLevelByLanguage(selectedSchool, language)}</p>
              </div>
              {/* District */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 hover:border-slate-600 transition-colors">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{t.district}</p>
                <p className="text-xs font-semibold text-slate-200 break-words leading-snug">{getSchoolDistrictByLanguage(selectedSchool, language) || '-'}</p>
              </div>
              {/* Religion */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 hover:border-slate-600 transition-colors">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{t.religion}</p>
                <p className="text-xs font-semibold text-slate-200 break-words leading-snug">{getSchoolReligionByLanguage(selectedSchool, language) || t.noReligion}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/15 rounded-xl text-indigo-300">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-200 font-medium leading-relaxed">
                    {getSchoolAddressByLanguage(selectedSchool, language)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {selectedSchool.Website && (
                  <a 
                    href={selectedSchool.Website.startsWith('http') ? selectedSchool.Website : `https://${selectedSchool.Website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-2xl font-bold text-sm hover:bg-orange-600 transition-all active:scale-95"
                  >
                    <Globe className="w-4 h-4" />
                    {t.website}
                  </a>
                )}
                {selectedSchool.Telephone && (
                  <a 
                    href={`tel:${selectedSchool.Telephone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-slate-100 py-3 rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                    {t.call}
                  </a>
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
