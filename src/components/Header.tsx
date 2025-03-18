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
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "TV Shows", href: "/tv" },
    { name: "Movies", href: "/movies" },
    // { name: 'New & Popular', href: '/new' },
    { name: "My List", href: "/my-list" },
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
        )
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length >= 2) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
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
    setShowSuggestions(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
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
        <div className="flex items-center space-x-8">
          <p
            onClick={() => navigate("/")}
            className="text-2xl font-bold cursor-pointer text-red-600 hover:text-red-500 transition"
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
              className="flex items-center space-x-1.5 text-sm font-medium text-white"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <span>Browse</span>
              <ChevronDownIcon
                className={`w-4 h-4 transition duration-200 ${
                  showMobileMenu ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            {showMobileMenu && (
              <div className="absolute top-8 left-0 bg-black/95 border border-gray-700 p-2 w-56 rounded-md animate-fade-in">
                <div className="flex flex-col space-y-2">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setShowMobileMenu(false);
                      }}
                      className={`px-3 py-2 text-sm rounded-md transition ${
                        location.pathname === item.href
                          ? "bg-red-600/20 text-white font-medium"
                          : "text-[#e5e5e5] hover:bg-white/10"
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-6">
          <button
            className="hover:scale-110 transition"
            onClick={() => setShowSearch(true)}
          >
            <SearchIcon className="h-5 w-5" />
          </button>
          
          {user && ( // Only show notification button for logged-in users
            <button
              className="hover:scale-110 transition relative"
              onClick={() => setIsNotificationOpen(true)}
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-600 rounded-full"></span>
            </button>
          )}
          
          <NotificationDialog
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />

          <div className="relative">
            <button
              className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-800 transition-colors duration-200"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user ? (
                <>
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`}
                    alt={user.displayName || 'User'}
                    className="h-6 w-6 rounded-full"
                  />
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </>
              ) : (
                <UserCircle2 className="h-6 w-6 text-gray-300" />
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-md bg-zinc-900 border border-zinc-800 shadow-xl animate-fade-in z-50">
                {user ? (
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-zinc-700">
                      <p className="text-sm text-white">{user.displayName || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => navigate('/profile')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-red-600/10 hover:text-white transition"
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={() => navigate('/my-list')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-red-600/10 hover:text-white transition"
                      >
                        My List
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-red-600/10 hover:text-white transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    <Link
                      to="/auth/login"
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-red-600/10 hover:text-white transition"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/auth/register"
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-red-600/10 hover:text-white transition"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60">
          <div className="relative w-full max-w-2xl bg-[#141414] p-6 rounded-lg">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
              onClick={() => {
                setShowSearch(false);
                setSearchTerm("");
                setSuggestions([]);
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

            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer rounded-lg"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <img
                      src={`${baseUrl}${
                        suggestion.backdrop_path || suggestion.poster_path
                      }`}
                      alt={suggestion.title || suggestion.name}
                      className="h-16 w-28 object-cover rounded"
                    />
                    <div>
                      <p className="text-white font-medium text-lg">
                        {suggestion.title || suggestion.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>
                          {suggestion.media_type.charAt(0).toUpperCase() +
                            suggestion.media_type.slice(1)}
                        </span>
                        {(suggestion.release_date ||
                          suggestion.first_air_date) && (
                          <>
                            <span>•</span>
                            <span>
                              {suggestion.release_date?.split("-")[0] ||
                                suggestion.first_air_date?.split("-")[0]}
                            </span>
                          </>
                        )}
                        {suggestion.vote_average > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-green-400">
                              {Math.round(suggestion.vote_average * 10)}% Match
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
