import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaPlus, FaCheck } from "react-icons/fa";
import { XIcon } from "lucide-react";
import { Movie } from "../types/movie";
import toast from "react-hot-toast";
import { useMovieList } from "../hooks/useMovieList";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { tmdbImage, posterSrcSet } from "../utils/requests";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/400x600/1e1e1e/ffffff?text=No+Image+Available";

interface MovieCardProps {
  movie: Movie;
  showRemoveButton?: boolean;
  onListUpdate?: () => void;
}

function MovieCardComponent({
  movie,
  showRemoveButton = false,
  onListUpdate,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const { isInList, addToList, removeFromList } = useMovieList();
  const { addToWatchHistory } = useWatchHistory();

  const mediaType = (movie.media_type ||
    (movie.first_air_date ? "tv" : "movie")) as "movie" | "tv";
  const title = movie.title || movie.name || "Untitled";

  const handleListUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      setIsUpdating(true);
      const isCurrentlyInList = isInList(movie.id);

      if (isCurrentlyInList) {
        await removeFromList(movie.id);
        toast.success("Removed from list");
      } else {
        await addToList(movie);
        toast.success("Added to list");
      }

      onListUpdate?.();
    } catch (error) {
      console.error("Error updating list:", error);
      toast.error("Failed to update list");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsUpdating(true);
      await removeFromList(movie.id);
      toast.success("Removed from your list");
      onListUpdate?.();
    } catch (error) {
      console.error("Error removing from list:", error);
      toast.error("Failed to remove from list");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCardClick = () => {
    window.scrollTo(0, 0);
    addToWatchHistory({
      id: movie.id,
      title,
      poster_path: movie.poster_path || "",
      media_type: mediaType,
    });
    navigate(`/info/${mediaType}/${movie.id}`);
  };

  const isInMyList = isInList(movie.id);
  const imagePath = movie.poster_path || movie.backdrop_path;

  const imageUrl =
    imgError || !imagePath
      ? FALLBACK_IMAGE
      : tmdbImage(imagePath, "w342");

  const imageSrcSet =
    imgError || !imagePath ? undefined : posterSrcSet(imagePath);

  return (
    <div
      className="group aspect-[2/3] w-full relative rounded-[20px] overflow-hidden cursor-pointer bg-ink-900 ring-1 ring-white/[0.16] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.75)] transition-transform duration-300 ease-ios
                 after:content-[''] after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit]
                 after:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),inset_0_0_0_1px_rgba(255,255,255,0.12)]
                 [@media(hover:hover)]:hover:z-20 [@media(hover:hover)]:hover:-translate-y-1.5 [@media(hover:hover)]:hover:scale-[1.03] [@media(hover:hover)]:hover:ring-white/40 [@media(hover:hover)]:hover:shadow-[0_20px_44px_-12px_rgba(0,0,0,0.85)]"
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-white/[0.06] animate-pulse rounded-[20px]" />
      )}

      <img
        src={imageUrl}
        srcSet={imageSrcSet}
        sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 260px"
        alt={title}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!imgError) {
            setImgError(true);
          } else {
            setIsLoaded(true);
          }
        }}
        onLoad={() => setIsLoaded(true)}
        className={`object-cover w-full h-full transition-transform duration-500 ease-ios
                   ${isHovered ? "scale-105" : "scale-100"}
                   ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {showRemoveButton && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={isUpdating}
          aria-label={`Remove ${title} from list`}
          title="Remove from list"
          className="glass-chip hidden [@media(hover:none)]:flex absolute right-2 top-2 z-20 h-8 w-8 items-center justify-center rounded-full text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_16px_rgba(0,0,0,0.65)] transition-transform duration-150 active:scale-90 disabled:opacity-50"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}

      {isHovered && (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-between p-2.5 sm:p-4 bg-gradient-to-t from-black/95 via-black/45 to-transparent animate-[fadeIn_0.25s_ease-out]"
        >
          <div className="flex items-center gap-2" />

          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="btn-primary flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full group-hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
                aria-label={`Play ${title}`}
              >
                <FaPlay className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-950 pl-0.5" />
              </button>
              {showRemoveButton ? (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUpdating}
                  className="liquid-glass liquid-refract-orb flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:!bg-red-500/75 transition-transform duration-300 ease-spring group-hover:scale-105"
                  aria-label={`Remove ${title} from list`}
                  title="Remove from list"
                >
                  <XIcon
                    className={`text-white w-4 h-4 sm:w-5 sm:h-5 ${
                      isUpdating ? "opacity-50" : ""
                    }`}
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleListUpdate}
                  disabled={isUpdating}
                  className={`liquid-glass liquid-refract-orb flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full
                           transition-transform duration-300 ease-spring group-hover:scale-105
                           ${isInMyList ? "!bg-white/25" : ""}`}
                  aria-label={isInMyList ? `Remove ${title} from My List` : `Add ${title} to My List`}
                  title={isInMyList ? "In My List" : "Add to My List"}
                >
                  {isInMyList ? (
                    <FaCheck
                      className={`text-white text-xs sm:text-sm ${
                        isUpdating ? "opacity-50" : ""
                      }`}
                    />
                  ) : (
                    <FaPlus
                      className={`text-white text-xs sm:text-sm ${
                        isUpdating ? "opacity-50" : ""
                      }`}
                    />
                  )}
                </button>
              )}
            </div>
            <h3
              className="font-display text-sm sm:text-base text-white font-semibold drop-shadow-lg
                         line-clamp-1 sm:line-clamp-2"
            >
              {title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

export const MovieCard = React.memo(MovieCardComponent);
