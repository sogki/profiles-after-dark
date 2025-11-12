import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/authContext";

/**
 * Hook to update user's last_activity timestamp periodically
 * This enables real-time online status tracking
 */
export function useUpdateActivity() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Update activity immediately
    const updateActivity = async () => {
      try {
        await supabase
          .from("user_profiles")
          .update({ last_activity: new Date().toISOString() } as any)
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Error updating activity:", error);
      }
    };

    // Update on mount
    updateActivity();

    // Update every 30 seconds while user is active
    const interval = setInterval(updateActivity, 30000);

    // Update on page visibility change (when user switches tabs back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateActivity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Update on mouse movement (user is active)
    let activityTimeout: NodeJS.Timeout;
    const handleActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(updateActivity, 5000); // Debounce to 5 seconds
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      clearInterval(interval);
      clearTimeout(activityTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [user]);
}

/**
 * Hook to check if a user is online based on last_activity
 * A user is considered online if their last_activity was within the last 5 minutes
 */
export function useIsUserOnline(userId?: string) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastActivity, setLastActivity] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsOnline(false);
      setLastActivity(null);
      return;
    }

    let mounted = true;

    const checkOnlineStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("last_activity, show_online_status")
          .eq("user_id", userId)
          .single();

        if (error) throw error;

        if (!mounted) return;

        if (!data?.show_online_status) {
          setIsOnline(false);
          setLastActivity(null);
          return;
        }

        const activity = data.last_activity;
        setLastActivity(activity);

        if (!activity) {
          setIsOnline(false);
          return;
        }

        // Check if last activity was within 5 minutes
        const lastActivityTime = new Date(activity).getTime();
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        
        // Only show as online if activity was within the last 5 minutes
        // Also ensure the timestamp is valid (not in the future)
        const isValidTime = lastActivityTime <= now;
        const isRecentActivity = lastActivityTime > fiveMinutesAgo;

        const newIsOnline = isValidTime && isRecentActivity;
        
        // Only update state if it changed to prevent unnecessary re-renders
        setIsOnline(prev => prev !== newIsOnline ? newIsOnline : prev);
      } catch (error) {
        console.error("Error checking online status:", error);
        if (mounted) {
          setIsOnline(false);
        }
      }
    };

    checkOnlineStatus();

    // Check every 30 seconds
    const interval = setInterval(checkOnlineStatus, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  return { isOnline, lastActivity };
}


