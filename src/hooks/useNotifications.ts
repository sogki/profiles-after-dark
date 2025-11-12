import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/authContext";
import { Tables } from "@/types/database";

type Notification = Tables<"notifications">;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Setup real-time subscription
  useEffect(() => {
    if (!user) {
      // Clean up channel if user logs out
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(() => {});
        channelRef.current = null;
      }
      return;
    }

    let isMounted = true;
    const channelName = `notifications:${user.id}`;

    // Clean up any existing channel with the same name first
    const existingChannels = supabase.getChannels();
    const existingChannel = existingChannels.find(
      (ch) => ch.topic === `realtime:${channelName}`
    );
    
    if (existingChannel) {
      supabase.removeChannel(existingChannel).catch(() => {});
    }

    // Clean up ref channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current).catch(() => {});
      channelRef.current = null;
    }

    // Small delay to ensure cleanup completes (helps with React StrictMode)
    const setupChannel = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!isMounted || !user) return;

      // Double-check no channel exists
      const channels = supabase.getChannels();
      const duplicateChannel = channels.find(
        (ch) => ch.topic === `realtime:${channelName}`
      );
      
      if (duplicateChannel) {
        supabase.removeChannel(duplicateChannel).catch(() => {});
      }

      // Create new channel
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      });

      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;

            if (payload.eventType === "INSERT") {
              const newNotification = payload.new as Notification;
              setNotifications((prev) => {
                // Avoid duplicates
                if (prev.some((n) => n.id === newNotification.id)) {
                  return prev;
                }
                return [newNotification, ...prev];
              });
              if (!newNotification.read) {
                setUnreadCount((prev) => prev + 1);
                // Show browser notification if permission granted
                if ("Notification" in window && Notification.permission === "granted") {
                  const notificationContent = (newNotification as any).content || newNotification.message || "New Notification";
                  new Notification("New Notification", {
                    body: notificationContent,
                    icon: "/favicon.ico",
                    badge: "/favicon.ico",
                  });
                }
              }
            } else if (payload.eventType === "UPDATE") {
              const updatedNotification = payload.new as Notification;
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === updatedNotification.id ? updatedNotification : n
                )
              );
              const oldNotification = payload.old as Notification;
              if (oldNotification.read !== updatedNotification.read) {
                setUnreadCount((prev) =>
                  updatedNotification.read ? Math.max(0, prev - 1) : prev + 1
                );
              }
            } else if (payload.eventType === "DELETE") {
              const deletedNotification = payload.old as Notification;
              setNotifications((prev) =>
                prev.filter((n) => n.id !== deletedNotification.id)
              );
              if (!deletedNotification.read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }
          }
        )
        .subscribe((status) => {
          if (!isMounted) return;
          
          if (status === "SUBSCRIBED") {
            console.log("Subscribed to notifications channel");
          } else if (status === "CHANNEL_ERROR") {
            console.error("Channel subscription error");
          }
        });

      if (isMounted) {
        channelRef.current = channel;
      } else {
        // Component unmounted before channel was set, clean it up
        supabase.removeChannel(channel).catch(() => {});
      }
    };

    setupChannel();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(() => {});
        channelRef.current = null;
      }
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