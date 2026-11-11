import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../utils/axios";
import { Movie } from "../types/movie";
import { baseUrl } from "../utils/requests";
import { FaPlay, FaStar } from "react-icons/fa";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@mui/material";

interface Props {
  fetchUrl: string;
}

function Banner({ fetchUrl }: Props) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string>("");
  const [imgLoaded, setImgLoaded] = useState(false); // Track banner image loading
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch both movies and TV shows with more details
        const [moviesResponse, tvResponse] = await Promise.all([
          axios.get("/trending/movie/week?append_to_response=videos"),
          axios.get("/trending/tv/week?append_to_response=videos"),
        ]);

        // Process and combine the results
        interface MediaItem {
          id: number;
          backdrop_path: string | null;
          media_type: string;
          videos?: { results: { key: string; type: string }[] };
        }
        const allMedia: MediaItem[] = [
          ...moviesResponse.data.results.map((item: MediaItem) => ({
            ...item,
            media_type: "movie",
            videos: item.videos?.results || [],
          })),
          ...tvResponse.data.results.map((item: MediaItem) => ({
            ...item,
            media_type: "tv",
            videos: item.videos?.results || [],
          })),
        ].filter((item: MediaItem) => item.backdrop_path);

        // Get a random item from the combined results
        const randomItem =
          allMedia[Math.floor(Math.random() * allMedia.length)];

        // Fetch additional details including videos
        const { data: mediaDetails } = await axios.get(
          `/${randomItem.media_type}/${randomItem.id}?append_to_response=videos,similar,recommendations`
        );

        // Find trailer
        if (mediaDetails.videos?.results?.length > 0) {
          const trailer =
            mediaDetails.videos.results.find(
              (video: { type: string; key: string }) => video.type === "Trailer"
            ) || mediaDetails.videos.results[0];

          if (trailer) {
            setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
          }
        }

        setMovie({
          ...mediaDetails,
          media_type: randomItem.media_type, // Ensure media_type is preserved
        });
      } catch (error) {
        console.error("Error fetching banner data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fetchUrl]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleMore = () => {
    if (movie) {
      navigate(`/info/${movie.media_type}/${movie.id}`, {
        state: {
          movie: {
            ...movie,
            media_type: movie.media_type, // Ensure media_type is passed
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
        {/* Main banner skeleton with shimmer effect */}
        <div className="absolute inset-0">
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{
              bgcolor: "#1C1C1F",
              transform: "scale(1)",
              "&::after": {
                background:
                  "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)",
              },
            }}
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060608]/60 to-[#060608]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-transparent to-transparent" />

        {/* Content skeleton */}
        <div className="absolute bottom-[25%] xs:bottom-[28%] sm:bottom-[30%] md:bottom-[22%] left-4 space-y-3 xs:space-y-4 md:space-y-6 md:left-12 lg:left-16">
          {/* Title skeleton */}
          <Skeleton
            variant="rectangular"
            sx={{
              width: { xs: 280, sm: 320, md: 450, lg: 600 },
              height: { xs: 40, sm: 44, md: 56, lg: 72 },
              bgcolor: "#1C1C1F",
              borderRadius: "4px",
            }}
          />

          {/* Metadata skeleton */}
          <div className="flex flex-wrap gap-2 xs:gap-2 md:gap-4 mb-4 xs:mb-6">
            {/* Rating */}
            <Skeleton
              variant="rectangular"
              width={90}
              height={28}
              sx={{ bgcolor: "#1C1C1F", borderRadius: "4px" }}
            />
            {/* Year */}
            <Skeleton
              variant="rectangular"
              width={55}
              height={28}
              sx={{ bgcolor: "#1C1C1F", borderRadius: "4px" }}
            />
            {/* HD Badge */}
            <Skeleton
              variant="rectangular"
              width={45}
              height={28}
              sx={{ bgcolor: "#1C1C1F", borderRadius: "4px" }}
            />
            {/* Type Badge */}
            <Skeleton
              variant="rectangular"
              width={90}
              height={28}
              sx={{ bgcolor: "#1C1C1F", borderRadius: "4px" }}
            />
          </div>

          {/* Description skeleton */}
          <div className="max-w-xs space-y-2 md:max-w-lg lg:max-w-2xl">
            <Skeleton
              variant="text"
              width="100%"
              sx={{
                bgcolor: "#1C1C1F",
                height: {
                  xs: 24,
                  sm: 26,
                  md: 28,
                },
              }}
            />
            <Skeleton
              variant="text"
              width="95%"
              sx={{
                bgcolor: "#1C1C1F",
                height: {
                  xs: 24,
                  sm: 26,
                  md: 28,
                },
              }}
            />
            <Skeleton
              variant="text"
              width="90%"
              sx={{
                bgcolor: "#1C1C1F",
                height: {
                  xs: 24,
                  sm: 26,
                  md: 28,
                },
              }}
            />
            <Skeleton
              variant="text"
              width="85%"
              sx={{
                bgcolor: "#1C1C1F",
                height: {
                  xs: 24,
                  sm: 26,
                  md: 28,
                },
                display: { xs: 'block', md: 'block' },
              }}
            />
            <Skeleton
              variant="text"
              width="70%"
              sx={{
                bgcolor: "#1C1C1F",
                height: {
                  xs: 0,
                  sm: 0,
                  md: 28,
                },
                display: { xs: 'none', md: 'block' },
              }}
            />
          </div>

          {/* Buttons skeleton */}
          <div className="flex gap-2 xs:gap-3 md:gap-4">
            <Skeleton
              variant="rectangular"
              sx={{
                width: { xs: 36, sm: 40, md: 150 },
                height: { xs: 36, sm: 40, md: 46 },
                bgcolor: "#1C1C1F",
                borderRadius: { xs: "50%", sm: "50%", md: "4px" },
              }}
            />
            <Skeleton
              variant="rectangular"
              sx={{
                width: { xs: 36, sm: 40, md: 150 },
                height: { xs: 36, sm: 40, md: 46 },
                bgcolor: "#1C1C1F",
                borderRadius: { xs: "50%", sm: "50%", md: "4px" },
              }}
            />
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
          src={`${baseUrl}${movie.backdrop_path}`}
          alt={movie.title || movie.name}
          className={`h-full w-full object-cover will-change-transform ${
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

      {/* Trailer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass liquid-glass-strong relative w-full max-w-5xl aspect-video rounded-[28px] p-1.5"
            >
              <button
                onClick={closeModal}
                className="btn-glass absolute -top-12 right-0 px-4 py-1.5 text-sm"
              >
                Close
              </button>
              {trailerUrl ? (
                <iframe
                  className="w-full h-full rounded-[22px]"
                  src={trailerUrl.replace("watch?v=", "embed/")}
                  title="Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/80">
                  No trailer available
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Banner;