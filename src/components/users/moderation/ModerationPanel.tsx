import { useEffect, useState } from "react"
import { useAuth } from "../../../context/authContext"
import { supabase } from "../../../lib/supabase"
import { Navigate } from "react-router-dom"
import toast from "react-hot-toast"

import {
  Users,
  FileText,
  BarChart3,
  Megaphone,
  AlertTriangle,
  Shield,
  Ban,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  Clock,
  User,
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  Database,
  UserCog,
  ImageIcon,
  Search,
  Filter,
  ExternalLink,
} from "lucide-react"

interface ReportedUser {
  id: string
  reason: string
  created_at: string
  reported_user: { username: string; avatar_url?: string; id?: string } | null
  reporter_user: { username: string } | null
}

interface Log {
  id: string
  moderator_id: string
  action: string
  target_user_id: string
  target_profile_id: string | null
  description: string | null
  created_at: string
  title?: string
  tags?: string[]
  content_url?: string
}

interface UserSummary {
  user_id: string
  display_name: string | null
  username: string | null
}

interface ContentItem {
  id: string
  title: string
  image_url: string
  category: string
  type: "profile" | "banner"
  tags: string[]
  created_at: string
  user_id?: string
  username?: string
  download_count?: number
  source_table: "profiles" | "profile_pairs"
}

interface EditContentModal {
  open: boolean
  content: ContentItem | null
  editedTitle: string
  editedTags: string[]
  tagInput: string
}

