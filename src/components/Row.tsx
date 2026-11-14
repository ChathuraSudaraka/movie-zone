import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import axios from "../utils/axios";
import Thumbnail from "./Thumbnail";
import { Movie } from "../types/movie";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface Props {
  title: string;
  fetchUrl: string;
  mediaType?: string;
}

const rowCache = new Map<string, Movie[]>();

function Row({ title, fetchUrl, mediaType = "movie" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const cached = rowCache.get(fetchUrl);
  const [movies, setMovies] = useState<Movie[]>(cached ?? []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [isVisible, setIsVisible] = useState(Boolean(cached));
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? 10 : 20
  );

  const visibleMovies = useMemo(
    () => movies.slice(0, visibleCount),
    [movies, visibleCount]
  );

  const expandVisibleCards = useCallback(() => {
    setVisibleCount((prev) => (prev < movies.length ? movies.length : prev));
  }, [movies.length]);

  const handleNavigation = useCallback(
    (direction: "left" | "right") => {
      if (!rowRef.current) return;

      if (direction === "right") {
        expandVisibleCards();
      }

      const scrollAmount = rowRef.current.offsetWidth;
      const newScrollPosition =
        direction === "left"
          ? rowRef.current.scrollLeft - scrollAmount
          : rowRef.current.scrollLeft + scrollAmount;

      rowRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
    },
    [expandVisibleCards]
  );

  // Defer below-the-fold row network/DOM work until within 600px of viewport
  useEffect(() => {
    if (isVisible) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const existing = rowCache.get(fetchUrl);
    if (existing) {
      setMovies(existing);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    async function fetchData() {
      try {
        setIsLoading(true);
        const request = await axios.get(fetchUrl);
        if (!cancelled && request.data?.results) {
          let resolvedType = "movie";
          if (
            fetchUrl.includes("/tv/") ||
            fetchUrl.includes("with_networks=213")
          ) {
            resolvedType = "tv";
          } else if (fetchUrl.includes("/trending/all/")) {
            resolvedType = "mixed";
          }

          const results = request.data.results.map((item: Movie) => ({
            ...item,
            media_type:
              resolvedType === "mixed"
                ? item.media_type || "movie"
                : resolvedType,
            backdrop_path: item.backdrop_path,
            poster_path: item.poster_path,
          }));

          rowCache.set(fetchUrl, results);
          setMovies(results);
        }
      } catch (error) {
        console.error("Error fetching row data:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [fetchUrl, mediaType, isVisible]);

  if (!isVisible || isLoading) {
    return (
      <div ref={containerRef} className="row-perf space-y-2 mb-10 md:mb-12">
        <div className="flex justify-between items-center px-4 md:px-8 lg:px-16 md:mb-6 mb-3">
          <h2 className="font-display text-xl font-semibold tracking-tight text-white/90 md:text-2xl lg:text-[1.65rem]">
            {title}
          </h2>
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-hidden px-4 md:px-8 lg:px-16">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="relative flex-none w-[180px] xs:w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] xl:w-[280px] aspect-[2/3] bg-white/[0.04] rounded-[20px] overflow-hidden ring-1 ring-white/10 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="row-perf mb-10 md:mb-12">
      <div className="flex justify-between items-center px-4 md:px-8 lg:px-16 mb-1">
        <h2 className="font-display text-xl font-semibold tracking-tight text-white md:text-2xl lg:text-[1.65rem]">
          {title}
        </h2>
        <div className="hidden md:flex gap-2">
          <button
            type="button"
            onClick={() => handleNavigation("left")}
            aria-label={`Scroll ${title} left`}
            className="liquid-glass liquid-refract-orb flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-transform duration-300 ease-spring hover:scale-105 hover:text-white active:scale-90"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => handleNavigation("right")}
            aria-label={`Scroll ${title} right`}
            className="liquid-glass liquid-refract-orb flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-transform duration-300 ease-spring hover:scale-105 hover:text-white active:scale-90"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          ref={rowRef}
          onScroll={visibleCount < movies.length ? expandVisibleCards : undefined}
          className="flex gap-4 overflow-x-auto overscroll-x-contain scrollbar-hide scroll-smooth py-4 px-4 md:px-8 lg:px-16"
        >
          {visibleMovies.map((movie) => (
            <div
              key={movie.id}
              className="flex-none w-[180px] xs:w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] xl:w-[280px]"
            >
              <Thumbnail movie={movie} viewMode="grid" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(Row);
