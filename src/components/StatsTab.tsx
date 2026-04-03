import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../store';
import {
  getSchoolDistrictByLanguage,
  getSchoolFinancingByLanguage,
  getSchoolGenderByLanguage,
  getSchoolLevelByLanguage,
  getSchoolReligionByLanguage,
  localizeFinancingValue,
  localizeGenderValue,
  localizeReligionValue,
  localizeDistrictValue,
} from '../utils';

type ChartDatum = {
  name: string;
  value: number;
};

type HistogramDatum = {
  bucket: string;
  count: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valueLabel: string;
};

function normalizeText(value: string, fallback: string): string {
  const trimmed = String(value || '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeLevelLabel(value: string, language: 'en' | 'zh', fallback: string): string {
  const upper = value.toUpperCase();
  if (upper.includes('KINDERGARTEN') || upper.includes('幼稚')) return language === 'zh' ? '幼稚園' : 'Kindergarten';
  if (upper.includes('PRIMARY') || upper.includes('小學')) return language === 'zh' ? '小學' : 'Primary';
  if (upper.includes('SECONDARY') || upper.includes('中學')) return language === 'zh' ? '中學' : 'Secondary';
  return normalizeText(value, fallback);
}

function getCanonicalLevel(value: string): 'KINDERGARTEN' | 'PRIMARY' | 'SECONDARY' | 'OTHER' {
  const upper = value.toUpperCase();
  if (upper.includes('KINDERGARTEN') || upper.includes('幼稚')) return 'KINDERGARTEN';
  if (upper.includes('PRIMARY') || upper.includes('小學')) return 'PRIMARY';
  if (upper.includes('SECONDARY') || upper.includes('中學')) return 'SECONDARY';
  return 'OTHER';
}

function buildDistribution(values: string[], fallback: string): ChartDatum[] {
  const map = new Map<string, number>();

  values.forEach((value) => {
    const key = normalizeText(value, fallback);
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value);
}

function normalizeReligionLabel(value: string, fallback: string, noneLabel: string): string {
  const normalized = normalizeText(value, fallback);
  const upper = normalized.toUpperCase();
  const compact = upper.replace(/[\s./_-]/g, '');

  const isNoReligion =
    normalized === '無' ||
    normalized === '不適用' ||
    upper === 'N.A.' ||
    upper === 'N/A' ||
    compact === 'NA' ||
    compact === 'NONE' ||
    compact === 'NOTAPPLICABLE' ||
    compact === 'NORELIGION';

  return isNoReligion ? noneLabel : normalized;
}

function buildReligionDistribution(values: string[], fallback: string, noneLabel: string): ChartDatum[] {
  const base = buildDistribution(values.map((value) => normalizeReligionLabel(value, fallback, noneLabel)), fallback);
  const regular = base.filter((item) => item.name !== noneLabel);
  const none = base.find((item) => item.name === noneLabel);
  return none ? [...regular, none] : regular;
}

const cardClass = 'rounded-2xl border border-slate-700 bg-slate-900/90 shadow-[0_12px_36px_rgba(2,6,23,0.45)]';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={`${cardClass} p-4 sm:p-5`}>
      <p className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-slate-100 mt-1">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`${cardClass} p-4 sm:p-5`}>
      <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function LocalizedTooltip({ active, payload, label, valueLabel }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 px-4 py-3 shadow-xl">
      <p className="text-slate-100 font-semibold text-base">{label}</p>
      <p className="text-cyan-400 text-2xl mt-1">
        {valueLabel} : <span className="font-semibold">{Number(payload[0].value || 0).toLocaleString()}</span>
      </p>
    </div>
  );
}

function DistributionChart({ data, color, valueLabel }: { data: ChartDatum[]; color: string; valueLabel: string }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis
            dataKey="name"
            angle={-25}
            textAnchor="end"
            interval={0}
            height={54}
            tick={{ fill: '#cbd5e1', fontSize: 11 }}
          />
          <YAxis allowDecimals={false} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: 'rgba(30, 41, 59, 0.35)' }}
            content={<LocalizedTooltip valueLabel={valueLabel} />}
          />
          <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DistrictChart({ data, color, valueLabel }: { data: ChartDatum[]; color: string; valueLabel: string }) {
  const chartHeight = Math.max(320, data.length * 34 + 24);

  return (
    <div style={{ height: chartHeight }} className="w-full overflow-x-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis type="number" allowDecimals={false} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#cbd5e1', fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: 'rgba(30, 41, 59, 0.35)' }}
            content={<LocalizedTooltip valueLabel={valueLabel} />}
          />
          <Bar dataKey="value" fill={color} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const StatsTab: React.FC = () => {
  const { schools, filteredSchools, language } = useStore();
  const [useFiltered, setUseFiltered] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<Array<'KINDERGARTEN' | 'PRIMARY' | 'SECONDARY'>>([
    'KINDERGARTEN',
    'PRIMARY',
    'SECONDARY',
  ]);

  const t = language === 'zh'
    ? {
        title: '學校統計總覽',
        subtitle: '以下統計可切換使用全部學校或目前篩選結果。',
        scopeAll: '全部學校',
        scopeFiltered: '目前篩選',
        levelFilterLabel: '學校級別篩選',
        levelFilterHint: '可多選',
        levelKindergarten: '幼稚園',
        levelPrimary: '小學',
        levelSecondary: '中學',
        totalSchools: '學校總數',
        districts: '涵蓋地區',
        unknown: '未提供',
        byLevel: '按學校級別分布',
        byFinancing: '按資助種類分布',
        byGender: '按學生性別分布',
        byReligion: '按宗教分布',
        byDistrict: '按地區分布（全部）',
        empty: '目前沒有可顯示的統計資料。',
        noReligion: '無宗教 / 不適用',
        countLabel: '數量',
      }
    : {
        title: 'School Statistics',
        subtitle: 'Toggle between all schools or current filters.',
        scopeAll: 'All schools',
        scopeFiltered: 'Current filters',
        levelFilterLabel: 'School Level Filter',
        levelFilterHint: 'multi-select',
        levelKindergarten: 'Kindergarten',
        levelPrimary: 'Primary',
        levelSecondary: 'Secondary',
        totalSchools: 'Total Schools',
        districts: 'Districts Covered',
        unknown: 'Unknown',
        byLevel: 'Distribution by School Level',
        byFinancing: 'Distribution by Financing Type',
        byGender: 'Distribution by Student Gender',
        byReligion: 'Distribution by Religion',
        byDistrict: 'Distribution by District (All)',
        empty: 'No statistics available for the current filters.',
        noReligion: 'No religion / N.A.',
        countLabel: 'count',
      };

  const statsSchools = useFiltered ? filteredSchools : schools;

  const levelOptions = useMemo(() => [
    { key: 'KINDERGARTEN' as const, label: t.levelKindergarten },
    { key: 'PRIMARY' as const, label: t.levelPrimary },
    { key: 'SECONDARY' as const, label: t.levelSecondary },
  ], [t.levelKindergarten, t.levelPrimary, t.levelSecondary]);

  const filteredStatsSchools = useMemo(() => {
    if (selectedLevels.length === 0) return statsSchools;
    return statsSchools.filter((school) => {
      const level = getCanonicalLevel(getSchoolLevelByLanguage(school, language));
      if (level === 'OTHER') return false;
      return selectedLevels.includes(level);
    });
  }, [language, selectedLevels, statsSchools]);

  const toggleLevel = (key: 'KINDERGARTEN' | 'PRIMARY' | 'SECONDARY') => {
    setSelectedLevels((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const levelDistribution = useMemo(() => {
    return buildDistribution(
      filteredStatsSchools.map((school) => normalizeLevelLabel(getSchoolLevelByLanguage(school, language), language, t.unknown)),
      t.unknown
    );
  }, [filteredStatsSchools, language, t.unknown]);

  const financingDistribution = useMemo(() => {
    return buildDistribution(
      filteredStatsSchools.map((school) => localizeFinancingValue(getSchoolFinancingByLanguage(school, 'en'), language)),
      t.unknown
    );
  }, [filteredStatsSchools, language, t.unknown]);

  const genderDistribution = useMemo(() => {
    return buildDistribution(
      filteredStatsSchools.map((school) => localizeGenderValue(getSchoolGenderByLanguage(school, 'en'), language)),
      t.unknown
    );
  }, [filteredStatsSchools, language, t.unknown]);

  const religionDistribution = useMemo(() => {
    return buildReligionDistribution(
      filteredStatsSchools.map((school) => localizeReligionValue(getSchoolReligionByLanguage(school, 'en'), language)),
      t.unknown,
      t.noReligion
    );
  }, [filteredStatsSchools, language, t.noReligion, t.unknown]);

  const districtDistribution = useMemo(() => {
    return buildDistribution(
      filteredStatsSchools.map((school) => localizeDistrictValue(getSchoolDistrictByLanguage(school, 'en'), language)),
      t.unknown
    );
  }, [filteredStatsSchools, language, t.unknown]);

  const representedDistricts = useMemo(() => {
    return districtDistribution.length;
  }, [districtDistribution.length]);

  if (filteredStatsSchools.length === 0) {
    return (
      <div className="absolute inset-0 pt-40 sm:pt-44 md:pt-28 px-3 sm:px-4 md:px-6 pb-6 md:pb-8 overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <div className={`${cardClass} p-8 text-center`}>
            <p className="text-slate-300 font-semibold">{t.empty}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pt-40 sm:pt-44 md:pt-28 px-3 sm:px-4 md:px-6 pb-6 md:pb-8 overflow-y-auto overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
        <div className={`${cardClass} p-4 sm:p-5`}>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{t.title}</h2>
          <p className="text-sm text-slate-400 mt-1">{t.subtitle}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold">
              {useFiltered ? t.scopeFiltered : t.scopeAll}
            </span>
            <button
              type="button"
              onClick={() => setUseFiltered((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                useFiltered
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-800 border-slate-600 text-slate-300 hover:text-white"
              }`}
            >
              {useFiltered ? t.scopeFiltered : t.scopeAll}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold">
              {t.levelFilterLabel}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500">({t.levelFilterHint})</span>
            {levelOptions.map((option) => {
              const active = selectedLevels.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => toggleLevel(option.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${active ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <StatCard label={t.totalSchools} value={filteredStatsSchools.length.toLocaleString()} />
          <StatCard label={t.districts} value={representedDistricts.toLocaleString()} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          <ChartCard title={t.byLevel}>
            <DistributionChart data={levelDistribution} color="#6366f1" valueLabel={t.countLabel} />
          </ChartCard>

          <ChartCard title={t.byFinancing}>
            <DistributionChart data={financingDistribution} color="#f97316" valueLabel={t.countLabel} />
          </ChartCard>

          <ChartCard title={t.byGender}>
            <DistributionChart data={genderDistribution} color="#22c55e" valueLabel={t.countLabel} />
          </ChartCard>

          <ChartCard title={t.byReligion}>
            <DistributionChart data={religionDistribution} color="#a855f7" valueLabel={t.countLabel} />
          </ChartCard>

          <ChartCard title={t.byDistrict}>
            <DistrictChart data={districtDistribution} color="#0ea5e9" valueLabel={t.countLabel} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
