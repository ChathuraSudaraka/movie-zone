import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaPlus, FaCheck } from "react-icons/fa";
import { XIcon } from "lucide-react";
import { Movie } from "../types/movie";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useMovieList } from '../hooks/useMovieList';
import { useWatchHistory } from '../hooks/useWatchHistory';

const FALLBACK_IMAGE = "https://via.placeholder.com/400x600/1e1e1e/ffffff?text=No+Image+Available";

interface MovieCardProps {
  movie: Movie;
  showRemoveButton?: boolean;
  onListUpdate?: () => void;
}

export function MovieCard({ movie, showRemoveButton = false, onListUpdate }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInList, addToList, removeFromList } = useMovieList();
  const { watchHistory, addToWatchHistory } = useWatchHistory();

  const handleListUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth/login');
      return;
    }

    try {
      setIsUpdating(true);
      const isCurrentlyInList = isInList(movie.id);
      
      if (isCurrentlyInList) {
        await removeFromList(movie.id);
        toast.success('Removed from list');
      } else {
        await addToList(movie);
        toast.success('Added to list');
      }
      
      onListUpdate?.();
    } catch (error) {
      console.error('Error updating list:', error);
      toast.error('Failed to update list');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('user_lists')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movie.id);

      if (error) throw error;
      toast.success('Removed from your list');
      onListUpdate?.();
    } catch (error) {
      console.error('Error removing from list:', error);
      toast.error('Failed to remove from list');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCardClick = () => {
    window.scrollTo(0, 0);
    if (user) {
      addToWatchHistory({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path || '',
        media_type: (movie.media_type || 'movie') as 'movie' | 'tv'
      });
    }
    navigate(`/info/${movie.media_type}/${movie.id}`);
  };

  const isWatched = watchHistory.some(item => item.id === String(movie.id) || Number(item.id) === movie.id);
  const isInMyList = isInList(movie.id);

  const imageUrl = imgError || !movie.poster_path
    ? FALLBACK_IMAGE
    : `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

  return (
    <div
      className="relative min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] 
                 aspect-[2/3] sm:aspect-[2/3] cursor-pointer transition-all duration-300 
                 ease-in-out group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse rounded-sm" />
      )}

      <img
        src={imageUrl}
        alt={movie.title}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`rounded-md object-cover w-full h-full transition-all duration-300 
                   ${isHovered ? "scale-105 brightness-75" : ""}
                   ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      <div
        className={`absolute inset-0 flex flex-col justify-between p-2 sm:p-4 
                   transition-opacity duration-300 
                   ${isHovered ? "opacity-100" : "opacity-0 sm:opacity-0"}`}
      >
        <div className="flex items-center gap-2">
          {isWatched && (
            <div className="bg-white/20 px-2 py-1 rounded text-xs">
              Watched
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full 
                       bg-white/90 hover:bg-white transition group-hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <FaPlay className="h-3 w-3 sm:h-5 sm:w-5 text-black pl-0.5" />
            </button>
            {showRemoveButton ? (
              <button
                onClick={handleRemove}
                disabled={isUpdating}
                className="flex items-center justify-center w-10 h-10 rounded-full 
                         bg-red-600/60 hover:bg-red-600 transition group-hover:scale-110"
                title="Remove from list"
              >
                <XIcon className={`text-white w-5 h-5 ${isUpdating ? "opacity-50" : ""}`} />
              </button>
            ) : (
              <button
                onClick={handleListUpdate}
                disabled={isUpdating}
                className={`flex items-center justify-center w-10 h-10 rounded-full 
                         transition group-hover:scale-110
                         ${isInMyList ? "bg-[#2a2a2a]/60 hover:bg-[#2a2a2a]" 
                                : "bg-red-600/60 hover:bg-red-600"}`}
              >
                {isInMyList ? (
                  <FaCheck className={`text-white text-sm ${isUpdating ? "opacity-50" : ""}`} />
                ) : (
                  <FaPlus className={`text-white text-sm ${isUpdating ? "opacity-50" : ""}`} />
                )}
              </button>
            )}
          </div>
          <h3 className="text-sm sm:text-base text-white font-semibold drop-shadow-lg 
                       line-clamp-1 sm:line-clamp-2">
            {movie.title}
          </h3>
        </div>
      </div>
    </div>
  );
}
