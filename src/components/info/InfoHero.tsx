import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaStar } from "react-icons/fa";
import { Movie } from "../../types/movie";
import toast from "react-hot-toast";
import { NavigateFunction } from "react-router-dom";
import { addToList, removeFromList } from "../../utils/localList";
import InfoActions from "./InfoActions";

interface InfoHeroProps {
  content: Movie;
  trailer: string | null;
  openModal: (url: string) => void;
  handleWatch: () => void;
  handlePlayClick?: (source?: string) => void;
  isInMyList: boolean;
  setShowRatingModal: (show: boolean) => void;
  user: null;
  navigate: NavigateFunction;
  type: string | undefined;
}

export const InfoHero: React.FC<InfoHeroProps> = ({
  content,
  trailer,
  openModal,
  handleWatch,
  handlePlayClick,
  isInMyList,
  setShowRatingModal,
  type,
}) => {
  // Add local state for optimistic UI updates
  const [isUpdatingList, setIsUpdatingList] = useState(false);
  const [optimisticInList, setOptimisticInList] = useState(isInMyList);
  const [imgLoaded, setImgLoaded] = useState(false); // Track image loading
  // Update local state when prop changes
  useEffect(() => {
    setOptimisticInList(isInMyList);
  }, [isInMyList]);

  const handleMyList = async () => {
    if (!content) return;

    if (isUpdatingList) return;

    setIsUpdatingList(true);
    const wasInList = optimisticInList;
    setOptimisticInList(!wasInList);

    toast.success(!wasInList ? "Added to your list" : "Removed from your list");

    try {
      if (wasInList) {
        removeFromList(content.id);
      } else {
        addToList({
          ...content,
          media_type: content.media_type || type,
        } as Movie);
      }
    } catch (error) {
      console.error("Error updating list:", error);
      setOptimisticInList(wasInList);
      toast.error("Failed to update list");
    } finally {
      setIsUpdatingList(false);
    }
  };

  const handleLike = async () => {
    try {
      toast.success("Added to your likes");
    } catch (error) {
      console.error("Error liking content:", error);
      toast.error("Failed to like content");
    }
  };

  const handleShareContent = async () => {
    if (!content) return;

    try {
      const shareUrl = `${window.location.origin}/info/${content.media_type}/${content.id}`;

      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: content.title,
          text: `Check out ${content.title} on MovieZone!`,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing content:", error);
      // Only show error for clipboard operations, not for share dialog dismissals
      if (!navigator.share) {
        toast.error("Failed to copy link");
      }
    }
  };

  return (
    <div className="relative z-20 min-h-[88vh] lg:min-h-[92vh] w-full flex items-end pt-28 pb-10 md:pb-14">
      {/* Background Image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={`https://image.tmdb.org/t/p/original${content.backdrop_path}`}
          alt={content.title}
          className={`h-full w-full object-cover will-change-transform ${
            imgLoaded ? "animate-ken-burns" : ""
          }`}
          style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.6s ease" }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
        )}
        {/* Deep layered obsidian scrims for high contrast & serene focus */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/65 to-ink-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-black/35" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full px-4 md:px-8 lg:px-16"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end gap-6 lg:gap-10">
          {/* Layered Poster Card (Desktop/Tablet) */}
          {content.poster_path && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
              className="hidden md:block shrink-0 w-44 lg:w-52 aspect-[2/3] rounded-[22px] overflow-hidden ring-1 ring-white/20 shadow-[0_24px_60px_-14px_rgba(0,0,0,0.9)] bg-neutral-900"
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${content.poster_path}`}
                alt={content.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}

          {/* Hero Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 drop-shadow-[0_6px_28px_rgba(0,0,0,0.65)] tracking-tight leading-[1.06]">
              {content.title}
            </h1>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2 md:gap-2.5 text-white/95 mb-5 text-xs xs:text-sm md:text-[14px]">
              {content.vote_average > 0 && (
                <span className="liquid-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold text-white">
                  <FaStar className="text-[11px] text-amber-400" />
                  {content.vote_average.toFixed(1)}
                  <span className="text-white/50 font-normal">
                    ({Math.round(content.vote_average * 10)}%)
                  </span>
                </span>
              )}
              {content.release_date && (
                <span className="liquid-glass rounded-full px-3 py-1 font-medium text-neutral-200">
                  {new Date(content.release_date).getFullYear()}
                </span>
              )}
              <span className="liquid-glass rounded-full px-3 py-1 font-medium text-neutral-200 whitespace-nowrap">
                4K HDR
              </span>
              <span className="liquid-glass rounded-full px-3 py-1 font-medium text-neutral-200 whitespace-nowrap">
                {content.media_type === "movie" ? "Movie" : "TV Series"}
              </span>
              {content.runtime && content.runtime > 0 ? (
                <span className="liquid-glass rounded-full px-3 py-1 font-medium text-neutral-200 whitespace-nowrap">
                  {Math.floor(content.runtime / 60)}h {content.runtime % 60}m
                </span>
              ) : content.media_type === "tv" && content.number_of_seasons ? (
                <span className="liquid-glass rounded-full px-3 py-1 font-medium text-neutral-200 whitespace-nowrap">
                  {content.number_of_seasons}{" "}
                  {content.number_of_seasons === 1 ? "Season" : "Seasons"}
                  {content.number_of_episodes
                    ? ` · ${content.number_of_episodes} Eps`
                    : ""}
                </span>
              ) : null}
            </div>

            {/* Overview */}
            <p className="text-neutral-200/90 text-sm xs:text-base md:text-lg max-w-2xl mb-6 leading-relaxed line-clamp-3 xs:line-clamp-4">
              {content.overview}
            </p>

            {/* Action Buttons */}
            <InfoActions
              trailer={trailer}
              openModal={openModal}
              content={content}
              handleWatch={handleWatch}
              handlePlayClick={handlePlayClick}
              isInMyList={optimisticInList}
              isUpdatingList={isUpdatingList}
              handleMyList={handleMyList}
              handleLike={handleLike}
              handleShareContent={handleShareContent}
              setShowRatingModal={setShowRatingModal}
            />

            {/* Credits & Genres */}
            <div className="hidden xs:grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8 border-t border-white/10 pt-4 text-xs md:text-sm">
              {content.credits?.cast && content.credits.cast.length > 0 && (
                <div className="line-clamp-1">
                  <span className="text-white/45">Starring </span>
                  <span className="font-medium text-neutral-200">
                    {content.credits.cast
                      .slice(0, 3)
                      .map((c) => c.name)
                      .join(" · ")}
                  </span>
                </div>
              )}
              {content.genres && content.genres.length > 0 && (
                <div className="line-clamp-1">
                  <span className="text-white/45">Genres </span>
                  <span className="font-medium text-neutral-200">
                    {content.genres.map((g: { id: number; name: string }) => g.name).join(" · ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
