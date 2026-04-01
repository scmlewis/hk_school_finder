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
