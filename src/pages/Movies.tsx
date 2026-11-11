import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../utils/axios";
import Thumbnail from "../components/Thumbnail";
import { Movie } from "../types/movie";
import ViewMode from "../components/common/ViewMode";
import Pagination from "../components/common/Pagination";
import FilterLayout from "../components/layout/FilterLayout";
import { LiquidSegmentedControl } from "../components/common/LiquidGlassControls";
import { loadFilterState } from "../utils/filterState";
import { FilterOptions } from "@/types/filters";
import NoResults from "../components/common/NoResults";

const MOVIE_DISCOVERY_TABS = [
  { value: "", label: "All Movies" },
  { value: "Trending Now", label: "Trending" },
  { value: "New Releases", label: "New Releases" },
  { value: "Popular Movies", label: "Popular" },
  { value: "Award Winners", label: "Top Rated" },
];

const getMovieGenreId = (genreName: string): number => {
  const genreMap: Record<string, number> = {
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

function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1
  );
  const viewMode: "grid" | "list" =
    searchParams.get("view") === "list" ? "list" : "grid";

  const activeFilters: FilterOptions = useMemo(() => {
    const hasFilterQuery =
      searchParams.has("genre") ||
      searchParams.has("year") ||
      searchParams.has("sort") ||
      searchParams.has("tag");

    if (hasFilterQuery) {
      return {
        genre: searchParams.get("genre") || "",
        year: searchParams.get("year") || "",
        sort: searchParams.get("sort") || "popularity.desc",
        tag: searchParams.get("tag") || "",
      };
    }

    const saved = loadFilterState("/movies");
    return (
      saved || {
        genre: "",
        year: "",
        sort: "popularity.desc",
        tag: "",
      }
    );
  }, [searchParams]);

  // Ensure initial URL stores page cleanly
  useEffect(() => {
    if (!searchParams.has("page")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("page", String(currentPage));
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, currentPage, setSearchParams]);

  const syncParams = useCallback(
    (
      updates: {
        page?: number;
        view?: "grid" | "list";
        filters?: FilterOptions;
      },
      replace = false
    ) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (updates.page !== undefined) {
            next.set("page", String(Math.max(1, updates.page)));
          }
          if (updates.view !== undefined) {
            next.set("view", updates.view);
          }
          if (updates.filters) {
            const { genre, year, sort, tag } = updates.filters;
            if (genre) next.set("genre", genre.toLowerCase());
            else next.delete("genre");

            if (year) next.set("year", String(year));
            else next.delete("year");

            if (sort) next.set("sort", sort);
            else next.delete("sort");

            if (tag) next.set("tag", tag);
            else next.delete("tag");
          }
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    document.title = "Movies - MovieZone";
    let cancelled = false;

    async function fetchMovies() {
      setLoading(true);
      try {
        let endpoint = "/discover/movie";
        const safeCurrentPage = Math.min(currentPage, 500);
        const params: Record<string, string | number | boolean> = {
          page: safeCurrentPage,
          include_adult: false,
        };

        switch (activeFilters.sort) {
          case "vote_average.desc":
            params.sort_by = "vote_average.desc";
            params["vote_count.gte"] = 200;
            break;
          case "release_date.desc":
          case "release_date.asc":
            params.sort_by = activeFilters.sort;
            break;
          default:
            params.sort_by = "popularity.desc";
            break;
        }

        if (activeFilters.genre) {
          const genreId = getMovieGenreId(activeFilters.genre);
          if (genreId) params.with_genres = genreId;
        }

        if (activeFilters.year) {
          const year = activeFilters.year;
          params.sort_by = params.sort_by || "popularity.desc";
          params["primary_release_date.gte"] = `${year}-01-01`;
          params["primary_release_date.lte"] = `${year}-12-31`;
          params.include_null_release_dates = false;
        }

        if (activeFilters.tag) {
          switch (activeFilters.tag) {
            case "New Releases": {
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              params.sort_by = "release_date.desc";
              params["release_date.gte"] = threeMonthsAgo
                .toISOString()
                .split("T")[0];
              break;
            }
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
        if (cancelled) return;

        const apiTotalPages = Math.min(response.data.total_pages || 1, 500);
        const processedMovies = (response.data.results || [])
          .filter(
            (movie: Movie) =>
              movie.backdrop_path !== null && movie.poster_path !== null
          )
          .map((movie: Movie) => ({
            ...movie,
            media_type: "movie",
          }));

        setMovies(processedMovies);
        setTotalResults(apiTotalPages * ITEMS_PER_PAGE);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        const axiosError = err as { response?: { status: number } };
        setError(
          axiosError.response?.status === 400
            ? "Invalid page number. Showing first page instead."
            : "Failed to load movies. Please try again later."
        );
        if (axiosError.response?.status === 400) {
          syncParams({ page: 1 }, true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMovies();
    return () => {
      cancelled = true;
    };
  }, [currentPage, activeFilters, syncParams]);

  const handleViewModeChange = (mode: "grid" | "list") => {
    syncParams({ view: mode }, true);
  };

  const handleFilterChange = (filters: FilterOptions) => {
    const yearValue = parseInt(filters.year);
    if (
      !filters.year ||
      (yearValue >= 1900 && yearValue <= new Date().getFullYear())
    ) {
      syncParams({
        page: 1,
        filters: { ...filters, tag: activeFilters.tag || "" },
      });
    }
  };

  const handleTagChange = (tag: string) => {
    syncParams({
      page: 1,
      filters: { ...activeFilters, tag },
    });
  };

  const handlePageChange = (page: number) => {
    syncParams({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    syncParams({
      page: 1,
      filters: { genre: "", year: "", sort: "popularity.desc", tag: "" },
    });
  };

  return (
    <div className="mt-[68px] min-h-screen">
      <FilterLayout
        initialFilters={activeFilters}
        onFilterChange={handleFilterChange}
      >
        <div className="space-y-6 pb-8">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Movies
                {activeFilters.genre ? (
                  <span className="text-neutral-400 font-medium capitalize">
                    {" "}
                    · {activeFilters.genre}
                  </span>
                ) : null}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Browse featured films, filter by genre or year, and switch between grid or list view.
              </p>
            </div>
            <ViewMode
              viewMode={viewMode}
              onViewChange={handleViewModeChange}
            />
          </div>

          {/* Quick Discovery Tabs */}
          <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
            <LiquidSegmentedControl<string>
              layoutId="movies-discovery-tag-lens"
              value={activeFilters.tag || ""}
              onChange={handleTagChange}
              options={MOVIE_DISCOVERY_TABS}
              className="w-max"
            />
          </div>

          {error && (
            <div className="glass-chip border-amber-400/30 text-amber-200 px-4 py-3 rounded-[18px] text-sm">
              {error}
            </div>
          )}

          {/* Grid / List */}
          <div className="min-h-[420px]">
            {loading ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
                    : "flex flex-col gap-4"
                }
              >
                {[...Array(12)].map((_, index) => (
                  <div
                    key={index}
                    className={`glass-chip animate-pulse ${
                      viewMode === "grid"
                        ? "aspect-[2/3] w-full rounded-[22px]"
                        : "w-full h-[200px] rounded-[22px]"
                    }`}
                  />
                ))}
              </div>
            ) : movies.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
                    : "flex flex-col gap-4"
                }
              >
                {movies.map((movie) => (
                  <div key={movie.id} className="group relative h-full">
                    <Thumbnail movie={movie} viewMode={viewMode} />
                  </div>
                ))}
              </div>
            ) : (
              <NoResults filters={activeFilters} onReset={handleReset} />
            )}
          </div>

          {/* URL-backed Pagination */}
          {!loading && movies.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalResults}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </FilterLayout>
    </div>
  );
}

export default Movies;
