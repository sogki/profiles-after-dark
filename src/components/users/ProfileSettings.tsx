import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  User,
  Mail,
  Save,
  Upload,
  X,
  Eye,
  EyeOff,
  Bell,
  Palette,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Shield,
  Key,
  Trash2,
  Download,
  Settings,
  Globe,
  Lock,
  Camera,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useAuth } from "../../context/authContext"
import { supabase } from "../../lib/supabase"
import toast from "react-hot-toast"
import Footer from "../Footer"

interface UserSettings {
  theme: "light" | "dark" | "system"
  accentColor: string
  fontSize: "small" | "medium" | "large"
  reducedMotion: boolean
  compactMode: boolean
  showProfileBadges: boolean
  autoPlayVideos: boolean
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  newFollowers: boolean
  profileLikes: boolean
  profileComments: boolean
  systemUpdates: boolean
  marketingEmails: boolean
  weeklyDigest: boolean
  soundEnabled: boolean
  desktopNotifications: boolean
}

interface PrivacySettings {
  profileVisibility: "public" | "private" | "friends"
  showEmail: boolean
  showActivity: boolean
  allowDirectMessages: boolean
  showOnlineStatus: boolean
  dataCollection: boolean
  analyticsOptOut: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  loginAlerts: boolean
  sessionTimeout: number
  trustedDevices: string[]
}

