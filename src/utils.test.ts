import { describe, it, expect } from 'vitest';
import { highlightMatch } from './utils';

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
});
