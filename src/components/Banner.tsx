import { useEffect, useState } from "react";
import axios from "../utils/axios";
import { Movie } from "../types/movie";
import { baseUrl } from "../utils/requests";
import { FaPlay } from "react-icons/fa";
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
        const allMedia = [
          ...moviesResponse.data.results.map((item: any) => ({
            ...item,
            media_type: "movie",
            videos: item.videos?.results || [],
          })),
          ...tvResponse.data.results.map((item: any) => ({
            ...item,
            media_type: "tv",
            videos: item.videos?.results || [],
          })),
        ].filter((item: any) => item.backdrop_path);

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
              (video: any) => video.type === "Trailer"
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
      <div className="relative h-[75vh] md:h-[95vh] lg:h-[115vh] bg-[#141414]">
        {/* Main banner skeleton with shimmer effect */}
        <div className="absolute inset-0">
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{
              bgcolor: "#2b2b2b",
              transform: "scale(1)",
              "&::after": {
                background:
                  "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent)",
              },
            }}
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#141414]/60 to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />

        {/* Content skeleton */}
        <div className="absolute bottom-[22%] left-4 space-y-6 md:left-12 lg:left-16">
          {/* Title skeleton */}
          <Skeleton
            variant="rectangular"
            sx={{
              width: { xs: 250, sm: 320, md: 450, lg: 600 },
              height: { xs: 32, sm: 40, md: 56, lg: 72 },
              bgcolor: "#2b2b2b",
              borderRadius: "4px",
            }}
          />

          {/* Metadata skeleton */}
          <div className="flex flex-wrap gap-3 mb-6">
            {/* Rating */}
            <Skeleton
              variant="rectangular"
              width={80}
              height={24}
              sx={{ bgcolor: "#2b2b2b", borderRadius: "4px" }}
            />
            {/* Year */}
            <Skeleton
              variant="rectangular"
              width={50}
              height={24}
              sx={{ bgcolor: "#2b2b2b", borderRadius: "4px" }}
            />
            {/* HD Badge */}
            <Skeleton
              variant="rectangular"
              width={40}
              height={24}
              sx={{ bgcolor: "#2b2b2b", borderRadius: "4px" }}
            />
            {/* Type Badge */}
            <Skeleton
              variant="rectangular"
              width={80}
              height={24}
              sx={{ bgcolor: "#2b2b2b", borderRadius: "4px" }}
            />
          </div>

          {/* Description skeleton */}
          <div className="max-w-xs space-y-2 md:max-w-lg lg:max-w-2xl">
            <Skeleton
              variant="text"
              width="100%"
              height={24}
              sx={{
                bgcolor: "#2b2b2b",
                height: {
                  xs: 20,
                  sm: 22,
                  md: 24,
                },
              }}
            />
            <Skeleton
              variant="text"
              width="95%"
              height={24}
              sx={{ bgcolor: "#2b2b2b" }}
            />
            <Skeleton
              variant="text"
              width="90%"
              height={24}
              sx={{
                bgcolor: "#2b2b2b",
                height: {
                  xs: 20,
                  sm: 22,
                  md: 24,
                },
              }}
            />
            <Skeleton
              variant="text"
              width="85%"
              sx={{
                bgcolor: "#2b2b2b",
                height: {
                  xs: 20,
                  sm: 22,
                  md: 24,
                },
              }}
            />
            <Skeleton
              variant="text"
              width="70%"
              sx={{
                bgcolor: "#2b2b2b",
                height: {
                  xs: 20,
                  sm: 22,
                  md: 24,
                },
              }}
            />
          </div>

          {/* Buttons skeleton */}
          <div className="flex gap-4 pt-2">
            <Skeleton
              variant="rectangular"
              sx={{
                width: { xs: 100, sm: 120, md: 150 },
                height: { xs: 38, sm: 42, md: 46 },
                bgcolor: "#2b2b2b",
                borderRadius: "4px",
              }}
            />
            <Skeleton
              variant="rectangular"
              sx={{
                width: { xs: 100, sm: 120, md: 150 },
                height: { xs: 38, sm: 42, md: 46 },
                bgcolor: "#2b2b2b",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="relative h-[75vh] md:h-[95vh] lg:h-[115vh]">
      <div className="absolute inset-0">
        <img
          src={`${baseUrl}${movie.backdrop_path}`}
          alt={movie.title || movie.name}
          className="h-full w-full object-cover"
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.5s' }}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#141414]/60 to-[#141414]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />

      <div className="absolute bottom-[22%] left-4 space-y-6 md:left-12 lg:left-16">
        <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white">
          {movie.title || movie.name}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-white/90 mb-6 text-sm md:text-base">
          {movie.vote_average && (
            <span className="text-green-500 font-semibold text-lg">
              {Math.round(movie.vote_average * 10)}% Match
            </span>
          )}
          {(movie.release_date || movie.first_air_date) && (
            <span className="font-medium">
              {new Date(
                movie.release_date || movie.first_air_date || Date.now()
              ).getFullYear()}
            </span>
          )}
          <span className="px-2 py-0.5 border border-white/40 rounded text-sm font-medium">
            HD
          </span>
          <span className="px-2 py-0.5 border border-white/40 rounded text-sm font-medium">
            {movie.media_type === "movie" ? "Movie" : "TV Series"}
          </span>
          {movie.runtime && movie.runtime > 0 && (
            <span className="font-medium">
              {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
            </span>
          )}
        </div>

        <h1 className="text-1xl md:text-2xl lg:text-2xl max-w-xs text-shadow-md text-white md:max-w-lg lg:max-w-2xl opacity-80 line-clamp-2 md:line-clamp-5">
          {movie.overview}
        </h1>

        <div className="flex space-x-4">
          <button
            onClick={openModal}
            className="flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto sm:px-8 sm:py-3 rounded-full sm:rounded bg-gray-500/30 hover:bg-gray-500/40 text-white transition duration-300 group"
          >
            <FaPlay className="text-xl sm:text-2xl group-hover:scale-110 transition duration-300" />
            <span className="hidden sm:inline ml-2 font-semibold text-lg">Play</span>
          </button>

          <button
            onClick={handleMore}
            className="flex items-center justify-center w-12 h-12 sm:w-auto sm:h-auto sm:px-8 sm:py-3 rounded-full sm:rounded bg-gray-500/30 hover:bg-gray-500/40 text-white transition duration-300 group"
          >
            <IoMdInformationCircleOutline className="text-2xl sm:text-3xl group-hover:scale-110 transition duration-300" />
            <span className="hidden sm:inline ml-2 font-semibold text-lg">More Info</span>
          </button>
        </div>
      </div>
      {/* Trailer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="relative w-[90%] max-w-5xl aspect-video bg-black">
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-lg"
            >
              Close
            </button>
            {trailerUrl ? (
              <iframe
                className="w-full h-full"
                src={trailerUrl.replace("watch?v=", "embed/")}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                No trailer available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Banner;
