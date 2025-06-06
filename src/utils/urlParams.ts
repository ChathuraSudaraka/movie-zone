export interface FilterParams {
  genre: string;
  year: string;
  sort: string;
  tag?: string;
}

export const getUrlParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  return {
    page: parseInt(searchParams.get('page') || '1'),
    viewMode: searchParams.get('view') as 'grid' | 'list' || 'grid',
    filters: {
      genre: searchParams.get('genre') || '',
      year: searchParams.get('year') || '',
      sort: searchParams.get('sort') || 'popularity.desc',
      tag: searchParams.get('tag') || ''
    }
  };
};

export const updateUrlParams = (
  params: {
    page?: number;
    viewMode?: 'grid' | 'list';
    filters?: FilterParams;
  },
  replace: boolean = true
) => {
  const searchParams = new URLSearchParams(window.location.search);
  
  if (params.page) searchParams.set('page', String(params.page));
  if (params.viewMode) searchParams.set('view', params.viewMode);
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Ensure value is converted to string and handle numbers
        const stringValue = typeof value === 'number' ? String(value) : value;
        searchParams.set(key, stringValue.toLowerCase());
      } else {
        searchParams.delete(key);
      }
    });
  }
  
  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  if (replace) {
    window.history.replaceState({}, '', newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
  }
};
