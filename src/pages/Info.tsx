import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Movie } from "../types/movie";
import { useVideoModal } from "../context/VideoModalContext";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabase";
import { InfoHero } from "../components/info/InfoHero";
import { InfoDetails } from "../components/info/InfoDetails";
import { LoadingSkeleton } from "../components/info/skeleton";
import { RatingModal } from "../components/RatingModal";
import { CastSection } from "../components/info/CastSection";
import { DownloadSection } from "../components/info/DownloadSection";
import toast from "react-hot-toast";

function Info() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { openModal } = useVideoModal();
  const { addToWatchHistory } = useWatchHistory();
  const { user } = useAuth();
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

  // ...existing code...  // Helper Methods
  const getVideoEmbedUrl = (source = "primary") => {
    if (!content?.id) return "";

    const sources = {
      // Primary: vidsrc.to (requires IMDB ID)
      primary: content.imdb_id
        ? content.media_type === "movie"
          ? `https://vidsrc.to/embed/movie/${content.imdb_id}`
          : `https://vidsrc.to/embed/tv/${content.imdb_id}`
        : content.media_type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${content.id}`
        : `https://vidsrc.cc/v2/embed/tv/${content.id}`,

      // Secondary: vidsrc.cc (uses TMDB ID)
      secondary:
        content.media_type === "movie"
          ? `https://vidsrc.cc/v2/embed/movie/${content.id}`
          : `https://vidsrc.cc/v2/embed/tv/${content.id}`,

      // Tertiary: embedsu.org
      tertiary:
        content.media_type === "movie"
          ? `https://embedsu.org/embed/movie/${content.id}`
          : `https://embedsu.org/embed/tv/${content.id}`, // Quaternary: movielair.cc
      quaternary:
        content.media_type === "movie"
          ? `https://movielair.cc/watch-movie/${content.id}`
          : `https://movielair.cc/watch-tv/${content.id}?season=1&episode=1`, // Fifth: vidlink.pro
      fifth:
        content.media_type === "movie"
          ? `https://vidlink.pro/movie/${content.id}`
          : `https://vidlink.pro/tv/${content.id}/1/1`, // Default to season 1, episode 1 for TV series

      // Fallback: smashystream
      fallback:
        content.media_type === "movie"
          ? `https://player.smashy.stream/movie/${content.id}`
          : `https://player.smashy.stream/tv/${content.id}`,
    };

    return sources[source as keyof typeof sources] || sources.primary;
  }; // Updated handlePlayClick to try multiple sources automatically
  const handlePlayClick = async (sourceType = "primary") => {
    if (!content) return;

    const sourceOrder = [
      "primary",
      "secondary",
      "tertiary",
      "quaternary",
      "fifth",
      "fallback",
    ];
    const startIndex = sourceOrder.indexOf(sourceType);
    const orderedSources = [
      ...sourceOrder.slice(startIndex),
      ...sourceOrder.slice(0, startIndex),
    ];

    // Show loading toast
    const loadingToast = toast.loading(
      `Finding best source for ${content.title}...`
    );

    // Try to find a working source
    for (const source of orderedSources) {
      const embedUrl = getVideoEmbedUrl(source);
      if (embedUrl) {
        try {
          // Test if the URL is accessible (basic check)
          openModal(embedUrl);
          toast.success(`Playing ${content.title}`, { id: loadingToast });
          console.log(`Using ${source} source: ${embedUrl}`);
          return;
        } catch (error) {
          console.warn(`${source} source failed, trying next...`);
          continue;
        }
      }
    }

    // If all sources fail, show user-friendly message
    toast.error(
      `${content.title} is currently unavailable from all streaming sources. Please try again later.`,
      { id: loadingToast }
    );
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

  // Generate dynamic meta tags for social sharing
  const pageUrl = `https://movie-zone.pages.dev/info/${type}/${id}`;
  const shareTitle = `${content.title || content.name} ${type === 'tv' ? '(TV Series)' : '(Movie)'} - MovieZone`;
  const shareDescription = content.overview 
    ? content.overview.length > 160 
      ? content.overview.substring(0, 157) + '...'
      : content.overview
    : `Watch ${content.title || content.name} on MovieZone - Your ultimate destination for movies and TV shows.`;
  
  // Use backdrop image (banner) for social sharing, fallback to poster
  const shareImage = content.backdrop_path 
    ? `https://image.tmdb.org/t/p/w1280${content.backdrop_path}`
    : content.poster_path 
    ? `https://image.tmdb.org/t/p/w780${content.poster_path}`
    : 'https://movie-zone.pages.dev/icon.png';

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="video.movie" />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="720" />
        <meta property="og:site_name" content="MovieZone" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@MovieZone" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={shareImage} />
        
        {/* Additional Meta Tags */}
        <meta property="og:locale" content="en_US" />
        {content.release_date && (
          <meta property="video:release_date" content={content.release_date} />
        )}
        {content.vote_average && (
          <meta property="video:rating" content={content.vote_average.toString()} />
        )}
        {content.genres && content.genres.length > 0 && (
          <meta property="video:tag" content={content.genres.map(g => g.name).join(', ')} />
        )}
      </Helmet>
      
      <div className="relative min-h-screen bg-[#141414]">
      {" "}
      {/* Hero Section */}
      <InfoHero
        content={content}
        trailer={trailer}
        openModal={openModal}
        handleWatch={handleWatch}
        handlePlayClick={handlePlayClick}
        isInMyList={isInMyList}
        setShowRatingModal={setShowRatingModal}
        user={user}
        navigate={navigate}
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
    </>
  );
}

export default Info;
