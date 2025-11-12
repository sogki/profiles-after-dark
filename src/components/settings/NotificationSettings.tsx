import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { Loader2, Save, Bell, Mail, Smartphone, Volume, VolumeX, Clock, CheckCircle, Check, X, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useNotifications } from "../../hooks/useNotifications"

interface NotificationSettingsProps {
  user: SupabaseUser | null
  loading: boolean
  setLoading: (loading: boolean) => void
  quietHoursEnabled: boolean
  setQuietHoursEnabled: (value: boolean) => void
  quietHoursStart: string
  setQuietHoursStart: (value: string) => void
  quietHoursEnd: string
  setQuietHoursEnd: (value: string) => void
}

export default function NotificationSettings({
  user,
  loading,
  setLoading,
  quietHoursEnabled,
  setQuietHoursEnabled,
  quietHoursStart,
  setQuietHoursStart,
  quietHoursEnd,
  setQuietHoursEnd,
}: NotificationSettingsProps) {
  const { 
    notifications: hookNotifications, 
    loading: loadingNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteNotifications: deleteMultipleNotifications 
  } = useNotifications()
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread" | "read">("all")
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())

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

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return
    try {
      await deleteMultipleNotifications(Array.from(selectedNotifications))
      setSelectedNotifications(new Set())
      toast.success(`Deleted ${selectedNotifications.size} notifications`)
    } catch (error) {
      toast.error("Failed to delete notifications")
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInSeconds / 3600)
    const diffInDays = Math.floor(diffInSeconds / 86400)
    
    if (diffInSeconds < 60) return "just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredNotifications = hookNotifications.filter((notification) => {
    if (notificationFilter === "unread" && notification.read) return false
    if (notificationFilter === "read" && !notification.read) return false
    return true
  })

  const saveNotificationSettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          quiet_hours_enabled: quietHoursEnabled,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd,
        } as any)
        .eq("user_id", user.id)

      if (error) throw error
      toast.success("Notification settings saved!")
    } catch (error) {
      toast.error("Failed to save notification settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Quiet Hours */}
      <div className="border-t border-slate-700 pt-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          {quietHoursEnabled ? (
            <VolumeX className="h-5 w-5 text-purple-400" />
          ) : (
            <Volume className="h-5 w-5 text-slate-400" />
          )}
          Quiet Hours
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <div>
              <p className="font-medium text-white">Enable Quiet Hours</p>
              <p className="text-sm text-slate-400">Disable notifications during specified hours</p>
            </div>
            <button
              onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${quietHoursEnabled ? "bg-purple-600" : "bg-slate-700/50"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${quietHoursEnabled ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">End Time</label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
        <button
          onClick={saveNotificationSettings}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium text-white transition-colors"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Save className="h-5 w-5 text-white" />}
        Save Notification Settings
      </button>

      {/* Notifications List */}
      <div className="border-t border-slate-700 pt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Bell className="h-5 w-5 text-purple-400" />
            Recent Notifications
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/30">
              {(["all", "unread", "read"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setNotificationFilter(filter)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    notificationFilter === filter
                      ? "bg-purple-600 text-white"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            {hookNotifications.filter((n) => !n.read).length > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Check className="h-3 w-3 text-white" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {loadingNotifications ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-white">No notifications</h3>
            <p className="text-slate-400">
              {notificationFilter === "all" 
                ? "You're all caught up! New notifications will appear here."
                : `No ${notificationFilter} notifications found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedNotifications.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg mb-4">
                <span className="text-sm text-slate-300">
                  {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete Selected
                </button>
              </div>
            )}
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`group p-4 rounded-lg border transition-colors ${
                  notification.read 
                    ? "border-slate-700/50 bg-slate-800/30" 
                    : "border-purple-500/50 bg-purple-900/30 shadow-lg shadow-purple-500/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => toggleNotificationSelection(notification.id)}
                    className="mt-1 w-4 h-4 text-purple-600 bg-slate-800/50 border-slate-700/50 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <div className={`mt-1 flex-shrink-0 ${notification.read ? "text-slate-400" : "text-purple-400"}`}>
                    {notification.read ? <CheckCircle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                  </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-medium ${notification.read ? "text-slate-300" : "text-white"}`}>
                                {notification.title || "Notification"}
                              </p>
                              {(notification.type === "report" || notification.type === "appeal" || notification.type === "feedback") && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-600/30 text-purple-300 rounded border border-purple-500/50">
                                  Staff
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${notification.read ? "text-slate-400" : "text-slate-300"}`}>
                              {notification.message || notification.content || "No message content"}
                            </p>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        )}
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className={`p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                            notification.read 
                              ? "hover:bg-slate-700/50" 
                              : "hover:bg-purple-600"
                          }`}
                          title={notification.read ? "Mark as unread" : "Mark as read"}
                        >
                          {notification.read ? (
                            <Bell className="h-3.5 w-3.5 text-slate-400" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5 text-purple-400" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 rounded hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete notification"
                        >
                          <X className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

