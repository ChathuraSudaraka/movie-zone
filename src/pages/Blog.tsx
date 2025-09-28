import { useState, useEffect } from 'react';
import { ExternalLink, Newspaper, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@mui/material';
import Pagination from '../components/common/Pagination';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  overview: string;
  genre_ids: number[];
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author: string;
}

function Blog() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [movieNews, setMovieNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Skeleton Components
  const NewsArticleSkeleton = () => (
    <article className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <Skeleton
          variant="rectangular"
          width={96}
          height={96}
          sx={{ bgcolor: '#2b2b2b', borderRadius: 1 }}
        />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton
              variant="text"
              width={100}
              height={16}
              sx={{ bgcolor: '#2b2b2b' }}
            />
            <Skeleton
              variant="text"
              width={4}
              height={16}
              sx={{ bgcolor: '#2b2b2b' }}
            />
            <Skeleton
              variant="text"
              width={80}
              height={16}
              sx={{ bgcolor: '#2b2b2b' }}
            />
          </div>
          <Skeleton
            variant="text"
            width="85%"
            height={24}
            sx={{ bgcolor: '#2b2b2b' }}
          />
          <Skeleton
            variant="text"
            width="100%"
            height={20}
            sx={{ bgcolor: '#2b2b2b' }}
          />
          <Skeleton
            variant="text"
            width="75%"
            height={20}
            sx={{ bgcolor: '#2b2b2b' }}
          />
          <Skeleton
            variant="text"
            width={120}
            height={16}
            sx={{ bgcolor: '#2b2b2b' }}
          />
        </div>
      </div>
    </article>
  );

  const TrendingMovieSkeleton = () => (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <Skeleton
          variant="rectangular"
          width={60}
          height={90}
          sx={{ bgcolor: '#2b2b2b', borderRadius: 1 }}
        />
        <div className="flex-1 space-y-2">
          <Skeleton
            variant="text"
            width="90%"
            height={18}
            sx={{ bgcolor: '#2b2b2b' }}
          />
          <div className="flex items-center gap-1">
            <Skeleton
              variant="rectangular"
              width={16}
              height={16}
              sx={{ bgcolor: '#2b2b2b' }}
            />
            <Skeleton
              variant="text"
              width={30}
              height={14}
              sx={{ bgcolor: '#2b2b2b' }}
            />
          </div>
          <Skeleton
            variant="text"
            width="70%"
            height={14}
            sx={{ bgcolor: '#2b2b2b' }}
          />
        </div>
      </div>
    </div>
  );

  const BlogLoadingSkeleton = () => (
    <div className="mt-[68px] min-h-screen bg-[#141414]">
      <div className="relative">
        {/* Hero Section Skeleton */}
        <div className="relative px-4 py-16 md:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            
            {/* Header Skeleton */}
            <div className="text-center mb-16 space-y-6">
              <Skeleton
                variant="circular"
                width={64}
                height={64}
                sx={{ bgcolor: '#2b2b2b', mx: 'auto' }}
              />
              <Skeleton
                variant="text"
                width={400}
                height={72}
                sx={{ bgcolor: '#2b2b2b', mx: 'auto' }}
              />
              <Skeleton
                variant="text"
                width={600}
                height={24}
                sx={{ bgcolor: '#2b2b2b', mx: 'auto' }}
              />
            </div>

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Movie News Section Skeleton */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton
                    variant="rectangular"
                    width={24}
                    height={24}
                    sx={{ bgcolor: '#2b2b2b' }}
                  />
                  <Skeleton
                    variant="text"
                    width={200}
                    height={32}
                    sx={{ bgcolor: '#2b2b2b' }}
                  />
                  <Skeleton
                    variant="circular"
                    width={20}
                    height={20}
                    sx={{ bgcolor: '#2b2b2b' }}
                  />
                </div>
                
                <div className="space-y-6">
                  {[...Array(6)].map((_, i) => (
                    <NewsArticleSkeleton key={i} />
                  ))}
                </div>
                
                {/* Pagination Skeleton */}
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton
                        key={i}
                        variant="rectangular"
                        width={40}
                        height={40}
                        sx={{ bgcolor: '#2b2b2b', borderRadius: 1 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="space-y-8">
                {/* Trending Movies Skeleton */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Skeleton
                      variant="rectangular"
                      width={24}
                      height={24}
                      sx={{ bgcolor: '#2b2b2b' }}
                    />
                    <Skeleton
                      variant="text"
                      width={150}
                      height={32}
                      sx={{ bgcolor: '#2b2b2b' }}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <TrendingMovieSkeleton key={i} />
                    ))}
                  </div>
                </div>

                {/* Additional Sidebar Content Skeleton */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
                  <Skeleton
                    variant="text"
                    width={120}
                    height={24}
                    sx={{ bgcolor: '#2b2b2b', mb: 3 }}
                  />
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton
                        key={i}
                        variant="text"
                        width={`${90 - i * 10}%`}
                        height={16}
                        sx={{ bgcolor: '#2b2b2b' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNews = movieNews.slice(startIndex, endIndex);

  // Fetch trending movies from TMDB
  const fetchTrendingMovies = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
      );
      const data = await response.json();
      setTrendingMovies(data.results.slice(0, 6));
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  };

  // Fetch movie news from News API
  const fetchMovieNews = async () => {
    setNewsLoading(true);
    try {
      const API_KEY = import.meta.env.VITE_NEWS_API_KEY;

      // Multiple queries for comprehensive movie news
      const queries = [
        'Hollywood movies',
        'cinema releases', 
        'movie reviews',
        'film industry',
        'box office',
        'movie premieres'
      ];
      
      // Fetch news with different queries to get diverse content
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const response = await fetch(
        `https://newsapi.org/v2/everything?q="${randomQuery}"&language=en&sortBy=publishedAt&pageSize=50&apiKey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.articles && data.articles.length > 0) {
        // Filter out articles with no image or description
        const filteredArticles = data.articles.filter((article: NewsArticle) => 
          article.urlToImage && 
          article.description && 
          article.title &&
          (article.title.toLowerCase().includes('movie') || 
           article.title.toLowerCase().includes('film') || 
           article.title.toLowerCase().includes('cinema') || 
           article.title.toLowerCase().includes('hollywood') ||
           article.description.toLowerCase().includes('movie') ||
           article.description.toLowerCase().includes('film'))
        );
        
        setMovieNews(filteredArticles);
        console.log(`Fetched ${filteredArticles.length} movie news articles with query: "${randomQuery}"`);
      } else {
        console.warn('No movie news articles found');
      }
      
    } catch (error) {
      console.error('Error fetching movie news:', error);
      // Fallback to entertainment headlines if everything fails
      try {
        const fallbackResponse = await fetch(
          `https://newsapi.org/v2/top-headlines?category=entertainment&country=us&pageSize=30&apiKey=927dd9ee12dd42da8293956ee3a5936d`
        );
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.articles) {
          setMovieNews(fallbackData.articles);
          console.log('Using fallback entertainment news');
        }
      } catch (fallbackError) {
        console.error('Fallback news fetch failed:', fallbackError);
      }
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTrendingMovies(),
        fetchMovieNews()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  if (loading) {
    return <BlogLoadingSkeleton />;
  }

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414]">
      <div className="relative">
        {/* Hero Section */}
        <div className="relative px-4 py-16 md:px-8 lg:px-16">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-6">
                <Newspaper className="w-8 h-8 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Movie Zone Blog
              </h1>
              
              <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                Stay updated with the latest movie news, reviews, and industry insights
              </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Movie News Section */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Newspaper className="w-6 h-6 text-red-500" />
                  Latest Movie News
                  {newsLoading && (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </h2>
                
                {newsLoading ? (
                  <div className="space-y-6">
                    {[...Array(itemsPerPage)].map((_, i) => (
                      <NewsArticleSkeleton key={i} />
                    ))}
                  </div>
                ) : paginatedNews.length > 0 ? (
                  <>
                    <div className="space-y-6">
                      {paginatedNews.map((article, index) => (
                        <article key={index} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-red-600 transition-all duration-300">
                          <div className="flex items-start gap-4">
                            {article.urlToImage && (
                              <img
                                src={article.urlToImage}
                                alt={article.title}
                                className="w-24 h-24 object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=96&h=96&fit=crop';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
                                <span className="font-medium text-red-500">{article.source.name}</span>
                                <span>•</span>
                                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                              </div>
                              
                              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 hover:text-red-400 transition-colors">
                                {article.title}
                              </h3>
                              
                              <p className="text-zinc-300 text-sm line-clamp-2 mb-3">
                                {article.description}
                              </p>
                              
                              <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
                              >
                                Read Full Article
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {movieNews.length > itemsPerPage && (
                      <div className="mt-8">
                        <Pagination
                          currentPage={currentPage}
                          totalItems={movieNews.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8 text-center">
                    <Newspaper className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400 mb-2">No movie news available at the moment.</p>
                    <p className="text-zinc-500 text-sm">Check back later for the latest updates!</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Trending Movies */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    Trending Movies
                  </h3>
                  
                  <div className="space-y-4">
                    {trendingMovies.map((movie, index) => (
                      <Link
                        key={movie.id}
                        to={`/info/movie/${movie.id}`}
                        className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-red-600 transition-all duration-300 group"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                            alt={movie.title}
                            className="w-16 h-24 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x300/1e1e1e/ffffff?text=No+Image';
                            }}
                          />
                          <div className="absolute top-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white">
                            #{index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-2 mb-1">
                            {movie.title}
                          </h4>
                          
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs text-zinc-400">
                              {movie.vote_average.toFixed(1)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-zinc-500 line-clamp-2">
                            {new Date(movie.release_date).getFullYear()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Additional Info Box */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">About Movie Zone</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Your ultimate destination for the latest movie news, reviews, and entertainment updates. 
                    Stay connected with Hollywood's biggest stories and trending films.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Blog;