export default function ProfileSettings() {
  const { user, userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  
  // Form states
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
  })
  
  // Settings states
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: "dark",
    accentColor: "#8b5cf6",
    fontSize: "medium",
    reducedMotion: false,
    compactMode: false,
    showProfileBadges: true,
    autoPlayVideos: true,
  })
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    newFollowers: true,
    profileLikes: true,
    profileComments: true,
    systemUpdates: true,
    marketingEmails: false,
    weeklyDigest: true,
    soundEnabled: true,
    desktopNotifications: true,
  })
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: "public",
    showEmail: false,
    showActivity: true,
    allowDirectMessages: true,
    showOnlineStatus: true,
    dataCollection: true,
    analyticsOptOut: false,
  })
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30,
    trustedDevices: [],
  })
  
  // UI states
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "notifications" | "privacy" | "security" | "account">("profile")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  
  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Load user data and settings
  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || "",
        display_name: userProfile.display_name || "",
        bio: userProfile.bio || "",
        avatar_url: userProfile.avatar_url || "",
        banner_url: userProfile.banner_url || "",
      })
    }
    
    loadUserSettings()
  }, [userProfile])

  const loadUserSettings = async () => {
    if (!user) return
    
    try {
      // Load user settings from database or localStorage
      const savedSettings = localStorage.getItem(`user_settings_${user.id}`)
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setUserSettings(prev => ({ ...prev, ...parsed.appearance }))
        setNotificationSettings(prev => ({ ...prev, ...parsed.notifications }))
        setPrivacySettings(prev => ({ ...prev, ...parsed.privacy }))
        setSecuritySettings(prev => ({ ...prev, ...parsed.security }))
      }
      
      // Apply theme
      applyTheme(userSettings.theme, userSettings.accentColor)
    } catch (error) {
      console.error("Error loading user settings:", error)
    }
  }

  const saveUserSettings = async () => {
    if (!user) return
    
    try {
      const settings = {
        appearance: userSettings,
        notifications: notificationSettings,
        privacy: privacySettings,
        security: securitySettings,
      }
      
      localStorage.setItem(`user_settings_${user.id}`, JSON.stringify(settings))
      
      // Also save to database for sync across devices
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          settings: settings,
          updated_at: new Date().toISOString(),
        })
      
      if (error) throw error
      
      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    }
  }

  const applyTheme = (theme: string, accentColor: string) => {
    const root = document.documentElement
    
    // Apply accent color
    root.style.setProperty("--accent-color", accentColor)
    
    // Apply theme
    if (theme === "light") {
      root.classList.remove("dark")
      root.classList.add("light")
    } else if (theme === "dark") {
      root.classList.remove("light")
      root.classList.add("dark")
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.toggle("dark", prefersDark)
      root.classList.toggle("light", !prefersDark)
    }
  }

  const handleImageUpload = async (file: File, type: "avatar" | "banner") => {
    if (!user) return
    
    setUploading(type)
    
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${type}-${Date.now()}.${fileExt}`
      const filePath = `${type}s/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true })
      
      if (uploadError) throw uploadError
      
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath)
      
      const imageUrl = urlData.publicUrl
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        [`${type}_url`]: imageUrl,
      }))
      
      toast.success(`${type === "avatar" ? "Avatar" : "Banner"} uploaded successfully`)
    } catch (error) {
      console.error(`Error uploading ${type}:`, error)
      toast.error(`Failed to upload ${type}`)
    } finally {
      setUploading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          banner_url: formData.banner_url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
      
      if (error) throw error
      
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match")
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      
      if (error) throw error
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      
      toast.success("Password updated successfully")
    } catch (error) {
      console.error("Error updating password:", error)
      toast.error("Failed to update password")
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    try {
      // Delete user data
      await supabase.from("user_profiles").delete().eq("user_id", user.id)
      await supabase.from("profiles").delete().eq("user_id", user.id)
      await supabase.from("favorites").delete().eq("user_id", user.id)
      
      // Sign out and redirect
      await signOut()
      navigate("/")
      toast.success("Account deleted successfully")
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Failed to delete account")
    }
  }

  const exportUserData = async () => {
    if (!user) return
    
    try {
      // Fetch all user data
      const [profileData, uploadsData, favoritesData] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("profiles").select("*").eq("user_id", user.id),
        supabase.from("favorites").select("*").eq("user_id", user.id),
      ])
      
      const userData = {
        profile: profileData.data,
        uploads: uploadsData.data,
        favorites: favoritesData.data,
        settings: {
          appearance: userSettings,
          notifications: notificationSettings,
          privacy: privacySettings,
        },
        exportDate: new Date().toISOString(),
      }
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `profiles-after-dark-data-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("Data exported successfully")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Failed to export data")
    }
  }

  const accentColors = [
    { name: "Purple", value: "#8b5cf6" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Teal", value: "#14b8a6" },
  ]

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "security", label: "Security", icon: Key },
    { id: "account", label: "Account", icon: Settings },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">Please sign in to access your settings.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400 text-lg">Manage your account and customize your experience</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 sticky top-8">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                          activeTab === tab.id
                            ? "bg-purple-600 text-white shadow-lg"
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Profile Information</h2>
                      <p className="text-gray-400">Update your profile details and images</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Profile Images */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Avatar Upload */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-3">Avatar</label>
                          <div className="relative">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-700 border-4 border-slate-600 mx-auto">
                              {formData.avatar_url ? (
                                <img
                                  src={formData.avatar_url}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="h-12 w-12 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={uploading === "avatar"}
                              className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-full transition-colors"
                            >
                              {uploading === "avatar" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                            </button>
                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, "avatar")
                              }}
                            />
                          </div>
                        </div>

                        {/* Banner Upload */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-3">Banner</label>
                          <div className="relative">
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-700 border-2 border-slate-600">
                              {formData.banner_url ? (
                                <img
                                  src={formData.banner_url}
                                  alt="Banner"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => bannerInputRef.current?.click()}
                              disabled={uploading === "banner"}
                              className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                            >
                              {uploading === "banner" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </button>
                            <input
                              ref={bannerInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file, "banner")
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter username"
                          />
                        </div>

                        <div>
                          <label htmlFor="display_name" className="block text-sm font-medium text-white mb-2">
                            Display Name
                          </label>
                          <input
                            type="text"
                            id="display_name"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter display name"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-white mb-2">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === "appearance" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Appearance</h2>
                      <p className="text-gray-400">Customize how the app looks and feels</p>
                    </div>

                    <div className="space-y-6">
                      {/* Theme Selection */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-3">Theme</label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: "light", label: "Light", icon: Sun },
                            { id: "dark", label: "Dark", icon: Moon },
                            { id: "system", label: "System", icon: Monitor },
                          ].map((theme) => {
                            const IconComponent = theme.icon
                            return (
                              <button
                                key={theme.id}
                                onClick={() => {
                                  setUserSettings({ ...userSettings, theme: theme.id as any })
                                  applyTheme(theme.id, userSettings.accentColor)
                                }}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                  userSettings.theme === theme.id
                                    ? "border-purple-500 bg-purple-500/10"
                                    : "border-slate-600 hover:border-slate-500"
                                }`}
                              >
                                <IconComponent className="h-6 w-6 text-white mx-auto mb-2" />
                                <span className="text-white text-sm font-medium">{theme.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Accent Color */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-3">Accent Color</label>
                        <div className="grid grid-cols-4 gap-3">
                          {accentColors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => {
                                setUserSettings({ ...userSettings, accentColor: color.value })
                                applyTheme(userSettings.theme, color.value)
                              }}
                              className={`relative p-3 rounded-lg border-2 transition-all ${
                                userSettings.accentColor === color.value
                                  ? "border-white"
                                  : "border-transparent hover:border-slate-500"
                              }`}
                              style={{ backgroundColor: color.value }}
                            >
                              {userSettings.accentColor === color.value && (
                                <Check className="h-4 w-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                              )}
                              <span className="sr-only">{color.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Size */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-3">Font Size</label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: "small", label: "Small" },
                            { id: "medium", label: "Medium" },
                            { id: "large", label: "Large" },
                          ].map((size) => (
                            <button
                              key={size.id}
                              onClick={() => setUserSettings({ ...userSettings, fontSize: size.id as any })}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                userSettings.fontSize === size.id
                                  ? "border-purple-500 bg-purple-500/10"
                                  : "border-slate-600 hover:border-slate-500"
                              }`}
                            >
                              <span className="text-white font-medium">{size.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggle Options */}
                      <div className="space-y-4">
                        {[
                          {
                            key: "reducedMotion",
                            label: "Reduced Motion",
                            description: "Minimize animations and transitions",
                          },
                          {
                            key: "compactMode",
                            label: "Compact Mode",
                            description: "Show more content in less space",
                          },
                          {
                            key: "showProfileBadges",
                            label: "Show Profile Badges",
                            description: "Display achievement badges on profiles",
                          },
                          {
                            key: "autoPlayVideos",
                            label: "Auto-play Videos",
                            description: "Automatically play video content",
                          },
                        ].map((option) => (
                          <div key={option.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                            <div>
                              <h4 className="text-white font-medium">{option.label}</h4>
                              <p className="text-slate-400 text-sm">{option.description}</p>
                            </div>
                            <button
                              onClick={() =>
                                setUserSettings({
                                  ...userSettings,
                                  [option.key]: !userSettings[option.key as keyof UserSettings],
                                })
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                userSettings[option.key as keyof UserSettings] ? "bg-purple-600" : "bg-slate-600"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  userSettings[option.key as keyof UserSettings] ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={saveUserSettings}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Appearance Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Notifications</h2>
                      <p className="text-gray-400">Control how and when you receive notifications</p>
                    </div>

                    <div className="space-y-6">
                      {/* General Notification Settings */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">General</h3>
                        <div className="space-y-4">
                          {[
                            {
                              key: "emailNotifications",
                              label: "Email Notifications",
                              description: "Receive notifications via email",
                              icon: Mail,
                            },
                            {
                              key: "pushNotifications",
                              label: "Push Notifications",
                              description: "Receive browser push notifications",
                              icon: Bell,
                            },
                            {
                              key: "desktopNotifications",
                              label: "Desktop Notifications",
                              description: "Show notifications on your desktop",
                              icon: Monitor,
                            },
                            {
                              key: "soundEnabled",
                              label: "Sound Notifications",
                              description: "Play sound for notifications",
                              icon: Volume2,
                            },
                          ].map((option) => {
                            const IconComponent = option.icon
                            return (
                              <div key={option.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <IconComponent className="h-5 w-5 text-purple-400" />
                                  <div>
                                    <h4 className="text-white font-medium">{option.label}</h4>
                                    <p className="text-slate-400 text-sm">{option.description}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    setNotificationSettings({
                                      ...notificationSettings,
                                      [option.key]: !notificationSettings[option.key as keyof NotificationSettings],
                                    })
                                  }
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    notificationSettings[option.key as keyof NotificationSettings]
                                      ? "bg-purple-600"
                                      : "bg-slate-600"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      notificationSettings[option.key as keyof NotificationSettings]
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Activity Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
                        <div className="space-y-4">
                          {[
                            {
                              key: "newFollowers",
                              label: "New Followers",
                              description: "When someone follows you",
                            },
                            {
                              key: "profileLikes",
                              label: "Profile Likes",
                              description: "When someone likes your profile",
                            },
                            {
                              key: "profileComments",
                              label: "Profile Comments",
                              description: "When someone comments on your profile",
                            },
                          ].map((option) => (
                            <div key={option.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                              <div>
                                <h4 className="text-white font-medium">{option.label}</h4>
                                <p className="text-slate-400 text-sm">{option.description}</p>
                              </div>
                              <button
                                onClick={() =>
                                  setNotificationSettings({
                                    ...notificationSettings,
                                    [option.key]: !notificationSettings[option.key as keyof NotificationSettings],
                                  })
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  notificationSettings[option.key as keyof NotificationSettings]
                                    ? "bg-purple-600"
                                    : "bg-slate-600"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    notificationSettings[option.key as keyof NotificationSettings]
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* System Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">System</h3>
                        <div className="space-y-4">
                          {[
                            {
                              key: "systemUpdates",
                              label: "System Updates",
                              description: "Important updates and announcements",
                            },
                            {
                              key: "weeklyDigest",
                              label: "Weekly Digest",
                              description: "Weekly summary of your activity",
                            },
                            {
                              key: "marketingEmails",
                              label: "Marketing Emails",
                              description: "Promotional content and offers",
                            },
                          ].map((option) => (
                            <div key={option.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                              <div>
                                <h4 className="text-white font-medium">{option.label}</h4>
                                <p className="text-slate-400 text-sm">{option.description}</p>
                              </div>
                              <button
                                onClick={() =>
                                  setNotificationSettings({
                                    ...notificationSettings,
                                    [option.key]: !notificationSettings[option.key as keyof NotificationSettings],
                                  })
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  notificationSettings[option.key as keyof NotificationSettings]
                                    ? "bg-purple-600"
                                    : "bg-slate-600"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    notificationSettings[option.key as keyof NotificationSettings]
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={saveUserSettings}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Notification Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === "privacy" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Privacy</h2>
                      <p className="text-gray-400">Control your privacy and data sharing preferences</p>
                    </div>

                    <div className="space-y-6">
                      {/* Profile Visibility */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-3">Profile Visibility</label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { id: "public", label: "Public", description: "Anyone can see your profile" },
                            { id: "private", label: "Private", description: "Only you can see your profile" },
                            { id: "friends", label: "Friends", description: "Only friends can see your profile" },
                          ].map((visibility) => (
                            <button
                              key={visibility.id}
                              onClick={() => setPrivacySettings({ ...privacySettings, profileVisibility: visibility.id as any })}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                privacySettings.profileVisibility === visibility.id
                                  ? "border-purple-500 bg-purple-500/10"
                                  : "border-slate-600 hover:border-slate-500"
                              }`}
                            >
                              <h4 className="text-white font-medium mb-1">{visibility.label}</h4>
                              <p className="text-slate-400 text-sm">{visibility.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Privacy Options */}
                      <div className="space-y-4">
                        {[
                          {
                            key: "showEmail",
                            label: "Show Email",
                            description: "Display your email on your profile",
                            icon: Mail,
                          },
                          {
                            key: "showActivity",
                            label: "Show Activity",
                            description: "Display your recent activity",
                            icon: Globe,
                          },
                          {
                            key: "allowDirectMessages",
                            label: "Allow Direct Messages",
                            description: "Let others send you direct messages",
                            icon: Mail,
                          },
                          {
                            key: "showOnlineStatus",
                            label: "Show Online Status",
                            description: "Display when you're online",
                            icon: Globe,
                          },
                          {
                            key: "dataCollection",
                            label: "Data Collection",
                            description: "Allow collection of usage data for improvements",
                            icon: Shield,
                          },
                          {
                            key: "analyticsOptOut",
                            label: "Opt Out of Analytics",
                            description: "Don't track my usage for analytics",
                            icon: Shield,
                          },
                        ].map((option) => {
                          const IconComponent = option.icon
                          return (
                            <div key={option.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-purple-400" />
                                <div>
                                  <h4 className="text-white font-medium">{option.label}</h4>
                                  <p className="text-slate-400 text-sm">{option.description}</p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  setPrivacySettings({
                                    ...privacySettings,
                                    [option.key]: !privacySettings[option.key as keyof PrivacySettings],
                                  })
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  privacySettings[option.key as keyof PrivacySettings] ? "bg-purple-600" : "bg-slate-600"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    privacySettings[option.key as keyof PrivacySettings] ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      <button
                        onClick={saveUserSettings}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Privacy Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Security</h2>
                      <p className="text-gray-400">Manage your account security and authentication</p>
                    </div>

                    <div className="space-y-6">
                      {/* Password Change */}
                      <div className="bg-slate-700/30 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                            <div className="relative">
                              <input
                                type={showPasswords.current ? "text" : "password"}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                                placeholder="Enter current password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                              >
                                {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">New Password</label>
                            <div className="relative">
                              <input
                                type={showPasswords.new ? "text" : "password"}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                                placeholder="Enter new password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                              >
                                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
                            <div className="relative">
                              <input
                                type={showPasswords.confirm ? "text" : "password"}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                                placeholder="Confirm new password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                              >
                                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                          >
                            Update Password
                          </button>
                        </form>
                      </div>

                      {/* Security Options */}
                      <div className="space-y-4">
                        {[
                          {
                            key: "twoFactorEnabled",
                            label: "Two-Factor Authentication",
                            description: "Add an extra layer of security to your account",
                            icon: Shield,
                          },
                          {
                            key: "loginAlerts",
                            label: "Login Alerts",
                            description: "Get notified of new login attempts",
                            icon: Bell,
                          },
                        ].map((option) => {
                          const IconComponent = option.icon
                          return (
                            <div key={option.key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-purple-400" />
                                <div>
                                  <h4 className="text-white font-medium">{option.label}</h4>
                                  <p className="text-slate-400 text-sm">{option.description}</p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  setSecuritySettings({
                                    ...securitySettings,
                                    [option.key]: !securitySettings[option.key as keyof SecuritySettings],
                                  })
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  securitySettings[option.key as keyof SecuritySettings] ? "bg-purple-600" : "bg-slate-600"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    securitySettings[option.key as keyof SecuritySettings] ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* Session Timeout */}
                      <div className="bg-slate-700/30 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">Session Timeout</h4>
                        <p className="text-slate-400 text-sm mb-3">Automatically sign out after inactivity</p>
                        <select
                          value={securitySettings.sessionTimeout}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={0}>Never</option>
                        </select>
                      </div>

                      <button
                        onClick={saveUserSettings}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Security Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Tab */}
                {activeTab === "account" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Account Management</h2>
                      <p className="text-gray-400">Manage your account data and preferences</p>
                    </div>

                    <div className="space-y-6">
                      {/* Account Info */}
                      <div className="bg-slate-700/30 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Email:</span>
                            <span className="text-white">{user.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Account Created:</span>
                            <span className="text-white">{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">User ID:</span>
                            <span className="text-white font-mono text-sm">{user.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Data Management */}
                      <div className="bg-slate-700/30 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
                        <div className="space-y-4">
                          <button
                            onClick={exportUserData}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Export My Data
                          </button>
                          <p className="text-slate-400 text-sm">
                            Download a copy of all your data including profile information, uploads, and settings.
                          </p>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white font-medium mb-2">Delete Account</h4>
                            <p className="text-slate-400 text-sm mb-4">
                              Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <button
                              onClick={() => setShowDeleteConfirm(true)}
                              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-md w-full">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Delete Account</h3>
                <p className="text-slate-400 mb-6">
                  Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}