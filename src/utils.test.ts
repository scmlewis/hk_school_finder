import { describe, it, expect } from 'vitest';
import {
  highlightMatch,
  cn,
  getSchoolNameByLanguage,
  getSchoolSecondaryNameByLanguage,
  getSchoolAddressByLanguage,
  getSchoolDistrictByLanguage,
  getSchoolReligionByLanguage,
  getSchoolGenderByLanguage,
  getSchoolFinancingByLanguage,
  getSchoolLevelByLanguage,
  getSchoolTypeByLanguage,
  getSchoolSessionByLanguage,
  getLevelBadgeColor,
  getLocalizedFinancingLabel,
  getLocalizedGenderLabel,
  getLocalizedReligionLabel,
  getLocalizedLevelLabel,
  getLocalizedDistrictLabel,
} from './utils';
import { School } from './types';

function makeSchool(overrides: Partial<Record<keyof School, string>> = {}): School {
  return {
    'School No.': '001',
    'School Name': 'Test School',
    'English Name': 'Test School English',
    'School Address': '123 Main St',
    'English Address': '123 Main St EN',
    Telephone: '12345678',
    'Fax Number': '87654321',
    Website: 'https://example.com',
    Religion: 'Christianity',
    'School Level': 'PRIMARY',
    Session: 'AM',
    'School Type': 'Aided',
    'Financing Type': 'Aided',
    'Student Gender': 'CO-ED',
    District: 'KOWLOON CITY',
    Longitude: '114.17',
    Latitude: '22.32',
    ...overrides,
  };
}

describe('highlightMatch', () => {
  it('returns original when query is empty', () => {
    expect(highlightMatch('hello', '')).toBe('hello');
  });

  it('highlights simple matches', () => {
    expect(highlightMatch('hello world', 'world')).toContain('<mark>world</mark>');
  });

  it('escapes regex characters in query', () => {
    expect(highlightMatch('a.b*c', 'a.b')).toContain('<mark>a.b</mark>');
  });

  it('highlights case-insensitive matches', () => {
    const result = highlightMatch('Hello World', 'hello');
    expect(result).toContain('<mark>Hello</mark>');
  });

  it('highlights multiple occurrences', () => {
    const result = highlightMatch('abc abc abc', 'abc');
    const matches = result.match(/<mark>abc<\/mark>/g);
    expect(matches?.length).toBe(3);
  });
});

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'end');
    expect(result).toContain('base');
    expect(result).not.toContain('hidden');
    expect(result).toContain('end');
  });

  it('deduplicates tailwind classes', () => {
    const result = cn('p-2 p-4');
    expect(result).toBe('p-4');
  });
});

describe('getSchoolNameByLanguage', () => {
  it('returns Chinese name when language is zh and School Name is Chinese', () => {
    const school = makeSchool({ 'School Name': ' test學校 ' });
    expect(getSchoolNameByLanguage(school, 'zh')).toBe('test學校');
  });

  it('returns English name when language is en', () => {
    const school = makeSchool();
    expect(getSchoolNameByLanguage(school, 'en')).toBe('Test School English');
  });

  it('falls back to English Name when School Name is empty (zh)', () => {
    const school = makeSchool({ 'School Name': '' });
    expect(getSchoolNameByLanguage(school, 'zh')).toBe('Test School English');
  });

  it('falls back to Chinese name when English Name is empty (en)', () => {
    const school = makeSchool({ 'English Name': '' });
    expect(getSchoolNameByLanguage(school, 'en')).toBe('Test School');
  });
});

describe('getSchoolSecondaryNameByLanguage', () => {
  it('returns English name as secondary when language is zh', () => {
    const school = makeSchool();
    expect(getSchoolSecondaryNameByLanguage(school, 'zh')).toBe('Test School English');
  });

  it('returns Chinese name as secondary when language is en', () => {
    const school = makeSchool();
    expect(getSchoolSecondaryNameByLanguage(school, 'en')).toBe('Test School');
  });
});

describe('getSchoolAddressByLanguage', () => {
  it('returns English address when language is en', () => {
    const school = makeSchool();
    expect(getSchoolAddressByLanguage(school, 'en')).toBe('123 Main St EN');
  });

  it('returns Chinese address when language is zh', () => {
    const school = makeSchool({ 'School Address': '中文地址' });
    expect(getSchoolAddressByLanguage(school, 'zh')).toBe('中文地址');
  });

  it('falls back to English Address when School Address is empty (en)', () => {
    const school = makeSchool({ 'School Address': '' });
    expect(getSchoolAddressByLanguage(school, 'en')).toBe('123 Main St EN');
  });
});

