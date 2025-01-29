import { useEffect, useState } from "react";
import axios from "../utils/axios";
import Thumbnail from "../components/Thumbnail";
import { Skeleton } from "@mui/material";
import { Movie } from "@/types/movie";
import ViewMode from "../components/common/ViewMode";
import Pagination from "../components/common/Pagination";
import FilterLayout from '../components/layout/FilterLayout';
import { getUrlParams, updateUrlParams } from "../utils/urlParams";

interface TVShowDetails extends Movie {
  vote_average: number;
  number_of_seasons?: number;
  first_air_date: string;
  status?: string;
  networks?: Array<{ name: string }>;
}

interface FilterOptions {
  genre: string;
  year: string;
  sort: string;
  tag?: string;
}

function TVShows() {
  const urlParams = getUrlParams();
  const [shows, setShows] = useState<TVShowDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(urlParams.viewMode);
  const [currentPage, setCurrentPage] = useState(urlParams.page);
  const [activeFilters, setActiveFilters] = useState(urlParams.filters);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    document.title = "Top Rated TV Shows - MovieZone";

    async function fetchTVShows() {
      try {
        setLoading(false);
        let endpoint = "/tv/top_rated";
        let params: any = {
          page: currentPage,
          include_adult: false,
        };

        // Handle sorting
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

        // Handle genre filter
        if (activeFilters.genre) {
          endpoint = "/discover/tv";
          params.with_genres = getGenreId(activeFilters.genre);
        }

        // Handle year filter with proper date ranges
        if (activeFilters.year) {
          endpoint = "/discover/tv";
          const year = activeFilters.year;
          params.sort_by = params.sort_by || "popularity.desc";
          params["first_air_date.gte"] = `${year}-01-01`;
          params["first_air_date.lte"] = `${year}-12-31`;

          // Ensure we get shows with valid dates
          params.include_null_first_air_dates = false;
        }

        // Handle tag filters
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

        // Calculate real total pages based on actual results
        const actualResults = response.data.total_results;
        const maxResults = Math.min(actualResults, 10000); // TMDB typically limits to 10000 results
        const calculatedPages = Math.ceil(maxResults / ITEMS_PER_PAGE);
        const actualTotalPages = Math.min(
          calculatedPages,
          response.data.total_pages
        );

        setShows(processedShows);
        setTotalPages(actualTotalPages);
        setTotalResults(maxResults);

        // Reset to page 1 if current page is beyond total pages
        if (currentPage > actualTotalPages) {
          setCurrentPage(1);
        }

        setError(null);
      } catch (error) {
        console.error("Error fetching TV shows:", error);
        setError("Failed to load TV shows. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchTVShows();
  }, [currentPage, activeFilters, totalPages]);

  // Update URL when state changes
  useEffect(() => {
    updateUrlParams({
      page: currentPage,
      viewMode,
      filters: activeFilters
    });
  }, [currentPage, viewMode, activeFilters]);

  // Update genre ID mapping with correct TV show genre IDs
  const getGenreId = (genreName: string): number => {
    const genreMap: { [key: string]: number } = {
      action: 10759, // Action & Adventure
      animation: 16,
      comedy: 35,
      crime: 80,
      documentary: 99,
      drama: 18,
      family: 10751,
      fantasy: 10765, // Sci-Fi & Fantasy
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

  // Add sorting function
  const sortShows = (shows: TVShowDetails[]) => {
    const { sort } = activeFilters;
    return [...shows].sort((a, b) => {
      switch (sort) {
        case "popularity.desc":
          return (b.popularity || 0) - (a.popularity || 0);
        case "vote_average.desc":
          return (b.vote_average || 0) - (a.vote_average || 0);
        case "release_date.desc":
          return (
            new Date(b.first_air_date).getTime() -
            new Date(a.first_air_date).getTime()
          );
        case "release_date.asc":
          return (
            new Date(a.first_air_date).getTime() -
            new Date(b.first_air_date).getTime()
          );
        default:
          return 0;
      }
    });
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  const handleFilterChange = (filters: FilterOptions) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ShowsGrid = ({
    shows,
    title,
  }: {
    shows: TVShowDetails[];
    title: string;
  }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white md:text-2xl lg:text-3xl">
          {title}
        </h2>
      </div>
      <div
        className={`${
          viewMode === "grid"
            ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-4"
        }`}
      >
        {shows.map((show) => (
          <div key={show.id} className="group relative">
            <Thumbnail movie={show} viewMode={viewMode} />
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="mt-[68px] min-h-screen bg-[#141414]">
        <div className="px-2 py-6 md:px-3 lg:px-4">
          {/* Mobile Skeleton Button */}
          <div className="md:hidden mb-4">
            <Skeleton
              variant="rectangular"
              height={50}
              sx={{ bgcolor: "#2b2b2b", borderRadius: "0.75rem" }}
            />
          </div>

          <div className="flex gap-6">
            {/* Filter Skeleton */}
            <div className="hidden md:block w-[280px] flex-shrink-0">
              <div className="sticky top-[84px]">
                <div className="bg-[#2b2b2b] rounded-xl overflow-hidden">
                  {/* Filter Header Skeleton */}
                  <Skeleton
                    variant="rectangular"
                    height={60}
                    sx={{ bgcolor: "#232323" }}
                  />
                  {/* Filter Content Skeleton */}
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="px-4 py-3">
                      <Skeleton
                        variant="text"
                        width={120}
                        height={24}
                        sx={{ bgcolor: "#232323", marginBottom: "12px" }}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {[...Array(4)].map((_, idx) => (
                          <Skeleton
                            key={idx}
                            variant="rectangular"
                            height={36}
                            sx={{ bgcolor: "#232323", borderRadius: "0.75rem" }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <Skeleton
                  variant="text"
                  width={200}
                  height={40}
                  sx={{ bgcolor: "#2b2b2b" }}
                />
                <Skeleton
                  variant="rectangular"
                  width={100}
                  height={36}
                  sx={{ bgcolor: "#2b2b2b", borderRadius: "0.5rem" }}
                />
              </div>
              <Skeleton
                className="mb-8"
                variant="rectangular"
                width={100}
                height={36}
                sx={{ bgcolor: "#2b2b2b", borderRadius: "0.5rem" }}
              />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="relative aspect-[2/3] w-full">
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height="100%"
                      sx={{
                        bgcolor: "#2b2b2b",
                        borderRadius: "0.5rem",
                        transform: "scale(1)",
                        "&::after": {
                          background:
                            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)",
                        },
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination Skeleton */}
              <div className="mt-8 flex justify-center">
                <Skeleton
                  variant="rectangular"
                  width={300}
                  height={40}
                  sx={{ bgcolor: "#2b2b2b", borderRadius: "0.5rem" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
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
    );
  }

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414]">
      <FilterLayout initialFilters={activeFilters} onFilterChange={handleFilterChange}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            All TV Shows
          </h1>
          <ViewMode viewMode={viewMode} onViewChange={handleViewModeChange} />
        </div>

        <ShowsGrid
          shows={sortShows(shows)}
          title={`TV Shows ${activeFilters.genre ? `- ${activeFilters.genre}` : ""}`}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={totalResults}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
        />
      </FilterLayout>
    </div>
  );
}

export default TVShows;
