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
    <div className="relative min-h-[calc(100vh-68px)] pt-4">
      {/* Desktop Filter */}
      <aside className="hidden md:block fixed left-3 w-[276px] lg:w-[296px] xl:w-[312px] 
                       top-[84px] bottom-4 liquid-glass liquid-glass-strong rounded-[28px] overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Filter
            initialFilters={initialFilters}
            onFilterChange={onFilterChange}
          />
        </div>
      </aside>

      {/* Mobile Filter Button */}
      <div className={`md:hidden fixed top-20 right-4 z-40
        transition-transform duration-300 ${isScrolled ? 'translate-y-0' : 'translate-y-[115%]'}`}>
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          aria-label="Open filters"
          className="liquid-glass liquid-glass-strong liquid-refract-orb relative flex items-center justify-center w-11 h-11 rounded-full text-white border-fuchsia-300/30 shadow-[0_8px_24px_-6px_rgba(217,70,239,0.5)] transition-transform duration-300 ease-spring hover:scale-110 active:scale-90"
        >
          <FiFilter className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={handleMobileClose} />
          <div className="liquid-glass liquid-glass-strong fixed right-0 top-0 bottom-0 w-full max-w-[90%] sm:max-w-[400px] rounded-l-[28px]">
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
      <main className="md:pl-[292px] lg:pl-[312px] xl:pl-[328px]">
        <div className="p-2 md:p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default FilterLayout;
