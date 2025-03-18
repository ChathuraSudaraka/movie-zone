import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Camera, User, Eye, Bell, MessageSquare } from "lucide-react";
import { supabase } from "../config/supabase";
import { ActivityItem, UserPreferences } from "../types/user";
import { uploadAvatar, updateUserProfile } from "../config/supabase";
import { UserProfile } from "../components/tabs/UserProfile";
import { Activity } from "../components/tabs/activity";
import { Preferences } from "../components/tabs/Preferences";
import { Contact } from "../components/tabs/Contact";

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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // ...existing code for fetching user data...
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
    }
  }, [user, setActivities]);

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
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user?.id || !e.target.files || !e.target.files[0]) return;

      const file = e.target.files[0];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (file.size > maxSize) {
        throw new Error("File size must be less than 2MB");
      }

      setIsSaving(true);
      const publicUrl = await uploadAvatar(file, user.id);
      await updateUserProfile(user.id, { avatar_url: publicUrl });

      window.location.reload();
    } catch (error) {
      console.error("Error uploading avatar:", error);
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
                user?.user_metadata?.avatar_url ||
                `https://ui-avatars.com/api/?name=${
                  user?.email || "User"
                }&size=200`
              }
              alt={user?.email || "Profile"}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-red-600"
            />
            <label className="absolute bottom-0 right-0 p-2 bg-red-600 rounded-full hover:bg-red-700 transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Camera className="w-4 h-4 text-white" />
            </label>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user?.user_metadata?.full_name ||
                user?.email?.split("@")[0] ||
                "User Profile"}
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
              { id: "contact", label: "Contact", icon: MessageSquare },
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
            <UserProfile
              user={user}
              displayName={displayName}
              setDisplayName={setDisplayName}
              handleSaveProfile={handleSaveProfile}
              isSaving={isSaving}
            />
          )}

          {activeTab === "activity" && (
            <Activity activities={activities} loading={loading} />
          )}

          {activeTab === "preferences" && (
            <Preferences
              preferences={preferences}
              updatePreferences={updatePreferences}
            />
          )}

          {activeTab === "contact" && <Contact />}
        </div>
      </div>
    </div>
  );
}
