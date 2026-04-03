import { describe, it, expect } from 'vitest';
import {
  localizeFinancingValue,
  localizeGenderValue,
  localizeReligionValue,
  localizeDistrictValue,
  getLocalizedDistrictLabel,
} from './utils';

describe('localizeFinancingValue', () => {
  it('translates common English financing terms to Chinese', () => {
    expect(localizeFinancingValue('Private', 'zh')).toBe('私立');
    expect(localizeFinancingValue('Direct Subsidy Scheme', 'zh')).toBe('直資');
    expect(localizeFinancingValue('DSS', 'zh')).toBe('直資');
    expect(localizeFinancingValue('Aided', 'zh')).toBe('資助');
    expect(localizeFinancingValue('English Schools Foundation', 'zh')).toBe('英基');
  });

  it('returns original when language is English', () => {
    expect(localizeFinancingValue('Private', 'en')).toBe('Private');
  });
});

describe('localizeGenderValue', () => {
  it('translates gender labels', () => {
    expect(localizeGenderValue('Boys', 'zh')).toBe('男');
    expect(localizeGenderValue('Girls', 'zh')).toBe('女');
    expect(localizeGenderValue('Co-Ed', 'zh')).toBe('男女');
    expect(localizeGenderValue('N.A.', 'zh')).toBe('不適用');
  });
});

describe('localizeReligionValue', () => {
  it('translates religion labels', () => {
    expect(localizeReligionValue('Buddhism', 'zh')).toBe('佛教');
    expect(localizeReligionValue('Catholicism', 'zh')).toBe('天主教');
    expect(localizeReligionValue('Protestantism / Christianity', 'zh')).toBe('基督教');
    expect(localizeReligionValue('N.A.', 'zh')).toBe('不適用');
  });
});

describe('localizeDistrictValue', () => {
  it('maps common English districts to Chinese', () => {
    expect(localizeDistrictValue('KOWLOON CITY', 'zh')).toBe('九龍城');
    expect(localizeDistrictValue('Yau Tsim Mong', 'zh')).toBe('油尖旺');
    expect(localizeDistrictValue('Sha Tin', 'zh')).toBe('沙田');
  });

  it('returns original in English mode', () => {
    expect(localizeDistrictValue('KOWLOON CITY', 'en')).toBe('KOWLOON CITY');
  });
});

describe('getLocalizedDistrictLabel', () => {
  it('prefers Chinese district when present on the school object', () => {
    const fakeSchool: any = { 'District': 'KOWLOON CITY', '分區': '九龍城' };
    expect(getLocalizedDistrictLabel(fakeSchool, 'zh')).toBe('九龍城');
  });
});
