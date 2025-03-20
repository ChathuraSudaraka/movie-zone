import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Camera,
  User,
  Settings,
  MessageSquare,
  LogOut,
  Mail,
  User as UserIcon,
  Activity,
  Bell,
  Shield,
} from "lucide-react";
import { supabase } from "../config/supabase";
import { ActivityItem, UserPreferences } from "../types/user";
import { uploadAvatar, updateUserProfile } from "../config/supabase";
import { UserProfile } from "../components/tabs/UserProfile";
import { Preferences } from "../components/tabs/Preferences";
import { Activity as ActivityTab } from "../components/tabs/activity";
import { Contact } from "../components/tabs/Contact";
import { Security } from "../components/tabs/Security";
import { Notifications } from "../components/tabs/Notifications";
import toast from "react-hot-toast";

export function Profile() {
  const { user, updateProfile } = useAuth();
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
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Update display name when user metadata changes
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
    }
  }, [user]);

  // Fetch user activities - ensuring compatibility with different table states
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Check if the table exists by querying it
        const { error: countError } = await supabase
          .from("user_activities")
          .select("*", { count: "exact", head: true });

        if (countError) {
          console.log("Error checking user_activities table:", countError);
          // Fallback to watch history
          await fetchWatchHistory();
        } else {
          // Table exists, fetch activities
          const { data, error } = await supabase
            .from("user_activities")
            .select("id, type, title, media_id, media_type, timestamp, user_id")
            .eq("user_id", user?.id || "")
            .order("timestamp", { ascending: false });

          if (error) {
            console.error("Error fetching activities:", error);
            await fetchWatchHistory();
          } else {
            setActivities(data || []);
          }
        }
      } catch (error) {
        console.error("Error in activity fetching:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    // Helper function to fetch watch history as fallback
    const fetchWatchHistory = async () => {
      try {
        const { data: watchHistoryData, error: watchHistoryError } =
          await supabase
            .from("watch_history")
            .select("media_id, title, media_type, watched_at")
            .eq("user_id", user?.id || "")
            .order("watched_at", { ascending: false });

        if (watchHistoryError) throw watchHistoryError;

        // Convert watch history to activity format
        const formattedActivities = (watchHistoryData || []).map(
          (item, index) => ({
            id: `watch-${item.media_id}-${index}`,
            type: "watch",
            title: item.title,
            media_id: item.media_id,
            media_type: item.media_type,
            timestamp: item.watched_at,
            user_id: user?.id || "",
          })
        );

        setActivities(formattedActivities);
      } catch (error) {
        console.error("Error fetching watch history:", error);
        setActivities([]);
      }
    };

    fetchActivities();
  }, [user]);

  const updatePreferences = async (
    newPreferences: Partial<UserPreferences>
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_preferences")
        .update({
          preferences: { ...preferences, ...newPreferences },
        })
        .eq("user_id", user.id);

      if (error) throw error;

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
      await updateProfile({ full_name: displayName });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out");
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="bg-zinc-900/80 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-red-600">
                <img
                  src={
                    user?.user_metadata?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${
                      user?.email || "User"
                    }&size=200`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {user?.user_metadata?.full_name || "Your Name"}
              </h1>
              <p className="text-gray-400 flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700
                           text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
                {/* Only show the Change Password button if the user didn't sign in with a provider like Google */}
                {!user?.app_metadata?.provider && (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700
                             text-white rounded-lg transition-colors"
                  >
                    Change Password
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-zinc-900/80 rounded-xl p-4">
          <div className="flex space-x-4 overflow-x-auto">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "security", label: "Security", icon: Shield },
              { id: "preferences", label: "Preferences", icon: Settings },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "activity", label: "Activity", icon: Activity },
              { id: "contact", label: "Contact", icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "bg-red-600 text-white"
                      : "text-gray-400 hover:bg-zinc-800"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-zinc-900/80 rounded-xl p-6">
          {activeTab === "profile" && (
            <UserProfile
              user={user}
              displayName={displayName}
              setDisplayName={setDisplayName}
              handleSaveProfile={handleSaveProfile}
              isSaving={isSaving}
            />
          )}
          {activeTab === "security" && <Security />}
          {activeTab === "preferences" && (
            <Preferences
              preferences={preferences}
              updatePreferences={updatePreferences}
            />
          )}
          {activeTab === "notifications" && <Notifications />}
          {activeTab === "activity" && (
            <ActivityTab activities={activities} loading={loading} />
          )}
          {activeTab === "contact" && <Contact />}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatisticsCards userId={user?.id} />
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">
              Change Password
            </h2>
            {/* Password change form would go here */}
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg"
                onClick={() => setShowPasswordChange(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg">
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// New component to handle statistics fetching and display
function StatisticsCards({ userId }: { userId?: string }) {
  const [stats, setStats] = useState({
    watched: "0",
    watchlist: "0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch watched movies count from watch_history table
        const { data: watchedData, error: watchedError } = await supabase
          .from("watch_history")
          .select("*", { count: "exact" })
          .eq("user_id", userId);

        // Fetch watchlist count from user_lists table
        const { data: watchlistData, error: watchlistError } = await supabase
          .from("user_lists")
          .select("*", { count: "exact" })
          .eq("user_id", userId);

        if (watchedError) throw watchedError;
        if (watchlistError) throw watchlistError;

        setStats({
          watched: String(watchedData?.length || 0),
          watchlist: String(watchlistData?.length || 0),
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const statsData = [
    { label: "Movies Watched", value: stats.watched, icon: Activity },
    { label: "In Watchlist", value: stats.watchlist, icon: UserIcon },
  ];

  return (
    <>
      {statsData.map((stat, index) => (
        <div key={index} className="bg-zinc-900/80 rounded-xl p-4 text-center">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              <stat.icon className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </>
          )}
        </div>
      ))}
    </>
  );
}
