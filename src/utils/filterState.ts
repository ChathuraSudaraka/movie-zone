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

export const clearFilterStates = () => {
  // Clear all filter states from localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('filter-state-')) {
      localStorage.removeItem(key);
    }
  });
};

// Add event listener for tab closing
window.addEventListener('beforeunload', () => {
  clearFilterStates();
  // Clear URL parameters
  window.history.replaceState({}, '', window.location.pathname);
});
