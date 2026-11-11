import React from "react";
import { Movie } from "../../types/movie";
import { MovieProcess } from "./MovieProcess";
import { TVProcess } from "./TVProcess";

interface DownloadSectionProps {
  type: string | undefined;
  content: Movie;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  selectedSeason: number;
  setSelectedSeason: (season: number) => void;
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  type,
  content,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  selectedSeason,
  setSelectedSeason,
  selectedQuality,
  setSelectedQuality
}) => {
  const isMovie = type === "movie";

  return (
    <section className="liquid-glass rounded-[28px] p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 mb-6 border-b border-white/10">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-white">
            Download Options
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {isMovie
              ? "Pick a video quality below to download a .torrent file or open a magnet link."
              : "Choose a season and quality, then expand an episode to view magnet links."}
          </p>
        </div>
        <div className="glass-chip self-start sm:self-auto inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] sm:text-xs text-neutral-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          <span>Higher seeds = faster download</span>
        </div>
      </div>

      <div>
        {isMovie ? (
          <MovieProcess
            content={content}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        ) : (
          <TVProcess
            content={content}
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
            selectedQuality={selectedQuality}
            setSelectedQuality={setSelectedQuality}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </section>
  );
};
