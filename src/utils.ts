import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { School } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AppLanguage = 'en' | 'zh';

function firstNonEmpty(values: Array<unknown>): string {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

export function getSchoolNameByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['中文名稱'], school['School Name'], school['ENGLISH NAME'], school['English Name']]);
  }
  return firstNonEmpty([school['English Name'], school['ENGLISH NAME'], school['School Name'], school['中文名稱']]);
}

export function getSchoolSecondaryNameByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['English Name'], school['ENGLISH NAME']]);
  }
  return firstNonEmpty([school['School Name'], school['中文名稱']]);
}

export function getSchoolAddressByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['School Address'], school['中文地址'], school['English Address'], school['ENGLISH ADDRESS']]);
  }
  return firstNonEmpty([school['English Address'], school['ENGLISH ADDRESS'], school['School Address'], school['中文地址']]);
}

export function getSchoolDistrictByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['分區'], school['District'], school['DISTRICT']]);
  }
  return firstNonEmpty([school['District'], school['DISTRICT'], school['分區']]);
}

export function getSchoolReligionByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['宗教'], school['Religion']]);
  }
  return firstNonEmpty([school['Religion'], school['宗教']]);
}

export function getSchoolGenderByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['就讀學生性別'], school['Student Gender'], school['STUDENTS GENDER']]);
  }
  return firstNonEmpty([school['Student Gender'], school['STUDENTS GENDER'], school['就讀學生性別']]);
}

export function getSchoolFinancingByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['資助種類'], school['Financing Type'], school['FINANCE TYPE']]);
  }
  return firstNonEmpty([school['Financing Type'], school['FINANCE TYPE'], school['資助種類']]);
}

export function getSchoolLevelByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['學校類型'], school['School Level'], school['SCHOOL LEVEL']]);
  }
  return firstNonEmpty([school['School Level'], school['SCHOOL LEVEL'], school['學校類型']]);
}

export function getSchoolTypeByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['中文種類'], school['School Type'], school['SCHOOL TYPE']]);
  }
  return firstNonEmpty([school['School Type'], school['SCHOOL TYPE'], school['中文種類']]);
}

export function getSchoolSessionByLanguage(school: School, language: AppLanguage): string {
  if (language === 'zh') {
    return firstNonEmpty([school['時段'], school['Session'], school['SESSION']]);
  }
  return firstNonEmpty([school['Session'], school['SESSION'], school['時段']]);
}

export function getLevelBadgeColor(level: string): { bg: string; text: string; label: string } {
  const upper = level.toUpperCase();
  if (upper.includes('KINDERGARTEN')) {
    return { bg: 'bg-pink-500/15', text: 'text-pink-400', label: 'K' };
  } else if (upper.includes('PRIMARY')) {
    return { bg: 'bg-indigo-500/15', text: 'text-indigo-400', label: 'P' };
  } else if (upper.includes('SECONDARY')) {
    return { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'S' };
  }
  return { bg: 'bg-slate-500/15', text: 'text-slate-400', label: 'O' };
}

export function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

export function getLocalizedFinancingLabel(school: School, language: AppLanguage): string {
  const rawEn = getSchoolFinancingByLanguage(school, 'en') || getSchoolFinancingByLanguage(school, 'zh') || '';
  if (!rawEn) return '';
  if (language === 'zh') {
    const u = rawEn.toUpperCase();
    if (u.includes('PRIVATE')) return '私立';
    if (u.includes('DIRECT SUBSIDY') || u.includes('DSS') || u.includes('DIRECT-SUBSIDY')) return '直資';
    if (u.includes('GOVERNMENT') || u.includes('GOVT') || u.includes('GOV')) return '政府';
    if (u.includes('AIDED') || u.includes('SUBVENTED') || u.includes('GRANT')) return '資助';
    return rawEn;
  }
  return rawEn;
}

