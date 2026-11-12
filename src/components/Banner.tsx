import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "../utils/axios";
import { Movie } from "../types/movie";
import { backdropSrcSet, tmdbImage } from "../utils/requests";
import { FaPlay, FaStar } from "react-icons/fa";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useVideoModal } from "../context/VideoModalContext";

interface Props {
  fetchUrl: string;
}

let cachedBanner: { movie: Movie; trailerEmbedUrl: string } | null = null;

function Banner({ fetchUrl }: Props) {
  const [movie, setMovie] = useState<Movie | null>(cachedBanner?.movie ?? null);
  const [loading, setLoading] = useState(!cachedBanner);
  const [trailerUrl, setTrailerUrl] = useState<string>(
    cachedBanner?.trailerEmbedUrl ?? ""
  );
  const [imgLoaded, setImgLoaded] = useState(Boolean(cachedBanner));
  const navigate = useNavigate();
  const { openModal: openVideoModal } = useVideoModal();

  useEffect(() => {
    if (cachedBanner) {
      setMovie(cachedBanner.movie);
      setTrailerUrl(cachedBanner.trailerEmbedUrl);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);

        const [moviesResponse, tvResponse] = await Promise.all([
          axios.get("/trending/movie/week"),
          axios.get("/trending/tv/week"),
        ]);
        if (cancelled) return;

        interface MediaItem {
          id: number;
          backdrop_path: string | null;
          media_type: string;
        }
        const allMedia: MediaItem[] = [
          ...moviesResponse.data.results.map((item: MediaItem) => ({
            ...item,
            media_type: "movie",
          })),
          ...tvResponse.data.results.map((item: MediaItem) => ({
            ...item,
            media_type: "tv",
          })),
        ].filter((item: MediaItem) => item.backdrop_path);

        const randomItem =
          allMedia[Math.floor(Math.random() * allMedia.length)];

        const { data: mediaDetails } = await axios.get(
          `/${randomItem.media_type}/${randomItem.id}?append_to_response=videos`
        );
        if (cancelled) return;

        let resolvedTrailer = "";
        if (mediaDetails.videos?.results?.length > 0) {
          const trailer =
            mediaDetails.videos.results.find(
              (video: { type: string; key: string }) => video.type === "Trailer"
            ) || mediaDetails.videos.results[0];

          if (trailer) {
            resolvedTrailer = `https://www.youtube.com/embed/${trailer.key}`;
            setTrailerUrl(resolvedTrailer);
          }
        }

        const resolvedMovie: Movie = {
          ...mediaDetails,
          media_type: randomItem.media_type,
        };

        cachedBanner = {
          movie: resolvedMovie,
          trailerEmbedUrl: resolvedTrailer,
        };
        setMovie(resolvedMovie);
      } catch (error) {
        console.error("Error fetching banner data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [fetchUrl]);

  const openModal = () => {
    if (trailerUrl) {
      openVideoModal(trailerUrl, {
        title: `${movie?.title || movie?.name || "Trailer"} · Trailer`,
      });
    } else {
      handleMore();
    }
  };

  const handleMore = () => {
    if (movie) {
      navigate(`/info/${movie.media_type}/${movie.id}`, {
        state: {
          movie: {
            ...movie,
            media_type: movie.media_type,
          },
          trailerUrl,
          from: "banner",
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="relative h-[85vh] xs:h-[90vh] sm:h-[95vh] md:h-[95vh] lg:h-[115vh] bg-[#060608]">
        <div className="absolute inset-0 bg-white/[0.03] animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060608]/60 to-[#060608]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-transparent to-transparent" />

        <div className="absolute bottom-[25%] xs:bottom-[28%] sm:bottom-[30%] md:bottom-[22%] left-4 space-y-4 md:space-y-6 md:left-12 lg:left-16">
          <div className="h-10 sm:h-12 md:h-14 lg:h-16 w-72 sm:w-80 md:w-[440px] lg:w-[560px] rounded-2xl bg-white/[0.06] animate-pulse" />
          <div className="flex flex-wrap gap-2 md:gap-3">
            <div className="h-7 w-20 rounded-full bg-white/[0.05] animate-pulse" />
            <div className="h-7 w-14 rounded-full bg-white/[0.05] animate-pulse" />
            <div className="h-7 w-12 rounded-full bg-white/[0.05] animate-pulse" />
            <div className="h-7 w-20 rounded-full bg-white/[0.05] animate-pulse" />
          </div>
          <div className="max-w-xs space-y-2.5 md:max-w-lg lg:max-w-2xl">
            <div className="h-4 w-full rounded-lg bg-white/[0.05] animate-pulse" />
            <div className="h-4 w-11/12 rounded-lg bg-white/[0.05] animate-pulse" />
            <div className="h-4 w-4/5 rounded-lg bg-white/[0.05] animate-pulse" />
          </div>
          <div className="flex gap-3 md:gap-4">
            <div className="h-11 w-11 sm:w-36 rounded-full bg-white/[0.08] animate-pulse" />
            <div className="h-11 w-11 sm:w-36 rounded-full bg-white/[0.05] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="relative h-[85vh] xs:h-[90vh] sm:h-[95vh] md:h-[95vh] lg:h-[110vh] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={tmdbImage(movie.backdrop_path, "w1280")}
          srcSet={backdropSrcSet(movie.backdrop_path)}
          sizes="100vw"
          fetchPriority="high"
          decoding="async"
          alt={movie.title || movie.name}
          className={`h-full w-full object-cover ${
            imgLoaded ? "animate-ken-burns" : ""
          }`}
          style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.7s ease" }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
        )}
      </div>

      {/* Adaptive cinematic scrims so light glass & text stay legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-ink-950" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/45 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
        className="absolute bottom-[24%] xs:bottom-[26%] sm:bottom-[28%] md:bottom-[22%] left-4 right-4 space-y-3 xs:space-y-4 md:space-y-5 md:left-12 lg:left-16"
      >
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="liquid-glass liquid-refract inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] xs:text-xs font-medium uppercase tracking-[0.2em] text-neutral-200"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-300 animate-pulse" />
          Trending this week
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
          className="font-display text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.04] text-white max-w-4xl drop-shadow-[0_6px_28px_rgba(0,0,0,0.6)]"
        >
          {movie.title || movie.name}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-wrap items-center gap-2 md:gap-2.5 text-white/95 text-xs xs:text-sm md:text-[15px]"
        >
          {movie.vote_average && (
            <span className="liquid-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold text-white">
              <FaStar className="text-[11px] text-amber-400" />
              {movie.vote_average.toFixed(1)}
            </span>
          )}
          {(movie.release_date || movie.first_air_date) && (
            <span className="liquid-glass rounded-full px-3 py-1 font-medium">
              {new Date(
                movie.release_date || movie.first_air_date || Date.now()
              ).getFullYear()}
            </span>
          )}
          <span className="liquid-glass rounded-full px-3 py-1 font-medium whitespace-nowrap">
            4K HDR
          </span>
          <span className="liquid-glass rounded-full px-3 py-1 font-medium whitespace-nowrap">
            {movie.media_type === "movie" ? "Movie" : "TV Series"}
          </span>
          {movie.runtime && movie.runtime > 0 && (
            <span className="liquid-glass rounded-full px-3 py-1 font-medium whitespace-nowrap">
              {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
            </span>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="text-sm xs:text-base md:text-lg lg:text-xl max-w-xs text-shadow-md text-neutral-100/90 md:max-w-lg lg:max-w-2xl line-clamp-3 xs:line-clamp-4 leading-relaxed"
        >
          {movie.overview}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="flex gap-3 md:gap-4 pt-1"
        >
          <button
            onClick={openModal}
            className="btn-primary shine group h-11 w-11 sm:h-auto sm:w-auto sm:px-7 sm:py-3.5"
          >
            <span className="shine-bar" />
            <FaPlay className="text-sm sm:text-base group-hover:scale-110 transition-transform duration-300" />
            <span className="hidden sm:inline text-base md:text-[17px]">Watch Trailer</span>
          </button>

          <button
            onClick={handleMore}
            className="btn-glass liquid-refract shine group h-11 w-11 sm:h-auto sm:w-auto sm:px-7 sm:py-3.5"
          >
            <span className="shine-bar" />
            <IoMdInformationCircleOutline className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300" />
            <span className="hidden sm:inline text-base md:text-[17px]">More Info</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Banner;