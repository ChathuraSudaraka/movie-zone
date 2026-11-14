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

interface TVShowDetails extends Movie {
  vote_average: number;
  number_of_seasons?: number;
  first_air_date: string;
  status?: string;
  networks?: Array<{ name: string }>;
}

const TV_DISCOVERY_TABS = [
  { value: "", label: "All Shows" },
  { value: "Trending Now", label: "Trending" },
  { value: "New Releases", label: "New Releases" },
  { value: "Popular Series", label: "Popular" },
  { value: "Award Winners", label: "Top Rated" },
];

const getTVGenreId = (genreName: string): number => {
  const genreMap: Record<string, number> = {
    action: 10759,
    adventure: 10759,
    animation: 16,
    comedy: 35,
    crime: 80,
    documentary: 99,
    drama: 18,
    family: 10751,
    fantasy: 10765,
    "sci-fi": 10765,
    horror: 9648,
    kids: 10762,
    mystery: 9648,
    news: 10763,
    reality: 10764,
    romance: 10749,
    soap: 10766,
    talk: 10767,
    thriller: 80,
    "war-politics": 10768,
    western: 37,
  };
  return genreMap[genreName.toLowerCase()] || 0;
};

const MAX_CACHE_ENTRIES = 30;
const tvQueryCache = new Map<
  string,
  { results: TVShowDetails[]; totalResults: number }
>();

function setTVQueryCache(
  key: string,
  value: { results: TVShowDetails[]; totalResults: number }
) {
  if (tvQueryCache.has(key)) {
    tvQueryCache.delete(key);
  } else if (tvQueryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = tvQueryCache.keys().next().value;
    if (oldestKey !== undefined) {
      tvQueryCache.delete(oldestKey);
    }
  }
  tvQueryCache.set(key, value);
}

function buildTVQuery(currentPage: number, activeFilters: FilterOptions) {
  const safePage = Math.min(currentPage, 500);
  let endpoint = "/discover/tv";
  const params: Record<string, string | number | boolean> = {
    page: safePage,
    include_adult: false,
  };

  switch (activeFilters.sort) {
    case "vote_average.desc":
      params.sort_by = "vote_average.desc";
      params["vote_count.gte"] = 200;
      break;
    case "release_date.desc":
      params.sort_by = "first_air_date.desc";
      break;
    case "release_date.asc":
      params.sort_by = "first_air_date.asc";
      break;
    default:
      params.sort_by = "popularity.desc";
      break;
  }

  if (activeFilters.genre) {
    const genreId = getTVGenreId(activeFilters.genre);
    if (genreId) params.with_genres = genreId;
  }

  if (activeFilters.year) {
    const year = activeFilters.year;
    params["first_air_date.gte"] = `${year}-01-01`;
    params["first_air_date.lte"] = `${year}-12-31`;
    params.include_null_first_air_dates = false;
  }

  if (activeFilters.tag) {
    switch (activeFilters.tag) {
      case "New Releases": {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        params.sort_by = "first_air_date.desc";
        params["first_air_date.gte"] = threeMonthsAgo
          .toISOString()
          .split("T")[0];
        break;
      }
      case "Trending Now":
        endpoint = "/trending/tv/day";
        break;
      case "Popular Series":
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

  return { endpoint, params, cacheKey: endpoint + JSON.stringify(params) };
}

function TVShows() {
  const [searchParams, setSearchParams] = useSearchParams();
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

    const saved = loadFilterState("/tv");
    return (
      saved || {
        genre: "",
        year: "",
        sort: "popularity.desc",
        tag: "",
      }
    );
  }, [searchParams]);

  const query = useMemo(
    () => buildTVQuery(currentPage, activeFilters),
    [currentPage, activeFilters]
  );
  const initialCached = tvQueryCache.get(query.cacheKey);

  const [shows, setShows] = useState<TVShowDetails[]>(
    () => initialCached?.results ?? []
  );
  const [loading, setLoading] = useState<boolean>(() => !initialCached);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState<number>(
    () => initialCached?.totalResults ?? 0
  );

  // Ensure initial URL always stores page & view cleanly
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
    document.title = "TV Shows - MovieZone";
    let cancelled = false;
    const controller = new AbortController();

    async function fetchTVShows() {
      const { endpoint, params, cacheKey } = query;

      const cached = tvQueryCache.get(cacheKey);
      if (cached) {
        setTVQueryCache(cacheKey, cached);
        setShows(cached.results);
        setTotalResults(cached.totalResults);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(endpoint, {
          params,
          signal: controller.signal,
        });
        if (cancelled || controller.signal.aborted) return;

        const processedShows = (response.data.results || [])
          .filter(
            (show: Movie) =>
              show.backdrop_path !== null && show.poster_path !== null
          )
          .map((show: Movie & { name?: string; first_air_date?: string }) => ({
            ...show,
            media_type: "tv",
            title: show.name || show.title,
            release_date: show.first_air_date || show.release_date,
          }));

        const maxResults = Math.min(
          response.data.total_results || processedShows.length,
          10000
        );

        setTVQueryCache(cacheKey, {
          results: processedShows,
          totalResults: maxResults,
        });

        setShows(processedShows);
        setTotalResults(maxResults);
        setError(null);
      } catch (err: unknown) {
        if (
          cancelled ||
          controller.signal.aborted ||
          (err as { code?: string; name?: string })?.code === "ERR_CANCELED" ||
          (err as { name?: string })?.name === "CanceledError"
        ) {
          return;
        }
        const axiosError = err as { response?: { status: number } };
        setError(
          axiosError.response?.status === 400
            ? "Invalid page number. Showing first page instead."
            : "Failed to load TV shows. Please try again later."
        );
        if (axiosError.response?.status === 400) {
          syncParams({ page: 1 }, true);
        }
      } finally {
        if (!cancelled && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchTVShows();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query, syncParams]);

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
                TV Series
                {activeFilters.genre ? (
                  <span className="text-neutral-400 font-medium capitalize">
                    {" "}
                    · {activeFilters.genre}
                  </span>
                ) : null}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Explore trending series, complete season guides, and episode downloads.
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
              layoutId="tv-discovery-tag-lens"
              value={activeFilters.tag || ""}
              onChange={handleTagChange}
              options={TV_DISCOVERY_TABS}
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
            ) : shows.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
                    : "flex flex-col gap-4"
                }
              >
                {shows.map((show) => (
                  <div key={show.id} className="group relative h-full">
                    <Thumbnail movie={show} viewMode={viewMode} />
                  </div>
                ))}
              </div>
            ) : (
              <NoResults filters={activeFilters} onReset={handleReset} />
            )}
          </div>

          {/* URL-backed Pagination */}
          {!loading && shows.length > 0 && (
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

export default TVShows;