describe('getSchoolDistrictByLanguage', () => {
  it('returns District field', () => {
    const school = makeSchool({ District: 'SHA TIN' });
    expect(getSchoolDistrictByLanguage(school, 'en')).toBe('SHA TIN');
  });

  it('returns Chinese district when available (zh)', () => {
    const school = makeSchool({ '分區': '沙田' } as any);
    expect(getSchoolDistrictByLanguage(school, 'zh')).toBe('沙田');
  });
});

describe('getSchoolReligionByLanguage', () => {
  it('returns Religion field', () => {
    const school = makeSchool({ Religion: 'Buddhism' });
    expect(getSchoolReligionByLanguage(school, 'en')).toBe('Buddhism');
  });

  it('returns Chinese religion when available (zh)', () => {
    const school = makeSchool({ '宗教': '佛教' });
    expect(getSchoolReligionByLanguage(school, 'zh')).toBe('佛教');
  });
});

describe('getSchoolGenderByLanguage', () => {
  it('returns Student Gender field', () => {
    const school = makeSchool({ 'Student Gender': 'CO-ED' });
    expect(getSchoolGenderByLanguage(school, 'en')).toBe('CO-ED');
  });

  it('returns Chinese gender when available (zh)', () => {
    const school = makeSchool({ '就讀學生性別': '男女' });
    expect(getSchoolGenderByLanguage(school, 'zh')).toBe('男女');
  });
});

describe('getSchoolFinancingByLanguage', () => {
  it('returns Financing Type field', () => {
    const school = makeSchool({ 'Financing Type': 'Aided' });
    expect(getSchoolFinancingByLanguage(school, 'en')).toBe('Aided');
  });

  it('returns Chinese financing when available (zh)', () => {
    const school = makeSchool({ '資助種類': '資助' });
    expect(getSchoolFinancingByLanguage(school, 'zh')).toBe('資助');
  });
});

describe('getSchoolLevelByLanguage', () => {
  it('returns School Level field', () => {
    const school = makeSchool({ 'School Level': 'PRIMARY' });
    expect(getSchoolLevelByLanguage(school, 'en')).toBe('PRIMARY');
  });

  it('returns Chinese level when available (zh)', () => {
    const school = makeSchool({ '學校類型': '小學' });
    expect(getSchoolLevelByLanguage(school, 'zh')).toBe('小學');
  });
});

describe('getSchoolTypeByLanguage', () => {
  it('returns School Type field', () => {
    const school = makeSchool({ 'School Type': 'Government' });
    expect(getSchoolTypeByLanguage(school, 'en')).toBe('Government');
  });

  it('returns Chinese type when available (zh)', () => {
    const school = makeSchool({ '中文種類': '政府' } as any);
    expect(getSchoolTypeByLanguage(school, 'zh')).toBe('政府');
  });
});

describe('getSchoolSessionByLanguage', () => {
  it('returns Session field', () => {
    const school = makeSchool({ Session: 'AM' });
    expect(getSchoolSessionByLanguage(school, 'en')).toBe('AM');
  });

  it('returns Chinese session when available (zh)', () => {
    const school = makeSchool({ '時段': '上午' } as any);
    expect(getSchoolSessionByLanguage(school, 'zh')).toBe('上午');
  });
});

describe('getLevelBadgeColor', () => {
  it('returns pink for Kindergarten', () => {
    const badge = getLevelBadgeColor('KINDERGARTEN');
    expect(badge.label).toBe('K');
    expect(badge.bg).toContain('pink');
    expect(badge.text).toContain('pink');
  });

  it('returns indigo for Primary', () => {
    const badge = getLevelBadgeColor('PRIMARY');
    expect(badge.label).toBe('P');
    expect(badge.bg).toContain('indigo');
  });

  it('returns purple for Secondary', () => {
    const badge = getLevelBadgeColor('SECONDARY');
    expect(badge.label).toBe('S');
    expect(badge.bg).toContain('purple');
  });

  it('returns slate for unknown level', () => {
    const badge = getLevelBadgeColor('UNKNOWN');
    expect(badge.label).toBe('O');
    expect(badge.bg).toContain('slate');
  });

  it('handles case-insensitive input', () => {
    expect(getLevelBadgeColor('primary').label).toBe('P');
    expect(getLevelBadgeColor('Kindergarten').label).toBe('K');
  });
});

