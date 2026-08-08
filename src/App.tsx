import React, { useEffect, useMemo, useState, Suspense } from 'react';
import axios from 'axios';
const Map = React.lazy(() => import('./components/Map'));
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import ActiveFilters from './components/ActiveFilters';
import BottomSheet from './components/BottomSheet';
const StatsTab = React.lazy(() => import('./components/StatsTab'));
const FavoritesView = React.lazy(() => import('./components/FavoritesView'));
import { fetchSchools } from './services';
import { useStore } from './store';
import { AlertCircle, Info, X, Github } from 'lucide-react';
import Loading from './components/Loading';

export default function App() {
  const { setSchools, setLoading, setError, loading, error, schools, language, setLanguage, favorites } = useStore();
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [activeView, setActiveView] = useState<'map' | 'stats' | 'favorites'>('map');
  const [deferMap, setDeferMap] = useState(false);

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
          map: '地圖',
          stats: '統計',
          favorites: '收藏',
          noFavorites: '尚未收藏任何學校',
          favoritesHint: '在學校詳情頁點擊 ☆ 即可收藏',
          authorBy: '開發者',
          githubProfile: 'GitHub 個人頁面',
          githubRepo: '專案倉庫',
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
          map: 'Map',
          stats: 'Stats',
          favorites: 'Favorites',
          noFavorites: 'No favorites yet',
          favoritesHint: 'Tap ☆ on any school detail to save it here',
          authorBy: 'Built by',
          githubProfile: 'GitHub Profile',
          githubRepo: 'Project Repo',
        }
  ), [language]);

  useEffect(() => {
    // eslint-disable-next-line no-console
  }, [loading, error, schools]);

  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        await axios.get(`${baseUrl}/api/test`, { timeout: 5000 });
      } catch (err: any) {
        console.error('Connectivity test failed:', err.message);
      }
    };
    checkConnectivity();

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchSchools();
        if (!data || !Array.isArray(data)) {
          throw new Error('Received invalid data format from server');
        }
        setSchools(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load school data. Please check your connection.');
        setLoading(false);
      }
    };

    loadData();
    // Defer loading the map bundle briefly to prioritize initial render
    const t = setTimeout(() => setDeferMap(true), 350);
    return () => clearTimeout(t);
  }, [setSchools, setLoading, setError]);

  

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-surface p-3 sm:p-6 text-center">
        <div className="w-12 sm:w-16 h-12 sm:h-16 bg-error-container rounded-full flex items-center justify-center mb-2 sm:mb-4">
          <AlertCircle className="w-6 sm:w-8 h-6 sm:h-8 text-error" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-on-surface mb-1 sm:mb-2">{t.errorTitle}</h2>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs mb-4 sm:mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-primary text-on-primary rounded-full font-semibold transition-colors cursor-pointer"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden overflow-x-hidden font-sans">
      <Loading visible={loading} />
      <div className="absolute top-1 sm:top-2 md:top-3 left-1 sm:left-2 md:left-3 right-1 sm:right-2 md:right-3 z-50 flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="bg-surface-container-high px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-full">
          <p className="text-xs sm:text-base md:text-xl font-semibold text-on-surface tracking-wide">
            {t.appName}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          <div className="rounded-full bg-surface-container-high p-1 sm:p-1.5 flex gap-0.5 sm:gap-1">
            <button
              onClick={() => setActiveView('map')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${activeView === 'map' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {t.map}
            </button>
            <button
              onClick={() => setActiveView('stats')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${activeView === 'stats' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {t.stats}
            </button>
            <button
              onClick={() => setActiveView('favorites')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors relative ${activeView === 'favorites' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {t.favorites}
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error rounded-full text-[8px] font-bold text-on-error-container flex items-center justify-center">{favorites.length}</span>
              )}
            </button>
          </div>
          <div className="rounded-full bg-surface-container-high p-1 sm:p-1.5 flex gap-0.5 sm:gap-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${language === 'en' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('zh')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-colors ${language === 'zh' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              繁中
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            className="h-8 sm:h-10 px-2 sm:px-3.5 rounded-full bg-surface-container-high text-on-surface text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5"
          >
            <Info className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden sm:inline">{t.about}</span>
          </button>
        </div>
      </div>

      {activeView === 'map' ? (
        <>
          <SearchBar />
          <FilterBar />
          <ActiveFilters />
          {deferMap ? (
            <Suspense fallback={<div className="p-4 text-on-surface-variant">{language === 'zh' ? '載入地圖...' : 'Loading map...'}</div>}>
              <Map />
            </Suspense>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">{language === 'zh' ? '載入地圖中...' : 'Preparing map...'}</div>
          )}
          <BottomSheet />
        </>
      ) : activeView === 'favorites' ? (
        <Suspense fallback={<div className="p-4 text-on-surface-variant">{language === 'zh' ? '載入收藏...' : 'Loading favorites...'}</div>}>
          <FavoritesView onBack={() => setActiveView('map')} />
        </Suspense>
      ) : (
        <Suspense fallback={<div className="p-4 text-on-surface-variant">{language === 'zh' ? '載入統計資料...' : 'Loading statistics...'}</div>}>
          <StatsTab />
        </Suspense>
      )}

      {isAboutOpen && (
        <>
          <button
            type="button"
            aria-label={t.close}
            className="fixed inset-0 z-[60] bg-black/60"
            onClick={() => setIsAboutOpen(false)}
          />
          <div className="fixed inset-x-0 top-20 z-[61] mx-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-surface-container p-5 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-semibold text-on-surface">{t.aboutTitle}</h2>
              <button
                type="button"
                aria-label={t.close}
                onClick={() => setIsAboutOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
              <p>{t.aboutOrigin}</p>
              <p>{t.aboutHowTo}</p>
              <p>{t.aboutMap}</p>
              <div className="border-t border-outline/20 pt-3 mt-3">
                <p className="text-xs text-outline mb-2">{t.authorBy} scmlewis</p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://github.com/scmlewis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Github className="w-3.5 h-3.5" />
                    {t.githubProfile}
                  </a>
                  <a
                    href="https://github.com/scmlewis/hk_school_finder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Github className="w-3.5 h-3.5" />
                    {t.githubRepo}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="space-y-2">
          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest bg-surface-container px-2.5 py-1.5 rounded-lg">
            {schools.length.toLocaleString()} {language === 'zh' ? '所學校' : 'schools indexed'}
          </p>
          <p className="text-[10px] text-outline font-medium bg-surface-container-low px-2 py-1 rounded">
            {t.data}
          </p>
        </div>
      </div>
    </div>
  );
}
