import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "../utils/requests";
import { FaPlay } from "react-icons/fa";
import { Movie } from "../types/movie";
import { BsPlayFill, BsStarFill } from "react-icons/bs";
import { BiTime } from "react-icons/bi";
import { getGenreName } from "../utils/genreMap";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/400x600/1e1e1e/ffffff?text=No+Image+Available";

interface Props {
  movie: Movie & { runtime?: number };
  viewMode: "grid" | "list";
}

function Thumbnail({ movie, viewMode }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [runtime, setRuntime] = useState<number | null>(null);
  const navigate = useNavigate();

  const formatYear = (date: string | undefined) => {
    if (!date) return '';
    return new Date(date).getFullYear().toString();
  };

  useEffect(() => {
    const fetchRuntime = async () => {
      if (viewMode === 'list' && movie.id) {
        try {
          const mediaType = movie.media_type || 'movie';
          const response = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${movie.id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
          );
          const data = await response.json();
          setRuntime(data.runtime || null);
        } catch (error) {
          console.error('Error fetching runtime:', error);
          setRuntime(null);
        }
      }
    };

    fetchRuntime();
  }, [movie.id, movie.media_type, viewMode]);

  const handleClick = () => {
    const mediaType = movie.media_type || "movie";
    navigate(`/info/${mediaType}/${movie.id}`);
    window.scrollTo(0, 0);
  };

  const imageUrl = imgError
    ? FALLBACK_IMAGE
    : movie.poster_path || movie.backdrop_path
      ? `${baseUrl}${movie.poster_path || movie.backdrop_path}`
      : FALLBACK_IMAGE;

  if (viewMode === "list") {
    return (
      <div className="group relative bg-zinc-900/80 rounded-xl overflow-hidden transition-all duration-300
                     border border-zinc-800/50 hover:border-zinc-700/50 hover:bg-zinc-900/90
                     hover:shadow-xl hover:shadow-black/20">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4">
          {/* Movie Poster */}
          <div className="relative h-[300px] sm:h-[200px] w-full sm:w-[140px] 
                         rounded-lg overflow-hidden sm:flex-shrink-0">
            <img
              src={imageUrl}
              alt={movie.title}
              className="h-full w-full object-cover transition-transform duration-300 
                         group-hover:scale-105"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-sm bg-black/60 px-2 py-1 rounded-md">
              <BiTime className="w-4 h-4" />
              {runtime ? (
                <span>{Math.floor(runtime / 60)}h {runtime % 60}m</span>
              ) : (
                <span>N/A</span>
              )}
            </div>
          </div>

          {/* Movie Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-red-500 
                             transition-colors line-clamp-1">
                  {movie.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-sm text-gray-400">
                  {movie.release_date && <span>{formatYear(movie.release_date)}</span>}
                  <span className="w-1 h-1 rounded-full bg-gray-600 hidden sm:block" />
                  <div className="flex items-center gap-1">
                    <BsStarFill className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">{movie.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-3 sm:mt-4 text-sm text-gray-300 line-clamp-2 sm:line-clamp-3">
              {movie.overview}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button 
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg 
                         bg-red-600 text-white hover:bg-red-700 transition-colors 
                         text-sm sm:text-base font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                <BsPlayFill className="w-5 h-5" />
                Watch Now
              </button>
            </div>

            {/* Genre Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
              {movie.genre_ids?.slice(0, 3).map((genreId) => (
                <span 
                  key={genreId}
                  className="px-2 py-1 text-xs rounded-md bg-gray-800/80 text-gray-400
                           border border-gray-700/50"
                >
                  {getGenreName(genreId)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative cursor-pointer transition-transform duration-300 ease-in-out
                 aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-900/50
                 hover:z-20 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <img
        src={imageUrl}
        alt={movie.title || movie.name}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-300
                   ${isHovered ? "scale-105 brightness-[0.3]" : "brightness-90"}
                   ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse rounded-md" />
      )}

      <div
        className={`absolute inset-0 flex flex-col justify-between p-3 transition-opacity duration-300 
                   ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        {/* Top section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center w-9 h-9 rounded-full 
                       bg-white hover:bg-white/90 transition transform-gpu
                       group-hover:scale-105 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <FaPlay className="w-4 h-4 text-black pl-0.5" />
            </button>
          </div>
        </div>

        {/* Bottom section */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold text-white line-clamp-2">
            {movie.title || movie.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {movie.vote_average > 0 && (
              <span className="text-green-400 font-medium">
                {Math.round(movie.vote_average * 10)}% Match
              </span>
            )}
            {(movie.release_date || movie.first_air_date) && (
              <span className="text-gray-400">
                {formatYear(movie.release_date || movie.first_air_date)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {movie.genre_ids?.slice(0, 2).map((genreId) => (
              <span
                key={genreId}
                className="px-1.5 py-0.5 text-[10px] font-medium rounded-sm 
                         bg-white/10 text-white/90"
              >
                {getGenreName(genreId)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Thumbnail;
