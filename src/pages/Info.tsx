import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Movie } from "../types/movie";
import { useVideoModal } from "../context/VideoModalContext";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { useAuth } from "../context/AuthContext";
import { useActivity } from "../hooks/useActivity";
import { supabase } from "../config/supabase";
import { InfoHero } from "../components/info/InfoHero";
import { InfoDetails } from "../components/info/InfoDetails";
import { LoadingSkeleton } from "../components/info/skeleton";
import { RatingModal } from "../components/RatingModal";
import { CastSection } from "../components/info/CastSection";
import { DownloadSection } from "../components/info/DownloadSection";

function Info() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { openModal } = useVideoModal();
  const { addToWatchHistory } = useWatchHistory();
  const { user } = useAuth();
  const { trackActivity } = useActivity();

  const [content, setContent] = useState<Movie | null>(null);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(5);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedQuality, setSelectedQuality] = useState<string>("All");
  const [isInMyList, setIsInMyList] = useState<boolean>(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Fetch content details
  useEffect(() => {
    const fetchContent = async () => {
      if (!id || !type) {
        navigate("/");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/${type}/${id}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&append_to_response=videos,credits,external_ids`
        );

        if (!response.ok) {
          throw new Error("Content not found");
        }

        const data = await response.json();

        // Transform the data to match the Movie type
        setContent({
          ...data,
          title: type === "tv" ? data.name : data.title,
          media_type: type,
          release_date: type === "tv" ? data.first_air_date : data.release_date,
          imdb_id: data.external_ids?.imdb_id || null,
        });

        // Set trailer
        const trailer = data.videos?.results?.find(
          (video: any) =>
            video.type === "Trailer" &&
            (video.site === "YouTube" || video.site === "Vimeo")
        );
        setTrailer(trailer ? trailer.key : null);
      } catch (error) {
        console.error("Error fetching content:", error);
        setError("Failed to load content");
        setTimeout(() => navigate("/"), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, type, navigate]);

  // Check if title is in local storage watchlist
  useEffect(() => {
    if (content) {
      const savedList = localStorage.getItem("netflix-mylist");
      if (savedList) {
        const list = JSON.parse(savedList);
        setIsInMyList(list.some((item: Movie) => item.id === content.id));
      }
    }
  }, [content]);

  // Check if title is in database watchlist
  const checkIfInList = async () => {
    if (!content || !user) return;

    try {
      const { data, error } = await supabase
        .from("user_lists")
        .select("id")
        .eq("user_id", user.id)
        .eq("movie_id", content.id)
        .maybeSingle();

      if (error) throw error;
      setIsInMyList(!!data);
    } catch (error) {
      console.error("Error checking list status:", error);
    }
  };

  // Update check when user or content changes
  useEffect(() => {
    checkIfInList();
  }, [content, user]);

  // Track view action when content loads
  useEffect(() => {
    if (content && user && !loading) {
      trackActivity({
        type: "view",
        title: content.title,
        media_id: content.id.toString(),
        media_type: content.media_type || (type as string),
      });
    }
  }, [content, user, loading]);

  // Helper Methods
  const getVideoEmbedUrl = () => {
    if (!content?.imdb_id) return "";
    if (content.media_type === "movie") {
      return `https://vidsrc.to/embed/movie/${content.imdb_id}`;
    } else {
      return `https://vidsrc.to/embed/tv/${content.imdb_id}`;
    }
  };

  const handlePlayClick = () => {
    const embedUrl = getVideoEmbedUrl();
    if (embedUrl) {
      openModal(embedUrl);
    }
  };

  const handleWatch = async () => {
    if (!content || !type) return;

    // Start playing video immediately
    handlePlayClick();

    // Ensure we have valid data for watch history
    const mediaData = {
      id: content.id,
      title:
        content.media_type === "tv"
          ? content.name || content.title || "Unknown Show"
          : content.title || "Unknown Movie",
      poster_path: content.poster_path || "",
      media_type: (content.media_type || type) as "movie" | "tv",
    };

    // Track activity and add to watch history
    trackActivity({
      type: "watch",
      title: mediaData.title,
      media_id: content.id.toString(),
      media_type: mediaData.media_type,
      metadata: {
        poster_path: content.poster_path || undefined,
      }
    }).catch((error) => {
      console.error("Failed to track watch activity:", error);
    });

    // Add to watch history in the background (legacy)
    addToWatchHistory(mediaData).catch((error) => {
      console.error("Failed to update watch history:", error);
    });
  };

  // UI Render Logic
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error}</h1>
          <p>Redirecting to home...</p>
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="relative min-h-screen bg-[#141414]">
      {/* Hero Section */}
      <InfoHero
        content={content}
        trailer={trailer}
        openModal={openModal}
        handleWatch={handleWatch}
        isInMyList={isInMyList}
        setShowRatingModal={setShowRatingModal}
        user={user}
        navigate={navigate}
        trackActivity={trackActivity}
        type={type}
      />

      {/* Details Section */}
      <div className="px-4 py-12 md:px-8 lg:px-16 bg-[#141414]">
        <div className="max-w-6xl mx-auto">
          {/* Download Section */}
          <DownloadSection
            type={type}
            content={content}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
            selectedQuality={selectedQuality}
            setSelectedQuality={setSelectedQuality}
          />

          {/* Cast Section */}
          {content.credits?.cast && content.credits.cast.length > 0 && (
            <CastSection cast={content.credits.cast} />
          )}

          {/* Additional Info */}
          <InfoDetails content={content} />
        </div>
      </div>

      {/* Rating Modal */}
      {content && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          mediaTitle={content.title}
          mediaId={content.id.toString()}
          mediaType={content.media_type || (type as string)}
        />
      )}
    </div>
  );
}

export default Info;
