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
import { Skeleton } from "@mui/material";

interface TVShowDetails extends Movie {
  vote_average: number;
  number_of_seasons?: number;
  first_air_date: string;
  status?: string;
  networks?: Array<{ name: string }>;
}

function TVShows() {
  const urlParams = getUrlParams();
  const savedFilters = loadFilterState(window.location.pathname);
  const [shows, setShows] = useState<TVShowDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(urlParams.viewMode);
  const [currentPage, setCurrentPage] = useState(urlParams.page);
  const [activeFilters, setActiveFilters] = useState(savedFilters || urlParams.filters);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    document.title = "TV Shows - MovieZone";

    async function fetchTVShows() {
      try {
        if (!isInitialLoad) setLoading(true);
        else setLoading(true); // Also set loading on initial load

        let endpoint = "/tv/top_rated";
        let params: any = {
          page: currentPage,
          include_adult: false,
        };

        switch (activeFilters.sort) {
          case "vote_average.desc":
            params["vote_count.gte"] = 200;
            break;
          case "release_date.desc":
          case "release_date.asc":
            endpoint = "/discover/tv";
            params.sort_by =
              activeFilters.sort === "release_date.desc"
                ? "first_air_date.desc"
                : "first_air_date.asc";
            break;
          case "popularity.desc":
            endpoint = "/discover/tv";
            params.sort_by = "popularity.desc";
            break;
        }

        if (activeFilters.genre) {
          endpoint = "/discover/tv";
          params.with_genres = getGenreId(activeFilters.genre);
        }

        if (activeFilters.year) {
          endpoint = "/discover/tv";
          const year = activeFilters.year;
          params.sort_by = params.sort_by || "popularity.desc";
          params["first_air_date.gte"] = `${year}-01-01`;
          params["first_air_date.lte"] = `${year}-12-31`;
          params.include_null_first_air_dates = false;
        }

        if (activeFilters.tag) {
          endpoint = "/discover/tv";
          switch (activeFilters.tag) {
            case "New Releases":
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              params.sort_by = "first_air_date.desc";
              params["first_air_date.gte"] = threeMonthsAgo
                .toISOString()
                .split("T")[0];
              break;
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

        const response = await axios.get(endpoint, { params });

        const processedShows = response.data.results
          .filter(
            (show: any) =>
              show.backdrop_path !== null && show.poster_path !== null
          )
          .map((show: any) => ({
            ...show,
            media_type: "tv",
            title: show.name,
            release_date: show.first_air_date,
          }));

        const actualResults = response.data.total_results;
        const maxResults = Math.min(actualResults, 10000);
        const calculatedPages = Math.ceil(maxResults / ITEMS_PER_PAGE);
        const actualTotalPages = Math.min(
          calculatedPages,
          response.data.total_pages
        );

        setShows(processedShows);
        setTotalPages(actualTotalPages);
        setTotalResults(maxResults);
        setError(null);
      } catch (error: any) {
        setError(
          error.response?.status === 400
            ? "Invalid page number. Showing first page instead."
            : "Failed to load TV shows. Please try again later."
        );
        
        if (error.response?.status === 400) {
          setCurrentPage(1);
        }
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }

    fetchTVShows();
  }, [currentPage, activeFilters, totalPages]);

  useEffect(() => {
    updateUrlParams({
      page: currentPage,
      viewMode,
      filters: activeFilters
    });
  }, [currentPage, viewMode, activeFilters]);

  const getGenreId = (genreName: string): number => {
    const genreMap: { [key: string]: number } = {
      action: 10759,
      animation: 16,
      comedy: 35,
      crime: 80,
      documentary: 99,
      drama: 18,
      family: 10751,
      fantasy: 10765,
      kids: 10762,
      mystery: 9648,
      news: 10763,
      reality: 10764,
      soap: 10766,
      talk: 10767,
      "war-politics": 10768,
      western: 37,
    };
    return genreMap[genreName.toLowerCase()] || 0;
  };

  // const sortShows = (shows: TVShowDetails[]) => {
  //   const { sort } = activeFilters;
  //   return [...shows].sort((a, b) => {
  //     switch (sort) {
  //       case "popularity.desc":
  //         return (b.popularity || 0) - (a.popularity || 0);
  //       case "vote_average.desc":
  //         return (b.vote_average || 0) - (a.vote_average || 0);
  //       case "release_date.desc":
  //         return (
  //           new Date(b.first_air_date).getTime() -
  //           new Date(a.first_air_date).getTime()
  //         );
  //       case "release_date.asc":
  //         return (
  //           new Date(a.first_air_date).getTime() -
  //           new Date(b.first_air_date).getTime()
  //         );
  //       default:
  //         return 0;
  //     }
  //   });
  // };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  const handleFilterChange = (filters: FilterOptions) => {
    const yearValue = parseInt(filters.year);

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

  const ShowsGrid = ({ shows, title }: { shows: TVShowDetails[]; title: string }) => (
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
            // Skeleton Loading Grid
            [...Array(12)].map((_, index) => (
              <div key={index} className={viewMode === "grid" 
                ? "aspect-[2/3] w-full relative rounded-sm overflow-hidden"
                : "w-full h-[200px] relative rounded-sm overflow-hidden"
              }>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{ bgcolor: "#1f1f1f" }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Skeleton
                    variant="text"
                    width="60%"
                    sx={{ bgcolor: "#1f1f1f" }}
                  />
                </div>
              </div>
            ))
          ) : shows.length > 0 ? (
            shows.map((show) => (
              <div key={show.id} className="group relative h-full">
                <Thumbnail movie={show} viewMode={viewMode} />
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
        {isInitialLoad || loading ? (
          // Header Skeleton
          <div className="flex items-center justify-between mb-6">
            <Skeleton
              variant="rectangular"
              width={200}
              height={40}
              sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width={100}
              height={40}
              sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white md:text-2xl lg:text-3xl">
              All TV Shows
            </h1>
            <ViewMode viewMode={viewMode} onViewChange={handleViewModeChange} />
          </div>
        )}

        <ShowsGrid
          shows={shows}
          title={`TV Shows ${activeFilters.genre ? `- ${activeFilters.genre}` : ""}`}
        />

        {!isInitialLoad && shows.length > 0 && (
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

export default TVShows;
