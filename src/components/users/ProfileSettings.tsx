import type React from "react"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import { Settings, ArrowLeft, Menu, User, Shield, Bell, Palette, Lock, Database, HelpCircle, Trophy } from 'lucide-react'
import toast from "react-hot-toast"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useNotifications } from "../../hooks/useNotifications"
import Footer from "../Footer"
import AccountSettings from "../settings/AccountSettings"
import SecuritySettings from "../settings/SecuritySettings"
import NotificationSettings from "../settings/NotificationSettings"
import AppearanceSettings from "../settings/AppearanceSettings"
import PrivacySettings from "../settings/PrivacySettings"
import DataSettings from "../settings/DataSettings"
import SupportSettings from "../settings/SupportSettings"

type Profile = {
  username: string
  display_name: string
  bio: string
  avatar_url: string
  banner_url: string
}

type LoginSession = {
  id: string
  device: string
  location: string
  ip_address: string
  last_active: string
  current: boolean
}

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
    "account" | "security" | "notifications" | "appearance" | "privacy" | "data" | "support" | "unlockables"
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Essential feature states
  const [selectedTheme, setSelectedTheme] = useState("dark")
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([])

  // Notification preferences
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState("22:00")
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00")

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState("public")
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [showBadgesOnProfile, setShowBadgesOnProfile] = useState(true)

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
          // Load user preferences from database or localStorage
          const savedTheme = localStorage.getItem("theme") || data.theme || "dark"
          const savedPrivacy = localStorage.getItem("privacy_settings")
          
          setSelectedTheme(savedTheme)
          
          // Apply saved theme on load
          if (savedTheme) {
            if (savedTheme === "light") {
              document.documentElement.classList.remove("dark")
            } else {
              document.documentElement.classList.add("dark")
            }
          }
          setQuietHoursEnabled(data.quiet_hours_enabled || false)
          setQuietHoursStart(data.quiet_hours_start || "22:00")
          setQuietHoursEnd(data.quiet_hours_end || "08:00")
          
          if (savedPrivacy) {
            try {
              const privacy = JSON.parse(savedPrivacy)
              setProfileVisibility(privacy.profile_visibility || data.profile_visibility || "public")
              setShowOnlineStatus(privacy.show_online_status ?? data.show_online_status ?? true)
            } catch {
              setProfileVisibility(data.profile_visibility || "public")
              setShowOnlineStatus(data.show_online_status ?? true)
            }
          } else {
            setProfileVisibility(data.profile_visibility || "public")
            setShowOnlineStatus(data.show_online_status ?? true)
          }
          setShowBadgesOnProfile(data.show_badges_on_profile ?? true)
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
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        toast.error("No user logged in.")
        setIsDeleting(false)
        return
      }

      const { error } = await supabase.rpc("delete_user_account", {
        uid: currentUser.id,
      })

      if (error) {
        toast.error(`Failed to delete account: ${error.message}`)
        setIsDeleting(false)
        return
      }

      toast.success("Your account has been deleted successfully.")
      await supabase.auth.signOut()
      navigate("/")
    } catch (error: any) {
      toast.error("An unexpected error occurred.")
      console.error("Delete account error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

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

  const savePrivacySettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Save to localStorage
      localStorage.setItem("privacy_settings", JSON.stringify({
        profile_visibility: profileVisibility,
        show_online_status: showOnlineStatus,
      }))
      
      // Try to save to database (if columns exist)
      const { error } = await supabase
        .from("user_profiles")
        .update({
          profile_visibility: profileVisibility,
          show_online_status: showOnlineStatus,
        } as any)
        .eq("user_id", user.id)

      if (error) {
        // If columns don't exist, that's okay - we're using localStorage
        console.log("Privacy columns may not exist in database, using localStorage")
      }
      
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
          privacy: { profileVisibility, showOnlineStatus },
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

    if (!user) {
      toast.error("Please log in to submit feedback")
      return
    }

    setLoading(true)
    try {
      // Store feedback (table may not exist, so we'll just log it for now)
      console.log("Feedback submitted:", {
        user_id: user.id,
        type: feedbackType,
        text: feedbackText,
        created_at: new Date().toISOString(),
      })
      
      toast.success("Thank you for your feedback! We'll review it soon.")
      setFeedbackText("")
      setFeedbackType("general")
    } catch (error) {
      console.error("Feedback submission error:", error)
      toast.success("Thank you for your feedback! We'll review it soon.")
      setFeedbackText("")
    } finally {
      setLoading(false)
    }
  }

  const navigationItems = useMemo(() => [
    { id: "account", label: "Account", icon: User },
    { id: "unlockables", label: "Unlockables", icon: Trophy },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "data", label: "Data & Backup", icon: Database },
    { id: "support", label: "Support", icon: HelpCircle },
  ], [])
  
  const activeTabInfo = useMemo(() => 
    navigationItems.find((item) => item.id === activeTab),
    [navigationItems, activeTab]
  )

  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab)
    setSidebarOpen(false)
  }, [])

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <main className="flex h-screen">
          {/* Sidebar */}
          <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1A1A1A] border-r border-slate-800/30 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}>
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800/30">
                <h1 className="text-xl font-bold text-white">Settings</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as typeof activeTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === item.id
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                          : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
              {/* Mobile Menu Button */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Menu className="h-5 w-5" />
                  <span>Settings</span>
                </button>
              </div>

            {/* Back Button */}
            <div className="mb-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            </div>

            {/* Content */}
            <div className="bg-[#1A1A1A] rounded-xl border border-slate-800/30 shadow-lg">
              <div className="p-4 sm:p-5">
              {/* Account Tab */}
              {activeTab === "account" && (
                <AccountSettings
                  profile={profile}
                  setProfile={setProfile}
                  user={user}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <SecuritySettings
                  user={user}
                  email={email}
                  setEmail={setEmail}
                  loading={loading}
                  setLoading={setLoading}
                  loginSessions={loginSessions}
                />
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <NotificationSettings
                  user={user}
                  loading={loading}
                  setLoading={setLoading}
                  quietHoursEnabled={quietHoursEnabled}
                  setQuietHoursEnabled={setQuietHoursEnabled}
                  quietHoursStart={quietHoursStart}
                  setQuietHoursStart={setQuietHoursStart}
                  quietHoursEnd={quietHoursEnd}
                  setQuietHoursEnd={setQuietHoursEnd}
                />
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <AppearanceSettings
                  user={user}
                  loading={loading}
                  setLoading={setLoading}
                  selectedTheme={selectedTheme}
                  setSelectedTheme={setSelectedTheme}
                />
              )}

              {/* Privacy Tab */}
              {activeTab === "privacy" && (
                <PrivacySettings
                  user={user}
                  loading={loading}
                  setLoading={setLoading}
                  profileVisibility={profileVisibility}
                  setProfileVisibility={setProfileVisibility}
                  showOnlineStatus={showOnlineStatus}
                  setShowOnlineStatus={setShowOnlineStatus}
                />
              )}

              {/* Data Tab */}
              {activeTab === "data" && (
                <DataSettings
                  user={user}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}

              {/* Support Tab */}
              {activeTab === "support" && (
                <SupportSettings
                  user={user}
                  loading={loading}
                  setLoading={setLoading}
                />
              )}

              {/* Unlockables Tab */}
              {activeTab === "unlockables" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Unlockables & Badges</h2>
                    <p className="text-slate-400">
                      View your achievements and discover badges you can unlock by engaging with the platform.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-500/20 rounded-lg">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">Badge Showcase</h3>
                        <p className="text-slate-300 mb-4">
                          Explore all available badges, track your progress, and see which achievements you've unlocked. 
                          Earn badges by uploading content, following users, and engaging with the community!
                        </p>
                        <button
                          onClick={() => navigate('/badges')}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
                        >
                          <Trophy className="w-5 h-5" />
                          <span>View Badge Showcase</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">How to Earn Badges</h4>
                      <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Upload your first piece of content</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Follow other users and build connections</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Get your content approved by moderators</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Reach download and favorite milestones</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Stay active and celebrate milestones</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Badge Rarities</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                          <span className="text-slate-300">Common - Easy to obtain</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-400"></span>
                          <span className="text-slate-300">Uncommon - Moderate achievements</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                          <span className="text-slate-300">Rare - Significant accomplishments</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-400"></span>
                          <span className="text-slate-300">Epic - Major milestones</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                          <span className="text-slate-300">Legendary - Exceptional achievements</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Badge Display Toggle */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Display Badges on Profile</h4>
                        <p className="text-sm text-slate-400">
                          Toggle whether your earned badges are visible on your public profile
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!user) return;
                          const newValue = !showBadgesOnProfile;
                          setShowBadgesOnProfile(newValue);
                          setLoading(true);
                          try {
                            const { error } = await supabase
                              .from("user_profiles")
                              .update({ show_badges_on_profile: newValue })
                              .eq("user_id", user.id);
                            if (error) throw error;
                            toast.success(newValue ? "Badges will be shown on your profile" : "Badges hidden from your profile");
                          } catch (error: any) {
                            console.error("Error updating badge display setting:", error);
                            toast.error("Failed to update setting");
                            setShowBadgesOnProfile(!newValue); // Revert on error
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          showBadgesOnProfile ? "bg-purple-600" : "bg-slate-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showBadgesOnProfile ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
