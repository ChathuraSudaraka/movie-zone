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
  return (
    <div className="mt-12 mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4">
        Download Options
      </h2>
      <div>
        {type === "movie" ? (
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
    </div>
  );
};
