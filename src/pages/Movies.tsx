import { useEffect, useState } from 'react'
import axios from '../utils/axios'
import Thumbnail from '../components/Thumbnail'
import { Movie } from '../types/movie'
import { Skeleton } from '@mui/material'
import ViewMode from '../components/common/ViewMode'
import Filter from '../components/common/Filter'
import Pagination from '../components/common/Pagination'
import { FiFilter } from "react-icons/fi";

interface FilterOptions {
  genre: string;
  year: string;
  sort: string;
  tag?: string;
}

function Movies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    genre: "",
    year: "",
    sort: "popularity.desc",
    tag: "",
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    document.title = 'Movies - MovieZone'

    async function fetchMovies() {
      try {
        setLoading(true);
        let endpoint = '/discover/movie';
        
        // Ensure page number is within valid range (TMDB typically limits to 500 pages)
        const safeCurrentPage = Math.min(currentPage, 500);
        
        let params: any = {
          page: safeCurrentPage,
          include_adult: false,
        };

        // Handle sorting
        switch (activeFilters.sort) {
          case "vote_average.desc":
            params.sort_by = "vote_average.desc";
            params['vote_count.gte'] = 200;
            break;
          case "release_date.desc":
          case "release_date.asc":
            params.sort_by = activeFilters.sort;
            break;
          case "popularity.desc":
            params.sort_by = "popularity.desc";
            break;
        }

        // Handle genre filter
        if (activeFilters.genre) {
          params.with_genres = getGenreId(activeFilters.genre);
        }

        // Handle year filter with proper date ranges
        if (activeFilters.year) {
          const year = activeFilters.year;
          params.sort_by = params.sort_by || 'popularity.desc';
          params['primary_release_date.gte'] = `${year}-01-01`;
          params['primary_release_date.lte'] = `${year}-12-31`;
          
          // Ensure we get movies with valid release dates
          params.include_null_release_dates = false;
        }

        // Handle tag filters
        if (activeFilters.tag) {
          switch (activeFilters.tag) {
            case "New Releases":
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              params.sort_by = "release_date.desc";
              params['release_date.gte'] = threeMonthsAgo.toISOString().split('T')[0];
              break;
            case "Trending Now":
              endpoint = '/trending/movie/day';
              break;
            case "Popular Movies":
              params.sort_by = "popularity.desc";
              params['vote_count.gte'] = 100;
              break;
            case "Award Winners":
              params.sort_by = "vote_average.desc";
              params['vote_count.gte'] = 200;
              params['vote_average.gte'] = 8;
              break;
          }
        }

        const response = await axios.get(endpoint, { params });
        
        // Update total pages with API limit
        const apiTotalPages = Math.min(response.data.total_pages, 500);
        
        const processedMovies = response.data.results
          .filter((movie: Movie) => movie.backdrop_path !== null && movie.poster_path !== null)
          .map((movie: Movie) => ({
            ...movie,
            media_type: 'movie'
          }));

        setMovies(processedMovies);
        setTotalPages(apiTotalPages);
        setTotalResults(apiTotalPages * ITEMS_PER_PAGE); // Adjust total results based on page limit
        setError(null);
      } catch (error: any) {
        setError(error.response?.status === 400 
          ? 'Invalid page number. Showing first page instead.' 
          : 'Failed to load movies. Please try again later.');
        
        // If we get a 400 error, reset to page 1
        if (error.response?.status === 400) {
          setCurrentPage(1);
        }
        console.error('Error fetching movies:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [currentPage, activeFilters, totalPages]);

  const getGenreId = (genreName: string): number => {
    const genreMap: { [key: string]: number } = {
      action: 28,
      adventure: 12,
      animation: 16,
      comedy: 35,
      crime: 80,
      documentary: 99,
      drama: 18,
      family: 10751,
      fantasy: 14,
      horror: 27,
      mystery: 9648,
      romance: 10749,
      'sci-fi': 878,
      thriller: 53
    };
    return genreMap[genreName.toLowerCase()] || 0;
  };

  const handleFilterChange = (filters: FilterOptions) => {
    setCurrentPage(1); // Reset to first page when filters change
    setActiveFilters(filters);
  };

  const handlePageChange = (page: number) => {
    // Ensure page number is within valid range
    const safePage = Math.min(Math.max(1, page), 500);
    setCurrentPage(safePage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const MoviesGrid = ({ movies, title }: { movies: Movie[], title: string }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white md:text-2xl lg:text-3xl">
          {title}
        </h2>
      </div>
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
          : 'flex flex-col gap-4'
      }`}>
        {movies.map((movie) => (
          <div key={movie.id} className="group relative">
            <Thumbnail movie={movie} viewMode={viewMode} />
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="mt-[68px] min-h-screen bg-[#141414]">
        <div className="px-2 py-6 md:px-3 lg:px-4">
          <Skeleton
            variant="text"
            width={200}
            height={40}
            sx={{ bgcolor: '#2b2b2b', marginBottom: '24px' }}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(15)].map((_, index) => (
              <div key={index} className="relative h-[280px] min-w-[160px] md:h-[420px] md:min-w-[280px]">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{
                    bgcolor: '#2b2b2b',
                    borderRadius: '0.125rem',
                    transform: 'scale(1)',
                    '&::after': {
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)'
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-[68px] min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 rounded hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414]">
      <div className="px-2 py-6 md:px-3 lg:px-4">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg text-gray-300 hover:text-white"
          >
            <FiFilter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        <div className="relative flex flex-col md:flex-row gap-6">
          {/* Filter Section */}
          <div className={`
            fixed inset-0 z-40 md:relative md:inset-auto
            transition-transform duration-300 ease-in-out
            ${isMobileFilterOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}>
            {/* Mobile Overlay */}
            <div 
              className="fixed inset-0 bg-black/50 md:hidden"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            
            {/* Filter Content */}
            <div className="absolute right-0 top-0 bottom-0 w-[320px] md:w-auto md:relative">
              <Filter onFilterChange={(filters) => {
                handleFilterChange(filters);
                setIsMobileFilterOpen(false); // Close filter on mobile after selection
              }} />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-white md:text-2xl lg:text-3xl">
                Movies
              </h1>
              <ViewMode viewMode={viewMode} onViewChange={setViewMode} />
            </div>

            <MoviesGrid 
              movies={movies} 
              title={`Movies ${activeFilters.genre ? `- ${activeFilters.genre}` : ''}`} 
            />

            <Pagination
              currentPage={currentPage}
              totalItems={totalResults}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Movies;
