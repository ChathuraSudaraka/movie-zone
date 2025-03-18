import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Camera, User, Eye, Bell, Film, ThumbsUp, History, Trash2 } from "lucide-react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import type { ActivityItem, UserPreferences } from "../types/user";
import { PLACEHOLDER_IMAGE } from "../utils/constants";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { useNavigate } from "react-router-dom";

export function Profile() {
  const { user } = useAuth();
  const { watchHistory, loading: watchHistoryLoading, clearHistory } = useWatchHistory();
  const [activeTab, setActiveTab] = useState("profile");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    newReleaseAlerts: true,
    watchlistUpdates: true,
    recommendationEmails: true,
    language: "en",
    autoplayTrailers: true,
    defaultPlaybackQuality: "auto",
  });
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const [historyPage, setHistoryPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userDoc = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          const data = userSnapshot.data();
          setActivities(data.activities || []);
          setPreferences(data.preferences || preferences);
        } else {
          // Initialize user document
          await setDoc(userDoc, {
            watchHistory: [],
            activities: [],
            preferences,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const updatePreferences = async (
    newPreferences: Partial<UserPreferences>
  ) => {
    if (!user) return;

    try {
      const userDoc = doc(db, "users", user.uid);
      await updateDoc(userDoc, {
        preferences: { ...preferences, ...newPreferences },
      });
      setPreferences((prev) => ({ ...prev, ...newPreferences }));
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      const userDoc = doc(db, "users", user.uid);
      await updateDoc(userDoc, {
        displayName,
        updatedAt: new Date().toISOString(),
      });
      // Optional: Update Firebase auth profile
      // await updateProfile(user, { displayName });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderWatchHistory = () => {
    if (watchHistoryLoading && watchHistory.length === 0) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
        </div>
      );
    }

    const filteredHistory = watchHistory.filter(item => 
      filterType === 'all' ? true : item.mediaType === filterType
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
                if (window.confirm('Are you sure you want to clear your watch history?')) {
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                ))}
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
    <div className="min-h-screen bg-[#141414] py-28 px-4 md:px-8">
      {/* Profile Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="relative">
            <img
              src={
                user?.photoURL ||
                `https://ui-avatars.com/api/?name=${
                  user?.displayName || "User"
                }&size=200`
              }
              alt={user?.displayName || "Profile"}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-red-600"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-red-600 rounded-full hover:bg-red-700 transition">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user?.displayName || "User Profile"}
            </h1>
            <p className="text-gray-400 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-zinc-800">
          <nav className="flex space-x-8">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "activity", label: "Activity", icon: Eye },
              { id: "preferences", label: "Preferences", icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-red-600 text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Sections */}
        <div className="py-8">
          {activeTab === "profile" && (
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
                    <label className="text-sm font-medium text-gray-400">
                      Email
                    </label>
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
                <h2 className="text-xl font-semibold text-white mb-4">
                  Watch History
                </h2>
                <div className="space-y-4">
                  {renderWatchHistory()}
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Recent Activity
              </h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="p-2 bg-zinc-700 rounded">
                        {activity.type === "watch" && (
                          <History className="w-5 h-5 text-blue-400" />
                        )}
                        {activity.type === "like" && (
                          <ThumbsUp className="w-5 h-5 text-green-400" />
                        )}
                        {activity.type === "add_to_list" && (
                          <Film className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">
                          {activity.type === "watch" && "Watched"}
                          {activity.type === "like" && "Liked"}
                          {activity.type === "add_to_list" &&
                            "Added to list"}{" "}
                          <span className="font-medium">{activity.title}</span>
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No recent activity
                </p>
              )}
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="max-w-2xl space-y-8">
              <h2 className="text-xl font-semibold text-white mb-6">
                Notification Preferences
              </h2>

              <div className="space-y-4">
                {[
                  { id: "emailNotifications", label: "Email Notifications" },
                  { id: "pushNotifications", label: "Push Notifications" },
                  { id: "newReleaseAlerts", label: "New Release Alerts" },
                  { id: "watchlistUpdates", label: "Watchlist Updates" },
                  {
                    id: "recommendationEmails",
                    label: "Recommendation Emails",
                  },
                ].map(({ id, label }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                  >
                    <label className="text-white">{label}</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          preferences[id as keyof UserPreferences] as boolean
                        }
                        onChange={(e) =>
                          updatePreferences({ [id]: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer 
                        peer-checked:after:translate-x-full peer-checked:after:border-white 
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                        after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
                        peer-checked:bg-red-600"
                      ></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">
                  Playback Settings
                </h3>
                <div className="grid gap-4">
                  <div className="p-4 bg-zinc-800/50 rounded-lg">
                    <label className="block text-white mb-2">
                      Default Playback Quality
                    </label>
                    <select
                      value={preferences.defaultPlaybackQuality}
                      onChange={(e) =>
                        updatePreferences({
                          defaultPlaybackQuality: e.target.value as any,
                        })
                      }
                      className="w-full bg-zinc-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="auto">Auto</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                      <option value="4k">4K</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                    <label className="text-white">Autoplay Trailers</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.autoplayTrailers}
                        onChange={(e) =>
                          updatePreferences({
                            autoplayTrailers: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer 
                        peer-checked:after:translate-x-full peer-checked:after:border-white 
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                        after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
                        peer-checked:bg-red-600"
                      ></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
