import type React from "react"
import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabase"
import { Loader2, Save, User, Mail, Lock, Bell, Camera, Upload, Trash2, Shield, AlertTriangle, CheckCircle, Settings, Eye, EyeOff, Palette, Globe, Download, MessageSquare, Database, HelpCircle, X, Copy, RefreshCw, Zap, Key, History, Users, Smartphone, Monitor, MapPin, LogOut, Volume, VolumeX, Clock, Filter } from 'lucide-react'
import toast from "react-hot-toast"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useNotifications } from "../../hooks/useNotifications"

import Footer from "../Footer"

type Profile = {
  username: string
  display_name: string
  bio: string
  avatar_url: string
  banner_url: string
}

type Notification = {
  id: string
  message: string
  created_at: string
  read: boolean
}

type LoginSession = {
  id: string
  device: string
  location: string
  ip_address: string
  last_active: string
  current: boolean
}

type Theme = {
  id: string
  name: string
  background: string
  preview: string
}

const themes: Theme[] = [
  { id: "dark", name: "Dark", background: "bg-gray-900", preview: "linear-gradient(135deg, #1f2937 0%, #111827 100%)" },
  { id: "light", name: "Light", background: "bg-white", preview: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)" },
  {
    id: "blue",
    name: "Ocean Blue",
    background: "bg-blue-900",
    preview: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
  },
  {
    id: "purple",
    name: "Purple Haze",
    background: "bg-purple-900",
    preview: "linear-gradient(135deg, #581c87 0%, #7c3aed 100%)",
  },
  {
    id: "green",
    name: "Forest Green",
    background: "bg-green-900",
    preview: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)",
  },
  {
    id: "sunset",
    name: "Sunset",
    background: "bg-orange-900",
    preview: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
  },
  {
    id: "aurora",
    name: "Aurora",
    background: "bg-indigo-900",
    preview: "linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #ec4899 100%)",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    background: "bg-pink-900",
    preview: "linear-gradient(135deg, #be185d 0%, #7c2d12 100%)",
  },
]

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
]

