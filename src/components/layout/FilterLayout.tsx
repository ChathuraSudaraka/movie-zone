import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import Filter from '../common/Filter';
import { FilterOptions } from '@/types/filters';

interface FilterLayoutProps {
    initialFilters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    children: React.ReactNode;
}

const FilterLayout: React.FC<FilterLayoutProps> = ({ children, initialFilters, onFilterChange }) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [tempFilters, setTempFilters] = useState(initialFilters);
  
  // Update tempFilters when initialFilters change externally
  useEffect(() => {
    setTempFilters(initialFilters);
  }, [initialFilters]);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle body scroll lock
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

  const handleMobileFilterChange = (filters: FilterOptions) => {
    setTempFilters(filters); // Store temporary filter state
    // Optional: Update in real-time
    // onFilterChange(filters);
  };

  const handleMobileApply = (filters: FilterOptions) => {
    onFilterChange(filters); // Apply the filters
    setTempFilters(filters); // Update temp filters
    setIsMobileFilterOpen(false); // Close the drawer
  };

  const handleMobileClose = () => {
    setTempFilters(initialFilters); // Reset temp filters
    setIsMobileFilterOpen(false);
  };

  return (
    <div className="py-2 md:py-6 px-2 sm:px-4">
      {/* Mobile Filter Button - Top Floating Style */}
      <div className={`md:hidden fixed top-20 right-4 z-40
        transition-all duration-300 ${isScrolled ? 'translate-y-0' : 'translate-y-[115%]'}`}
      >
        <div className="absolute inset-0 rounded-full -z-10 bg-gradient-to-b from-black/50 to-transparent blur-md" />
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className={`relative flex items-center justify-center w-11 h-11
                    bg-red-600 hover:bg-red-700 rounded-full 
                    text-white shadow-lg shadow-black/20
                    transition-all duration-300 hover:scale-110
                    border border-red-500/30`}
        >
          <FiFilter className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex flex-col md:flex-row gap-4 lg:gap-6">
        {/* Desktop Filter */}
        <aside className="hidden md:block w-[280px] lg:w-[300px] xl:w-[320px] flex-shrink-0">
          <div className={`sticky transition-all duration-300
            ${isScrolled ? 'top-[90px]' : 'top-[90px]'}
            max-h-[calc(100vh-100px)] rounded-lg overflow-y-auto hide-scrollbar`}>
            <Filter 
              initialFilters={initialFilters}
              onFilterChange={onFilterChange}
            />
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={handleMobileClose}
            />
            <div className="absolute inset-y-0 right-0 w-full max-w-[90%] sm:max-w-[400px]
                          transform transition-transform duration-300 ease-out-cubic">
              <Filter
                initialFilters={tempFilters}
                onFilterChange={handleMobileFilterChange}
                onClose={() => setIsMobileFilterOpen(false)}
                onApply={handleMobileApply}
                isMobile={true}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className=""> {/* Reduced padding since button is floating */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FilterLayout;
