import { useEffect, useState } from "react";
import axios from "../utils/axios";
import Thumbnail from "../components/Thumbnail";
import { Movie } from "../types/movie";
import ViewMode from "../components/common/ViewMode";
import Pagination from "../components/common/Pagination";
import FilterLayout from '../components/layout/FilterLayout';
import { getUrlParams, updateUrlParams } from "../utils/urlParams";
import { loadFilterState } from '../utils/filterState';
import { FilterOptions } from "@/types/filters";
import NoResults from '../components/common/NoResults';

function Movies() {
  const urlParams = getUrlParams();
  const savedFilters = loadFilterState(window.location.pathname);
  const [activeFilters, setActiveFilters] = useState(savedFilters || urlParams.filters);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(urlParams.viewMode);
  const [currentPage, setCurrentPage] = useState(urlParams.page);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    document.title = "Movies - MovieZone";

    async function fetchMovies() {
      try {
        // Change this line - set loading to true when fetching
        if (!isInitialLoad) setLoading(true);
        else setLoading(true); // Also set loading on initial load

        let endpoint = "/discover/movie";

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
            params["vote_count.gte"] = 200;
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
          params.sort_by = params.sort_by || "popularity.desc";
          params["primary_release_date.gte"] = `${year}-01-01`;
          params["primary_release_date.lte"] = `${year}-12-31`;

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
              params["release_date.gte"] = threeMonthsAgo
                .toISOString()
                .split("T")[0];
              break;
            case "Trending Now":
              endpoint = "/trending/movie/day";
              break;
            case "Popular Movies":
              params.sort_by = "popularity.desc";
              params["vote_count.gte"] = 100;
              break;
            case "Award Winners":
              params.sort_by = "vote_average.desc";
              params["vote_count.gte"] = 200;
              params["vote_average.gte"] = 8;
              break;
          }
        }

        const response = await axios.get(endpoint, { params });

        // Update total pages with API limit
        const apiTotalPages = Math.min(response.data.total_pages, 500);

        const processedMovies = response.data.results
          .filter(
            (movie: Movie) =>
              movie.backdrop_path !== null && movie.poster_path !== null
          )
          .map((movie: Movie) => ({
            ...movie,
            media_type: "movie",
          }));

        setMovies(processedMovies);
        setTotalPages(apiTotalPages);
        setTotalResults(apiTotalPages * ITEMS_PER_PAGE); // Adjust total results based on page limit
        setError(null);
      } catch (error: any) {
        setError(
          error.response?.status === 400
            ? "Invalid page number. Showing first page instead."
            : "Failed to load movies. Please try again later."
        );

        // If we get a 400 error, reset to page 1
        if (error.response?.status === 400) {
          setCurrentPage(1);
        }
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }

    fetchMovies();
  }, [currentPage, activeFilters]);

  // Update URL when state changes
  useEffect(() => {
    updateUrlParams({
      page: currentPage,
      viewMode,
      filters: activeFilters
    });
  }, [currentPage, viewMode, activeFilters]);

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
      "sci-fi": 878,
      thriller: 53,
    };
    return genreMap[genreName.toLowerCase()] || 0;
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  const handleFilterChange = (filters: FilterOptions) => {
    // Convert year to number for validation
    const yearValue = parseInt(filters.year);

    // Only update if year is valid or empty
    if (
      !filters.year ||
      (yearValue >= 1900 && yearValue <= new Date().getFullYear())
    ) {
      setCurrentPage(1);
      setActiveFilters(filters);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    const defaultFilters = {
      genre: "",
      year: "",
      sort: "popularity.desc",
    };
    setActiveFilters(defaultFilters);
    setCurrentPage(1);
  };

  const MoviesGrid = ({ movies, title }: { movies: Movie[]; title: string }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white md:text-2xl lg:text-3xl">
          {title}
        </h2>
      </div>

      <div className="min-h-[400px] relative w-full">
        <div className={`w-full ${
          viewMode === "grid"
          ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-4"
        }`}>
          {isInitialLoad || (loading && !isInitialLoad) ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent" />
            </div>
          ) : movies.length > 0 ? (
            movies.map((movie) => (
              <div key={movie.id} className="group relative h-full">
                <Thumbnail movie={movie} viewMode={viewMode} />
              </div>
            ))
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <NoResults 
                filters={activeFilters} 
                onReset={handleReset} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414]">
      <FilterLayout initialFilters={activeFilters} onFilterChange={handleFilterChange}>
        {error && (
          <div className="bg-red-500 text-white px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white md:text-2xl lg:text-3xl">
            All Movies
          </h1>
          <ViewMode viewMode={viewMode} onViewChange={handleViewModeChange} />
        </div>

        <MoviesGrid
          movies={movies}
          title={`Movies ${activeFilters.genre ? `- ${activeFilters.genre}` : ""}`}
        />

        {!isInitialLoad && movies.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalResults}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        )}
      </FilterLayout>
    </div>
  );
}

export default Movies;
