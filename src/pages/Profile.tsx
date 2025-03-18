import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Camera, User, Eye, Bell, Film, ThumbsUp, History } from "lucide-react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import type { ActivityItem, UserPreferences } from "../types/user";
import { PLACEHOLDER_IMAGE } from "../utils/constants";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { useNavigate } from "react-router-dom";

export function Profile() {
  const { user } = useAuth();
  const { watchHistory, loading: watchHistoryLoading } = useWatchHistory();
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
                  {watchHistoryLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent" />
                    </div>
                  ) : watchHistory.length > 0 ? (
                    watchHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-700/50"
                        onClick={() =>
                          navigate(`/info/${item.mediaType}/${item.id}`)
                        }
                      >
                        <img
                          src={item.posterPath || PLACEHOLDER_IMAGE}
                          alt={item.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="text-white font-medium">{item.title}</p>
                          <p className="text-sm text-gray-400">
                            Watched{" "}
                            {new Date(item.watchedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">
                      No watch history yet
                    </p>
                  )}
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