describe('getLocalizedFinancingLabel', () => {
  it('translates Private to 私立', () => {
    const school = makeSchool({ 'Financing Type': 'Private' });
    expect(getLocalizedFinancingLabel(school, 'zh')).toBe('私立');
  });

  it('translates Direct Subsidy to 直資', () => {
    const school = makeSchool({ 'Financing Type': 'Direct Subsidy Scheme' });
    expect(getLocalizedFinancingLabel(school, 'zh')).toBe('直資');
  });

  it('translates Government to 政府', () => {
    const school = makeSchool({ 'Financing Type': 'Government' });
    expect(getLocalizedFinancingLabel(school, 'zh')).toBe('政府');
  });

  it('translates Aided to 資助', () => {
    const school = makeSchool({ 'Financing Type': 'Aided' });
    expect(getLocalizedFinancingLabel(school, 'zh')).toBe('資助');
  });

  it('returns original in English mode', () => {
    const school = makeSchool({ 'Financing Type': 'Aided' });
    expect(getLocalizedFinancingLabel(school, 'en')).toBe('Aided');
  });
});

describe('getLocalizedGenderLabel', () => {
  it('translates Boys to 男', () => {
    const school = makeSchool({ 'Student Gender': 'Boys' });
    expect(getLocalizedGenderLabel(school, 'zh')).toBe('男');
  });

  it('translates Girls to 女', () => {
    const school = makeSchool({ 'Student Gender': 'Girls' });
    expect(getLocalizedGenderLabel(school, 'zh')).toBe('女');
  });

  it('translates Co-Ed to 男女', () => {
    const school = makeSchool({ 'Student Gender': 'Co-Ed' });
    expect(getLocalizedGenderLabel(school, 'zh')).toBe('男女');
  });

  it('translates N.A. to 不適用', () => {
    const school = makeSchool({ 'Student Gender': 'N.A.' });
    expect(getLocalizedGenderLabel(school, 'zh')).toBe('不適用');
  });
});

describe('getLocalizedReligionLabel', () => {
  it('translates Buddhism to 佛教', () => {
    const school = makeSchool({ Religion: 'Buddhism' });
    expect(getLocalizedReligionLabel(school, 'zh')).toBe('佛教');
  });

  it('translates Catholicism to 天主教', () => {
    const school = makeSchool({ Religion: 'Catholicism' });
    expect(getLocalizedReligionLabel(school, 'zh')).toBe('天主教');
  });

  it('translates Protestantism to 基督教', () => {
    const school = makeSchool({ Religion: 'Protestantism / Christianity' });
    expect(getLocalizedReligionLabel(school, 'zh')).toBe('基督教');
  });

  it('translates Islam to 伊斯蘭教', () => {
    const school = makeSchool({ Religion: 'Islam' });
    expect(getLocalizedReligionLabel(school, 'zh')).toBe('伊斯蘭教');
  });

  it('translates Taoism to 道教', () => {
    const school = makeSchool({ Religion: 'Taoism' });
    expect(getLocalizedReligionLabel(school, 'zh')).toBe('道教');
  });
});

describe('getLocalizedLevelLabel', () => {
  it('translates Kindergarten to 幼稚園', () => {
    const school = makeSchool({ 'School Level': 'KINDERGARTEN' });
    expect(getLocalizedLevelLabel(school, 'zh')).toBe('幼稚園');
  });

  it('translates Primary to 小學', () => {
    const school = makeSchool({ 'School Level': 'PRIMARY' });
    expect(getLocalizedLevelLabel(school, 'zh')).toBe('小學');
  });

  it('translates Secondary to 中學', () => {
    const school = makeSchool({ 'School Level': 'SECONDARY' });
    expect(getLocalizedLevelLabel(school, 'zh')).toBe('中學');
  });
});

describe('getLocalizedDistrictLabel', () => {
  it('returns Chinese district directly if already Chinese', () => {
    const school = makeSchool({ '分區': '九龍城' } as any);
    expect(getLocalizedDistrictLabel(school, 'zh')).toBe('九龍城');
  });

  it('translates English district to Chinese', () => {
    const school = makeSchool({ District: 'KOWLOON CITY' });
    expect(getLocalizedDistrictLabel(school, 'zh')).toBe('九龍城');
  });

  it('returns English district in English mode', () => {
    const school = makeSchool({ District: 'SHA TIN' });
    expect(getLocalizedDistrictLabel(school, 'en')).toBe('SHA TIN');
  });

  it('handles all 18 HK districts', () => {
    const districts: Record<string, string> = {
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
      'SAI KUNG': '西貢',
    };

    Object.entries(districts).forEach(([en, zh]) => {
      const school = makeSchool({ District: en });
      expect(getLocalizedDistrictLabel(school, 'zh')).toBe(zh);
    });
  });
});
