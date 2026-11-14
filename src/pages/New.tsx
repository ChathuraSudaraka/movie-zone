import { useEffect, useState } from "react";
import axios from "../utils/axios";
import Thumbnail from "../components/Thumbnail";
import { Movie } from "@/types/movie";

const NEW_TRENDING_ENDPOINT = "/trending/all/week";
const newContentCache = new Map<string, Movie[]>();

function New() {
  const initialCached = newContentCache.get(NEW_TRENDING_ENDPOINT);
  const [movies, setMovies] = useState<Movie[]>(() => initialCached ?? []);
  const [loading, setLoading] = useState<boolean>(() => !initialCached);
  const [error, setError] = useState<string | null>(null);

  const fetchNewContent = async () => {
    const cached = newContentCache.get(NEW_TRENDING_ENDPOINT);
    if (cached) {
      setMovies(cached);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(NEW_TRENDING_ENDPOINT);
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

      newContentCache.set(NEW_TRENDING_ENDPOINT, uniqueMovies);
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

  useEffect(() => {
    document.title = "New & Popular - MovieZone";
    fetchNewContent();
  }, []);

  if (loading) {
    return (
      <div className="mt-[68px] min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 h-10 w-52 rounded-full bg-white/[0.05] animate-pulse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(15)].map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] w-full bg-white/[0.05] animate-pulse rounded-[20px]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-[68px] min-h-[calc(100vh-68px)] flex items-center justify-center px-4">
        <div className="liquid-glass rounded-[28px] max-w-md w-full p-8 sm:p-10 text-center space-y-5">
          <p className="text-base sm:text-lg text-neutral-200">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchNewContent();
            }}
            className="btn-primary shine px-6 py-2.5 text-sm"
          >
            <span className="shine-bar" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[68px] min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="liquid-glass inline-flex items-center gap-3 rounded-full px-5 py-2.5">
          <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
            New & Popular
          </h1>
          <span className="glass-chip rounded-full px-2.5 py-0.5 text-xs font-semibold text-neutral-200">
            Weekly
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {movies.map((movie) => (
          <Thumbnail key={movie.id} movie={movie} viewMode="grid" />
        ))}
      </div>
    </div>
  );
}

export default New;
