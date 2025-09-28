import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BellIcon,
  ChevronDownIcon,
  SearchIcon,
  UserCircle2,
  XIcon,
} from "lucide-react";
import { baseUrl } from "@/utils/requests";
import { Movie } from "../types/movie";
import { NotificationDialog } from "./common/NotificationDialog";
import { useAuth } from "../context/AuthContext";

interface SearchResult extends Movie {
  media_type: "movie" | "tv" | string;
}

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [searchTab, setSearchTab] = useState<"titles" | "companies">("titles");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "TV Shows", href: "/tv" },
    { name: "Movies", href: "/movies" },
    // { name: 'New & Popular', href: '/new' },
    { name: "My List", href: "/my-list" },
    { name: "Donate", href: "/donate" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setShowSearch(false);
      setSearchTerm("");
    }
  };

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
          input
        )}&page=1&include_adult=false`
      );
      const data = await response.json();
      const filteredSuggestions = data.results
        .filter(
          (item: SearchResult) =>
            (item.media_type === "movie" || item.media_type === "tv") &&
            (item.backdrop_path || item.poster_path)
        );
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  // Filter out companies with no productions and sort by most productions
  const getValidCompanySuggestions = async (companies: any[]) => {
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const companyCounts: { company: any; count: number }[] = [];
    for (const company of companies) {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_companies=${company.id}&language=en-US&page=1`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          // Attach movie_count to the company object
          companyCounts.push({
            company: {
              ...company,
              movie_count: data.total_results || data.results.length,
            },
            count: data.total_results || data.results.length,
          });
        }
      } catch {}
    }
    // Sort by most productions
    companyCounts.sort((a, b) => b.count - a.count);
    return companyCounts.map((item) => item.company);
  };

  const fetchCompanySuggestions = async (input: string) => {
    if (!input || input.length < 2) {
      setCompanySuggestions([]);
      return;
    }
    try {
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
      const response = await fetch(
        `https://api.themoviedb.org/3/search/company?api_key=${API_KEY}&query=${encodeURIComponent(
          input
        )}`
      );
      const data = await response.json();
      // Only show companies with at least one production
      const validCompanies = await getValidCompanySuggestions(
        data.results || []
      );
      setCompanySuggestions(validCompanies);
    } catch (error) {
      setCompanySuggestions([]);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length >= 2) {
      fetchSuggestions(value);
      fetchCompanySuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setCompanySuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    const type =
      suggestion.media_type || (suggestion.first_air_date ? "tv" : "movie");
    navigate(`/info/${type}/${suggestion.id}`);
    setShowSearch(false);
    setSearchTerm("");
    setSuggestions([]);
    setCompanySuggestions([]);
    setShowSuggestions(false);
  };

  const handleCompanyClick = async (company: any) => {
    // Check if the company has at least one production
    try {
      const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_companies=${company.id}&language=en-US&page=1`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        navigate(`/search?company=${company.id}`);
        setShowSearch(false);
        setSearchTerm("");
        setSuggestions([]);
        setCompanySuggestions([]);
        setShowSuggestions(false);
      } else {
        alert("No productions found for this company.");
      }
    } catch (error) {
      alert("Failed to check company productions.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header
      className={`${
        isScrolled
          ? "bg-[#141414]"
          : "bg-gradient-to-b from-black/80 to-transparent"
      } fixed top-0 z-50 w-full transition-colors duration-300`}
    >
      <div className="flex w-full items-center justify-between h-[35px] px-4 md:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4 sm:gap-8">
          <p
            onClick={() => navigate("/")}
            className="text-lg sm:text-xl md:text-2xl font-bold cursor-pointer 
                     text-red-600 hover:text-red-500 transition"
          >
            MovieZone
          </p>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`text-sm font-medium headerLink group relative ${
                  location.pathname === item.href
                    ? "text-white"
                    : "text-[#e5e5e5] hover:text-white"
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 h-[2px] bg-red-600 transition-all duration-200 ${
                    location.pathname === item.href
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  }`}
                />
              </button>
            ))}
          </nav>

          {/* Mobile Navigation */}
          <div className="relative lg:hidden">
            <button
              className="flex items-center gap-1 text-sm font-medium text-white/90 
                       hover:text-white py-1 px-2"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <span>Browse</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform duration-200 
                         ${showMobileMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showMobileMenu && (
              <div
                className="absolute top-full left-0 mt-1 w-48 sm:w-64 
                           bg-black/95 border border-zinc-700 rounded-md shadow-lg 
                           overflow-hidden animate-in fade-in slide-in-from-top-4"
              >
                <div className="py-2">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-left text-sm transition-colors
                        ${
                          location.pathname === item.href
                            ? "bg-red-600/10 text-white font-medium"
                            : "text-gray-300 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      {item.name}
                      {location.pathname === item.href && (
                        <div className="ml-auto w-1 h-4 bg-red-600 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          {/* Search Button */}
          <button
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setShowSearch(true)}
          >
            <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>

          {/* Notifications */}
          {user && (
            <button
              className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
              onClick={() => setIsNotificationOpen(true)}
            >
              <BellIcon className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
            </button>
          )}

          <NotificationDialog
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />

          <div className="relative">
            <button
              className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user ? (
                <>
                  <img
                    src={
                      user?.user_metadata?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${
                        user?.email || "User"
                      }&size=200`
                    }
                    alt={user?.email || "Profile"}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                  />

                  <ChevronDownIcon
                    className={`w-4 h-4 text-white transition-transform duration-200 ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </>
              ) : (
                <UserCircle2 className="w-6 h-6 text-gray-300" />
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-md bg-black/95 border border-zinc-800 shadow-xl animate-in fade-in slide-in-from-top-2">
                {user ? (
                  <div className="divide-y divide-zinc-800">
                    <div className="px-4 py-3">
                      <p className="text-sm font-medium text-white truncate">
                        {user.user_metadata?.full_name ||
                          user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      {[
                        { label: "Profile Settings", href: "/profile" },
                        { label: "Subtitles", href: "/subtitle" },
                        { label: "My List", href: "/my-list" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            navigate(item.href);
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-1">
                    <Link
                      to="/auth/login"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth/register"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 
                     px-4 sm:px-6 bg-black/60"
        >
          <div className="relative w-full max-w-lg sm:max-w-2xl bg-[#141414] p-4 sm:p-6 rounded-lg">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
              onClick={() => {
                setShowSearch(false);
                setSearchTerm("");
                setSuggestions([]);
                setCompanySuggestions([]);
                setShowSuggestions(false);
              }}
            >
              <XIcon className="h-6 w-6" />
            </button>
            <form onSubmit={handleSearch} className="mt-4">
              <div className="flex items-center border-b-2 border-gray-600 focus-within:border-white">
                <SearchIcon className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchInput}
                  placeholder="Titles, people, genres"
                  className="w-full bg-transparent px-4 py-2 text-white placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
              </div>
            </form>

            {showSuggestions &&
              (companySuggestions.length > 0 || suggestions.length > 0) && (
                <div className="mt-4 bg-zinc-900/90 rounded-lg shadow-xl">
                  <div className="flex border-b border-zinc-800 mb-2">
                    <button
                      className={`px-4 py-2 text-sm font-semibold focus:outline-none transition-colors ${
                        searchTab === "titles"
                          ? "text-white border-b-2 border-red-600"
                          : "text-gray-400"
                      }`}
                      onClick={() => setSearchTab("titles")}
                    >
                      Titles & People
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-semibold focus:outline-none transition-colors ${
                        searchTab === "companies"
                          ? "text-white border-b-2 border-red-600"
                          : "text-gray-400"
                      }`}
                      onClick={() => setSearchTab("companies")}
                    >
                      Production Companies
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 p-2 max-h-[60vh] overflow-y-auto">
                    {searchTab === "titles" && suggestions.length > 0 && (
                      <div>
                        <div className="flex flex-col gap-1">
                          {suggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="flex items-center gap-3 p-2 hover:bg-zinc-800 cursor-pointer rounded"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <div className="relative h-12 w-20">
                                <div className="animate-pulse absolute inset-0 bg-gray-700 rounded" />
                                <img
                                  src={`${baseUrl}${
                                    suggestion.backdrop_path ||
                                    suggestion.poster_path
                                  }`}
                                  alt={suggestion.title || suggestion.name}
                                  className="h-12 w-20 object-cover rounded absolute inset-0 transition-opacity duration-300"
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
                                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
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
                                      <span className="text-green-400">
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
                                className="flex items-center gap-3 p-2 hover:bg-zinc-800 cursor-pointer rounded"
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
                </div>
              )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
