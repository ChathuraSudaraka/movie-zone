import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import Filter from '../common/Filter';
import { FilterOptions } from '@/types/filters';

interface FilterLayoutProps {
    initialFilters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    children: React.ReactNode;
}

const FilterLayout: React.FC<FilterLayoutProps> = ({ children, onFilterChange }) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileFilterOpen]);

  return (
    <div className="py-6 px-2 lg:px-4">
      {/* Mobile Filter Button */}
      <button
        type="button"
        onClick={() => setIsMobileFilterOpen(true)}
        className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-3 
                  bg-gray-800/50 rounded-xl border border-gray-700/50
                  text-gray-200 hover:bg-gray-700/50 transition-all mb-6"
      >
        <FiFilter className="w-5 h-5" />
        <span>Filters</span>
      </button>

      <div className="relative flex flex-col md:flex-row gap-4">
        {/* Desktop Filter - Increased width */}
        <aside className="hidden md:block w-[300px] lg:w-[310px] xl:w-[330px] flex-shrink-0">
          <div className="sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto hide-scrollbar">
            <Filter onFilterChange={onFilterChange} />
          </div>
        </aside>

        {/* Mobile Filter Drawer - Increased width */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="fixed inset-0 bg-black/60" 
              onClick={() => setIsMobileFilterOpen(false)} 
            />
            <div className="absolute inset-y-0 right-0 w-full max-w-[350px] animate-slide-left">
              <Filter
                onFilterChange={(filters) => {
                  onFilterChange(filters);
                  setIsMobileFilterOpen(false);
                }}
                onClose={() => setIsMobileFilterOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default FilterLayout;
