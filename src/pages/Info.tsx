import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Movie } from "../types/movie";
import { useVideoModal } from "../context/VideoModalContext";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { InfoHero } from "../components/info/InfoHero";
import { InfoDetails } from "../components/info/InfoDetails";
import { LoadingSkeleton } from "../components/info/skeleton";
import { RatingModal } from "../components/RatingModal";
import { CastSection } from "../components/info/CastSection";
import { DownloadSection } from "../components/info/DownloadSection";
import { isInList, subscribeToList } from "../utils/localList";

const INFO_CACHE_MAX = 30;

const infoContentCache = new Map<
  string,
  { content: Movie; trailer: string | null }
>();

function setInfoContentCache(
  key: string,
  value: { content: Movie; trailer: string | null }
) {
  if (infoContentCache.has(key)) {
    infoContentCache.delete(key);
  } else if (infoContentCache.size >= INFO_CACHE_MAX) {
    const oldestKey = infoContentCache.keys().next().value;
    if (oldestKey !== undefined) {
      infoContentCache.delete(oldestKey);
    }
  }
  infoContentCache.set(key, value);
}

function Info() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openModal } = useVideoModal();
  const { addToWatchHistory } = useWatchHistory();
  const cacheKey = type && id ? `${type}:${id}` : "";
  const cachedEntry = cacheKey ? infoContentCache.get(cacheKey) : undefined;

  const [content, setContent] = useState<Movie | null>(
    cachedEntry?.content ?? null
  );
  const [trailer, setTrailer] = useState<string | null>(
    cachedEntry?.trailer ?? null
  );
  const [loading, setLoading] = useState(!cachedEntry);
  const [error, setError] = useState<string | null>(null);
  const [itemsPerPage] = useState<number>(5);
  const [selectedQuality, setSelectedQuality] = useState<string>("All");
  const [isInMyList, setIsInMyList] = useState<boolean>(() =>
    cachedEntry ? isInList(cachedEntry.content.id) : false
  );
  const [showRatingModal, setShowRatingModal] = useState(false);

  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1
  );
  const selectedSeason = Math.max(
    1,
    parseInt(searchParams.get("season") || "1", 10) || 1
  );

  const setCurrentPage = useCallback(
    (page: number) => {
      const safePage = Math.max(1, page);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("page", String(safePage));
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  const setSelectedSeason = useCallback(
    (season: number) => {
      const safeSeason = Math.max(1, season);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("season", String(safeSeason));
          next.set("page", "1");
          return next;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  const validatedOgImage = useMemo(() => {
    if (!content) return "https://movie-zone.pages.dev/movie-zone.png";
    if (content.backdrop_path) {
      return `https://image.tmdb.org/t/p/w1280${content.backdrop_path}`;
    }
    if (content.poster_path) {
      return `https://image.tmdb.org/t/p/w780${content.poster_path}`;
    }
    return "https://movie-zone.pages.dev/movie-zone.png";
  }, [content]);

  // Fetch content details
  useEffect(() => {
    const controller = new AbortController();
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const fetchContent = async () => {
      if (!id || !type) {
        navigate("/");
        return;
      }

      const key = `${type}:${id}`;
      const existing = infoContentCache.get(key);
      if (existing) {
        setContent(existing.content);
        setTrailer(existing.trailer);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/${type}/${id}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&append_to_response=videos,credits,external_ids,images`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Content not found");
        }

        const data = await response.json();
        if (controller.signal.aborted) return;

        // Find the best available backdrop image in O(N) without mutating
        let bestBackdrop = data.backdrop_path;

        // If no main backdrop, try to get from additional images
        if (!bestBackdrop && data.images?.backdrops?.length > 0) {
          let topBackdrop: { file_path?: string; vote_average?: number } =
            data.images.backdrops[0];
          for (let i = 1; i < data.images.backdrops.length; i++) {
            const candidate = data.images.backdrops[i];
            if (
              (candidate.vote_average || 0) > (topBackdrop.vote_average || 0)
            ) {
              topBackdrop = candidate;
            }
          }
          bestBackdrop = topBackdrop.file_path;
        }

        const transformedContent: Movie = {
          ...data,
          title: type === "tv" ? data.name : data.title,
          media_type: type,
          release_date: type === "tv" ? data.first_air_date : data.release_date,
          imdb_id: data.external_ids?.imdb_id || null,
          backdrop_path: bestBackdrop,
        };

        const foundTrailer = data.videos?.results?.find(
          (video: { type: string; site: string; key: string }) =>
            video.type === "Trailer" &&
            (video.site === "YouTube" || video.site === "Vimeo")
        );
        const trailerKey = foundTrailer ? foundTrailer.key : null;

        setInfoContentCache(key, {
          content: transformedContent,
          trailer: trailerKey,
        });

        setContent(transformedContent);
        setTrailer(trailerKey);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Error fetching content:", err);
        setError("Failed to load content");
        redirectTimer = setTimeout(() => navigate("/"), 2000);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      controller.abort();
      if (redirectTimer !== undefined) {
        clearTimeout(redirectTimer);
      }
    };
  }, [id, type, navigate]);

  // Check if title is in localStorage watchlist and stay in sync
  useEffect(() => {
    const contentId = content?.id;
    if (contentId == null) return;
    const syncListState = () => {
      setIsInMyList(isInList(contentId));
    };
    syncListState();
    return subscribeToList(syncListState);
  }, [content?.id]);

  const videoSourceOptions = useMemo(() => {
    if (!content?.id) return [];
    const isMovie = content.media_type === "movie";
    const s = selectedSeason || 1;

    return [
      {
        key: "primary",
        name: "VidSrc.to",
        url: content.imdb_id
          ? isMovie
            ? `https://vidsrc.to/embed/movie/${content.imdb_id}`
            : `https://vidsrc.to/embed/tv/${content.imdb_id}/${s}/1`
          : isMovie
          ? `https://vidsrc.cc/v2/embed/movie/${content.id}`
          : `https://vidsrc.cc/v2/embed/tv/${content.id}/${s}/1`,
      },
      {
        key: "secondary",
        name: "VidSrc.cc",
        url: isMovie
          ? `https://vidsrc.cc/v2/embed/movie/${content.id}`
          : `https://vidsrc.cc/v2/embed/tv/${content.id}/${s}/1`,
      },
      {
        key: "fifth",
        name: "VidLink.pro",
        url: isMovie
          ? `https://vidlink.pro/movie/${content.id}`
          : `https://vidlink.pro/tv/${content.id}/${s}/1`,
      },
      {
        key: "tertiary",
        name: "EmbedSu",
        url: isMovie
          ? `https://embedsu.org/embed/movie/${content.id}`
          : `https://embedsu.org/embed/tv/${content.id}/${s}/1`,
      },
      {
        key: "quaternary",
        name: "MovieLair",
        url: isMovie
          ? `https://movielair.cc/watch-movie/${content.id}`
          : `https://movielair.cc/watch-tv/${content.id}?season=${s}&episode=1`,
      },
      {
        key: "fallback",
        name: "SmashyStream",
        url: isMovie
          ? `https://player.smashy.stream/movie/${content.id}`
          : `https://player.smashy.stream/tv/${content.id}?s=${s}&e=1`,
      },
    ];
  }, [content?.id, content?.imdb_id, content?.media_type, selectedSeason]);

  const handlePlayClick = useCallback(
    async (sourceType = "primary") => {
      if (!content || !videoSourceOptions.length) return;

      const chosen =
        videoSourceOptions.find((s) => s.key === sourceType) ||
        videoSourceOptions[0];

      openModal(chosen.url, {
        title: content.title || content.name || "Now Playing",
        sources: videoSourceOptions,
        activeSourceKey: chosen.key,
      });
    },
    [content, videoSourceOptions, openModal]
  );

  const handleWatch = useCallback(async () => {
    if (!content || !type) return;

    handlePlayClick("primary");

    const mediaData = {
      id: content.id,
      title:
        content.media_type === "tv"
          ? content.name || content.title || "Unknown Show"
          : content.title || "Unknown Movie",
      poster_path: content.poster_path || "",
      media_type: (content.media_type || type) as "movie" | "tv",
    };

    addToWatchHistory(mediaData).catch((error) => {
      console.error("Failed to update watch history:", error);
    });
  }, [content, type, handlePlayClick, addToWatchHistory]);

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
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://movie-zone.pages.dev";
  const pageUrl = `${origin}/info/${type}/${id}`;
  const shareTitle = `${content.title || content.name} ${type === 'tv' ? '(TV Series)' : '(Movie)'} - MovieZone`;
  const shareDescription = content.overview 
    ? content.overview.length > 160 
      ? content.overview.substring(0, 157) + '...'
      : content.overview
    : `Watch ${content.title || content.name} on MovieZone - Your ultimate destination for movies and TV shows.`;
  
  const shareImage = validatedOgImage;

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content={type === 'tv' ? 'video.tv_show' : 'video.movie'} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        <meta property="og:image" content={shareImage} />
        <meta property="og:image:secure_url" content={shareImage} />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="720" />
        <meta property="og:image:alt" content={`${content.title || content.name} banner`} />
        <meta property="og:site_name" content="MovieZone" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@MovieZone" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        <meta name="twitter:image" content={shareImage} />
        <meta name="twitter:image:alt" content={`${content.title || content.name} banner`} />
        
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
      
      <div className="relative min-h-screen">
      {/* Hero Section */}
      <InfoHero
        content={content}
        trailer={trailer}
        openModal={openModal}
        handleWatch={handleWatch}
        handlePlayClick={handlePlayClick}
        isInMyList={isInMyList}
        setShowRatingModal={setShowRatingModal}
        user={null}
        navigate={navigate}
        type={type}
      />
      {/* Details Section */}
      <div className="relative z-10 px-4 py-10 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto space-y-12">
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
