
import { useAuth } from "@/context/authContext";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/database";
type Notification = Tables<"notifications">;
import { useState, useEffect, useCallback } from "react"
interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | "follow" | "like" | "comment" | "system"
  read: boolean
  action_url?: string
  metadata?: Record<string, any>
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", `${user?.id}`)
        .order("created_at", { ascending: false });


      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter((n) => !n.read).length || 0)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications"
      );
    } finally {
      setLoading(false)
    }
  }, [user])

  // Create a new notification
  const createNotification = useCallback(
    async (notification: Omit<Notification, "id" | "user_id" | "created_at">) => {
      if (!user) return

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
          .single()

        if (error) throw error

        // Add to local state
        setNotifications((prev) => [data, ...prev])
        if (!notification.read) {
          setUnreadCount((prev) => prev + 1)
        }

        return data
      } catch (err) {
        console.error("Error creating notification:", err)
        throw err
      }
    },
    [user]
  )

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
      throw err
    }
  }, [user])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (error) throw error

      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === notificationId)
        if (notification && !notification.read) {
          setUnreadCount((count) => Math.max(0, count - 1))
        }
        return prev.filter((n) => n.id !== notificationId)
      })
    } catch (err) {
      console.error("Error deleting notification:", err)
      throw err
    }
  }, [])

  // Delete multiple notifications
  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      const { error } = await supabase.from("notifications").delete().in("id", notificationIds)

      if (error) throw error

      setNotifications((prev) => {
        const deletedNotifications = prev.filter((n) => notificationIds.includes(n.id))
        const unreadDeleted = deletedNotifications.filter((n) => !n.read).length
        setUnreadCount((count) => Math.max(0, count - unreadDeleted))
        return prev.filter((n) => !notificationIds.includes(n.id))
      })
    } catch (err) {
      console.error("Error deleting notifications:", err)
      throw err
    }
  }, [])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    return false
  }, [])

  // Show browser notification
  const showBrowserNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      const hasPermission = await requestNotificationPermission()
      if (!hasPermission) return

      return new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      })
    },
    [requestNotificationPermission]
  )

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return

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
      .subscribe()

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchNotifications, user]);

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
  }
}