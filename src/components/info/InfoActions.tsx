import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="flex flex-wrap items-center gap-2.5 md:gap-3 mb-6">
      {/* Unified Watch Split Pill */}
      <div className="relative" ref={dropdownRef}>
        <div className="btn-primary shine inline-flex h-11 items-center p-0 gap-0">
          <span className="shine-bar" />
          <button
            onClick={handleWatch}
            className="flex h-full items-center gap-2 pl-5 pr-4 sm:pl-6 sm:pr-4 text-neutral-950 font-semibold transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/35 rounded-l-full"
          >
            <Clapperboard className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <span className="text-sm sm:text-base">
              Watch {content.media_type === "movie" ? "Movie" : "Show"}
            </span>
          </button>
          <span className="h-5 w-px bg-black/15" />
          <button
            onClick={() => setShowSourceDropdown(!showSourceDropdown)}
            className="flex h-full items-center justify-center pl-3 pr-4 transition-opacity hover:opacity-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/35 rounded-r-full"
            aria-label="Select video source"
          >
            <FaChevronDown
              className={`text-xs transition-transform duration-300 ease-spring ${
                showSourceDropdown ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Source Dropdown */}
        <AnimatePresence>
          {showSourceDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -4 }}
              transition={{ type: "spring", stiffness: 460, damping: 32 }}
              style={{ transformOrigin: "top left" }}
              className="liquid-glass liquid-glass-strong absolute top-full left-0 mt-2.5 w-64 rounded-[24px] z-50 overflow-hidden will-change-transform"
            >
              <div className="p-2">
                <div className="text-[11px] text-white/45 px-3 py-2 font-semibold uppercase tracking-wider">
                  Select Video Source
                </div>
                {videoSources.map((source) => (
                  <button
                    key={source.key}
                    onClick={() => handleSourceSelect(source.key)}
                    className="w-full text-left px-3 py-2.5 rounded-[16px] hover:bg-white/10 transition-colors"
                  >
                    <div className="text-white text-sm font-medium">
                      {source.name}
                    </div>
                    <div className="text-white/50 text-xs">
                      {source.description}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trailer Button */}
      {trailer && (
        <button
          onClick={() => openModal(`https://www.youtube.com/embed/${trailer}`)}
          className="btn-glass liquid-refract shine group h-11 px-4 sm:px-6"
        >
          <span className="shine-bar" />
          <FaPlay className="text-xs sm:text-sm group-hover:scale-110 transition-transform duration-300" />
          <span className="hidden sm:inline font-semibold text-sm sm:text-base">
            Trailer
          </span>
        </button>
      )}
      {/* Other Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Add/Remove from List Button */}
        <button
          className={`liquid-glass liquid-refract-orb flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full 
            ${isUpdatingList ? "opacity-60" : ""} 
            transition-transform duration-300 ease-spring hover:scale-105 active:scale-90 group`}
          title={isInMyList ? "Remove from My List" : "Add to My List"}
          onClick={handleMyList}
          disabled={isUpdatingList}
        >
          {isUpdatingList ? (
            <FaSpinner className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
          ) : isInMyList ? (
            <FaCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <FaPlus className="text-sm sm:text-lg text-white group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Like Button */}
        <button
          className="liquid-glass liquid-refract-orb flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-transform duration-300 ease-spring hover:scale-105 active:scale-90 group"
          title="Like this title"
          onClick={handleLike}
        >
          <FaThumbsUp className="text-white text-sm sm:text-lg group-hover:scale-110 transition-transform duration-300" />
        </button>

        {/* Share Button */}
        <button
          className="liquid-glass liquid-refract-orb flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-transform duration-300 ease-spring hover:scale-105 active:scale-90 group"
          title="Share"
          onClick={handleShareContent}
        >
          <Share2 className="text-white w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
        </button>

        {/* Rate Button */}
        <button
          className="liquid-glass liquid-refract-orb flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-transform duration-300 ease-spring hover:scale-105 active:scale-90 group"
          title="Rate this title"
          onClick={() => setShowRatingModal(true)}
        >
          <Star className="text-white w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};

export default InfoActions;
