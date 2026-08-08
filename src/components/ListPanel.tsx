import React, { useEffect, useRef, useState, useCallback } from 'react';
import { List } from 'react-window';
import { motion } from 'motion/react';
import { useStore } from '../store';
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
      style={{ ...style, paddingLeft: 12, paddingRight: 12, paddingBottom: 8 }}
    />
  );
}

function ListContent({ containerHeight, isLoaded, filteredSchools, t }: {
  containerHeight: number;
  isLoaded: boolean;
  filteredSchools: any[];
  t: { noResults: string; schools: string };
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

  return (
    <>
      <div className="px-3 py-2 border-b border-outline/10 flex-shrink-0">
        <p className="text-xs text-on-surface-variant font-medium">
          {filteredSchools.length.toLocaleString()} {t.schools}
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
          <div className="flex items-center justify-center h-full px-4">
            <p className="text-sm text-on-surface-variant text-center">{t.noResults}</p>
          </div>
        ) : (
          <List
            listRef={listRef}
            rowComponent={SchoolRow}
            rowCount={filteredSchools.length}
            rowHeight={CARD_HEIGHT}
            rowProps={rowProps}
            style={{ height: containerHeight - 40, width: '100%' }}
          />
        )}
      </div>
    </>
  );
}

export default function ListPanel() {
  const { filteredSchools, selectedSchool, setSelectedSchool, language } = useStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    setIsLoaded(false);
    const timer = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, [filteredSchools]);

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
    ? { noResults: '沒有符合條件的學校', schools: '所學校' }
    : { noResults: 'No schools match your filters', schools: 'schools' };

  return (
    <>
      {/* Desktop: side panel */}
      <div
        ref={containerRef}
        className="hidden md:flex h-full bg-surface border-l border-outline/10 flex-col"
        style={{ width: PANEL_WIDTH }}
      >
        <ListContent
          containerHeight={containerHeight}
          isLoaded={isLoaded}
          filteredSchools={filteredSchools}
          t={t}
        />
      </div>

      {/* Mobile: drawer */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) {
            useStore.getState().setListPanelOpen(false);
          }
        }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-2xl flex flex-col"
        style={{ height: '60vh', zIndex: 45 }}
      >
        <div className="flex justify-center py-2 flex-shrink-0">
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>
        <ListContent
          containerHeight={Math.floor(window.innerHeight * 0.6) - 32}
          isLoaded={isLoaded}
          filteredSchools={filteredSchools}
          t={t}
        />
      </motion.div>
    </>
  );
}