export function getLocalizedGenderLabel(school: School, language: AppLanguage): string {
  const rawEn = getSchoolGenderByLanguage(school, 'en') || getSchoolGenderByLanguage(school, 'zh') || '';
  if (!rawEn) return '';
  const u = rawEn.toUpperCase();
  if (language === 'zh') {
    if (u.includes('BOY')) return '男';
    if (u.includes('GIRL')) return '女';
    if (u.includes('CO-ED') || u.includes('COED') || u.includes('MIXED')) return '男女';
    if (u === 'N.A.' || u === 'N/A' || u === 'NA' || u === 'NOT APPLICABLE') return '不適用';
    return rawEn;
  }
  return rawEn;
}

export function getLocalizedReligionLabel(school: School, language: AppLanguage): string {
  const rawEn = getSchoolReligionByLanguage(school, 'en') || getSchoolReligionByLanguage(school, 'zh') || '';
  if (!rawEn) return '';
  const u = rawEn.toUpperCase();
  if (language === 'zh') {
    if (u.includes('BUDDHISM')) return '佛教';
    if (u.includes('CATHOLIC')) return '天主教';
    if (u.includes('PROTESTANT') || u.includes('CHRISTIAN')) return '基督教';
    if (u.includes('ISLAM')) return '伊斯蘭教';
    if (u.includes('TAOISM')) return '道教';
    if (u.includes('CONFUCIAN')) return '孔教';
    if (u.includes('SIKH')) return '錫克教';
    if (u.includes('OTH')) return '其他';
    if (u === 'N.A.' || u === 'N/A' || u === 'NA' || u === 'NOT APPLICABLE') return '不適用';
    return rawEn;
  }
  return rawEn;
}

export function getLocalizedLevelLabel(school: School, language: AppLanguage): string {
  const rawEn = getSchoolLevelByLanguage(school, 'en') || getSchoolLevelByLanguage(school, 'zh') || '';
  if (!rawEn) return '';
  const u = rawEn.toUpperCase();
  if (language === 'zh') {
    if (u.includes('KINDERGARTEN')) return '幼稚園';
    if (u.includes('PRIMARY')) return '小學';
    if (u.includes('SECONDARY')) return '中學';
    return rawEn;
  }
  return rawEn;
}

export function getLocalizedDistrictLabel(school: School, language: AppLanguage): string {
  const zhCandidate = getSchoolDistrictByLanguage(school, 'zh') || '';
  const enCandidate = getSchoolDistrictByLanguage(school, 'en') || '';
  if (language === 'zh') {
    // Prefer an existing Chinese value
    if (zhCandidate && /[\u4e00-\u9fff]/.test(zhCandidate)) return zhCandidate;

    const key = enCandidate.trim().toUpperCase();
    if (!key) return zhCandidate || enCandidate;

    const fallbackEnToZh: Record<string, string> = {
      'CENTRAL AND WESTERN': '中西區',
      'WAN CHAI': '灣仔',
      'EASTERN': '東區',
      'SOUTHERN': '南區',
      'ISLANDS': '離島',
      'YAU TSIM MONG': '油尖旺',
      'KOWLOON CITY': '九龍城',
      'SHAM SHUI PO': '深水埗',
      'WONG TAI SIN': '黃大仙',
      'KWUN TONG': '觀塘',
      'TSUEN WAN': '荃灣',
      'KWAI TSING': '葵青',
      'TUEN MUN': '屯門',
      'YUEN LONG': '元朗',
      'NORTH': '北區',
      'TAI PO': '大埔',
      'SHA TIN': '沙田',
      'SAI KUNG': '西貢'
    };

    // Try exact key then substring matches
    if (fallbackEnToZh[key]) return fallbackEnToZh[key];
    for (const k of Object.keys(fallbackEnToZh)) {
      if (key.includes(k)) return fallbackEnToZh[k];
    }

    // Fallback to any zhCandidate or enCandidate
    return zhCandidate || enCandidate;
  }

  // English mode: prefer English candidate
  return enCandidate || zhCandidate;
}

