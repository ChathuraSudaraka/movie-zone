interface FilterState {
  genre: string;
  year: string;
  sort: string;
  tag?: string;
}

export const saveFilterState = (key: string, state: FilterState) => {
  // Ensure all values are strings or empty strings
  const sanitizedState = {
    genre: String(state.genre || ''),
    year: String(state.year || ''),
    sort: String(state.sort || 'popularity.desc'),
    tag: String(state.tag || '')
  };
  localStorage.setItem(`filter-state-${key}`, JSON.stringify(sanitizedState));
};

export const loadFilterState = (key: string): FilterState | null => {
  const saved = localStorage.getItem(`filter-state-${key}`);
  if (!saved) return null;
  
  try {
    const state = JSON.parse(saved);
    return {
      genre: String(state.genre || ''),
      year: String(state.year || ''),
      sort: String(state.sort || 'popularity.desc'),
      tag: String(state.tag || '')
    };
  } catch {
    return null;
  }
};
