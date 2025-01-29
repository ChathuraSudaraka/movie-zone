interface FilterState {
  genre: string;
  year: string;
  sort: string;
  tag?: string;
}

export const saveFilterState = (key: string, state: FilterState) => {
  localStorage.setItem(`filter-state-${key}`, JSON.stringify(state));
};

export const loadFilterState = (key: string): FilterState | null => {
  const saved = localStorage.getItem(`filter-state-${key}`);
  return saved ? JSON.parse(saved) : null;
};
