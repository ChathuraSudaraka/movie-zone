import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { posterSrcSet, tmdbImage } from "../utils/requests";
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
  const [seasonsCount, setSeasonsCount] = useState<number | null>(null);
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
          setRuntime(data.runtime || data.episode_run_time?.[0] || null);
          setSeasonsCount(data.number_of_seasons || null);
        } catch (error) {
          console.error('Error fetching runtime:', error);
          setRuntime(null);
          setSeasonsCount(null);
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

  const imagePath = movie.poster_path || movie.backdrop_path;
  const imageUrl = imgError
    ? FALLBACK_IMAGE
    : imagePath
      ? tmdbImage(imagePath, "w500")
      : FALLBACK_IMAGE;
  const imageSrcSet = !imgError && imagePath ? posterSrcSet(imagePath) : undefined;

  if (viewMode === "list") {
    return (
      <div className="group relative rounded-[24px] overflow-hidden transition-transform duration-300 ease-ios
                     glass-chip hover:border-white/30 hover:-translate-y-0.5">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4">
          {/* Movie Poster */}
          <div className="relative h-[300px] sm:h-[200px] w-full sm:w-[140px] 
                         rounded-[18px] overflow-hidden sm:flex-shrink-0 ring-1 ring-white/10">
            <img
              src={imageUrl}
              alt={movie.title}
              className="h-full w-full object-cover transition-transform duration-500 ease-ios
                         group-hover:scale-105"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs glass-chip px-2.5 py-1 rounded-full">
              <BiTime className="w-3.5 h-3.5" />
              {seasonsCount ? (
                <span>
                  {seasonsCount} {seasonsCount === 1 ? "Season" : "Seasons"}
                </span>
              ) : runtime ? (
                <span>
                  {runtime >= 60
                    ? `${Math.floor(runtime / 60)}h ${runtime % 60}m`
                    : `${runtime}m`}
                </span>
              ) : (
                <span>{movie.media_type === "tv" ? "Series" : "Movie"}</span>
              )}
            </div>
          </div>

          {/* Movie Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="font-display text-lg sm:text-xl font-bold text-white/95 group-hover:text-white 
                             transition-colors line-clamp-1">
                  {movie.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-sm text-neutral-400">
                  {movie.release_date && <span>{formatYear(movie.release_date)}</span>}
                  <span className="w-1 h-1 rounded-full bg-white/30 hidden sm:block" />
                  <div className="flex items-center gap-1">
                    <BsStarFill className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-medium text-white/90">{movie.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-3 sm:mt-4 text-sm text-neutral-300 line-clamp-2 sm:line-clamp-3 leading-relaxed">
              {movie.overview}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button 
                className="btn-primary shine px-5 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                <span className="shine-bar" />
                <BsPlayFill className="w-5 h-5" />
                Watch Now
              </button>
            </div>

            {/* Genre Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
              {movie.genre_ids?.slice(0, 3).map((genreId) => (
                <span 
                  key={genreId}
                  className="px-2.5 py-1 text-xs rounded-full glass-chip text-white/80"
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
      className="group relative cursor-pointer transition-transform duration-300 ease-ios
                 aspect-[2/3] w-full overflow-hidden rounded-[20px] bg-neutral-900
                 ring-1 ring-white/15 hover:z-20 hover:-translate-y-1.5 hover:scale-[1.03]
                 hover:ring-white/40 hover:shadow-[0_20px_44px_-12px_rgba(0,0,0,0.85)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <img
        src={imageUrl}
        srcSet={imageSrcSet}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
        alt={movie.title || movie.name}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-transform duration-500 ease-ios
                   ${isHovered ? "scale-108" : "scale-100"}
                   ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {!isLoaded && (
        <div className="absolute inset-0 bg-white/[0.06] animate-pulse rounded-[20px]" />
      )}

      {/* Subtle top-edge glass reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

      {/* Rating badge (lightweight glass chip — zero backdrop-filter lag in grids) */}
      {movie.vote_average > 0 && (
        <div className="glass-chip absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white">
          <BsStarFill className="h-2.5 w-2.5 text-amber-400" />
          {movie.vote_average.toFixed(1)}
        </div>
      )}

      {/* Hover overlay (mounted only while hovered so idle cards carry zero backdrop-filter cost) */}
      {isHovered && (
      <div
        className="absolute inset-0 flex flex-col justify-end gap-3 p-3.5 sm:p-4
                   bg-gradient-to-t from-black/95 via-black/55 to-transparent
                   animate-[fadeIn_0.25s_ease-out]"
      >
        <button
          className="liquid-glass liquid-refract-orb absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full
                   transition-transform duration-300 ease-spring hover:scale-110 active:scale-90"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          aria-label={`Open ${movie.title || movie.name}`}
        >
          <FaPlay className="h-4 w-4 sm:h-5 sm:w-5 text-white pl-0.5" />
        </button>

        <div className="space-y-1.5">
          <h3 className="font-display text-sm sm:text-base font-semibold leading-tight text-white line-clamp-2">
            {movie.title || movie.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
            {(movie.release_date || movie.first_air_date) && (
              <span>{formatYear(movie.release_date || movie.first_air_date)}</span>
            )}
            {movie.media_type && (
              <>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                <span className="uppercase tracking-wider text-[10px] text-white/80">
                  {movie.media_type === "tv" ? "Series" : "Movie"}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {movie.genre_ids?.slice(0, 2).map((genreId) => (
              <span
                key={genreId}
                className="glass-chip rounded-full px-2 py-0.5 text-[10px] font-medium text-white/85"
              >
                {getGenreName(genreId)}
              </span>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default Thumbnail;