import React, { useState, useEffect } from "react";
import { Movie } from "../../types/movie";
import { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { NavigateFunction } from "react-router-dom";
import { supabase } from "../../config/supabase";
import InfoActions from "./InfoActions";

interface InfoHeroProps {
  content: Movie;
  trailer: string | null;
  openModal: (url: string) => void;
  handleWatch: () => void;
  handlePlayClick?: (source?: string) => void;
  isInMyList: boolean;
  setShowRatingModal: (show: boolean) => void;
  user: User | null;
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
  user,
  navigate,
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
    if (!content || !user) {
      navigate("/auth/login");
      return;
    }

    // Prevent multiple rapid clicks
    if (isUpdatingList) return;

    // Optimistic update
    setIsUpdatingList(true);
    const wasInList = optimisticInList;
    setOptimisticInList(!wasInList);

    // Show immediate feedback
    toast.success(!wasInList ? "Added to your list" : "Removed from your list");

    try {
      if (wasInList) {
        // Remove from list
        const { error: deleteError } = await supabase
          .from("user_lists")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", content.id);

        if (deleteError) throw deleteError;
      } else {
        // Add to list
        const { error: insertError } = await supabase
          .from("user_lists")
          .insert({
            user_id: user.id,
            movie_id: content.id,
            title: content.title,
            poster_path: content.poster_path,
            media_type: content.media_type || type,
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error updating list:", error);
      // Revert optimistic update on error
      setOptimisticInList(wasInList);
      toast.error("Failed to update list");
    } finally {
      setIsUpdatingList(false);
    }
  };

  const handleLike = async () => {
    if (!content || !user) {
      navigate("/auth/login");
      return;
    }

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
    <div className="relative h-[90vh] w-full">
      {/* Background Image */}
      <div className="absolute top-0 left-0 h-full w-full">
        <img
          src={`https://image.tmdb.org/t/p/original${content.backdrop_path}`}
          alt={content.title}
          className="h-full w-full object-cover"
          style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.5s" }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
      </div>{" "}
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-6 xs:px-4 xs:pb-8 md:pb-16 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Logo or Title */}
          <h1 className="text-3xl xs:text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 xs:mb-3 md:mb-6 drop-shadow-lg tracking-tight leading-tight">
            {content.title}
          </h1>
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 xs:gap-2 md:gap-4 text-white/90 mb-4 xs:mb-6 md:mb-6 text-xs xs:text-sm md:text-base">
            <span className="text-green-500 font-semibold text-sm xs:text-base md:text-lg">
              {Math.round(content.vote_average * 10)}% Match
            </span>
            <span className="font-medium">
              {new Date(content.release_date).getFullYear()}
            </span>
            <span className="px-1.5 xs:px-2 py-0.5 border border-white/40 rounded text-xs xs:text-sm md:text-sm font-medium whitespace-nowrap">
              HD
            </span>
            <span className="px-1.5 xs:px-2 py-0.5 border border-white/40 rounded text-xs xs:text-sm md:text-sm font-medium whitespace-nowrap">
              {content.media_type === "movie" ? "Movie" : "TV Series"}
            </span>
            {content.runtime && (
              <span className="font-medium whitespace-nowrap">
                {Math.floor(content.runtime / 60)}h {content.runtime % 60}m
              </span>
            )}
          </div>{" "}
          {/* Overview */}
          <p className="text-white/90 text-sm xs:text-base md:text-xl lg:text-2xl max-w-3xl mb-3 xs:mb-4 md:mb-8 leading-relaxed line-clamp-3 xs:line-clamp-4 md:line-clamp-5">
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
          {/* Additional Info - Hidden on very small screens to save space */}
          <div className="hidden xs:grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 text-white/90 text-[10px] xs:text-xs md:text-sm">
            {/* Cast */}
            {content.credits?.cast && content.credits.cast.length > 0 && (
              <div className="line-clamp-1">
                <span className="text-white/60">Starring: </span>
                <span className="font-medium">
                  {content.credits.cast
                    .slice(0, 3)
                    .map((c) => c.name)
                    .join(", ")}
                </span>
              </div>
            )}
            {/* Genres */}
            {content.genres && content.genres.length > 0 && (
              <div className="line-clamp-1">
                <span className="text-white/60">Genres: </span>
                <span className="font-medium">
                  {content.genres.map((g: any) => g.name).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
