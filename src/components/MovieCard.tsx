import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaPlus, FaCheck } from "react-icons/fa";
import { XIcon } from "lucide-react";
import { Movie } from "../types/movie";
import toast from "react-hot-toast";
import { useMovieList } from "../hooks/useMovieList";
import { useWatchHistory } from "../hooks/useWatchHistory";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/400x600/1e1e1e/ffffff?text=No+Image+Available";

interface MovieCardProps {
  movie: Movie;
  showRemoveButton?: boolean;
  onListUpdate?: () => void;
}

export function MovieCard({
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
      title: movie.title,
      poster_path: movie.poster_path || "",
      media_type: (movie.media_type || "movie") as "movie" | "tv",
    });
    navigate(`/info/${movie.media_type}/${movie.id}`);
  };

  const isInMyList = isInList(movie.id);

  const imageUrl =
    imgError || !movie.poster_path
      ? FALLBACK_IMAGE
      : `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

  return (
    <div
      className="group aspect-[2/3] w-full relative rounded-[20px] overflow-hidden cursor-pointer bg-neutral-900 ring-1 ring-white/15 transition-transform duration-300 ease-ios hover:z-20 hover:-translate-y-1.5 hover:scale-[1.03] hover:ring-white/40 hover:shadow-[0_20px_44px_-12px_rgba(0,0,0,0.85)] will-change-transform"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-white/[0.06] animate-pulse rounded-[20px]" />
      )}

      <img
        src={imageUrl}
        alt={movie.title}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`object-cover w-full h-full transition-transform duration-500 ease-ios
                   ${isHovered ? "scale-105" : "scale-100"}
                   ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* Subtle top-edge glass reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

      <div
        className={`absolute inset-0 flex flex-col justify-between p-2.5 sm:p-4 bg-gradient-to-t from-black/95 via-black/45 to-transparent 
                   transition-opacity duration-300 
                   ${isHovered ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex items-center gap-2" />

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              className="btn-primary flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full group-hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              aria-label={`Play ${movie.title}`}
            >
              <FaPlay className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-950 pl-0.5" />
            </button>
            {showRemoveButton ? (
              <button
                onClick={handleRemove}
                disabled={isUpdating}
                className="liquid-glass liquid-refract-orb flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:!bg-red-500/75 transition-transform duration-300 ease-spring group-hover:scale-105"
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
                onClick={handleListUpdate}
                disabled={isUpdating}
                className={`liquid-glass liquid-refract-orb flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full 
                         transition-transform duration-300 ease-spring group-hover:scale-105
                         ${
                           isInMyList
                             ? "!bg-white/25"
                             : ""
                         }`}
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
            {movie.title}
          </h3>
        </div>
      </div>
    </div>
  );
}
