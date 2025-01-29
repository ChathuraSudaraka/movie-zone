import React, { useState } from "react";
import { FiFilter, FiChevronDown, FiRefreshCw } from "react-icons/fi";
import { MdOutlineCategory, MdLocalFireDepartment } from "react-icons/md";
import { BsCalendar3, BsStarFill } from "react-icons/bs";
import { TbArrowsSort } from "react-icons/tb";

interface FilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  onClose?: () => void;
}

interface FilterOptions {
  genre: string;
  year: string;
  sort: string;
  tag?: string;
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
    <div className="border-b border-gray-800/50 last:border-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 
                 hover:bg-gray-800/30 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3 text-gray-200">
          <Icon className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
          <span className="font-medium group-hover:text-white transition-colors">
            {title}
          </span>
        </div>
        <FiChevronDown
          className={`w-5 h-5 text-gray-400 transition-all duration-300
            group-hover:text-white ${isExpanded ? "rotate-180" : "rotate-0"}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out
        ${isExpanded ? "h-full opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="p-3 sm:p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default function Filter({ onFilterChange, onClose }: FilterProps) {
  const [filters, setFilters] = React.useState<FilterOptions>({
    genre: "",
    year: "",
    sort: "popularity.desc",
  });

  const handleReset = () => {
    const defaultFilters = {
      genre: "",
      year: "",
      sort: "popularity.desc",
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div
      className="w-full h-screen md:h-auto flex flex-col bg-[#1a1a1a]/90 backdrop-blur-sm 
                    md:rounded-xl border-l md:border border-gray-800/50 shadow-xl shadow-black/20"
    >
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-20 p-3 sm:p-4 border-b border-gray-800/50 rounded-t-xl
        bg-[#1a1a1a] backdrop-blur-sm flex items-center justify-between"
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <FiFilter className="w-5 h-5 text-red-500" />
          <span>Filters</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                     text-gray-400 hover:text-white hover:bg-gray-800/50 
                     transition-all group"
          >
            <FiRefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm">Reset</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="divide-y divide-gray-800/50">
          {/* Genres Section */}
          <FilterSection title="Genres" icon={MdOutlineCategory}>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(GENRE_CATEGORIES).map(([category, genres]) => (
                <React.Fragment key={category}>
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() =>
                        handleFilterChange("genre", genre.toLowerCase())
                      }
                      className={`px-4 py-2.5 text-sm rounded-xl border transition-all duration-200
                        hover:scale-[1.02] active:scale-[0.98]
                        ${
                          filters.genre === genre.toLowerCase()
                            ? "bg-red-500/10 text-red-500 border-red-500/30 shadow-lg shadow-red-500/10"
                            : "bg-gray-800/30 text-gray-300 border-gray-700/50 hover:bg-gray-700/50 hover:text-white"
                        }`}
                    >
                      {genre}
                    </button>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </FilterSection>

          {/* Year Section */}
          <FilterSection title="Year" icon={BsCalendar3}>
            <div className="space-y-4">
              <input
                type="range"
                min={YEARS[YEARS.length - 1]}
                max={CURRENT_YEAR}
                value={filters.year || CURRENT_YEAR}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                         accent-red-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {YEARS[YEARS.length - 1]}
                </span>
                <span
                  className="text-sm font-medium px-3 py-1 rounded-full
                             bg-red-500/10 text-red-500"
                >
                  {filters.year || "All Years"}
                </span>
                <span className="text-sm text-gray-500">{CURRENT_YEAR}</span>
              </div>
            </div>
          </FilterSection>

          {/* Sort Section */}
          <FilterSection title="Sort By" icon={TbArrowsSort}>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleFilterChange("sort", value)}
                  className={`px-4 py-2.5 text-sm rounded-xl border flex items-center gap-2
                    transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                    ${
                      filters.sort === value
                        ? "bg-red-500/10 text-red-500 border-red-500/30 shadow-lg shadow-red-500/10"
                        : "bg-gray-800/30 text-gray-300 border-gray-700/50 hover:bg-gray-700/50 hover:text-white"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </FilterSection>
        </div>
      </div>

      {/* Safe Area Padding for Mobile */}
      <div className="h-safe-area md:h-0" />
    </div>
  );
}
