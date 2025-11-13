import { useState, useEffect, useRef } from "react"
import { Bell, X, Check, Trash2, Settings, Filter, MoreHorizontal, Clock, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../context/authContext"
import { supabase } from "../lib/supabase"
import toast from "react-hot-toast"

interface Notification {
  id: string
  user_id: string
  title?: string
  message?: string
  content?: string
  type: "info" | "success" | "warning" | "error" | "follow" | "like" | "comment" | "system" | "report"
  read: boolean
  action_url?: string
  metadata?: Record<string, any>
  created_at: string
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  notifications?: Notification[]
  onNotificationClick?: (notification: Notification) => void
  markAsRead?: (id: string) => Promise<void>
  markAllAsRead?: () => Promise<void>
  deleteNotification?: (id: string) => Promise<void>
  deleteNotifications?: (ids: string[]) => Promise<void>
}

export default function NotificationCenter({ 
  isOpen, 
  onClose, 
  notifications: propNotifications, 
  onNotificationClick,
  markAsRead: markAsReadProp,
  markAllAsRead: markAllAsReadProp,
  deleteNotification: deleteNotificationProp,
  deleteNotifications: deleteNotificationsProp
}: NotificationCenterProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use prop notifications or fallback to empty array
  const notifications = propNotifications || []

  // Notifications are now managed by the useNotifications hook in Header
  // No need for local loading or subscription management

  const playNotificationSound = () => {
    // Check if sound is enabled in user settings
    const settings = localStorage.getItem(`user_settings_${user?.id}`)
    if (settings) {
      const parsed = JSON.parse(settings)
      if (parsed.notifications?.soundEnabled) {
        const audio = new Audio("/notification-sound.mp3")
        audio.volume = 0.3
        audio.play().catch(() => {
          // Ignore errors if sound can't play
        })
      }
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      if (markAsReadProp) {
        await markAsReadProp(notificationId)
        toast.success("Notification marked as read")
      } else {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId)
        
        if (error) throw error
        toast.success("Notification marked as read")
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const handleMarkAllAsRead = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (!user) return
    
    try {
      if (markAllAsReadProp) {
        await markAllAsReadProp()
        toast.success("All notifications marked as read")
      } else {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", user.id)
          .eq("read", false)
        
        if (error) throw error
        toast.success("All notifications marked as read")
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("Failed to mark all as read")
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      if (deleteNotificationProp) {
        await deleteNotificationProp(notificationId)
        toast.success("Notification deleted")
      } else {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", notificationId)
        
        if (error) throw error
        toast.success("Notification deleted")
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const deleteSelected = async () => {
    if (selectedNotifications.size === 0) return
    
    try {
      const notificationIds = Array.from(selectedNotifications)
      if (deleteNotificationsProp) {
        await deleteNotificationsProp(notificationIds)
        setSelectedNotifications(new Set())
        toast.success(`Deleted ${notificationIds.length} notifications`)
      } else {
        const { error } = await supabase
          .from("notifications")
          .delete()
          .in("id", notificationIds)
        
        if (error) throw error
        setSelectedNotifications(new Set())
        toast.success(`Deleted ${notificationIds.length} notifications`)
      }
    } catch (error) {
      console.error("Error deleting notifications:", error)
      toast.error("Failed to delete notifications")
    }
  }

  const handleNotificationClick = (notification: Notification, event?: React.MouseEvent) => {
    // Don't mark as read if clicking on checkbox or delete button
    if (event) {
      const target = event.target as HTMLElement
      if (target.closest('input[type="checkbox"]') || target.closest('button')) {
        return
      }
    }
    
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url
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

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case "follow":
        return "New Follower"
      case "like":
        return "New Like"
      case "comment":
        return "New Comment"
      case "system":
        return "System Notification"
      case "success":
        return "Success"
      case "warning":
        return "Warning"
      case "error":
        return "Error"
      case "report":
        return "Report Notification"
      default:
        return "Notification"
    }
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
      case "achievement":
        return "🏆"
      case "success":
        return "✅"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      case "report":
        return "🚩"
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
      case "achievement":
        return "bg-yellow-500/20 border-yellow-500/30"
      case "success":
        return "bg-green-500/20 border-green-500/30"
      case "warning":
        return "bg-yellow-500/20 border-yellow-500/30"
      case "error":
        return "bg-red-500/20 border-red-500/30"
      case "report":
        return "bg-orange-500/20 border-orange-500/30"
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
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="fixed top-16 right-4 md:right-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden z-50"
        data-notification-center
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
                      <option value="report">Reports</option>
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
                onClick={(e) => {
                  e.stopPropagation()
                  handleMarkAllAsRead(e)
                }}
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
                {filteredNotifications.map((notification) => {
                  const notificationDate = new Date(notification.created_at);
                  const now = new Date();
                  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
                  const diffInMinutes = Math.floor(diffInSeconds / 60);
                  const diffInHours = Math.floor(diffInSeconds / 3600);
                  const diffInDays = Math.floor(diffInSeconds / 86400);
                  
                  let timeAgo: string;
                  if (diffInSeconds < 60) {
                    timeAgo = "just now";
                  } else if (diffInMinutes < 60) {
                    timeAgo = `${diffInMinutes}m ago`;
                  } else if (diffInHours < 24) {
                    timeAgo = `${diffInHours}h ago`;
                  } else if (diffInDays < 7) {
                    timeAgo = `${diffInDays}d ago`;
                  } else {
                    timeAgo = notificationDate.toLocaleDateString();
                  }

                  return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group p-4 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                      !notification.read ? "bg-purple-500/5 border-l-2 border-purple-500" : ""
                    }`}
                    onClick={(e) => handleNotificationClick(notification, e)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative mt-1">
                        <input
                          type="checkbox"
                          id={`notification-${notification.id}`}
                          checked={selectedNotifications.has(notification.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleNotificationSelection(notification.id)
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="sr-only"
                        />
                        <label
                          htmlFor={`notification-${notification.id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className={`flex items-center justify-center w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200 ${
                            selectedNotifications.has(notification.id)
                              ? 'bg-purple-600 border-purple-600 hover:bg-purple-700 hover:border-purple-700'
                              : 'bg-slate-700 border-slate-600 hover:border-purple-500 hover:bg-slate-600'
                          }`}
                        >
                          {selectedNotifications.has(notification.id) && (
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          )}
                        </label>
                      </div>
                      
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-base ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold ${notification.read ? "text-slate-300" : "text-white"}`}>
                              {notification.title || getNotificationTitle(notification.type)}
                            </h4>
                            <p className={`text-sm mt-1 line-clamp-2 ${notification.read ? "text-slate-400" : "text-slate-300"}`}>
                              {notification.message || notification.content || "No message content"}
                            </p>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {timeAgo}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                handleDeleteNotification(notification.id)
                              }}
                              className="p-1.5 hover:bg-slate-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete notification"
                            >
                              <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 bg-slate-800/50">
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                // Navigate to notification settings
                onClose()
                window.location.href = "/profile-settings?tab=notifications"
              }}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <Settings className="h-4 w-4" />
              Notification Settings
            </button>
          </div>
        </motion.div>
    </AnimatePresence>
  )
}