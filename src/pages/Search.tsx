import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Movie } from "../types/movie";
import { baseUrl } from "@/utils/requests";
import { FaPlay } from "react-icons/fa";
import { Skeleton } from "@mui/material";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/400x600/1e1e1e/ffffff?text=No+Image+Available";

interface SearchResult extends Movie {
  media_type: "movie" | "tv" | string;
}

function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const getImageUrl = (result: SearchResult) => {
    if (imgError) return FALLBACK_IMAGE;
    if (result.poster_path || result.backdrop_path) {
      return `${baseUrl}${result.poster_path || result.backdrop_path}`;
    }
    return FALLBACK_IMAGE;
  };

  useEffect(() => {
    document.title = `Search - ${query} - MovieZone`;

    async function searchContent() {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
        const response = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
            query
          )}&page=1&include_adult=false`
        );
        const data = await response.json();
        const filteredResults = data.results.filter(
          (item: SearchResult) =>
            (item.media_type === "movie" || item.media_type === "tv") &&
            (item.backdrop_path || item.poster_path)
        );
        setResults(filteredResults);
      } catch (error) {
        console.error("Error searching content:", error);
      } finally {
        setLoading(false);
      }
    }

    searchContent();
  }, [query]);

  const handleNavigateToInfo = (result: SearchResult) => {
    const type = result.media_type || (result.first_air_date ? "tv" : "movie");
    window.scrollTo(0, 0);
    navigate(`/info/${type}/${result.id}`);
  };

  if (loading) {
    return (
      <div className="mt-[68px] min-h-screen bg-[#141414] px-2 py-6 md:px-3 lg:px-4">
        <h1 className="text-3xl font-bold mb-4 text-white">
          {results.length > 0
            ? `Search results for "${query}"`
            : `No results found for "${query}"`}
        </h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="relative group flex flex-col overflow-hidden rounded-md bg-zinc-900 shadow-md min-h-[220px] h-full"
              style={{ willChange: "transform" }}
            >
              <div className="relative w-full aspect-[2/3] bg-zinc-800">
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
                  style={{ aspectRatio: "2 / 3" }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4">
                  <Skeleton
                    variant="text"
                    width="60%"
                    sx={{ bgcolor: "#1f1f1f" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414] px-2 py-6 md:px-3 lg:px-4">
      <h1 className="text-3xl font-bold mb-4 text-white">
        {results.length > 0
          ? `Search results for "${query}"`
          : `No results found for "${query}"`}
      </h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {results.map((result) => (
          <div
            key={result.id}
            className="relative group flex flex-col overflow-hidden rounded-md bg-zinc-900 shadow-md transition-all duration-300 cursor-pointer min-h-[220px] h-full"
            onMouseEnter={() => setHoveredId(result.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleNavigateToInfo(result)}
            style={{ willChange: "transform" }}
          >
            <div className="relative w-full aspect-[2/3] bg-zinc-800">
              <img
                src={getImageUrl(result)}
                alt={result.title || result.name}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  setImgError(true);
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
                onLoad={() => setIsLoaded(true)}
                className={`object-cover w-full h-full transition-all duration-300 ${
                  hoveredId === result.id ? "scale-105 brightness-75" : ""
                } ${isLoaded ? "opacity-100" : "opacity-0"}`}
                style={{
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                }}
              />
              {!isLoaded && (
                <div className="absolute inset-0 bg-zinc-900 animate-pulse rounded-md" />
              )}
              <div
                className={`absolute inset-0 flex flex-col justify-end p-2 md:p-4 transition-opacity duration-300 ${
                  hoveredId === result.id ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white transition group-hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateToInfo(result);
                      }}
                    >
                      <FaPlay className="h-4 w-4 md:h-5 md:w-5 text-black pl-0.5" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-semibold text-white line-clamp-1">
                      {result.title || result.name}
                    </h3>
                    {result.vote_average > 0 && (
                      <p className="text-[10px] md:text-xs text-green-400 font-medium">
                        {Math.round(result.vote_average * 10)}% Match
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;
