import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { dataAtom, loadingAtom, errorAtom } from '../state';

describe('Jotai atoms', () => {
  it('dataAtom initialises to empty array', () => {
    const store = createStore();
    expect(store.get(dataAtom)).toEqual([]);
  });

  it('loadingAtom initialises to true', () => {
    const store = createStore();
    expect(store.get(loadingAtom)).toBe(true);
  });

  it('errorAtom initialises to null', () => {
    const store = createStore();
    expect(store.get(errorAtom)).toBeNull();
  });
});
