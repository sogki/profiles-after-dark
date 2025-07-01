import { useAuth } from "@/context/authContext";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
import { useCallback, useEffect, useState } from "react";

type Notification = Tables<"notifications">;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", `${user?.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: now } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    if (!user?.id) return;

    // Subscribe to notifications for this user
    const subscription = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          // payload has eventType and new/old records
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === (payload.new as Notification).id
                  ? (payload.new as Notification)
                  : n
              )
            );
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchNotifications, user]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
  };
}
