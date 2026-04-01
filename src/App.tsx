import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import BottomSheet from './components/BottomSheet';
import { fetchSchools } from './services';
import { useStore } from './store';
import { Loader2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  console.log('App: Rendering...');
  const { setSchools, setLoading, setError, loading, error, schools, language, setLanguage } = useStore();
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const t = useMemo(() => (
    language === 'zh'
      ? {
          appName: '香港學校地圖',
          loading: '載入香港學校資料中...',
          errorTitle: '發生錯誤',
          retry: '重試',
          about: '關於',
          aboutTitle: '關於香港學校地圖',
          aboutOrigin: '資料來源：教育局（EDB）及 Data.gov.hk。',
          aboutHowTo: '使用方式：先搜尋學校名稱，再用篩選器（級別、性別、資助類型、宗教）縮小結果。',
          aboutMap: '地圖提示：點擊學校標記可打開詳細資訊卡，查看地址、學校資訊及聯絡方式。',
          close: '關閉',
          data: '資料來源：教育局與Data.gov.hk',
        }
      : {
          appName: 'HK School Finder',
          loading: 'Loading HK School Data...',
          errorTitle: 'Oops! Something went wrong',
          retry: 'Try Again',
          about: 'About',
          aboutTitle: 'About HK School Finder',
          aboutOrigin: 'Data sources: Hong Kong EDB and Data.gov.hk datasets.',
          aboutHowTo: 'How to use: start with search, then narrow results using filters (level, gender, financing type, religion).',
          aboutMap: 'Map tip: click a school marker to open the detail card with address, school details, and contact actions.',
          close: 'Close',
          data: 'Data: EDB & Data.gov.hk',
        }
  ), [language]);

  useEffect(() => {
    console.log('App: Store State:', { loading, error, schoolsCount: schools.length });
  }, [loading, error, schools]);

  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const res = await axios.get(`${baseUrl}/api/test`, { timeout: 5000 });
        console.log('App: Connectivity test:', res.data);
      } catch (err: any) {
        console.error('App: Connectivity test failed', err.name, err.message);
      }
    };
    checkConnectivity();

    const loadData = async () => {
      console.log('App: Starting to load data...');
      try {
        setLoading(true);
        const data = await fetchSchools();
        if (!data || !Array.isArray(data)) {
          throw new Error('Received invalid data format from server');
        }
        console.log('App: Data fetched successfully', data.length);
        if (data.length > 0) {
          console.log('App: Sample school:', data[0]);
        }
        setSchools(data);
        setLoading(false);
      } catch (err) {
        console.error('App: Error loading data', err);
        setError('Failed to load school data. Please check your connection.');
        setLoading(false);
      }
    };

    loadData();
  }, [setSchools, setLoading, setError]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-4 right-4 max-w-xl mx-auto h-16 bg-slate-900 rounded-2xl skeleton" />
          <div className="absolute top-64 left-3 right-3 max-w-md mx-auto h-96 bg-slate-900 rounded-2xl skeleton" />
        </div>
        
        <div className="relative z-10 text-center">
          <div className="mb-6">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          </div>
          <p className="text-slate-300 font-display font-semibold text-lg mb-2">
            {t.loading}
          </p>
          <p className="text-slate-500 text-sm font-medium">
            {language === 'zh' ? '正在獲取數據...' : 'Fetching data...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
          <AlertCircle className="w-8 h-8 text-red-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">{t.errorTitle}</h2>
        <p className="text-slate-400 max-w-xs mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors cursor-pointer"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden font-sans">
      <div className="absolute top-3 left-3 right-3 z-50 flex items-center justify-between gap-2">
        <div className="bg-slate-900/98 border border-indigo-400/30 shadow-[0_10px_30px_rgba(79,70,229,0.18)] rounded-xl px-4 py-2.5">
          <p className="text-base md:text-xl font-display font-bold text-slate-100 tracking-wide">
            {t.appName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-slate-900/98 border border-blue-400/25 p-1.5 flex gap-1 shadow-[0_8px_24px_rgba(30,41,59,0.45)]">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('zh')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${language === 'zh' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              繁中
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-slate-900/98 border border-blue-400/25 text-slate-100 text-sm font-semibold flex items-center gap-1.5 shadow-[0_8px_24px_rgba(30,41,59,0.45)]"
          >
            <Info className="w-4 h-4" />
            {t.about}
          </button>
        </div>
      </div>

      <SearchBar />
      <FilterBar />
      <Map />
      <BottomSheet />

      {isAboutOpen && (
        <>
          <button
            type="button"
            aria-label={t.close}
            className="fixed inset-0 z-[60] bg-black/55"
            onClick={() => setIsAboutOpen(false)}
          />
          <div className="fixed inset-x-0 top-20 z-[61] mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-100">{t.aboutTitle}</h2>
              <button
                type="button"
                aria-label={t.close}
                onClick={() => setIsAboutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>{t.aboutOrigin}</p>
              <p>{t.aboutHowTo}</p>
              <p>{t.aboutMap}</p>
            </div>
          </div>
        </>
      )}
      
      {/* Attribution / Info - Credibility & Trust */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-900/80 border border-slate-700 px-2.5 py-1.5 rounded-lg ">
            📊 {schools.length.toLocaleString()} {language === 'zh' ? '所學校' : 'schools indexed'}
          </p>
          <p className="text-[10px] text-slate-500 font-medium bg-slate-900/60 border border-slate-700 px-2 py-1 rounded">
            {t.data}
          </p>
        </div>
      </div>
    </div>
  );
}
