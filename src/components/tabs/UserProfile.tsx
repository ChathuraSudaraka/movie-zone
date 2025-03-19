import { FormEvent, useState } from "react";
import { User } from "@supabase/supabase-js";
import { useWatchHistory } from "../../hooks/useWatchHistory";
import { PLACEHOLDER_IMAGE } from "../../utils/constants";
import { History, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserProfileProps {
  user: User | null;
  displayName: string;
  setDisplayName: (name: string) => void;
  handleSaveProfile: (e: FormEvent) => Promise<void>;
  isSaving: boolean;
}

export function UserProfile({
  user,
  displayName,
  setDisplayName,
  handleSaveProfile,
  isSaving,
}: UserProfileProps) {
  const {
    watchHistory,
    loading: watchHistoryLoading,
    clearHistory,
  } = useWatchHistory();
  const navigate = useNavigate();
  const [historyPage, setHistoryPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv">("all");

  const renderWatchHistory = () => {
    if (watchHistoryLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
        </div>
      );
    }

    const filteredHistory = watchHistory.filter((item) =>
      filterType === "all" ? true : item.mediaType === filterType
    );
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const currentItems = filteredHistory.slice(
      (historyPage - 1) * itemsPerPage,
      historyPage * itemsPerPage
    );

    return (
      <div className="space-y-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Watch History</h2>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-zinc-800 text-white text-sm rounded-md px-3 py-1.5 border border-zinc-700"
            >
              <option value="all">All</option>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
            </select>
          </div>
          {watchHistory.length > 0 && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to clear your watch history?"
                  )
                ) {
                  clearHistory();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600/10 text-red-500 rounded-md hover:bg-red-600/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          )}
        </div>

        {/* History Grid */}
        {currentItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentItems.map((item) => (
                <div
                  key={`${item.id}-${item.watchedAt}`}
                  onClick={() => navigate(`/info/${item.mediaType}/${item.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[2/3] rounded-md overflow-hidden mb-2">
                    <img
                      src={item.posterPath || PLACEHOLDER_IMAGE}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-white font-medium line-clamp-1 group-hover:text-red-500 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {new Date(item.watchedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setHistoryPage(page)}
                      className={`w-8 h-8 rounded-full text-sm transition-colors ${
                        historyPage === page
                          ? "bg-red-600 text-white"
                          : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-zinc-800/30 rounded-lg">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No watch history yet</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Profile Information
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-red-500 focus:ring-red-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-md text-gray-400 cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div>
        <div className="space-y-4">{renderWatchHistory()}</div>
      </div>
    </div>
  );
}
