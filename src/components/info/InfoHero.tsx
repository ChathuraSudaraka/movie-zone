import React, { useState } from "react";
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
  React.useEffect(() => {
    setOptimisticInList(isInMyList);
  }, [isInMyList]);

  const handleMyList = async () => {
    if (!content || !user) {
      navigate('/auth/login');
      return;
    }

    // Prevent multiple rapid clicks
    if (isUpdatingList) return;
    
    // Optimistic update
    setIsUpdatingList(true);
    const wasInList = optimisticInList;
    setOptimisticInList(!wasInList);
    
    // Show immediate feedback
    toast.success(!wasInList ? 'Added to your list' : 'Removed from your list');

    try {
      if (wasInList) {
        // Remove from list
        const { error: deleteError } = await supabase
          .from('user_lists')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', content.id);

        if (deleteError) throw deleteError;
      } else {
        // Add to list
        const { error: insertError } = await supabase
          .from('user_lists')
          .insert({
            user_id: user.id,
            movie_id: content.id,
            title: content.title,
            poster_path: content.poster_path,
            media_type: content.media_type || type
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating list:', error);
      // Revert optimistic update on error
      setOptimisticInList(wasInList);
      toast.error('Failed to update list');
    } finally {
      setIsUpdatingList(false);
    }
  };

  const handleLike = async () => {
    if (!content || !user) {
      navigate('/auth/login');
      return;
    }
    
    try {
      toast.success('Added to your likes');
    } catch (error) {
      console.error('Error liking content:', error);
      toast.error('Failed to like content');
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
          url: shareUrl
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing content:', error);
      // Only show error for clipboard operations, not for share dialog dismissals
      if (!navigator.share) {
        toast.error('Failed to copy link');
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
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.5s' }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-16 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Logo or Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg tracking-tight">
            {content.title}
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-white/90 mb-6 text-sm md:text-base">
            <span className="text-green-500 font-semibold text-lg">
              {Math.round(content.vote_average * 10)}% Match
            </span>
            <span className="font-medium">
              {new Date(content.release_date).getFullYear()}
            </span>
            <span className="px-2 py-0.5 border border-white/40 rounded text-sm font-medium">
              HD
            </span>
            <span className="px-2 py-0.5 border border-white/40 rounded text-sm font-medium">
              {content.media_type === "movie" ? "Movie" : "TV Series"}
            </span>
            {content.runtime && (
              <span className="font-medium">
                {Math.floor(content.runtime / 60)}h {content.runtime % 60}m
              </span>
            )}
          </div>

          {/* Overview */}
          <p className="text-white/90 text-lg max-w-3xl mb-8 leading-relaxed line-clamp-2 md:line-clamp-5">
            {content.overview}
          </p>

          {/* Action Buttons */}
          <InfoActions
            trailer={trailer}
            openModal={openModal}
            content={content}
            handleWatch={handleWatch}
            isInMyList={optimisticInList}
            isUpdatingList={isUpdatingList}
            handleMyList={handleMyList}
            handleLike={handleLike}
            handleShareContent={handleShareContent}
            setShowRatingModal={setShowRatingModal}
          />

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white/90">
            {/* Cast */}
            {content.credits?.cast && content.credits.cast.length > 0 && (
              <div>
                <span className="text-white/60 text-sm">Starring: </span>
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
              <div>
                <span className="text-white/60 text-sm">Genres: </span>
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
