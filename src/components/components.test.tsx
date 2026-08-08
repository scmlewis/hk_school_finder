import { describe, it, expect } from 'vitest';
import {
  getSchoolNameByLanguage,
  getSchoolSecondaryNameByLanguage,
  getLevelBadgeColor,
  getSchoolLevelByLanguage,
} from '../utils';
import { School } from '../types';

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
    Religion: 'None',
    'School Level': 'PRIMARY',
    Session: 'AM',
    'School Type': 'PRIVATE',
    'Financing Type': 'PRIVATE',
    'Student Gender': 'CO-ED',
    District: 'CENTRAL',
    'Primary One Admission School Net': '1',
    Longitude: '114.17',
    Latitude: '22.32',
    East: '833000',
    North: '816000',
    ...overrides,
  };
}

describe('getSchoolNameByLanguage', () => {
  it('returns English name for en', () => {
    const school = makeSchool();
    expect(getSchoolNameByLanguage(school, 'en')).toBe('Test School English');
  });

  it('returns Chinese name for zh', () => {
    const school = makeSchool({ 'School Name': '測試學校' });
    expect(getSchoolNameByLanguage(school, 'zh')).toBe('測試學校');
  });
});

describe('getSchoolSecondaryNameByLanguage', () => {
  it('returns secondary English name for en', () => {
    const school = makeSchool({ 'School Name': '測試學校' });
    expect(getSchoolSecondaryNameByLanguage(school, 'en')).toBe('測試學校');
  });

  it('returns secondary Chinese name for zh', () => {
    const school = makeSchool();
    expect(getSchoolSecondaryNameByLanguage(school, 'zh')).toBe('Test School English');
  });
});

describe('getSchoolLevelByLanguage', () => {
  it('returns level for en', () => {
    const school = makeSchool({ 'School Level': 'PRIMARY' });
    expect(getSchoolLevelByLanguage(school, 'en')).toBe('PRIMARY');
  });
});

describe('getLevelBadgeColor', () => {
  it('returns pink for Kindergarten', () => {
    const badge = getLevelBadgeColor('KINDERGARTEN');
    expect(badge.label).toBe('K');
    expect(badge.bg).toContain('pink');
  });

  it('returns blue for Primary', () => {
    const badge = getLevelBadgeColor('PRIMARY');
    expect(badge.label).toBe('P');
    expect(badge.bg).toContain('blue');
  });

  it('returns teal for Secondary', () => {
    const badge = getLevelBadgeColor('SECONDARY');
    expect(badge.label).toBe('S');
    expect(badge.bg).toContain('emerald');
  });

  it('returns default for unknown', () => {
    const badge = getLevelBadgeColor('UNKNOWN');
    expect(badge.label).toBe('O');
    expect(badge.bg).toContain('surface');
  });
});

describe('school data integrity', () => {
  it('school has all required fields', () => {
    const school = makeSchool();
    expect(school['School No.']).toBeDefined();
    expect(school['School Name']).toBeDefined();
    expect(school['English Name']).toBeDefined();
    expect(school.Longitude).toBeDefined();
    expect(school.Latitude).toBeDefined();
    expect(school['School Level']).toBeDefined();
  });

  it('school coordinates are parseable', () => {
    const school = makeSchool();
    const lng = parseFloat(school.Longitude || '');
    const lat = parseFloat(school.Latitude || '');
    expect(lng).toBeGreaterThan(113);
    expect(lng).toBeLessThan(115);
    expect(lat).toBeGreaterThan(22);
    expect(lat).toBeLessThan(23);
  });
});
