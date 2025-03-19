import { createContext, useContext, useEffect, useState } from "react";
import { supabase, deleteUserAccount } from "../config/supabase";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  updateProfile: async () => {},
  deleteAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
    try {
      if (!user) return;

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Update auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: data.full_name }
      });

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    
    try {
      // Show a loading toast
      toast.loading('Deleting account...');
      
      try {
        // Delete the user account (using RPC)
        await deleteUserAccount(user.id);
        
        // Sign out after deletion
        await supabase.auth.signOut();
        
        // Dismiss loading toast and show success
        toast.dismiss();
        toast.success('Your account has been deleted');
        
        // Navigate to home page
        navigate('/');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.dismiss();
        toast.error('Failed to delete account. Please try again later.');
      }
    } catch (error) {
      console.error('Error in account deletion process:', error);
      toast.dismiss();
      toast.error('An unexpected error occurred');
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signOut, 
      updateProfile,
      deleteAccount 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
