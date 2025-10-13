import React from "react";
import {
  FaCheck,
  FaPlay,
  FaPlus,
  FaSpinner,
  FaThumbsUp,
  FaChevronDown,
} from "react-icons/fa";
import { Clapperboard, Share2, Star } from "lucide-react";
import { Movie } from "../../types/movie";
import { useState, useRef, useEffect } from "react";

interface InfoActionsProps {
  trailer: string | null;
  openModal: (url: string) => void;
  content: Movie;
  handleWatch: () => void;
  handlePlayClick?: (source?: string) => void;
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
  handlePlayClick,
  isInMyList,
  isUpdatingList = false,
  handleMyList,
  handleLike,
  handleShareContent,
  setShowRatingModal,
}) => {
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const videoSources = [
    {
      key: "primary",
      name: "VidSrc.to (Primary)",
      description: "Best quality",
    },
    { key: "secondary", name: "VidSrc.cc", description: "Alternative source" },
    { key: "tertiary", name: "EmbedSu", description: "Backup source" },
    { key: "quaternary", name: "MovieLair", description: "Movie streaming" },
    { key: "fifth", name: "VidLink.pro", description: "Additional source" },
    { key: "fallback", name: "SmashyStream", description: "Fallback source" },
  ];

  const handleSourceSelect = (sourceKey: string) => {
    if (handlePlayClick) {
      handlePlayClick(sourceKey);
    } else {
      handleWatch();
    }
    setShowSourceDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSourceDropdown(false);
      }
    };

    if (showSourceDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSourceDropdown]);
  return (
    <div className="flex flex-wrap items-center gap-2 xs:gap-2.5 md:gap-3 mb-4 xs:mb-6 md:mb-8">
      {/* Trailer Button */}
      {trailer && (
        <button
          onClick={() => openModal(`https://www.youtube.com/embed/${trailer}`)}
          className="flex items-center justify-center w-9 h-9 xs:w-10 xs:h-10 sm:w-auto sm:h-auto sm:px-8 sm:py-3 rounded-full sm:rounded bg-gray-500/30 hover:bg-gray-500/40 text-white transition duration-300 group"
        >
          <FaPlay className="text-sm xs:text-base sm:text-2xl group-hover:scale-110 transition duration-300" />
          <span className="hidden sm:inline ml-2 font-semibold text-lg">
            Watch Trailer
          </span>
        </button>
      )}{" "}
      {/* Watch Button with Source Selection */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex">
          <button
            onClick={handleWatch}
            className="flex items-center justify-center h-9 xs:h-10 sm:h-auto px-4 xs:px-5 sm:px-8 py-2 xs:py-2.5 sm:py-3 rounded-l bg-gray-500/30 hover:bg-gray-500/40 text-white transition duration-300 group"
          >
            <Clapperboard className="text-sm xs:text-base sm:text-2xl fill-white text-neutral-800 group-hover:scale-110 transition duration-300" />
            <span className="hidden sm:inline ml-2 font-semibold text-lg">
              Watch {content.media_type === "movie" ? "Movie" : "Show"}
            </span>
          </button>
          <button
            onClick={() => setShowSourceDropdown(!showSourceDropdown)}
            className="flex items-center justify-center w-9 h-9 xs:w-10 xs:h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-3 rounded-r bg-gray-500/30 hover:bg-gray-500/40 text-white transition duration-300 border-l border-gray-400/30"
          >
            <FaChevronDown
              className={`text-[10px] xs:text-xs sm:text-sm transition-transform duration-200 ${
                showSourceDropdown ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Source Dropdown */}
        {showSourceDropdown && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl z-50">
            <div className="p-2">
              <div className="text-xs text-gray-400 px-3 py-2 font-semibold uppercase tracking-wide">
                Select Video Source
              </div>
              {videoSources.map((source) => (
                <button
                  key={source.key}
                  onClick={() => handleSourceSelect(source.key)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="text-white text-sm font-medium group-hover:text-red-400">
                    {source.name}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {source.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Other Action Buttons */}
      <div className="flex items-center gap-1.5 xs:gap-2">
        {/* Add/Remove from List Button - Optimized with visual feedback */}
        <button
          className={`flex items-center justify-center w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 rounded-full 
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
            <FaSpinner className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white animate-spin" />
          ) : isInMyList ? (
            <FaCheck className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <FaPlus className="text-sm xs:text-base sm:text-xl text-white group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Like Button */}
        <button
          className="flex items-center justify-center w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 rounded-full bg-gray-500/30 hover:bg-gray-500/40 transition duration-300 group"
          title="Like this title"
          onClick={handleLike}
        >
          <FaThumbsUp className="text-white text-sm xs:text-base sm:text-xl group-hover:scale-110 transition duration-300" />
        </button>

        {/* Share Button */}
        <button
          className="flex items-center justify-center w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 rounded-full bg-gray-500/30 hover:bg-gray-500/40 transition duration-300 group"
          title="Share"
          onClick={handleShareContent}
        >
          <Share2 className="text-white w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition duration-300" />
        </button>

        {/* Rate Button */}
        <button
          className="flex items-center justify-center w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 rounded-full bg-gray-500/30 hover:bg-gray-500/40 transition duration-300 group"
          title="Rate this title"
          onClick={() => setShowRatingModal(true)}
        >
          <Star className="text-white w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition duration-300" />
        </button>
      </div>
    </div>
  );
};

export default InfoActions;
