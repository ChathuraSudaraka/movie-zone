import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

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
      return `No results found for ${filters.genre} movies from ${filters.year}`;
    }
    if (filters.genre) {
      return `No results found for ${filters.genre}`;
    }
    if (filters.year) {
      return `No results found from ${filters.year}`;
    }
    return 'No results found';
  };

  return (
    <div className="flex flex-col items-center h-screen justify-center px-4 text-center">
      <FiAlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-xl md:text-2xl font-medium text-white mb-2">
        {getMessage()}
      </h3>
      <p className="text-gray-400 mb-6">
        Try adjusting your filters or search with different criteria
      </p>
      <button
        onClick={onReset}
        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 
                 text-white rounded-xl transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default NoResults;