export function localizeFinancingValue(rawValue: string, language: AppLanguage): string {
  if (!rawValue) return '';
  if (language === 'zh') {
    if (/[\u4e00-\u9fff]/.test(rawValue)) return rawValue;
    const u = rawValue.toUpperCase();
    if (u.includes('PRIVATE')) return '私立';
    if (u.includes('DIRECT SUBSIDY') || u.includes('DSS') || u.includes('DIRECT-SUBSIDY')) return '直資';
    if (u.includes('GOVERNMENT') || u.includes('GOVT') || u.includes('GOV')) return '政府';
    if (u.includes('AIDED') || u.includes('SUBVENTED') || u.includes('GRANT') || u.includes('CAPUT')) return '資助';
    if (u.includes('ENGLISH') && u.includes('SCHOOL')) return '英基';
    return rawValue;
  }
  return rawValue;
}

export function localizeGenderValue(rawValue: string, language: AppLanguage): string {
  if (!rawValue) return '';
  if (language === 'zh') {
    if (/[\u4e00-\u9fff]/.test(rawValue)) return rawValue;
    const u = rawValue.toUpperCase();
    if (u.includes('BOY')) return '男';
    if (u.includes('GIRL')) return '女';
    if (u.includes('CO-ED') || u.includes('COED') || u.includes('MIXED')) return '男女';
    if (u.includes('N.A.') || u.includes('N/A') || u.includes('NA') || u.includes('NOT APPLICABLE')) return '不適用';
    return rawValue;
  }
  return rawValue;
}

export function localizeReligionValue(rawValue: string, language: AppLanguage): string {
  if (!rawValue) return '';
  if (language === 'zh') {
    if (/[\u4e00-\u9fff]/.test(rawValue)) return rawValue;
    const u = rawValue.toUpperCase();
    if (u.includes('BUDDHISM')) return '佛教';
    if (u.includes('CATHOLIC')) return '天主教';
    if (u.includes('PROTESTANT') || u.includes('CHRISTIAN')) return '基督教';
    if (u.includes('ISLAM')) return '伊斯蘭教';
    if (u.includes('TAOISM')) return '道教';
    if (u.includes('CONFUCIAN')) return '孔教';
    if (u.includes('SIKH')) return '錫克教';
    if (u.includes('OTHER') || u.includes('OTH')) return '其他';
    if (u.includes('N.A.') || u.includes('N/A') || u.includes('NA') || u.includes('NOT APPLICABLE')) return '不適用';
    return rawValue;
  }
  return rawValue;
}

export function localizeDistrictValue(rawValue: string, language: AppLanguage): string {
  if (!rawValue) return '';
  if (language === 'zh') {
    if (/[\u4e00-\u9fff]/.test(rawValue)) return rawValue;
    const key = rawValue.trim().toUpperCase();
    const fallbackEnToZh: Record<string, string> = {
      'CENTRAL AND WESTERN': '中西區',
      'WAN CHAI': '灣仔',
      'EASTERN': '東區',
      'SOUTHERN': '南區',
      'ISLANDS': '離島',
      'YAU TSIM MONG': '油尖旺',
      'KOWLOON CITY': '九龍城',
      'SHAM SHUI PO': '深水埗',
      'WONG TAI SIN': '黃大仙',
      'KWUN TONG': '觀塘',
      'TSUEN WAN': '荃灣',
      'KWAI TSING': '葵青',
      'TUEN MUN': '屯門',
      'YUEN LONG': '元朗',
      'NORTH': '北區',
      'TAI PO': '大埔',
      'SHA TIN': '沙田',
      'SAI KUNG': '西貢'
    };

    if (fallbackEnToZh[key]) return fallbackEnToZh[key];
    for (const k of Object.keys(fallbackEnToZh)) {
      if (key.includes(k)) return fallbackEnToZh[k];
    }
    return rawValue;
  }
  return rawValue;
}
