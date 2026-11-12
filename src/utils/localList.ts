import { Movie } from '../types/movie';

const LIST_KEY = 'moviezone_list';

let cachedList: Movie[] | null = null;
let cachedIds: Set<number> | null = null;
const listeners = new Set<() => void>();

function ensureCache(): Movie[] {
  if (cachedList !== null) return cachedList;
  try {
    const raw = localStorage.getItem(LIST_KEY);
    cachedList = raw ? (JSON.parse(raw) as Movie[]) : [];
  } catch {
    cachedList = [];
  }
  cachedIds = new Set(cachedList.map((m) => m.id));
  return cachedList;
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === LIST_KEY || e.key === null) {
      cachedList = null;
      cachedIds = null;
      notifyListeners();
    }
  });
}

export function subscribeToList(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getList(): Movie[] {
  return ensureCache();
}

export function isInList(movieId: number): boolean {
  ensureCache();
  return cachedIds ? cachedIds.has(movieId) : false;
}

export function addToList(movie: Movie): void {
  const list = ensureCache();
  if (!cachedIds?.has(movie.id)) {
    const next = [movie, ...list];
    cachedList = next;
    cachedIds?.add(movie.id);
    try {
      localStorage.setItem(LIST_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
    notifyListeners();
  }
}

export function removeFromList(movieId: number): void {
  const list = ensureCache();
  if (cachedIds?.has(movieId)) {
    const next = list.filter((m) => m.id !== movieId);
    cachedList = next;
    cachedIds?.delete(movieId);
    try {
      localStorage.setItem(LIST_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
    notifyListeners();
  }
}

export function clearList(): void {
  cachedList = [];
  cachedIds = new Set();
  try {
    localStorage.removeItem(LIST_KEY);
  } catch {
    // Ignore storage errors
  }
  notifyListeners();
}
