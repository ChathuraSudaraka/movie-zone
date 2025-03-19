import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { Camera, User, Settings, MessageSquare, LogOut, Mail, User as UserIcon, Activity, Bell } from "lucide-react";
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

  // Fetch user activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Replace this with your actual data fetching logic
        const { data, error } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
        toast.error('Failed to load activity data');
      } finally {
        setLoading(false);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user?.id || !e.target.files || !e.target.files[0]) return;

      const file = e.target.files[0];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (file.size > maxSize) {
        toast.error("File size must be less than 2MB");
        return;
      }

      setIsSaving(true);
      const publicUrl = await uploadAvatar(file, user.id);
      await updateUserProfile(user.id, { avatar_url: publicUrl });
      toast.success("Avatar updated successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
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
                  src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email || "User"}&size=200`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <label 
                className="absolute bottom-0 right-0 p-2 bg-red-600 rounded-full cursor-pointer
                         hover:bg-red-700 transition-colors duration-200"
              >
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isSaving}
                />
              </label>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {user?.user_metadata?.full_name || 'Your Name'}
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
                {user?.user_metadata?.auth_provider === 'email' && (
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
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'security', label: 'Security', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Settings },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'contact', label: 'Contact', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-400 hover:bg-zinc-800'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-zinc-900/80 rounded-xl p-6">
          {activeTab === 'profile' && (
            <UserProfile
              user={user}
              displayName={displayName}
              setDisplayName={setDisplayName}
              handleSaveProfile={handleSaveProfile}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'security' && (
            <Security />
          )}
          {activeTab === 'preferences' && (
            <Preferences
              preferences={preferences}
              updatePreferences={updatePreferences}
            />
          )}
          {activeTab === 'notifications' && (
            <Notifications />
          )}
          {activeTab === 'activity' && (
            <ActivityTab
              activities={activities}
              loading={loading}
            />
          )}
          {activeTab === 'contact' && <Contact />}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Movies Watched', value: '27', icon: Activity },
            { label: 'In Watchlist', value: '12', icon: UserIcon },
          ].map((stat, index) => (
            <div key={index} className="bg-zinc-900/80 rounded-xl p-4 text-center">
              <stat.icon className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
