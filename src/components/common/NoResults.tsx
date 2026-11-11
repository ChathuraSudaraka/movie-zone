import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface NoResultsProps {
  filters: {
    genre?: string;
    year?: string;
  };
  onReset: () => void;
}

const NoResults: React.FC<NoResultsProps> = ({ filters, onReset }) => {
  const getMessage = () => {
    if (filters.genre && filters.year) {
      return `No results found for ${filters.genre} titles from ${filters.year}`;
    }
    if (filters.genre) {
      return `No results found for ${filters.genre}`;
    }
    if (filters.year) {
      return `No results found from ${filters.year}`;
    }
    return "No results found";
  };

  return (
    <div className="liquid-glass flex flex-col items-center justify-center p-10 rounded-[26px] text-center max-w-md mx-auto my-8">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.06] border border-white/15 mb-4">
        <AlertCircle className="w-6 h-6 text-neutral-300" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 capitalize">
        {getMessage()}
      </h3>
      <p className="text-sm text-neutral-400 mb-6">
        Try adjusting your filters or browse a different category.
      </p>
      <button onClick={onReset} className="btn-primary px-6 py-2.5 text-sm">
        <RotateCcw className="w-4 h-4" />
        <span>Reset Filters</span>
      </button>
    </div>
  );
};

export default NoResults;
