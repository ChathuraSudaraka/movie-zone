import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Settings,
  MessageSquare,
  LogOut,
  Mail,
  User as UserIcon,
  Bell,
  Shield,
} from "lucide-react";
import { supabase } from "../config/supabase";
import { UserPreferences } from "../types/user";
import { UserProfile } from "../components/tabs/UserProfile";
import { Preferences } from "../components/tabs/Preferences";
import { Contact } from "../components/tabs/Contact";
import { Security } from "../components/tabs/Security";
import { Notifications } from "../components/tabs/Notifications";
import toast from "react-hot-toast";

export function Profile() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
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
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    document.title = `Profile - MovieZone`;

    if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
    }
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
      window.location.href = "/";
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
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
                {/* Only show the Change Password button if the user didn't sign in with a provider like Google */}
                {!user?.app_metadata?.provider && (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
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
        const { count: watchedCount, error: watchedError } = await supabase
          .from("watch_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        // Fetch watchlist count from user_lists table
        const { count: watchlistCount, error: watchlistError } = await supabase
          .from("user_lists")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        if (watchedError) throw watchedError;
        if (watchlistError) throw watchlistError;
        setStats({
          watched: String(watchedCount ?? 0),
          watchlist: String(watchlistCount ?? 0),
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
    { label: "Movies Watched", value: stats.watched, icon: UserIcon },
    { label: "In Watchlist", value: stats.watchlist, icon: UserIcon },
  ];
  return (
    <>
      {statsData.map((stat, index) => (
        <div key={index} className="bg-zinc-900/80 rounded-xl p-4 text-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse mb-2" />
              <div className="h-6 w-12 bg-zinc-800 animate-pulse rounded mb-1" />
              <div className="h-3 w-20 bg-zinc-800 animate-pulse rounded" />
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