const ModerationPanel = () => {
  const { userProfile, loading } = useAuth()
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportedUser[]>([])
  const [fetchingReports, setFetchingReports] = useState(true)
  const [activeTab, setActiveTab] = useState("reports")
  const [logs, setLogs] = useState<Log[]>([])
  const [fetchingLogs, setFetchingLogs] = useState(false)
  const [usersMap, setUsersMap] = useState<Record<string, UserSummary>>({})

  // Content management states
  const [content, setContent] = useState<ContentItem[]>([])
  const [fetchingContent, setFetchingContent] = useState(false)
  const [contentSearch, setContentSearch] = useState("")
  const [contentFilter, setContentFilter] = useState<"all" | "profile" | "banner">("all")
  const [editModal, setEditModal] = useState<EditContentModal>({
    open: false,
    content: null,
    editedTitle: "",
    editedTags: [],
    tagInput: "",
  })

  // Modal states
  const [actionModal, setActionModal] = useState({
    open: false,
    action: null as "warn" | "restrict" | "terminate" | null,
    userId: null as string | null,
    username: "",
  })
  const [warningMessage, setWarningMessage] = useState("")

  // Announcement states
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false)
  const [announcementDraft, setAnnouncementDraft] = useState("")

  const fetchReports = async () => {
    setFetchingReports(true)
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          id,
          reason,
          created_at,
          reported_user:user_profiles!reports_reported_user_id_fkey(username, avatar_url, id),
          reporter_user:user_profiles!reports_reporter_user_id_fkey(username)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setReports(data as ReportedUser[])
    } catch (error) {
      console.error("Failed to fetch reports", error)
      toast.error("Failed to fetch reported users")
    } finally {
      setFetchingReports(false)
    }
  }

  const fetchContent = async () => {
    setFetchingContent(true)
    try {
      const allContent: ContentItem[] = []

      // Fetch from profiles table
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select(`
            id,
            type,
            image_url,
            download_count,
            created_at,
            updated_at,
            text_data
          `)
          .order("created_at", { ascending: false })

        if (profilesError) {
          console.warn("Could not fetch from profiles table:", profilesError)
        } else if (profilesData) {
          const profilesWithMetadata = profilesData.map((item) => ({
            id: item.id,
            title: item.text_data || `${item.type} ${item.id}`,
            image_url: item.image_url || "/placeholder.svg",
            category: "General",
            type: (item.type === "banner" ? "banner" : "profile") as "profile" | "banner",
            tags: [],
            created_at: item.created_at,
            download_count: item.download_count || 0,
            username: "Unknown User",
            source_table: "profiles" as const,
          }))

          allContent.push(...profilesWithMetadata)
        }
      } catch (error) {
        console.warn("Error fetching profiles:", error)
      }

      // Fetch from profile_pairs table
      try {
        const { data: pairsData, error: pairsError } = await supabase
          .from("profile_pairs")
          .select(`
            id,
            updated_at,
            pfp_url,
            banner_url,
            title,
            category,
            tags
          `)
          .order("updated_at", { ascending: false })

        if (pairsError) {
          console.warn("Could not fetch from profile_pairs table:", pairsError)
        } else if (pairsData) {
          // Create entries for both pfp and banner from each pair
          pairsData.forEach((pair) => {
            // Add profile picture entry
            if (pair.pfp_url) {
              allContent.push({
                id: `${pair.id}-pfp`,
                title: `${pair.title} (Profile)`,
                image_url: pair.pfp_url,
                category: pair.category || "General",
                type: "profile",
                tags: Array.isArray(pair.tags) ? pair.tags : [],
                created_at: pair.updated_at,
                download_count: 0,
                username: "Unknown User",
                source_table: "profile_pairs",
              })
            }

            // Add banner entry
            if (pair.banner_url) {
              allContent.push({
                id: `${pair.id}-banner`,
                title: `${pair.title} (Banner)`,
                image_url: pair.banner_url,
                category: pair.category || "General",
                type: "banner",
                tags: Array.isArray(pair.tags) ? pair.tags : [],
                created_at: pair.updated_at,
                download_count: 0,
                username: "Unknown User",
                source_table: "profile_pairs",
              })
            }
          })
        }
      } catch (error) {
        console.warn("Error fetching profile_pairs:", error)
      }

      // Sort by creation date
      allContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setContent(allContent)
    } catch (error) {
      console.error("Failed to fetch content", error)
      toast.error("Failed to fetch content")
    } finally {
      setFetchingContent(false)
    }
  }

  const fetchLogs = async () => {
    setFetchingLogs(true)
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("moderation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (logsError) throw logsError
      if (!logsData) return

      setLogs(logsData)

      const userIdsSet = new Set<string>()
      logsData.forEach((log) => {
        if (log.moderator_id) userIdsSet.add(log.moderator_id)
        if (log.target_user_id) userIdsSet.add(log.target_user_id)
      })

      const userIds = Array.from(userIdsSet)
      if (userIds.length === 0) return

      // Try to fetch user data - handle if user_profiles table doesn't exist
      try {
        const { data: usersData, error: usersError } = await supabase
          .from("user_profiles")
          .select("user_id, display_name, username")
          .in("user_id", userIds)

        if (usersError) {
          console.warn("Could not fetch user profiles:", usersError)
        } else {
          const userMap: Record<string, UserSummary> = {}
          usersData?.forEach((u) => {
            userMap[u.user_id] = {
              user_id: u.user_id,
              display_name: u.display_name,
              username: u.username,
            }
          })
          setUsersMap(userMap)
        }
      } catch (error) {
        console.warn("User profiles table not available:", error)
      }
    } catch (error) {
      console.error("Failed to fetch logs", error)
      toast.error("Failed to fetch moderation logs")
    } finally {
      setFetchingLogs(false)
    }
  }

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, message, is_active")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) throw error

      if (data.length > 0 && data[0].is_active) {
        setAnnouncement(data[0].message)
      } else {
        setAnnouncement(null)
      }
    } catch (error) {
      console.error("Failed to fetch announcement", error)
      toast.error("Failed to fetch announcement")
    }
  }

  const saveAnnouncement = async () => {
    try {
      const { error } = await supabase.from("announcements").upsert(
        [
          {
            id: 1,
            message: announcementDraft,
            is_active: true,
          },
        ],
        { onConflict: ["id"] },
      )

      if (error) throw error

      toast.success("Announcement saved successfully")
      setAnnouncement(announcementDraft)
      setIsEditingAnnouncement(false)
    } catch (error) {
      toast.error("Failed to save announcement")
      console.error(error)
    }
  }

  const deleteAnnouncement = async () => {
    try {
      const { error } = await supabase.from("announcements").update({ is_active: false }).eq("id", 1)

      if (error) throw error

      toast.success("Announcement deleted")
      setAnnouncement(null)
      setIsEditingAnnouncement(false)
    } catch (error) {
      toast.error("Failed to delete announcement")
      console.error(error)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      const { error } = await supabase.from("reports").delete().eq("id", id)
      if (error) throw error

      setReports((prev) => prev.filter((r) => r.id !== id))
      toast.success("Report dismissed")
    } catch (error) {
      toast.error("Failed to dismiss report")
      console.error(error)
    }
  }

  const openActionModal = (action: "warn" | "restrict" | "terminate", userId: string, username: string) => {
    setActionModal({ open: true, action, userId, username })
    setWarningMessage("")
  }

  const closeActionModal = () => {
    setActionModal({ open: false, action: null, userId: null, username: "" })
    setWarningMessage("")
  }

  const handleActionConfirmed = async () => {
    if (!actionModal.userId || !actionModal.action) {
      toast.error("No action selected or target user missing")
      closeActionModal()
      return
    }

    try {
      if (actionModal.action === "warn") {
        const { error } = await supabase.from("user_warnings").insert([
          {
            user_id: actionModal.userId,
            moderator_id: userProfile?.user_id,
            message: warningMessage || "No message provided",
          },
        ])
        if (error) throw error
        toast.success(`User ${actionModal.username} has been warned`)
      } else if (actionModal.action === "restrict") {
        const { error } = await supabase
          .from("user_profiles")
          .update({ restricted: true })
          .eq("user_id", actionModal.userId)
        if (error) throw error
        toast.success(`User ${actionModal.username} has been restricted`)
      } else if (actionModal.action === "terminate") {
        const { error } = await supabase
          .from("user_profiles")
          .update({ terminated: true })
          .eq("user_id", actionModal.userId)
        if (error) throw error
        toast.success(`User ${actionModal.username} has been terminated`)
      }

      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: `${actionModal.action} user`,
          target_user_id: actionModal.userId,
          description:
            actionModal.action === "warn"
              ? `Warned user with message: ${warningMessage}`
              : `Performed ${actionModal.action} on user`,
        },
      ])

      fetchReports()
      fetchLogs()
    } catch (error) {
      console.error("Failed to perform action:", error)
      toast.error("Failed to perform action")
    } finally {
      closeActionModal()
    }
  }

  // Content management functions
  const openEditModal = (contentItem: ContentItem) => {
    setEditModal({
      open: true,
      content: contentItem,
      editedTitle: contentItem.title,
      editedTags: [...contentItem.tags],
      tagInput: "",
    })
  }

  const closeEditModal = () => {
    setEditModal({
      open: false,
      content: null,
      editedTitle: "",
      editedTags: [],
      tagInput: "",
    })
  }

  const addTagToEdit = () => {
    if (editModal.tagInput.trim() && !editModal.editedTags.includes(editModal.tagInput.trim())) {
      setEditModal({
        ...editModal,
        editedTags: [...editModal.editedTags, editModal.tagInput.trim()],
        tagInput: "",
      })
    }
  }

  const removeTagFromEdit = (tagToRemove: string) => {
    setEditModal({
      ...editModal,
      editedTags: editModal.editedTags.filter((tag) => tag !== tagToRemove),
    })
  }

  const saveContentEdit = async () => {
    if (!editModal.content) return

    try {
      if (editModal.content.source_table === "profiles") {
        // Update profiles table
        const { error } = await supabase
          .from("profiles")
          .update({
            text_data: editModal.editedTitle,
          })
          .eq("id", editModal.content.id)

        if (error) throw error
      } else if (editModal.content.source_table === "profile_pairs") {
        // Update profile_pairs table
        const pairId = editModal.content.id.split("-")[0] // Remove -pfp or -banner suffix
        const { error } = await supabase
          .from("profile_pairs")
          .update({
            title: editModal.editedTitle.replace(" (Profile)", "").replace(" (Banner)", ""),
            tags: editModal.editedTags,
          })
          .eq("id", pairId)

        if (error) throw error
      }

      toast.success("Content updated successfully")
      closeEditModal()
      fetchContent()

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "edit content",
          target_user_id: editModal.content.user_id || "unknown",
          target_profile_id: editModal.content.id,
          description: `Edited ${editModal.content.type}: "${editModal.content.title}" → "${editModal.editedTitle}"`,
        },
      ])
    } catch (error) {
      console.error("Failed to update content:", error)
      toast.error("Failed to update content")
    }
  }

  const deleteContent = async (contentItem: ContentItem) => {
    if (!window.confirm(`Are you sure you want to delete "${contentItem.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      if (contentItem.source_table === "profiles") {
        const { error } = await supabase.from("profiles").delete().eq("id", contentItem.id)
        if (error) throw error
      } else if (contentItem.source_table === "profile_pairs") {
        const pairId = contentItem.id.split("-")[0] // Remove -pfp or -banner suffix
        const { error } = await supabase.from("profile_pairs").delete().eq("id", pairId)
        if (error) throw error
      }

      toast.success("Content deleted successfully")
      fetchContent()

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "delete content",
          target_user_id: contentItem.user_id || "unknown",
          target_profile_id: contentItem.id,
          description: `Deleted ${contentItem.type}: "${contentItem.title}"`,
        },
      ])
    } catch (error) {
      console.error("Failed to delete content:", error)
      toast.error("Failed to delete content")
    }
  }

  // Filter content based on search and filter
  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(contentSearch.toLowerCase()) ||
      item.username?.toLowerCase().includes(contentSearch.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(contentSearch.toLowerCase()))
    const matchesFilter = contentFilter === "all" || item.type === contentFilter
    return matchesSearch && matchesFilter
  })

  useEffect(() => {
    fetchAnnouncement()

    const channel = supabase
      .channel("realtime:announcements")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            if (payload.new?.is_active) {
              setAnnouncement(payload.new.message)
            } else {
              setAnnouncement(null)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (userProfile?.role === "staff") {
      if (activeTab === "reports") {
        fetchReports()
      } else if (activeTab === "logs") {
        fetchLogs()
      } else if (activeTab === "content") {
        fetchContent()
      }
    }
  }, [userProfile, activeTab])

  if (!loading && userProfile?.role !== "staff") {
    return <Navigate to="/" />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  const navigationItems = [
    { id: "reports", label: "Reported Users", icon: Users },
    { id: "content", label: "Content Management", icon: ImageIcon },
    { id: "logs", label: "Moderation Logs", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "users", label: "User Management", icon: UserCog },
    { id: "settings", label: "Developer Portal", icon: Database },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-8xl mx-auto grid grid-cols-12 gap-6 md:gap-8">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col space-y-6 self-start">
          {/* Header */}
          <div className="border-b border-gray-700 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-bold">Moderation Panel</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              <span>Staff Access Active</span>
            </div>
          </div>

          {/* Navigation */}
          <section>
            <h3 className="text-lg font-semibold text-gray-300 mb-4 uppercase tracking-wide text-sm">
              Moderation Tools
            </h3>
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-3 transition-all duration-200 rounded-lg px-4 py-3 text-left ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </section>

          {/* Announcements Section */}
          <section className="mt-auto">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 uppercase tracking-wide text-sm flex items-center space-x-2">
              <Megaphone size={18} />
              <span>Announcements</span>
            </h3>

            {isEditingAnnouncement ? (
              <div className="space-y-4">
                <textarea
                  value={announcementDraft}
                  onChange={(e) => setAnnouncementDraft(e.target.value)}
                  className="w-full min-h-[100px] p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  rows={4}
                  placeholder="Write your announcement here..."
                />
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={saveAnnouncement}
                    className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => setIsEditingAnnouncement(false)}
                    className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                  {announcement && (
                    <button
                      onClick={deleteAnnouncement}
                      className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-700 rounded-lg p-3 min-h-[80px]">
                  <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                    {announcement || "No active announcements."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAnnouncementDraft(announcement || "")
                    setIsEditingAnnouncement(true)
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  <Edit3 size={16} />
                  <span>Edit Announcement</span>
                </button>
              </div>
            )}
          </section>
        </aside>

        {/* Main Content */}
        <main className="col-span-12 md:col-span-9 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {navigationItems.find((item) => item.id === activeTab)?.label || "Dashboard"}
              </h1>
              <p className="text-gray-400 mt-1">
                {activeTab === "reports" && "Review and take action on user reports"}
                {activeTab === "content" && "Manage uploaded profiles and banners"}
                {activeTab === "logs" && "View recent moderation actions and system events"}
                {activeTab === "analytics" && "Platform statistics and insights"}
                {activeTab === "users" && "Manage user accounts and permissions"}
                {activeTab === "settings" && "Configure platform-wide settings"}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              {/* Reports Tab */}
              {activeTab === "reports" && (
                <div>
                  {fetchingReports ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No pending reports</h3>
                      <p className="text-gray-400">All reports have been reviewed</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div key={report.id} className="bg-gray-700 rounded-lg border-l-4 border-l-orange-500 p-6">
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <img
                                src={report.reported_user?.avatar_url || "/placeholder.svg?height=48&width=48"}
                                alt={report.reported_user?.username || "User"}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-2.5 w-2.5 text-white" />
                              </div>
                            </div>

                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                  {report.reported_user?.username || "Unknown User"}
                                </h3>
                                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                                  REPORTED
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span>Reported by: {report.reporter_user?.username || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>{new Date(report.created_at).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                <span className="text-sm text-gray-300">{report.reason}</span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() =>
                                  openActionModal(
                                    "warn",
                                    report.reported_user?.id || "",
                                    report.reported_user?.username || "",
                                  )
                                }
                                className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-sm"
                              >
                                <AlertTriangle className="h-4 w-4" />
                                Warn
                              </button>
                              <button
                                onClick={() =>
                                  openActionModal(
                                    "restrict",
                                    report.reported_user?.id || "",
                                    report.reported_user?.username || "",
                                  )
                                }
                                className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-sm"
                              >
                                <Ban className="h-4 w-4" />
                                Restrict
                              </button>
                              <button
                                onClick={() =>
                                  openActionModal(
                                    "terminate",
                                    report.reported_user?.id || "",
                                    report.reported_user?.username || "",
                                  )
                                }
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                              >
                                <XCircle className="h-4 w-4" />
                                Terminate
                              </button>
                              <div className="border-t border-gray-600 my-1"></div>
                              <button
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to dismiss this report?")) {
                                    handleDismiss(report.id)
                                  }
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm"
                              >
                                <Eye className="h-4 w-4" />
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Content Management Tab */}
              {activeTab === "content" && (
                <div>
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by title, username, or tags..."
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={contentFilter}
                        onChange={(e) => setContentFilter(e.target.value as "all" | "profile" | "banner")}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Content</option>
                        <option value="profile">Profiles Only</option>
                        <option value="banner">Banners Only</option>
                      </select>
                    </div>
                  </div>

                  {fetchingContent ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : filteredContent.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No content found</h3>
                      <p className="text-gray-400">
                        {contentSearch || contentFilter !== "all"
                          ? "Try adjusting your search or filter criteria"
                          : "No uploaded content available"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredContent.map((item) => (
                        <div key={`${item.source_table}-${item.id}`} className="bg-gray-700 rounded-lg overflow-hidden">
                          <div className="relative">
                            <img
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  item.type === "profile" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                                }`}
                              >
                                {item.type === "profile" ? "Profile" : "Banner"}
                              </span>
                            </div>
                            <div className="absolute top-2 right-2">
                              <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                                {item.download_count || 0} downloads
                              </span>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                                {item.source_table}
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="font-semibold text-white mb-2 truncate">{item.title}</h3>

                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                              <User className="h-4 w-4" />
                              <span>{item.username || "Unknown User"}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>

                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {item.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                                {item.tags.length > 3 && (
                                  <span className="text-gray-400 text-xs">+{item.tags.length - 3} more</span>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteContent(item)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                              <button
                                onClick={() => window.open(item.image_url, "_blank")}
                                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === "logs" && (
                <div>
                  {fetchingLogs ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No logs available</h3>
                      <p className="text-gray-400">Moderation actions will appear here</p>
                    </div>
                  ) : (
                    <div className="bg-gray-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Moderator
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Target User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-600 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                                    {usersMap[log.moderator_id]?.username?.charAt(0)?.toUpperCase() || "M"}
                                  </div>
                                  <span className="text-sm text-gray-300">
                                    {usersMap[log.moderator_id]?.username || "Unknown"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {usersMap[log.target_user_id]?.username || "Unknown"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                                {log.description || "No description"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Other Tabs */}
              {["analytics", "users", "settings"].includes(activeTab) && (
                <div className="text-center py-12">
                  <div className="h-16 w-16 mx-auto text-gray-400 mb-4">
                    {activeTab === "analytics" && <BarChart3 className="h-full w-full" />}
                    {activeTab === "users" && <UserCog className="h-full w-full" />}
                    {activeTab === "settings" && <Database className="h-full w-full" />}
                  </div>
                  <h3 className="text-lg font-medium mb-2 capitalize">{activeTab} Coming Soon</h3>
                  <p className="text-gray-400">This feature will be available in a future update</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Action Modal */}
        {actionModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-lg w-full">
              <div className="flex items-center gap-2 mb-4">
                {actionModal.action === "warn" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                {actionModal.action === "restrict" && <Ban className="h-5 w-5 text-orange-500" />}
                {actionModal.action === "terminate" && <XCircle className="h-5 w-5 text-red-500" />}
                <h3 className="text-xl font-semibold">
                  {actionModal.action === "warn" && "Warn User"}
                  {actionModal.action === "restrict" && "Restrict User"}
                  {actionModal.action === "terminate" && "Terminate User"}
                </h3>
              </div>

              <p className="text-gray-400 mb-4">
                You are about to {actionModal.action} user "{actionModal.username}".
                {actionModal.action === "terminate" && " This action cannot be undone."}
              </p>

              {actionModal.action === "warn" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Warning Message</label>
                  <textarea
                    placeholder="Enter warning message (optional)"
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    className="w-full min-h-[100px] p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeActionModal}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionConfirmed}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    actionModal.action === "terminate" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Confirm {actionModal.action}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Content Modal */}
        {editModal.open && editModal.content && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Edit3 className="h-5 w-5 text-blue-500" />
                <h3 className="text-xl font-semibold">Edit Content</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div>
                  <img
                    src={editModal.content.image_url || "/placeholder.svg"}
                    alt={editModal.content.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="mt-2 text-sm text-gray-400">
                    <p>Type: {editModal.content.type}</p>
                    <p>Category: {editModal.content.category}</p>
                    <p>Source: {editModal.content.source_table}</p>
                    <p>Uploaded by: {editModal.content.username}</p>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={editModal.editedTitle}
                      onChange={(e) => setEditModal({ ...editModal, editedTitle: e.target.value })}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editModal.editedTags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-full text-sm"
                        >
                          {tag}
                          <button type="button" onClick={() => removeTagFromEdit(tag)} className="hover:text-red-400">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editModal.tagInput}
                        onChange={(e) => setEditModal({ ...editModal, tagInput: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addTagToEdit()
                          }
                        }}
                        placeholder="Add a tag"
                        className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addTagToEdit}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveContentEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModerationPanel
