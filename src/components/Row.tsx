import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "../utils/axios";
import Thumbnail from "./Thumbnail";
import { Movie } from "../types/movie";
import { Skeleton } from "@mui/material";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMediaQuery } from "react-responsive";

interface Props {
  title: string;
  fetchUrl: string;
  mediaType?: string;
}

function Row({ title, fetchUrl, mediaType = "movie" }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const handleNavigation = useCallback((direction: "left" | "right") => {
    if (!rowRef.current) return;

    const scrollAmount = rowRef.current.offsetWidth;
    const newScrollPosition =
      direction === "left"
        ? rowRef.current.scrollLeft - scrollAmount
        : rowRef.current.scrollLeft + scrollAmount;

    rowRef.current.scrollTo({
      left: newScrollPosition,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const request = await axios.get(fetchUrl);
        if (request.data?.results) {
          // Determine media type based on the fetchUrl
          let mediaType = "movie";
          if (
            fetchUrl.includes("/tv/") ||
            fetchUrl.includes("with_networks=213")
          ) {
            mediaType = "tv";
          } else if (fetchUrl.includes("/trending/all/")) {
            mediaType = "mixed"; // Will use item's own media_type
          }

          const results = request.data.results.map((item: Movie) => {
            const processedItem = {
              ...item,
              media_type:
                mediaType === "mixed" ? item.media_type || "movie" : mediaType,
              backdrop_path: item.backdrop_path,
              poster_path: item.poster_path,
            };
            // console.log('Processed item:', processedItem);
            return processedItem;
          });

          setMovies(results);
        }
      } catch (error) {
        console.error("Error fetching row data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [fetchUrl, mediaType]);

  if (isLoading) {
    return (
      <div className="row-perf space-y-2 mb-12">
        <div className="flex justify-between items-center px-4 md:px-8 lg:px-16 md:mb-8 mb-4">
          <Skeleton
            variant="rectangular"
            width={200}
            height={32}
            sx={{ bgcolor: "rgba(255,255,255,0.06)", borderRadius: 3 }}
          />
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-16">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="relative flex-none w-[180px] xs:w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] xl:w-[280px] aspect-[2/3] bg-white/[0.05] rounded-[20px] overflow-hidden ring-1 ring-white/10"
              >
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.05)",
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Skeleton
                    variant="text"
                    width="60%"
                    sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row-perf mb-10 md:mb-12">
      <div className="flex justify-between items-center px-4 md:px-8 lg:px-16 mb-1">
        <h2 className="font-display text-xl font-semibold tracking-tight text-white md:text-2xl lg:text-[1.65rem]">
          {title}
        </h2>
        {!isMobile && (
          <div className="flex gap-2">
            <button
              onClick={() => handleNavigation("left")}
              aria-label={`Scroll ${title} left`}
              className="liquid-glass liquid-refract-orb flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-transform duration-300 ease-spring hover:scale-105 hover:text-white active:scale-90"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleNavigation("right")}
              aria-label={`Scroll ${title} right`}
              className="liquid-glass liquid-refract-orb flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-transform duration-300 ease-spring hover:scale-105 hover:text-white active:scale-90"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-4 px-4 md:px-8 lg:px-16"
        >
          {movies.map((movie) => (
            <div key={movie.id} className="flex-none w-[180px] xs:w-[200px] sm:w-[220px] md:w-[240px] lg:w-[260px] xl:w-[280px]">
              <Thumbnail movie={movie} viewMode="grid" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(Row);
