// Movie API utilities for blog content

// TMDB API functions (already available in your app)
export const tmdbApi = {
  // Get trending movies
  getTrending: async (timeWindow: 'day' | 'week' = 'week') => {
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
    );
    return response.json();
  },

  // Get movie details with reviews
  getMovieWithReviews: async (movieId: number) => {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&append_to_response=reviews,videos,similar`
    );
    return response.json();
  },

  // Search movies for blog content
  searchMovies: async (query: string) => {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    return response.json();
  }
};

// News API functions for movie news
export const newsApi = {
  // Get movie news
  getMovieNews: async (pageSize: number = 20) => {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    if (!apiKey) {
      console.warn('News API key not configured');
      return { articles: [] };
    }

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=movie OR cinema OR hollywood&language=en&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${apiKey}`
    );
    return response.json();
  },

  // Get entertainment news
  getEntertainmentNews: async () => {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    if (!apiKey) return { articles: [] };

    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=entertainment&country=us&apiKey=${apiKey}`
    );
    return response.json();
  }
};

// OMDb API functions (alternative movie database)
export const omdbApi = {
  // Get movie by IMDB ID
  getMovieByImdb: async (imdbId: string) => {
    const apiKey = import.meta.env.VITE_OMDB_API_KEY;
    if (!apiKey) {
      console.warn('OMDb API key not configured');
      return null;
    }

    const response = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}&plot=full`
    );
    return response.json();
  },

  // Search movies
  searchMovies: async (title: string, year?: number) => {
    const apiKey = import.meta.env.VITE_OMDB_API_KEY;
    if (!apiKey) return null;

    const yearParam = year ? `&y=${year}` : '';
    const response = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(title)}${yearParam}&apikey=${apiKey}`
    );
    return response.json();
  }
};

// Utility functions for blog content
export const blogUtils = {
  // Generate blog post from movie data
  generateMovieReview: (movie: any) => {
    return {
      id: `review-${movie.id}`,
      title: `Review: ${movie.title}`,
      description: movie.overview?.substring(0, 150) + '...',
      content: `An in-depth review of ${movie.title}...`,
      image: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`,
      author: 'Movie Zone Team',
      publishedAt: new Date().toISOString(),
      category: 'reviews',
      rating: movie.vote_average,
      releaseDate: movie.release_date
    };
  },

  // Format news article for blog
  formatNewsForBlog: (article: any) => {
    return {
      id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: article.title,
      description: article.description,
      content: article.content || article.description,
      image: article.urlToImage,
      author: article.author || article.source.name,
      publishedAt: article.publishedAt,
      category: 'news',
      url: article.url,
      source: article.source.name
    };
  },

  // Get popular movie genres for tags
  getPopularGenres: () => {
    return [
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 16, name: 'Animation' },
      { id: 35, name: 'Comedy' },
      { id: 80, name: 'Crime' },
      { id: 99, name: 'Documentary' },
      { id: 18, name: 'Drama' },
      { id: 10751, name: 'Family' },
      { id: 14, name: 'Fantasy' },
      { id: 36, name: 'History' },
      { id: 27, name: 'Horror' },
      { id: 10402, name: 'Music' },
      { id: 9648, name: 'Mystery' },
      { id: 10749, name: 'Romance' },
      { id: 878, name: 'Science Fiction' },
      { id: 10770, name: 'TV Movie' },
      { id: 53, name: 'Thriller' },
      { id: 10752, name: 'War' },
      { id: 37, name: 'Western' }
    ];
  }
};

// Error handling wrapper
export const apiWithErrorHandling = async (apiCall: () => Promise<any>) => {
  try {
    const result = await apiCall();
    return { success: true, data: result };
  } catch (error) {
    console.error('API call failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};