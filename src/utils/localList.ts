import { Movie } from '../types/movie';

const LIST_KEY = 'moviezone_list';

export function getList(): Movie[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    return raw ? (JSON.parse(raw) as Movie[]) : [];
  } catch {
    return [];
  }
}

export function isInList(movieId: number): boolean {
  return getList().some((m) => m.id === movieId);
}

export function addToList(movie: Movie): void {
  const list = getList();
  if (!list.some((m) => m.id === movie.id)) {
    list.unshift(movie);
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  }
}

export function removeFromList(movieId: number): void {
  const list = getList().filter((m) => m.id !== movieId);
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

export function clearList(): void {
  localStorage.removeItem(LIST_KEY);
}
