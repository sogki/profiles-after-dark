import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/authContext";
import { Tables } from "@/types/database";

type Notification = Tables<"notifications">;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter((n: Notification) => !n.read).length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new notification
  const createNotification = useCallback(
    async (notification: Omit<Notification, "id" | "user_id" | "created_at">) => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("notifications")
          .insert([
            {
              ...notification,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setNotifications((prev) => [data, ...prev]);
        if (!notification.read) {
          setUnreadCount((prev) => prev + 1);
        }

        return data;
      } catch (err) {
        console.error("Error creating notification:", err);
        throw err;
      }
    },
    [user]
  );

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      throw err;
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (err) {
      console.error("Error deleting notification:", err);
      throw err;
    }
  }, []);

  // Delete multiple notifications
  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", notificationIds);

      if (error) throw error;

      setNotifications((prev) => {
        const deletedNotifications = prev.filter((n) => notificationIds.includes(n.id));
        const unreadDeleted = deletedNotifications.filter((n) => !n.read).length;
        setUnreadCount((count) => Math.max(0, count - unreadDeleted));
        return prev.filter((n) => !notificationIds.includes(n.id));
      });
    } catch (err) {
      console.error("Error deleting notifications:", err);
      throw err;
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      return new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    },
    [requestNotificationPermission]
  );

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            if (!(payload.new as Notification).read) {
              setUnreadCount((prev) => prev + 1);
            }
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === (payload.new as Notification).id
                  ? (payload.new as Notification)
                  : n
              )
            );
            setUnreadCount(
              (prev) =>
                prev +
                ((payload.new as Notification).read
                  ? -1
                  : (payload.old as Notification).read
                  ? 1
                  : 0)
            );
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== payload.old.id)
            );
            if (!(payload.old as Notification).read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteNotifications,
    requestNotificationPermission,
    showBrowserNotification,
  };
}