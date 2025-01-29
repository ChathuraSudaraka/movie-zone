import { useState } from "react";
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
  movie: Movie;
  viewMode: "grid" | "list";
}

function Thumbnail({ movie, viewMode }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    window.scrollTo(0, 0);
    const mediaType = movie.media_type || "movie";
    navigate(`/info/${mediaType}/${movie.id}`);
  };

  const imageUrl = imgError
    ? FALLBACK_IMAGE
    : movie.poster_path || movie.backdrop_path
      ? `${baseUrl}${movie.poster_path || movie.backdrop_path}`
      : FALLBACK_IMAGE;

  if (viewMode === "list") {
    return (
      <div
        className="group relative bg-gray-900/30 rounded-xl overflow-hidden transition-all duration-300
                   border border-gray-800/50 hover:border-gray-700/50 backdrop-blur-sm
                   hover:shadow-xl hover:shadow-black/20"
      >
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
              <span>2h 30m</span>
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
                  <span>{new Date(movie.release_date).getFullYear()}</span>
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
      className="relative min-w-[160px] md:h-[420px] md:min-w-[280px] cursor-pointer 
                 transition-all duration-300 ease-in-out group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{ willChange: "transform" }}
    >
      <img
        src={imageUrl}
        alt={movie.title || movie.name}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`rounded-sm object-cover md:rounded w-full h-full
                   transition-all duration-300 ${isHovered ? "scale-105 brightness-75" : ""
          }
                   ${isLoaded ? "opacity-100" : "opacity-0"}`}
        style={{
          willChange: "transform",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          backfaceVisibility: "hidden",
        }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse rounded-sm" />
      )}

      <div
        className={`absolute inset-0 flex flex-col justify-end p-4 
                      transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
          }`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full 
                       bg-white/90 hover:bg-white transition group-hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <FaPlay className="h-5 w-5 text-black pl-0.5" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white md:text-base line-clamp-1">
              {movie.title || movie.name}
            </h3>
            {movie.vote_average > 0 && (
              <p className="text-xs text-green-400 font-medium">
                {Math.round(movie.vote_average * 10)}% Match
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Thumbnail;
