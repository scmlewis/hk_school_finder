import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { List } from 'react-window';
import { motion } from 'motion/react';
import { X, School as SchoolIcon } from 'lucide-react';
import { useStore } from '../store';
import { School } from '../types';
import SchoolCard from './SchoolCard';
import { SkeletonListCard } from './Skeleton';

const CARD_HEIGHT = 88;
const PANEL_WIDTH = 360;

interface SchoolRowProps {
  index: number;
  style: React.CSSProperties;
  schools: any[];
  selectedSchoolId: string | null;
  onSchoolClick: (school: any) => void;
}

function SchoolRow({ index, style, schools, selectedSchoolId, onSchoolClick }: SchoolRowProps) {
  const school = schools[index];
  const isSelected = school['School No.'] === selectedSchoolId;
  return (
    <SchoolCard
      school={school}
      isSelected={isSelected}
      onClick={() => onSchoolClick(school)}
      style={{ ...style, paddingLeft: 8, paddingRight: 8, paddingBottom: 6 }}
    />
  );
}

function ListContent({ availableHeight, isLoaded, filteredSchools, totalCount, t, onClose }: {
  availableHeight: number;
  isLoaded: boolean;
  filteredSchools: any[];
  totalCount: number;
  t: { noResults: string; schools: string; title: string; showing: string; of: string; close: string };
  onClose: () => void;
}) {
  const { selectedSchool, setSelectedSchool, language } = useStore();
  const listRef = useRef<{ element: HTMLDivElement | null; scrollToRow: (config: { align?: string; behavior?: string; index: number }) => void } | null>(null);

  const selectedIndex = filteredSchools.findIndex(
    (s) => s['School No.'] === selectedSchool?.['School No.']
  );

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      listRef.current.scrollToRow({ index: selectedIndex, align: 'smart' });
    }
  }, [selectedIndex]);

  const handleSchoolClick = useCallback((school: any) => {
    setSelectedSchool(school);
  }, [setSelectedSchool]);

  const selectedSchoolId = selectedSchool?.['School No.'] ?? null;

  const rowProps = {
    schools: filteredSchools,
    selectedSchoolId,
    onSchoolClick: handleSchoolClick,
  } as any;

  const HEADER_HEIGHT = 48;
  const COUNT_HEIGHT = 36;
  const listHeight = availableHeight - HEADER_HEIGHT - COUNT_HEIGHT;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-outline/10 flex items-center justify-between flex-shrink-0 bg-surface-container-high rounded-t-2xl">
        <div className="flex items-center gap-2">
          <SchoolIcon className="w-4 h-4 text-on-surface-variant" />
          <p className="text-sm font-semibold text-on-surface">{t.title}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-surface-container-highest text-on-surface-variant transition-colors"
          aria-label={t.close}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-outline/10 flex-shrink-0">
        <p className="text-xs text-on-surface-variant font-medium">
          {t.showing} <span className="text-on-surface font-semibold">{filteredSchools.length.toLocaleString()}</span> {t.of} {totalCount.toLocaleString()} {t.schools}
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        {!isLoaded ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonListCard key={i} />
            ))}
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 gap-2">
            <SchoolIcon className="w-8 h-8 text-outline-variant" />
            <p className="text-sm text-on-surface-variant text-center">{t.noResults}</p>
          </div>
        ) : (
          <List
            listRef={listRef}
            rowComponent={SchoolRow}
            rowCount={filteredSchools.length}
            rowHeight={CARD_HEIGHT}
            rowProps={rowProps}
            style={{ height: listHeight, width: '100%' }}
          />
        )}
      </div>
    </div>
  );
}

export default function ListPanel() {
  const { filteredSchools, language, setListPanelOpen } = useStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  const dedupedSchools = useMemo(() => {
    const seen = new Map<string, School>();
    for (const school of filteredSchools) {
      const id = school['School No.'] || '';
      if (id && !seen.has(id)) {
        seen.set(id, school);
      }
    }
    return Array.from(seen.values());
  }, [filteredSchools]);

  useEffect(() => {
    setIsLoaded(false);
    const timer = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, [dedupedSchools]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const t = language === 'zh'
    ? { noResults: '沒有符合條件的學校', schools: '所學校', title: '學校列表', showing: '顯示', of: '/', close: '關閉列表' }
    : { noResults: 'No schools match your filters', schools: 'schools', title: 'School List', showing: 'Showing', of: 'of', close: 'Close list' };

  const handleClose = () => setListPanelOpen(false);

  return (
    <>
      {/* Desktop: floating card over map */}
      <div
        ref={containerRef}
        className="hidden md:flex fixed top-[60px] right-3 bottom-3 z-40 bg-surface-container border border-outline-variant rounded-2xl shadow-2xl flex-col overflow-hidden"
        style={{ width: PANEL_WIDTH }}
      >
        <ListContent
          availableHeight={containerHeight}
          isLoaded={isLoaded}
          filteredSchools={dedupedSchools}
          totalCount={filteredSchools.length}
          t={t}
          onClose={handleClose}
        />
      </div>

      {/* Mobile: bottom drawer */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) {
            handleClose();
          }
        }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container rounded-t-2xl shadow-2xl flex flex-col border border-outline-variant border-b-0"
        style={{ height: '60vh', zIndex: 45 }}
      >
        <div className="flex justify-center py-2 flex-shrink-0">
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>
        <ListContent
          availableHeight={Math.floor(window.innerHeight * 0.6) - 32}
          isLoaded={isLoaded}
          filteredSchools={dedupedSchools}
          totalCount={filteredSchools.length}
          t={t}
          onClose={handleClose}
        />
      </motion.div>
    </>
  );
}
