import { describe, it, expect } from 'vitest';
import { getDistance, MTR_STATIONS } from './services';

describe('getDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(getDistance(22.2819, 114.1581, 22.2819, 114.1581)).toBeCloseTo(0, 6);
  });

  it('is symmetric', () => {
    const a = getDistance(0, 0, 0, 1);
    const b = getDistance(0, 1, 0, 0);
    expect(a).toBeCloseTo(b, 6);
  });

  it('1 degree longitude at equator ≈ 111.195 km (Earth mean radius)', () => {
    expect(getDistance(0, 0, 0, 1)).toBeCloseTo(111.195, 3);
  });

  it('Central to Admiralty is ~1.5km', () => {
    const dist = getDistance(22.2819, 114.1581, 22.2795, 114.1645);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(2);
  });

  it('Central to Sha Tin is ~10-15km', () => {
    const dist = getDistance(22.2819, 114.1581, 22.3831, 114.1870);
    expect(dist).toBeGreaterThan(8);
    expect(dist).toBeLessThan(18);
  });

  it('handles negative coordinates (Southern hemisphere)', () => {
    const dist = getDistance(-33.8688, 151.2093, -33.8688, 151.2093);
    expect(dist).toBeCloseTo(0, 6);
  });

  it('handles crossing the date line', () => {
    const dist = getDistance(0, 179, 0, -179);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(250);
  });
});

describe('MTR_STATIONS', () => {
  it('has at least 90 stations (full network)', () => {
    expect(MTR_STATIONS.length).toBeGreaterThanOrEqual(90);
  });

  it('each station has required fields', () => {
    MTR_STATIONS.forEach((station) => {
      expect(station.name).toBeTruthy();
      expect(station.nameEn).toBeTruthy();
      expect(typeof station.lat).toBe('number');
      expect(typeof station.lng).toBe('number');
      expect(Array.isArray(station.line)).toBe(true);
      expect(station.line.length).toBeGreaterThan(0);
    });
  });

  it('all stations are within Hong Kong bounds (lat 22.1-22.6, lng 113.9-114.4)', () => {
    MTR_STATIONS.forEach((station) => {
      expect(station.lat).toBeGreaterThan(22.1);
      expect(station.lat).toBeLessThan(22.6);
      expect(station.lng).toBeGreaterThan(113.9);
      expect(station.lng).toBeLessThan(114.4);
    });
  });

  it('Central station has expected coordinates', () => {
    const central = MTR_STATIONS.find((s) => s.nameEn === 'Central');
    expect(central).toBeDefined();
    expect(central!.lat).toBeCloseTo(22.2819, 3);
    expect(central!.lng).toBeCloseTo(114.1581, 3);
  });

  it('no duplicate station names', () => {
    const names = MTR_STATIONS.map((s) => s.nameEn);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});
