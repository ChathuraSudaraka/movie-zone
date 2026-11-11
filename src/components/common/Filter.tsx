import React, { useState } from "react";
import { FiFilter, FiChevronDown, FiRefreshCw } from "react-icons/fi";
import { MdOutlineCategory, MdLocalFireDepartment } from "react-icons/md";
import { BsCalendar3, BsStarFill } from "react-icons/bs";
import { TbArrowsSort } from "react-icons/tb";
import { loadFilterState, saveFilterState } from "@/utils/filterState";
import { FilterOptions } from "@/types/filters";
import { LiquidSlider } from "./LiquidGlassControls";

interface FilterProps {
  initialFilters?: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onClose?: () => void;
  onApply?: (filters: FilterOptions) => void;  // Modified this line
  isMobile?: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i);

const GENRE_CATEGORIES = {
  Popular: ["Action", "Comedy", "Drama", "Horror"],
  Story: ["Adventure", "Romance", "Mystery", "Crime"],
  Style: ["Animation", "Documentary", "Fantasy", "Sci-Fi"],
  Family: ["Family", "Thriller"],
};

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popular", icon: MdLocalFireDepartment },
  { value: "vote_average.desc", label: "Top Rated", icon: BsStarFill },
  { value: "release_date.desc", label: "Newest", icon: BsCalendar3 },
  { value: "release_date.asc", label: "Oldest", icon: BsCalendar3 },
];

interface FilterSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon: Icon,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3.5 sm:p-4 hover:bg-white/[0.04] transition-colors duration-200 group"
      >
        <div className="flex items-center gap-3 text-neutral-200">
          <Icon className="w-4 h-4 text-neutral-300 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium group-hover:text-white transition-colors">
            {title}
          </span>
        </div>
        <FiChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform duration-300 group-hover:text-white ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "h-full opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-3.5 pb-4 pt-1 sm:px-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default function Filter({ 
  initialFilters, 
  onFilterChange, 
  onClose, 
  onApply,
  isMobile 
}: FilterProps) {
  const [filters, setFilters] = React.useState<FilterOptions>(() => {
    // Try to load saved state first, then fall back to initialFilters or defaults
    const savedState = loadFilterState(window.location.pathname);
    return savedState || initialFilters || {
      genre: "",
      year: "",
      sort: "popularity.desc",
    };
  });

  // Sync with initialFilters and save to localStorage when filters change
  React.useEffect(() => {
    if (initialFilters) {
      setFilters(current => ({
        ...current,
        ...initialFilters
      }));
    }
  }, [initialFilters]);

  React.useEffect(() => {
    saveFilterState(window.location.pathname, filters);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value.toLowerCase()
    };
    setFilters(newFilters);
    
    // Only call onFilterChange immediately for desktop
    if (!isMobile) {
      onFilterChange(newFilters);
      saveFilterState(window.location.pathname, newFilters);
    }
  };

  const handleReset = () => {
    const defaultFilters = {
      genre: "",
      year: "",
      sort: "popularity.desc",
    };
    setFilters(defaultFilters);
    
    // Always trigger the reset immediately, regardless of mobile/desktop
    if (isMobile && onApply) {
      onApply(defaultFilters);
    } else {
      onFilterChange(defaultFilters);
    }
    
    saveFilterState(window.location.pathname, defaultFilters);
  };

  const handleApply = () => {
    if (isMobile && onApply) {
      onApply(filters); // Pass current filters to parent
      saveFilterState(window.location.pathname, filters);
    }
  };

  // Helper function to check if a filter is active
  const isFilterActive = (key: keyof FilterOptions, value: string): boolean => {
    return filters[key]?.toLowerCase() === value.toLowerCase();
  };

  return (
    <div className={`w-full flex flex-col bg-transparent ${isMobile ? "h-screen" : "h-full"}`}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 p-4 border-b border-white/10 backdrop-blur-md bg-ink-950/35 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white flex items-center gap-2.5">
          <FiFilter className="w-4 h-4 text-neutral-300" />
          <span>Filters</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition-colors group"
          >
            <FiRefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-xs font-medium">Reset</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg
                       bg-gray-800/50 text-gray-400 hover:text-white 
                       hover:bg-gray-700/50 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content with Better Mobile Support */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
        <div>
          {/* Genres Section */}
          <FilterSection title="Genres" icon={MdOutlineCategory}>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GENRE_CATEGORIES).map(([category, genres]) => (
                <React.Fragment key={category}>
                  {genres.map((genre) => {
                    const genreValue = genre.toLowerCase();
                    const isActive = isFilterActive("genre", genreValue);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleFilterChange("genre", genreValue)}
                        className={`px-3.5 py-2 text-xs sm:text-sm rounded-[14px] border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                          isActive
                            ? "liquid-refract bg-white/[0.2] text-white border-white/35 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                            : "bg-white/[0.04] text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </FilterSection>

          {/* Year Section */}
          <FilterSection title="Year" icon={BsCalendar3}>
            <div className="space-y-3">
              <LiquidSlider
                min={YEARS[YEARS.length - 1]}
                max={CURRENT_YEAR}
                value={Number(filters.year) || CURRENT_YEAR}
                onChange={(val) => handleFilterChange("year", val)}
                ariaLabel="Release Year"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">
                  {YEARS[YEARS.length - 1]}
                </span>
                <span className="glass-chip text-xs font-medium px-3 py-1 rounded-full text-white">
                  {filters.year || "All Years"}
                </span>
                <span className="text-xs text-neutral-500">{CURRENT_YEAR}</span>
              </div>
            </div>
          </FilterSection>

          {/* Sort Section */}
          <FilterSection title="Sort By" icon={TbArrowsSort}>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map(({ value, label, icon: Icon }) => {
                const isActive = isFilterActive("sort", value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleFilterChange("sort", value)}
                    className={`px-3 py-2 text-xs sm:text-sm rounded-[14px] border flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? "liquid-refract bg-white/[0.2] text-white border-white/35 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                        : "bg-white/[0.04] text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </FilterSection>
        </div>
      </div>

      {/* Mobile Action Bar */}
      {isMobile && (
        <div className="sticky bottom-0 p-4 border-t border-white/10 backdrop-blur-md bg-ink-950/40">
          <button
            type="button"
            onClick={handleApply}
            className="btn-primary w-full py-3 px-4 text-sm"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}
