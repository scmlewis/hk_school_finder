import React, { useEffect, useState } from 'react';
import '../components/Loading.css';
import logo from '../assets/logo.svg';
import { useStore } from '../store';

type Props = {
  visible: boolean;
};

export default function Loading({ visible }: Props) {
  const { language } = useStore();
  const [mounted, setMounted] = useState(visible);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setExiting(false);
      setMounted(true);
    } else if (mounted) {
      setExiting(true);
      const t = setTimeout(() => setMounted(false), 420);
      return () => clearTimeout(t);
    }
  }, [visible, mounted]);

  if (!mounted) return null;

  const title = language === 'zh' ? '香港學校地圖' : 'HK School Finder';
  const loadingText = language === 'zh' ? '載入香港學校資料中...' : 'Loading HK School Data...';

  return (
    <div
      className={`loading-overlay ${exiting ? 'loading-exit' : 'loading-enter'}`}
      role="status"
      aria-live="polite"
      aria-label={loadingText}
    >
      <div className="loading-backdrop" />
      <div className="loading-content">
        <div className="brand">
          <img src={logo} alt={title} className="brand-mark" />
        </div>

        <h1 className="loading-title">{title}</h1>
        <p className="loading-sub">{loadingText}</p>

        <div className="loading-bar" aria-hidden />
      </div>
    </div>
  );
}
