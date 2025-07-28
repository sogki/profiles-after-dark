import { useState, useEffect, useRef, forwardRef } from "react"
import { Bell, X, Check, Trash2, Settings, Filter, MoreHorizontal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../context/authContext"
import { supabase } from "../lib/supabase"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"

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

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  onNotificationClick?: (notification: Notification) => void
}

const NotificationCenter = forwardRef<HTMLDivElement, NotificationCenterProps>(
  ({ isOpen, onClose, onNotificationClick }, ref) => {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
    const [showFilters, setShowFilters] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const navigate = useNavigate()

    // Merge forwarded ref with internal ref
    const mergedRef = ref || containerRef

    useEffect(() => {
      if (isOpen && user) {
        loadNotifications()
        setupRealtimeSubscription()
      }

      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe()
          subscriptionRef.current = null
        }
      }
    }, [isOpen, user])

    const loadNotifications = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)
        
        if (error) throw error

        const transformedData: Notification[] = (data || []).map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          title: item.content || "Notification",
          message: item.content || "",
          type: ["info", "success", "warning", "error", "follow", "like", "comment", "system"].includes(item.type)
            ? (item.type as Notification["type"])
            : "info",
          read: item.read ?? false,
          created_at: item.created_at ?? new Date().toISOString(),
          action_url: item.action_url,
          metadata: item.metadata,
        }))

        setNotifications(transformedData)
      } catch (error: any) {
        console.error("Error loading notifications:", error.message, error)
        toast.error("Failed to load notifications")
      } finally {
        setLoading(false)
      }
    }

    const requestNotificationPermission = async () => {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission()
        return permission === "granted"
      }
      return Notification.permission === "granted"
    }

    const setupRealtimeSubscription = () => {
      if (!user) return

      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }

      subscriptionRef.current = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              const newNotification: Notification = {
                id: payload.new.id,
                user_id: payload.new.user_id,
                title: payload.new.content || "Notification",
                message: payload.new.content || "",
                type: ["info", "success", "warning", "error", "follow", "like", "comment", "system"].includes(payload.new.type)
                  ? (payload.new.type as Notification["type"])
                  : "info",
                read: payload.new.read ?? false,
                created_at: payload.new.created_at ?? new Date().toISOString(),
                action_url: payload.new.action_url,
                metadata: payload.new.metadata,
              }

              setNotifications((prev) => [newNotification, ...prev])
              
              if (await requestNotificationPermission()) {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: "/favicon.ico",
                  tag: newNotification.id,
                })
              }
              
              toast.success(newNotification.message, { duration: 4000 })
              
              playNotificationSound()
            } else if (payload.eventType === "UPDATE") {
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === payload.new.id
                    ? {
                        ...n,
                        title: payload.new.content || n.title,
                        message: payload.new.content || n.message,
                        type: ["info", "success", "warning", "error", "follow", "like", "comment", "system"].includes(payload.new.type)
                          ? (payload.new.type as Notification["type"])
                          : n.type,
                        read: payload.new.read ?? n.read,
                        created_at: payload.new.created_at ?? n.created_at,
                        action_url: payload.new.action_url,
                        metadata: payload.new.metadata,
                      }
                    : n
                )
              )
            } else if (payload.eventType === "DELETE") {
              setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
            }
          }
        )
        .subscribe()

      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe()
          subscriptionRef.current = null
        }
      }
    }

    const playNotificationSound = () => {
      const settings = localStorage.getItem(`user_settings_${user?.id}`)
      if (settings) {
        const parsed = JSON.parse(settings)
        if (parsed.notifications?.soundEnabled) {
          const audio = new Audio("/notification-sound.mp3")
          audio.volume = 0.3
          audio.play().catch(() => {})
        }
      }
    }

    const markAsRead = async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId)
        
        if (error) throw error
        
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
      } catch (error: any) {
        console.error("Error marking notification as read:", error.message, error)
        toast.error("Failed to mark notification as read")
      }
    }

    const markAllAsRead = async () => {
      if (!user) return
      
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", user.id)
          .eq("read", false)
        
        if (error) {
          console.error("Supabase error details:", error)
          throw new Error(`Failed to mark all as read: ${error.message}`)
        }
        
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        toast.success("All notifications marked as read")
      } catch (error: any) {
        console.error("Error marking all as read:", error.message, error)
        toast.error(`Failed to mark all as read: ${error.message || 'Unknown error'}`)
      }
    }

    const deleteNotification = async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", notificationId)
        
        if (error) throw error
        
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      } catch (error: any) {
        console.error("Error deleting notification:", error.message, error)
        toast.error("Failed to delete notification")
      }
    }

    const deleteSelected = async () => {
      if (selectedNotifications.size === 0) return
      
      try {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .in("id", Array.from(selectedNotifications))
        
        if (error) throw error
        
        setNotifications((prev) => prev.filter((n) => !selectedNotifications.has(n.id)))
        setSelectedNotifications(new Set())
        toast.success(`Deleted ${selectedNotifications.size} notifications`)
      } catch (error: any) {
        console.error("Error deleting notifications:", error.message, error)
        toast.error("Failed to delete notifications")
      }
    }

    const handleNotificationClick = (notification: Notification) => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
      
      if (onNotificationClick) {
        onNotificationClick(notification)
      }
      
      if (notification.action_url) {
        navigate(notification.action_url)
      }
    }

    const toggleNotificationSelection = (notificationId: string) => {
      setSelectedNotifications((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(notificationId)) {
          newSet.delete(notificationId)
        } else {
          newSet.add(notificationId)
        }
        return newSet
      })
    }

    const getNotificationIcon = (type: string) => {
      switch (type) {
        case "follow":
          return "👤"
        case "like":
          return "❤️"
        case "comment":
          return "💬"
        case "system":
          return "⚙️"
        case "success":
          return "✅"
        case "warning":
          return "⚠️"
        case "error":
          return "❌"
        default:
          return "ℹ️"
      }
    }

    const getNotificationColor = (type: string) => {
      switch (type) {
        case "follow":
          return "bg-blue-500/20 border-blue-500/30"
        case "like":
          return "bg-red-500/20 border-red-500/30"
        case "comment":
          return "bg-green-500/20 border-green-500/30"
        case "system":
          return "bg-purple-500/20 border-purple-500/30"
        case "success":
          return "bg-green-500/20 border-green-500/30"
        case "warning":
          return "bg-yellow-500/20 border-yellow-500/30"
        case "error":
          return "bg-red-500/20 border-red-500/30"
        default:
          return "bg-slate-500/20 border-slate-500/30"
      }
    }

    const filteredNotifications = notifications.filter((notification) => {
      if (filter === "unread" && notification.read) return false
      if (filter === "read" && !notification.read) return false
      if (typeFilter !== "all" && notification.type !== typeFilter) return false
      return true
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    if (!isOpen) return null

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
          onClick={onClose}
        >
          <motion.div
            ref={mergedRef}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-purple-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-sm text-slate-400">{unreadCount} unread</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Filters"
                >
                  <Filter className="h-5 w-5 text-slate-400" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-slate-700 overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                      <div className="flex gap-2">
                        {["all", "unread", "read"].map((filterOption) => (
                          <button
                            key={filterOption}
                            onClick={() => setFilter(filterOption as any)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              filter === filterOption
                                ? "bg-purple-600 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Types</option>
                        <option value="follow">Follows</option>
                        <option value="like">Likes</option>
                        <option value="comment">Comments</option>
                        <option value="system">System</option>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
              <div className="flex items-center gap-2">
                {selectedNotifications.size > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete ({selectedNotifications.size})
                  </button>
                )}
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto max-h-96">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No notifications found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                        !notification.read ? "bg-purple-500/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.has(notification.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleNotificationSelection(notification.id)
                          }}
                          className="mt-1 w-4 h-4 rounded-full border-slate-600 bg-slate-700 text-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 cursor-pointer"
                        />
                        
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${notification.read ? "text-slate-300" : "text-white"}`}>
                                {notification.title}
                              </h4>
                              <p className={`text-sm mt-1 ${notification.read ? "text-slate-400" : "text-slate-300"}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-2">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="p-1 hover:bg-slate-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="h-3 w-3 text-slate-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
              <button
                onClick={() => {
                  onClose()
                  navigate("/profile-settings?tab=notifications")
                }}
                className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                <Settings className="h-4 w-4" />
                Notification Settings
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }
)

export default NotificationCenter