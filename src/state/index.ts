import { atom } from 'jotai';

export interface DataItem {
  id: number;
  title: string;
  description: string;
  value: number;
}

export const dataAtom = atom<DataItem[]>([]);
export const loadingAtom = atom<boolean>(true);
export const errorAtom = atom<string | null>(null);
