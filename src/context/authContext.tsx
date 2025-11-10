import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";

interface UserProfile {
  avatar_url: string | null;
  banner_url: string | null;
  display_name: string | null;
  username: string | null;
  role: string | null; // Added for access control (e.g. 'staff')
}

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: any }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("avatar_url, banner_url, display_name, username, role")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error.message);
      setUserProfile(null);
    } else {
      setUserProfile(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);
      if (currentUser) fetchUserProfile(currentUser.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);
      if (currentUser) fetchUserProfile(currentUser.id);
      else setUserProfile(null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      // Log for debugging
      if (error) {
        console.error('Signup error:', error);
      }
      
      // If error is about email confirmation, the account was likely created
      // but email sending failed. Supabase requires email confirmation before sign-in.
      if (error && error.message?.includes('confirmation email')) {
        // Check if user data was returned (account was created)
        if (data?.user) {
          // Account was created successfully, but email confirmation is required
          // Return success with a helpful message
          return { 
            data, 
            error: { 
              message: 'Account created! However, the confirmation email could not be sent. Please contact support or try signing in - your account may still work.' 
            } 
          };
        } else {
          // Account creation might have failed, return error
          return { 
            data, 
            error: { 
              message: 'Account creation may have failed due to email service issues. Please try again or contact support.' 
            } 
          };
        }
      }
      
      return { data, error };
    } catch (err: any) {
      console.error('Signup exception:', err);
      return { 
        data: null, 
        error: { 
          message: err?.message || 'Failed to create account. Please try again.' 
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, userProfile, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
