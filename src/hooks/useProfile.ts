// Profile management is no longer needed without Supabase auth.
export function useProfile() {
  return {
    profile: null,
    loading: false,
    updateProfile: async () => {},
  };
}
