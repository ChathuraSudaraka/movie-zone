import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FilmIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { tmdbImage } from "@/utils/requests";
import { Movie } from "../types/movie";
import { MobileDock } from "./MobileDock";

interface SearchResult extends Movie {
  media_type: "movie" | "tv" | string;
}

interface CompanySuggestion {
  id: number;
  name: string;
  movie_count?: number;
}

const COMPANY_COUNT_CACHE_LIMIT = 200;
const companyCountCache = new Map<number, number>();

function setCachedCompanyCount(companyId: number, count: number) {
  if (companyCountCache.has(companyId)) {
    companyCountCache.delete(companyId);
  } else if (companyCountCache.size >= COMPANY_COUNT_CACHE_LIMIT) {
    const oldestKey = companyCountCache.keys().next().value;
    if (oldestKey !== undefined) {
      companyCountCache.delete(oldestKey);
    }
  }
  companyCountCache.set(companyId, count);
}

function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  return (
    signal?.aborted === true ||
    (error instanceof DOMException && error.name === "AbortError")
  );
}

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<CompanySuggestion[]>([]);
  const [searchTab, setSearchTab] = useState<"titles" | "companies">("titles");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTabRef = useRef<"titles" | "companies">(searchTab);
  const companyQueryRef = useRef("");
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "TV Shows", href: "/tv" },
    { name: "Movies", href: "/movies" },
    // { name: 'New & Popular', href: '/new' },
    { name: "My List", href: "/my-list" },
    // { name: "Blog", href: "/blog" },
    { name: "Donate", href: "/donate" },
  ];

  useEffect(() => {
    searchTabRef.current = searchTab;
  }, [searchTab]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    let rafId: number | null = null;
    let lastScrolled = window.scrollY > 24;
    if (lastScrolled) {
      setIsScrolled(true);
    }

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const next = window.scrollY > 24;
        if (next !== lastScrolled) {
          lastScrolled = next;
          setIsScrolled(next);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const closeSearch = () => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    companyQueryRef.current = "";
    setShowSearch(false);
    setSearchTerm("");
    setSuggestions([]);
    setCompanySuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      closeSearch();
    }
  };

  const fetchSuggestions = async (input: string, signal?: AbortSignal) => {
    const trimmed = input.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
          trimmed
        )}&page=1&include_adult=false`,
        { signal }
      );
      const data = await response.json();
      if (signal?.aborted) return;

      const filteredSuggestions = (data.results || []).filter(
        (item: SearchResult) =>
          (item.media_type === "movie" || item.media_type === "tv") &&
          (item.backdrop_path || item.poster_path)
      );
      setSuggestions(filteredSuggestions);
    } catch (error) {
      if (isAbortError(error, signal)) return;
      console.error("Error fetching suggestions:", error);
    }
  };

  // Filter out companies with no productions and sort by most productions
  const getValidCompanySuggestions = async (
    companies: CompanySuggestion[],
    signal?: AbortSignal
  ): Promise<CompanySuggestion[]> => {
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const resolved = await Promise.all(
      companies.slice(0, 8).map(
        async (
          company
        ): Promise<{ company: CompanySuggestion; count: number } | null> => {
          const cachedCount = companyCountCache.get(company.id);
        if (cachedCount !== undefined) {
          return cachedCount > 0
            ? {
                company: { ...company, movie_count: cachedCount },
                count: cachedCount,
              }
            : null;
        }

        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_companies=${company.id}&language=en-US&page=1`;
        try {
          const response = await fetch(url, { signal });
          if (!response.ok) return null;
          const data = await response.json();
          if (signal?.aborted) return null;

          const count =
            data.results && data.results.length > 0
              ? data.total_results || data.results.length
              : 0;
          setCachedCompanyCount(company.id, count);
          if (count > 0) {
            return {
              company: { ...company, movie_count: count },
              count,
            };
          }
        } catch (error) {
          if (isAbortError(error, signal)) {
            throw error;
          }
          // skip companies that fail to load
        }
        return null;
      })
    );

    const companyCounts = resolved.filter(
      (item): item is { company: CompanySuggestion; count: number } =>
        item !== null
    );
    // Sort by most productions
    companyCounts.sort((a, b) => b.count - a.count);
    return companyCounts.map((item) => item.company);
  };

  const fetchCompanySuggestions = async (
    input: string,
    signal?: AbortSignal
  ) => {
    const trimmed = input.trim();
    if (trimmed.length < 2) {
      companyQueryRef.current = "";
      setCompanySuggestions([]);
      return;
    }
    try {
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
      const response = await fetch(
        `https://api.themoviedb.org/3/search/company?api_key=${API_KEY}&query=${encodeURIComponent(
          trimmed
        )}`,
        { signal }
      );
      const data = await response.json();
      if (signal?.aborted) return;

      // Only show companies with at least one production
      const validCompanies = await getValidCompanySuggestions(
        data.results || [],
        signal
      );
      if (signal?.aborted) return;

      companyQueryRef.current = trimmed;
      setCompanySuggestions(validCompanies);
    } catch (error) {
      if (isAbortError(error, signal)) return;
      setCompanySuggestions([]);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      companyQueryRef.current = "";
      setSuggestions([]);
      setCompanySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTabRef.current === "titles") {
      companyQueryRef.current = "";
      setCompanySuggestions([]);
    }
    setShowSuggestions(true);

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      const controller = new AbortController();
      abortControllerRef.current = controller;
      fetchSuggestions(trimmed, controller.signal);
      if (searchTabRef.current === "companies") {
        fetchCompanySuggestions(trimmed, controller.signal);
      }
    }, 300);
  };

  const handleTabChange = (tab: "titles" | "companies") => {
    setSearchTab(tab);
    searchTabRef.current = tab;

    const trimmed = searchTerm.trim();
    if (
      tab === "companies" &&
      trimmed.length >= 2 &&
      (companySuggestions.length === 0 || companyQueryRef.current !== trimmed)
    ) {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        fetchSuggestions(trimmed, controller.signal);
        fetchCompanySuggestions(trimmed, controller.signal);
        return;
      }

      if (
        !abortControllerRef.current ||
        abortControllerRef.current.signal.aborted
      ) {
        abortControllerRef.current = new AbortController();
      }
      fetchCompanySuggestions(trimmed, abortControllerRef.current.signal);
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    const type =
      suggestion.media_type || (suggestion.first_air_date ? "tv" : "movie");
    navigate(`/info/${type}/${suggestion.id}`);
    closeSearch();
  };

  const handleCompanyClick = async (company: CompanySuggestion) => {
    if (typeof company.movie_count === "number" && company.movie_count > 0) {
      navigate(`/search?company=${company.id}`);
      closeSearch();
      return;
    }

    // Check if the company has at least one production
    try {
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_companies=${company.id}&language=en-US&page=1`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        navigate(`/search?company=${company.id}`);
        closeSearch();
      } else {
        alert("No productions found for this company.");
      }
    } catch {
      alert("Failed to check company productions.");
    }
  };

  const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 block w-full px-0 py-3 lg:px-0 lg:py-3.5">
      {/* Seamless top scrim + feathered dark frosted glass when scrolled (no hard bottom line) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-black/65 via-black/25 to-transparent"
      />
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-x-0 top-0 -z-10 h-24 bg-[#0a0a0d]/80 backdrop-blur-md lg:backdrop-blur-xl transition-opacity duration-300 ${
          isScrolled ? "opacity-100" : "opacity-0"
        }`}
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, black 68%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 68%, transparent 100%)",
        }}
      />

      <div className="flex w-full items-center justify-between px-4 md:px-8 lg:px-14">
        {/* Left side */}
        <div className="flex items-center gap-3 sm:gap-8">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            transition={spring}
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 rounded-full border-0 bg-transparent py-1 pl-0 pr-2"
          >
            <span className="liquid-glass liquid-refract-orb flex h-9 w-9 items-center justify-center rounded-full">
              <FilmIcon className="h-[17px] w-[17px] text-white transition-transform duration-500 ease-spring group-hover:rotate-[-12deg]" />
            </span>
            <span className="font-display text-lg sm:text-xl font-semibold tracking-tight text-white">
              Movie<span className="text-white/60">Zone</span>
            </span>
          </motion.button>

          {/* Desktop Navigation – sliding liquid pill */}
          <nav className="relative hidden lg:flex items-center gap-0.5 rounded-full p-1">
            {navigation.map((item) => {
              const active = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`relative rounded-full border-0 bg-transparent px-4 py-2 text-[15px] font-medium transition-colors duration-300 ${
                    active ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-liquid-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="liquid-glass liquid-refract absolute inset-0 -z-0 rounded-full !bg-white/[0.06]"
                    />
                  )}
                  <span className="relative z-10">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Button (Mobile & Desktop) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            className="liquid-glass liquid-refract flex h-9 lg:h-10 items-center gap-2 rounded-full px-3.5 sm:px-4 text-white/85 hover:text-white"
            onClick={() => setShowSearch(true)}
            aria-label="Search"
          >
            <SearchIcon className="h-[17px] w-[17px] lg:h-[18px] lg:w-[18px]" />
            <span className="text-xs sm:text-sm font-medium">Search</span>
          </motion.button>
        </div>
      </div>

      {/* Floating Mobile Bottom Dock */}
      <MobileDock />

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSearch}
            className="pointer-events-auto fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-20 sm:px-6 sm:pt-28 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -12 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="liquid-glass liquid-glass-strong relative w-full max-w-lg sm:max-w-2xl rounded-[32px] p-4 sm:p-5 will-change-transform"
            >
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-2 rounded-full bg-white/10 pl-4 pr-1.5 ring-1 ring-white/10 transition focus-within:bg-white/15 focus-within:ring-white/25">
                <SearchIcon className="h-5 w-5 text-white/60" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchInput}
                  placeholder="Movies, shows, people…"
                  className="w-full bg-transparent px-1 py-3.5 text-[17px] text-white placeholder-white/40 focus:outline-none"
                  autoFocus
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  className="liquid-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 hover:text-white"
                  onClick={closeSearch}
                >
                  <XIcon className="h-4 w-4" />
                </motion.button>
              </div>
            </form>

            {showSuggestions &&
              (companySuggestions.length > 0 || suggestions.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring}
                  className="mt-4"
                >
                  <div className="relative mb-3 flex rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10">
                    {(["titles", "companies"] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`relative flex-1 rounded-full border-0 bg-transparent px-4 py-2 text-sm font-semibold transition-colors focus:outline-none ${
                          searchTab === tab ? "text-white" : "text-white/50 hover:text-white/80"
                        }`}
                        onClick={() => handleTabChange(tab)}
                      >
                        {searchTab === tab && (
                          <motion.span
                            layoutId="search-tab-pill"
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                            className="liquid-glass absolute inset-0 rounded-full !bg-white/15"
                          />
                        )}
                        <span className="relative z-10">
                          {tab === "titles" ? "Titles & People" : "Production Companies"}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-2 p-2 max-h-[60vh] overflow-y-auto">
                    {searchTab === "titles" && suggestions.length > 0 && (
                      <div>
                        <div className="flex flex-col gap-1">
                          {suggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="flex items-center gap-3 p-2 hover:bg-white/5 cursor-pointer rounded-xl transition-colors"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <div className="relative h-12 w-20">
                                <div className="animate-pulse absolute inset-0 bg-white/10 rounded-xl" />
                                <img
                                  src={tmdbImage(
                                    suggestion.backdrop_path ||
                                      suggestion.poster_path,
                                    "w300"
                                  )}
                                  loading="lazy"
                                  decoding="async"
                                  alt={suggestion.title || suggestion.name}
                                  className="h-12 w-20 object-cover rounded-xl absolute inset-0 transition-opacity duration-300"
                                  onLoad={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.opacity = "1";
                                  }}
                                  style={{ opacity: "0" }}
                                />
                              </div>
                              <div>
                                <p className="text-white font-medium text-base md:text-lg">
                                  {suggestion.title || suggestion.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-400">
                                  <span>
                                    {suggestion.media_type
                                      .charAt(0)
                                      .toUpperCase() +
                                      suggestion.media_type.slice(1)}
                                  </span>
                                  {(suggestion.release_date ||
                                    suggestion.first_air_date) && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {suggestion.release_date?.split(
                                          "-"
                                        )[0] ||
                                          suggestion.first_air_date?.split(
                                            "-"
                                          )[0]}
                                      </span>
                                    </>
                                  )}
                                  {suggestion.vote_average > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-400 font-medium">
                                        {Math.round(
                                          suggestion.vote_average * 10
                                        )}
                                        % Match
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchTab === "companies" &&
                      companySuggestions.length > 0 && (
                        <div>
                          <div className="flex flex-col gap-1">
                            {companySuggestions.map((company) => (
                              <div
                                key={company.id}
                                className="flex items-center gap-3 p-2 hover:bg-white/5 cursor-pointer rounded-xl transition-colors"
                                onClick={() => handleCompanyClick(company)}
                              >
                                <div>
                                  <p className="text-white font-medium text-base md:text-lg">
                                    {company.name}
                                  </p>
                                  <div className="text-gray-400 text-xs md:text-sm">
                                    Productions: {company.movie_count || "?"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </motion.div>
              )}
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;