export default function ProfileSettings() {
  const [profile, setProfile] = useState<Profile>({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
  })
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<
    "account" | "security" | "notifications" | "appearance" | "privacy" | "data" | "support"
  >("account")

  const bannerInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Notifications state - use the hook
  const { 
    notifications: hookNotifications, 
    loading: loadingNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteNotifications: deleteMultipleNotifications 
  } = useNotifications()
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread" | "read">("all")
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())

  // Essential feature states
  const [selectedTheme, setSelectedTheme] = useState("dark")
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([])

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState("22:00")
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00")

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState("public")
  const [allowFriendRequests, setAllowFriendRequests] = useState(true)
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)

  // Feedback
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackType, setFeedbackType] = useState("general")

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const usernameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Check if user came from email confirmation setup
    const setup = searchParams.get('setup')
    const tab = searchParams.get('tab')
    
    if (setup === 'true') {
      // Switch to account tab if not already there
      if (tab !== 'account') {
        setActiveTab('account')
      }
      
      // Auto-focus on username input after a short delay
      setTimeout(() => {
        if (usernameInputRef.current) {
          usernameInputRef.current.focus()
          usernameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
      
      // Show welcome message
      toast.success('Welcome! Please set your username to complete your profile.')
    } else if (tab) {
      // If tab is specified, switch to it
      setActiveTab(tab as any)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          toast.error("Failed to fetch user")
          setLoading(false)
          return
        }

        setUser(user)
        setEmail(user.email ?? "")

        const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

        if (data) {
          setProfile(data)
          // Load user preferences
          setSelectedTheme(data.theme || "dark")
          setSelectedLanguage(data.language || "en")
          setEmailNotifications(data.email_notifications ?? true)
          setPushNotifications(data.push_notifications ?? true)
          setQuietHoursEnabled(data.quiet_hours_enabled || false)
          setQuietHoursStart(data.quiet_hours_start || "22:00")
          setQuietHoursEnd(data.quiet_hours_end || "08:00")
          setProfileVisibility(data.profile_visibility || "public")
          setAllowFriendRequests(data.allow_friend_requests ?? true)
          setShowOnlineStatus(data.show_online_status ?? true)
        } else if (error) {
          toast.error("Failed to fetch profile")
        }

        // Fetch login sessions
        await fetchLoginSessions(user)
      } catch (error) {
        console.error("Fetch profile error:", error)
        toast.error("Unexpected error fetching profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const fetchLoginSessions = async (currentUser: SupabaseUser | null) => {
    if (!currentUser) {
      setLoginSessions([])
      return
    }

    try {
      // Get current session info from Supabase auth
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Get user agent and device info from browser
        const userAgent = navigator.userAgent
        let device = "Unknown Device"
        
        if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
          device = "iOS Device"
        } else if (userAgent.includes("Android")) {
          device = "Android Device"
        } else if (userAgent.includes("Windows")) {
          device = "Windows Device"
        } else if (userAgent.includes("Mac")) {
          device = "Mac Device"
        } else if (userAgent.includes("Linux")) {
          device = "Linux Device"
        }

        // Get browser info
        let browser = "Unknown Browser"
        if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
          browser = "Chrome"
        } else if (userAgent.includes("Firefox")) {
          browser = "Firefox"
        } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
          browser = "Safari"
        } else if (userAgent.includes("Edg")) {
          browser = "Edge"
        }

        const deviceInfo = `${browser} on ${device}`
        
        // Create a session entry for the current session
        setLoginSessions([
          {
            id: session.access_token.substring(0, 8),
            device: deviceInfo,
            location: "Unknown", // IP geolocation would require an external service
            ip_address: "Unknown", // IP address is not available from client-side
            last_active: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : new Date().toISOString(),
            current: true,
          },
        ])
      } else {
        setLoginSessions([])
      }
    } catch (error) {
      console.error("Error fetching login sessions:", error)
      setLoginSessions([])
    }
  }

  // Notifications are now managed by the useNotifications hook
  // No need for separate fetching

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "avatar_url" | "banner_url") => {
    const file = e.target.files?.[0]
    if (!file) {
      toast.error("No file selected.")
      return
    }

    if (!user) {
      toast.error("User not authenticated.")
      return
    }

    const isAvatar = field === "avatar_url"
    isAvatar ? setUploadingAvatar(true) : setUploadingBanner(true)

    const bucket = isAvatar ? "avatars" : "banners"
    const filePath = `${user.id}/${field}-${Date.now()}-${file.name}`

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      if (!publicUrl) throw new Error("No public URL returned.")

      setProfile((prev) => ({ ...prev, [field]: publicUrl }))

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ [field]: publicUrl })
        .eq("user_id", user.id)

      if (updateError) {
        console.error(updateError)
        throw updateError
      }

      toast.success(`${isAvatar ? "Avatar" : "Banner"} uploaded successfully.`)
    } catch (error: any) {
      console.error("Upload Error:", error)
      toast.error(error?.message || "Failed to upload file.")
    } finally {
      isAvatar ? setUploadingAvatar(false) : setUploadingBanner(false)
      e.target.value = ""
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    const { error } = await supabase.from("user_profiles").update(profile).eq("user_id", user.id)

    if (error) {
      toast.error("Failed to update profile.")
    } else {
      toast.success("Profile updated successfully.")
    }
    setLoading(false)
  }

  const updateEmailPassword = async () => {
    if (!user) return

    if (password && password !== confirmPassword) {
      toast.error("Passwords don't match.")
      return
    }

    setLoading(true)

    try {
      if (email && email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email })
        if (error) throw error
        toast.success("Email updated successfully.")
      }

      if (password) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        toast.success("Password updated successfully.")
      }
    } catch (error) {
      toast.error("Failed to update email or password.")
    } finally {
      setLoading(false)
      setPassword("")
      setConfirmPassword("")
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      const currentUser = supabase.auth.user()
      if (!currentUser) {
        alert("No user logged in.")
        setIsDeleting(false)
        return
      }

      const { error } = await supabase.rpc("delete_user_account", {
        uid: currentUser.id,
      })

      if (error) {
        alert(`Failed to delete account: ${error.message}`)
        setIsDeleting(false)
        return
      }

      alert("Your account has been deleted successfully.")
      await supabase.auth.signOut()
    } catch {
      alert("An unexpected error occurred.")
    } finally {
      setIsDeleting(false)
    }
  }

  const saveThemeSettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ theme: selectedTheme, language: selectedLanguage })
        .eq("user_id", user.id)

      if (error) throw error
      toast.success("Theme settings saved successfully!")
    } catch (error) {
      toast.error("Failed to save theme settings")
    } finally {
      setLoading(false)
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
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
          quiet_hours_enabled: quietHoursEnabled,
          quiet_hours_start: quietHoursStart,
          quiet_hours_end: quietHoursEnd,
        })
        .eq("user_id", user.id)

      if (error) throw error
      toast.success("Notification settings saved!")
    } catch (error) {
      toast.error("Failed to save notification settings")
    } finally {
      setLoading(false)
    }
  }

  const savePrivacySettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          profile_visibility: profileVisibility,
          allow_friend_requests: allowFriendRequests,
          show_online_status: showOnlineStatus,
        })
        .eq("user_id", user.id)

      if (error) throw error
      toast.success("Privacy settings saved!")
    } catch (error) {
      toast.error("Failed to save privacy settings")
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    setLoading(true)
    try {
      // Mock data export
      const userData = {
        profile,
        settings: {
          theme: selectedTheme,
          language: selectedLanguage,
          notifications: { emailNotifications, pushNotifications },
          privacy: { profileVisibility, allowFriendRequests, showOnlineStatus },
        },
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `user-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Data exported successfully!")
    } catch (error) {
      toast.error("Failed to export data")
    } finally {
      setLoading(false)
    }
  }

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please enter your feedback")
      return
    }

    setLoading(true)
    try {
      // Mock feedback submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Feedback submitted successfully!")
      setFeedbackText("")
    } catch (error) {
      toast.error("Failed to submit feedback")
    } finally {
      setLoading(false)
    }
  }

  const navigationItems = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "data", label: "Data & Backup", icon: Database },
    { id: "support", label: "Support", icon: HelpCircle },
  ]

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <><div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 md:gap-8">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col space-y-6 self-start">
          {/* Header */}
          <div className="border-b border-gray-700 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold">Settings</h2>
            </div>
            <p className="text-sm text-gray-400">Manage your account preferences</p>
          </div>

          {/* Navigation */}
          <section>
            <h3 className="text-lg font-semibold text-gray-300 mb-4 uppercase tracking-wide text-sm">
              Account Settings
            </h3>
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center space-x-3 transition-all duration-200 rounded-lg px-4 py-3 text-left ${activeTab === item.id
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </section>

          {/* User Info */}
          <section className="mt-auto pt-6 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={profile.avatar_url || "/placeholder.svg?height=40&width=40"}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile.display_name || profile.username || "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
            </div>
          </section>
        </aside>

        {/* Main Content */}
        <main className="col-span-12 md:col-span-9 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {navigationItems.find((item) => item.id === activeTab)?.label || "Settings"}
              </h1>
              <p className="text-gray-400 mt-1">
                {activeTab === "account" && "Manage your profile information and preferences"}
                {activeTab === "security" && "Update your security settings and password"}
                {activeTab === "notifications" && "View and manage your notifications"}
                {activeTab === "appearance" && "Customize your theme and display preferences"}
                {activeTab === "privacy" && "Control your privacy and visibility settings"}
                {activeTab === "data" && "Export your data and manage backups"}
                {activeTab === "support" && "Get help and provide feedback"}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              {/* Account Tab */}
              {activeTab === "account" && (
                <div className="space-y-8">
                  {/* Profile Header */}
                  <div className="relative">
                    {/* Banner */}
                    <div
                      className="relative h-48 bg-gray-700 rounded-lg cursor-pointer group overflow-hidden"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      {uploadingBanner && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                      {profile.banner_url ? (
                        <img
                          src={profile.banner_url || "/placeholder.svg"}
                          alt="Banner"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Upload className="h-12 w-12 mx-auto mb-2" />
                            <p>Click to upload banner</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <div className="text-center text-white">
                          <Camera className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Change Banner</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={bannerInputRef}
                        onChange={(e) => handleUpload(e, "banner_url")} />
                    </div>

                    {/* Avatar */}
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute left-6 -bottom-16 w-32 h-32 rounded-full border-4 border-gray-800 bg-gray-700 cursor-pointer group overflow-hidden shadow-lg flex items-center justify-center transition-transform duration-300 hover:scale-105"
                    >
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-full">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url || "/placeholder.svg"}
                          alt="Avatar"
                          className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="h-16 w-16 text-gray-400" />
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity duration-300">
                        <Camera className="text-white h-6 w-6" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={avatarInputRef}
                        onChange={(e) => handleUpload(e, "avatar_url")} />
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="pt-20 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                        <input
                          ref={usernameInputRef}
                          value={profile.username}
                          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                          className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your username" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                        <input
                          value={profile.display_name}
                          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                          className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your display name" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                      <textarea
                        rows={4}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Tell us about yourself..." />
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div className="space-y-8">
                  {/* Email & Password */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your email" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 pl-10 pr-12 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter new password" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 pl-10 pr-12 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirm new password" />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={updateEmailPassword}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      Update Security Settings
                    </button>
                  </div>

                  {/* Login Activity */}
                  <div className="border-t border-gray-700 pt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <History className="h-5 w-5 text-green-400" />
                      Login Activity
                    </h3>

                    <div className="space-y-3">
                      {loginSessions.length > 0 ? (
                        loginSessions.map((session) => (
                          <div key={session.id} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-600 rounded-lg">
                                {session.device.includes("iPhone") || session.device.includes("iOS") || session.device.includes("Android") ? (
                                  <Smartphone className="h-5 w-5" />
                                ) : (
                                  <Monitor className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{session.device}</p>
                                {session.location !== "Unknown" && session.ip_address !== "Unknown" && (
                                  <p className="text-sm text-gray-400 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {session.location} • {session.ip_address}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {session.current ? "Current session" : `Last active: ${new Date(session.last_active).toLocaleString()}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.current && (
                                <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <History className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-400 text-sm">No active sessions found</p>
                          <p className="text-gray-500 text-xs mt-1">Session tracking will be available soon</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="border-t border-gray-700 pt-8">
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
                      </div>
                      <p className="text-gray-300 mb-4">
                        Deleting your account is permanent and will remove all your data. This action cannot be undone.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        {isDeleting ? "Deleting Account..." : "Delete Account"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="space-y-8">
                  {/* Notification Preferences */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Bell className="h-5 w-5 text-blue-400" />
                      Notification Preferences
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-400">Receive notifications via email</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? "bg-blue-600" : "bg-gray-600"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-gray-400">Receive push notifications on your devices</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPushNotifications(!pushNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushNotifications ? "bg-blue-600" : "bg-gray-600"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotifications ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div className="border-t border-gray-700 pt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      {quietHoursEnabled ? (
                        <VolumeX className="h-5 w-5 text-purple-400" />
                      ) : (
                        <Volume className="h-5 w-5 text-gray-400" />
                      )}
                      Quiet Hours
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium">Enable Quiet Hours</p>
                          <p className="text-sm text-gray-400">Disable notifications during specified hours</p>
                        </div>
                        <button
                          onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${quietHoursEnabled ? "bg-purple-600" : "bg-gray-600"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${quietHoursEnabled ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>

                      {quietHoursEnabled && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                            <input
                              type="time"
                              value={quietHoursStart}
                              onChange={(e) => setQuietHoursStart(e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                            <input
                              type="time"
                              value={quietHoursEnd}
                              onChange={(e) => setQuietHoursEnd(e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={saveNotificationSettings}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save Notification Settings
                  </button>

                  {/* Notifications List */}
                  <div className="border-t border-gray-700 pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-400" />
                        Recent Notifications
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                          {(["all", "unread", "read"] as const).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setNotificationFilter(filter)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                notificationFilter === filter
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-300 hover:text-white"
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
                            <Check className="h-3 w-3" />
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                      </div>
                    ) : filteredNotifications.length === 0 ? (
                      <div className="text-center py-12">
                        <Bell className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No notifications</h3>
                        <p className="text-gray-400">
                          {notificationFilter === "all" 
                            ? "You're all caught up! New notifications will appear here."
                            : `No ${notificationFilter} notifications found.`}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedNotifications.size > 0 && (
                          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg mb-4">
                            <span className="text-sm text-gray-300">
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
                                ? "border-gray-600 bg-gray-700" 
                                : "border-blue-500 bg-blue-900/20"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedNotifications.has(notification.id)}
                                onChange={() => toggleNotificationSelection(notification.id)}
                                className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 cursor-pointer"
                              />
                              <div className={`mt-1 flex-shrink-0 ${notification.read ? "text-gray-400" : "text-blue-400"}`}>
                                {notification.read ? <CheckCircle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-medium ${notification.read ? "text-gray-300" : "text-white"}`}>
                                      {notification.title || "Notification"}
                                    </p>
                                    <p className={`text-sm mt-1 ${notification.read ? "text-gray-400" : "text-gray-300"}`}>
                                      {notification.message || notification.content || "No message content"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTimeAgo(notification.created_at)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    )}
                                    <button
                                      onClick={() => markAsRead(notification.id)}
                                      className={`p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                                        notification.read 
                                          ? "hover:bg-gray-600" 
                                          : "hover:bg-blue-600"
                                      }`}
                                      title={notification.read ? "Mark as unread" : "Mark as read"}
                                    >
                                      {notification.read ? (
                                        <Bell className="h-3.5 w-3.5 text-gray-400" />
                                      ) : (
                                        <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => deleteNotification(notification.id)}
                                      className="p-1.5 rounded hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Delete notification"
                                    >
                                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-white" />
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
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div className="space-y-8">
                  {/* Theme Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-400" />
                      Theme Selection
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`relative p-4 rounded-lg border-2 transition-all ${selectedTheme === theme.id
                              ? "border-blue-500 bg-blue-900/20"
                              : "border-gray-600 hover:border-gray-500"}`}
                        >
                          <div className="w-full h-16 rounded-lg mb-3" style={{ background: theme.preview }} />
                          <p className="text-sm font-medium">{theme.name}</p>
                          {selectedTheme === theme.id && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="h-5 w-5 text-blue-400" />
                            </div>
                          )}
                        </button>
                      ))} */}
                      <p>Coming Soon</p>
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="border-t border-gray-700 pt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-green-400" />
                      Language & Region
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* {languages.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => setSelectedLanguage(language.code)}
                          className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${selectedLanguage === language.code
                              ? "border-green-500 bg-green-900/20"
                              : "border-gray-600 hover:border-gray-500"}`}
                        >
                          <span className="text-2xl">{language.flag}</span>
                          <span className="font-medium">{language.name}</span>
                          {selectedLanguage === language.code && (
                            <CheckCircle className="h-5 w-5 text-green-400 ml-auto" />
                          )}
                        </button>
                      ))} */}
                      <p>Coming Soon</p>
                    </div>
                  </div>

                  {/* Save Button */}
                  {/* <button
                    onClick={saveThemeSettings}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save Appearance Settings
                  </button> */}
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === "privacy" && (
                <div className="space-y-8">
                  {/* Profile Visibility */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-400" />
                      Profile Visibility
                    </h3>

                    {/* <div className="space-y-3">
                      {[
                        { value: "public", label: "Public", description: "Anyone can see your profile" },
                        {
                          value: "friends",
                          label: "Friends Only",
                          description: "Only your friends can see your profile",
                        },
                        { value: "private", label: "Private", description: "Only you can see your profile" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setProfileVisibility(option.value)}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${profileVisibility === option.value
                              ? "border-blue-500 bg-blue-900/20"
                              : "border-gray-600 hover:border-gray-500"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{option.label}</p>
                              <p className="text-sm text-gray-400">{option.description}</p>
                            </div>
                            {profileVisibility === option.value && <CheckCircle className="h-5 w-5 text-blue-400" />}
                          </div>
                        </button>
                      ))}
                    </div> */}
                    <p>Coming Soon</p>
                  </div>

                  {/* Social Settings */}
                  <div className="border-t border-gray-700 pt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-400" />
                      Social Settings
                    </h3>

                    {/* <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium">Allow Friend Requests</p>
                          <p className="text-sm text-gray-400">Let others send you friend requests</p>
                        </div>
                        <button
                          onClick={() => setAllowFriendRequests(!allowFriendRequests)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowFriendRequests ? "bg-green-600" : "bg-gray-600"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowFriendRequests ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium">Show Online Status</p>
                          <p className="text-sm text-gray-400">Let others see when you're online</p>
                        </div>
                        <button
                          onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showOnlineStatus ? "bg-green-600" : "bg-gray-600"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnlineStatus ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>
                    </div> */}
                    <p>Coming Soon</p>
                  </div>

                  {/* Save Button */}
                  {/* <button
                    onClick={savePrivacySettings}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save Privacy Settings
                  </button> */}
                </div>
              )}

              {/* Data & Backup Tab */}
              {activeTab === "data" && (
                <div className="space-y-8">
                  {/* Data Export */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Download className="h-5 w-5 text-blue-400" />
                      Data Export
                    </h3>

                    <div className="bg-gray-700 p-6 rounded-lg">
                      <p className="text-gray-300 mb-4">
                        Download a copy of all your data including profile information, settings, and activity history.
                      </p>
                      <p>Coming Soon</p>
                      {/* <button
                        onClick={exportData}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                        Export My Data
                      </button> */}
                    </div>
                  </div>

                  {/* Account Backup */}
                  <div className="border-t border-gray-700 pt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Database className="h-5 w-5 text-green-400" />
                      Account Backup
                    </h3>

                    {/* <div className="bg-gray-700 p-6 rounded-lg">
                      <p className="text-gray-300 mb-4">
                        Create a backup of your account settings and preferences. This can be used to restore your
                        account configuration.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => toast.success("Backup created successfully!")}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          <Database className="h-5 w-5" />
                          Create Backup
                        </button>
                        <button
                          onClick={() => toast.success("Backup restored successfully!")}
                          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          <RefreshCw className="h-5 w-5" />
                          Restore Backup
                        </button>
                      </div>
                    </div> */}
                    <p>Coming Soon</p>
                  </div>

                  {/* Storage Usage */}
                  <div className="border-t border-gray-700 pt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-400" />
                      Storage Usage
                    </h3>

                    {/* <div className="space-y-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Profile Data</span>
                          <span className="text-sm text-gray-400">2.3 MB</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: "23%" }}></div>
                        </div>
                      </div>

                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Media Files</span>
                          <span className="text-sm text-gray-400">15.7 MB</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: "78%" }}></div>
                        </div>
                      </div>

                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Total Usage</span>
                          <span className="text-sm text-gray-400">18.0 MB / 100 MB</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: "18%" }}></div>
                        </div>
                      </div>
                    </div> */}
                    <p>Coming Soon</p>
                  </div>
                </div>
              )}

              {/* Support Tab */}
              {activeTab === "support" && (
                <div className="space-y-8">
                  {/* Feedback */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                      Send Feedback
                    </h3>

                    <div className="space-y-4">
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Feedback Type</label>
                        <select
                          value={feedbackType}
                          onChange={(e) => setFeedbackType(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="general">General Feedback</option>
                          <option value="bug">Bug Report</option>
                          <option value="feature">Feature Request</option>
                          <option value="improvement">Improvement Suggestion</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Your Feedback</label>
                        <textarea
                          rows={6}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Tell us what you think or report any issues you've encountered..." />
                      </div>

                      <button
                        onClick={submitFeedback}
                        disabled={loading || !feedbackText.trim()}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                        Send Feedback
                      </button> */}
                      <p>Coming Soon</p>
                    </div>
                  </div>

                  {/* Help Resources */}
                  <div className="border-t border-gray-700 pt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-green-400" />
                      Help & Resources
                    </h3>

                    {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <a href="#" className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-600 rounded-lg">
                            <HelpCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Help Center</p>
                            <p className="text-sm text-gray-400">Browse our help articles</p>
                          </div>
                        </div>
                      </a>

                      <a href="#" className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-600 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Contact Support</p>
                            <p className="text-sm text-gray-400">Get help from our team</p>
                          </div>
                        </div>
                      </a>

                      <a href="#" className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-600 rounded-lg">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Community</p>
                            <p className="text-sm text-gray-400">Join our community forum</p>
                          </div>
                        </div>
                      </a>

                      <a href="#" className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-600 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Report Issue</p>
                            <p className="text-sm text-gray-400">Report bugs or problems</p>
                          </div>
                        </div>
                      </a>
                    </div> */}
                    <p>Coming Soon</p>
                  </div>

                  {/* System Information */}
                  <div className="border-t border-gray-700 pt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-gray-400" />
                      System Information
                    </h3>

                    {/* <div className="bg-gray-700 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">App Version</p>
                          <p className="font-medium">v2.1.0</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Browser</p>
                          <p className="font-medium">{navigator.userAgent.split(" ")[0]}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Platform</p>
                          <p className="font-medium">{navigator.platform}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Last Updated</p>
                          <p className="font-medium">{new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div> */}
                    <p>Coming Soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div><Footer /></>
  )
}