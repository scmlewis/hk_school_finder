import { describe, it, expect } from 'vitest';
import { getDistance } from './services';

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
});
