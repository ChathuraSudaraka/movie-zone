import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import Thumbnail from "../components/Thumbnail";
import { Movie } from "../types/movie";

interface SearchResult extends Movie {
  media_type: "movie" | "tv" | string;
}

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const companyId = searchParams.get("company");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    document.title = `Search - ${query || companyId || "Company"} - MovieZone`;
    setPage(1);
    setTotalResults(null);
    setResults([]);
    setLoading(true);

    let cancelled = false;

    async function searchContent() {
      if (!query && !companyId) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
        const url = companyId
          ? `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&language=en-US&sort_by=popularity.desc&page=1`
          : `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
        const response = await fetch(url);
        const data = await response.json();
        if (cancelled) return;

        const filteredResults = (data.results || []).filter(
          (item: SearchResult) =>
            (item.media_type === "movie" ||
              item.media_type === "tv" ||
              companyId) &&
            (item.backdrop_path || item.poster_path)
        );
        setResults(filteredResults);
        setTotalResults(data.total_results || null);
      } catch (error) {
        if (!cancelled) {
          console.error("Error searching content:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    searchContent();
    return () => {
      cancelled = true;
    };
  }, [query, companyId]);

  // Load more for company search
  const handleLoadMore = async () => {
    if (!companyId) return;
    setLoadingMore(true);
    try {
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
      const nextPage = page + 1;
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_companies=${companyId}&language=en-US&sort_by=popularity.desc&page=${nextPage}`;
      const response = await fetch(url);
      const data = await response.json();
      const filteredResults: SearchResult[] = (data.results || []).filter(
        (item: SearchResult) => item.backdrop_path || item.poster_path
      );
      setResults((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const uniqueNext = filteredResults.filter(
          (item) => !seen.has(item.id)
        );
        return [...prev, ...uniqueNext];
      });
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more results:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-[68px] min-h-screen px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-3 liquid-glass rounded-full px-5 py-2.5">
          <SearchIcon className="h-4 w-4 text-white/75 shrink-0" />
          <h1 className="font-display text-lg sm:text-xl font-semibold text-white tracking-tight">
            {companyId
              ? "Loading productions..."
              : query
                ? `Searching for "${query}"...`
                : "Searching..."}
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] w-full rounded-[20px] bg-white/[0.04] ring-1 ring-white/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[68px] min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="liquid-glass inline-flex items-center gap-3 rounded-full px-5 py-2.5">
          <SearchIcon className="h-4 w-4 text-white/75 shrink-0" />
          <h1 className="font-display text-lg sm:text-xl font-semibold text-white tracking-tight">
            {results.length > 0
              ? companyId && totalResults
                ? `Productions: ${totalResults}`
                : `Search results for "${query}"`
              : companyId
                ? "No productions found for this company."
                : query
                  ? `No results found for "${query}"`
                  : "Search movies & TV shows"}
          </h1>
        </div>

        {results.length > 0 && (
          <span className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-neutral-300">
            {results.length} {results.length === 1 ? "title" : "titles"}
          </span>
        )}
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((result) => {
            const resolvedType =
              result.media_type || (result.first_air_date ? "tv" : "movie");
            return (
              <Thumbnail
                key={`${resolvedType}-${result.id}`}
                movie={{
                  ...result,
                  title: result.title || result.name || "Untitled",
                  media_type: resolvedType,
                }}
                viewMode="grid"
              />
            );
          })}
        </div>
      ) : (
        <div className="liquid-glass rounded-[28px] max-w-md mx-auto my-12 p-8 sm:p-10 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full glass-chip flex items-center justify-center">
            <SearchIcon className="w-6 h-6 text-white/70" />
          </div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-white">
            {companyId
              ? "No productions available"
              : query
                ? `Nothing matched "${query}"`
                : "Start a search"}
          </h2>
          <p className="text-sm text-neutral-400">
            Try searching for another movie, series, or title keyword.
          </p>
        </div>
      )}

      {/* Load More button for company search */}
      {companyId && totalResults && results.length < totalResults && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            className="btn-glass px-7 py-3 text-sm disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Search;
