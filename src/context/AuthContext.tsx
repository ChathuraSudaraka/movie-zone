import { createContext, useContext } from "react";

// Auth is removed — this stub keeps all imports working without Supabase.
interface AuthContextType {
  user: null;
  loading: false;
  signOut: () => Promise<void>;
  updateProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: async () => {},
  updateProfile: async () => {},
  deleteAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        signOut: async () => {},
        updateProfile: async () => {},
        deleteAccount: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
