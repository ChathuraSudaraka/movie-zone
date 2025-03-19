import React from "react";
import { FaCheck, FaPlay, FaPlus, FaSpinner, FaThumbsUp } from "react-icons/fa";
import { Clapperboard, Share2, Star } from "lucide-react";
import { Movie } from "../../types/movie";

interface InfoActionsProps {
  trailer: string | null;
  openModal: (url: string) => void;
  content: Movie;
  handleWatch: () => void;
  isInMyList: boolean;
  isUpdatingList?: boolean;
  handleMyList: () => void;
  handleLike: () => void;
  handleShareContent: () => void;
  setShowRatingModal: (show: boolean) => void;
}

const InfoActions: React.FC<InfoActionsProps> = ({
  trailer,
  openModal,
  content,
  handleWatch,
  isInMyList,
  isUpdatingList = false,
  handleMyList,
  handleLike,
  handleShareContent,
  setShowRatingModal,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      {/* Trailer Button */}
      {trailer && (
        <button
          onClick={() => openModal(`https://www.youtube.com/embed/${trailer}`)}
          className="flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto sm:px-8 sm:py-3 rounded-full sm:rounded bg-gray-500/30 hover:bg-gray-500/40 text-white transition duration-300 group"
        >
          <FaPlay className="text-xl sm:text-2xl group-hover:scale-110 transition duration-300" />
          <span className="hidden sm:inline ml-2 font-semibold text-lg">
            Watch Trailer
          </span>
        </button>
      )}

      {/* Watch Button */}
      <button
        onClick={handleWatch}
        className="flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto sm:px-8 sm:py-3 rounded-full sm:rounded bg-gray-500/30 hover:bg-gray-500/40 text-white transition duration-300 group"
      >
        <Clapperboard className="text-xl fill-white text-neutral-800 sm:text-2xl group-hover:scale-110 transition duration-300" />
        <span className="hidden sm:inline ml-2 font-semibold text-lg">
          Watch {content.media_type === "movie" ? "Movie" : "Show"}
        </span>
      </button>

      {/* Other Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Add/Remove from List Button - Optimized with visual feedback */}
        <button
          className={`flex items-center justify-center w-12 h-12 rounded-full 
            ${
              isUpdatingList
                ? "bg-gray-600/50"
                : "bg-gray-500/30 hover:bg-gray-500/40"
            } 
            transition duration-300 group`}
          title={isInMyList ? "Remove from My List" : "Add to My List"}
          onClick={handleMyList}
          disabled={isUpdatingList}
        >
          {isUpdatingList ? (
            <FaSpinner className="w-5 h-5 text-white animate-spin" />
          ) : isInMyList ? (
            <FaCheck className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <FaPlus className="text-white text-xl group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Like Button */}
        <button
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-500/30 hover:bg-gray-500/40 transition duration-300 group"
          title="Like this title"
          onClick={handleLike}
        >
          <FaThumbsUp className="text-white text-xl group-hover:scale-110 transition duration-300" />
        </button>

        {/* Share Button */}
        <button
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-500/30 hover:bg-gray-500/40 transition duration-300 group"
          title="Share"
          onClick={handleShareContent}
        >
          <Share2 className="text-white text-xl group-hover:scale-110 transition duration-300" />
        </button>

        {/* Rate Button */}
        <button
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-500/30 hover:bg-gray-500/40 transition duration-300 group"
          title="Rate this title"
          onClick={() => setShowRatingModal(true)}
        >
          <Star className="text-white text-xl group-hover:scale-110 transition duration-300" />
        </button>
      </div>
    </div>
  );
};

export default InfoActions;
