import { useEffect, useState } from "react";
import axios from "../utils/axios";
import Thumbnail from "../components/Thumbnail";
import { Skeleton } from "@mui/material";
import { Movie } from "@/types/movie";

function New() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "New & Popular - MovieZone";
    fetchNewContent();
  }, []);

  const fetchNewContent = async () => {
    try {
      const response = await axios.get("/trending/all/week");
      const results: Movie[] = response.data.results
        .map((item: Movie): Movie => ({
          ...item,
          media_type: item.media_type || "movie",
        }))
        .filter(
          (item: Movie) =>
            item.id !== undefined &&
            item.backdrop_path !== null &&
            item.poster_path !== null
        );

      // Remove duplicates based on id
      const uniqueMovies = Array.from(
        new Map(results.map((item: Movie) => [item.id, item])).values()
      );

      setMovies(uniqueMovies);
      setError(null);
    } catch (error: unknown) {
      setError("Failed to load new content. Please try again later.");
      const errMsg = error as { message?: string };
      console.error("Error fetching new content:", errMsg.message || error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-[68px] min-h-screen bg-[#141414]">
        <div className="px-2 py-6 md:px-3 lg:px-4">
          <Skeleton
            variant="text"
            aria-label="Loading header text"
            width={200}
            height={40}
            sx={{ bgcolor: '#2b2b2b', marginBottom: '24px' }}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(15)].map((_, index) => (
              <div key={index} className="relative h-[280px] min-w-[160px] md:h-[420px] md:min-w-[280px]">
                <Skeleton
                  variant="rectangular"
                  aria-label="Loading movie thumbnail"
                  width="100%"
                  height="100%"
                  sx={{
                    bgcolor: '#2b2b2b',
                    borderRadius: '0.125rem',
                    transform: 'scale(1)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-[68px] min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchNewContent();
            }}
            className="mt-4 px-6 py-2 bg-red-600 rounded hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414]">
      <div className="px-2 py-6 md:px-3 lg:px-4">
        <h2 className="mb-6 text-xl font-semibold text-white md:text-2xl lg:text-3xl">
          New & Popular
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {movies.map((movie) => (
            <Thumbnail key={movie.id} movie={movie} viewMode="grid" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default New;
