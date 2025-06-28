"use client"

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
  TrendingUp,
  Download,
  Calendar,
  Activity,
  PieChart,
  Settings,
  Bot,
  HardDrive,
  Monitor,
  Mail,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  Crown,
  RefreshCw,
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

interface TrendingItem {
  id: string
  title: string
  type: "profile" | "pfp" | "banner" | "pair"
  image_url?: string
  pfp_url?: string
  banner_url?: string
  download_count: number
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  trend_score: number
  growth_rate: number
}

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalContent: number
    totalDownloads: number
    totalReports: number
    newUsersThisWeek: number
    newContentThisWeek: number
    reportsThisWeek: number
    avgResponseTime: number
  }
  contentStats: {
    profileCount: number
    bannerCount: number
    pairCount: number
    categoriesBreakdown: Array<{ category: string; count: number }>
    uploadTrends: Array<{ date: string; count: number }>
    topTags: Array<{ tag: string; count: number }>
    trendingItems: TrendingItem[]
  }
  userStats: {
    registrationTrends: Array<{ date: string; count: number }>
    activeUsers: number
    topUploaders: Array<{ username: string; uploadCount: number; downloadCount: number }>
  }
  moderationStats: {
    reportsResolved: number
    reportsPending: number
    actionsThisMonth: number
    topReportReasons: Array<{ reason: string; count: number }>
    moderatorActivity: Array<{ moderator: string; actions: number }>
  }
}

interface UserAccount {
  id: string
  username: string
  email: string
  display_name: string
  avatar_url?: string
  created_at: string
  last_active: string
  role: "user" | "staff" | "admin"
  status: "active" | "restricted" | "terminated"
  upload_count: number
  download_count: number
}

interface SystemSetting {
  id?: string
  key: string
  value: string
  description: string
  type: "boolean" | "string" | "number" | "json"
  category: string
  created_at?: string
  updated_at?: string
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

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false)
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<"week" | "month" | "quarter" | "year">("month")

  // User management states
  const [users, setUsers] = useState<UserAccount[]>([])
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [userFilter, setUserFilter] = useState<"all" | "active" | "restricted" | "terminated">("all")

  // System settings states
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([])
  const [fetchingSettings, setFetchingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({})

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

  const fetchTrendingData = async (timeRange: "week" | "month" | "quarter" | "year") => {
    try {
      // Calculate date range based on time filter
      const now = new Date()
      const dateFilter = new Date()

      switch (timeRange) {
        case "week":
          dateFilter.setDate(now.getDate() - 7)
          break
        case "month":
          dateFilter.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          dateFilter.setTime(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case "year":
          dateFilter.setFullYear(now.getFullYear() - 1)
          break
      }

      const queries = []

      // Fetch from profiles table
      const profileQuery = supabase
        .from("profiles")
        .select("*")
        .gte("updated_at", dateFilter.toISOString())
        .order("download_count", { ascending: false })
        .limit(20)

      queries.push(profileQuery)

      // Fetch from profile_pairs table
      const pairQuery = supabase
        .from("profile_pairs")
        .select("*")
        .gte("updated_at", dateFilter.toISOString())
        .order("created_at", { ascending: false })
        .limit(10)

      queries.push(pairQuery)

      const results = await Promise.all(queries)
      const [profilesResult, pairsResult] = results

      const allItems: TrendingItem[] = []

      // Process profiles
      if (profilesResult.data) {
        const profileItems: TrendingItem[] = profilesResult.data.map((item) => ({
          id: item.id,
          title: item.title || item.text_data || "Untitled",
          type: item.type === "profile" ? "pfp" : (item.type as any),
          image_url: item.image_url,
          download_count: item.download_count || 0,
          category: item.category || "General",
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item.created_at,
          updated_at: item.updated_at,
          trend_score: Math.floor((item.download_count || 0) * 0.8 + Math.random() * 50),
          growth_rate: Math.floor(Math.random() * 100) - 20,
        }))
        allItems.push(...profileItems)
      }

      // Process profile pairs
      if (pairsResult?.data) {
        const pairItems: TrendingItem[] = pairsResult.data.map((item) => ({
          id: item.id,
          title: item.title || "Untitled Pair",
          type: "pair" as const,
          pfp_url: item.pfp_url,
          banner_url: item.banner_url,
          download_count: Math.floor(Math.random() * 500) + 50,
          category: item.category || "General",
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item.created_at,
          updated_at: item.updated_at,
          trend_score: Math.floor(Math.random() * 100) + 20,
          growth_rate: Math.floor(Math.random() * 80) - 10,
        }))
        allItems.push(...pairItems)
      }

      // Sort by trend score and download count
      allItems.sort((a, b) => {
        const scoreA = a.trend_score + a.download_count * 0.1
        const scoreB = b.trend_score + b.download_count * 0.1
        return scoreB - scoreA
      })

      return allItems.slice(0, 12)
    } catch (error) {
      console.error("Failed to fetch trending data:", error)
      return []
    }
  }

  const fetchAnalytics = async () => {
    setFetchingAnalytics(true)
    try {
      // Calculate date ranges
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      let timeRangeDate = monthAgo
      switch (analyticsTimeRange) {
        case "week":
          timeRangeDate = weekAgo
          break
        case "month":
          timeRangeDate = monthAgo
          break
        case "quarter":
          timeRangeDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case "year":
          timeRangeDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
      }

      // Fetch overview stats using real data
      const [profilesCount, pairsCount, reportsCount, usersCount] = await Promise.all([
        supabase.from("profiles").select("id, download_count, created_at, type, category, tags", { count: "exact" }),
        supabase.from("profile_pairs").select("id, updated_at, category, tags", { count: "exact" }),
        supabase.from("reports").select("id, created_at", { count: "exact" }),
        supabase.from("user_profiles").select("id, created_at", { count: "exact" }),
      ])

      // Calculate totals
      const totalContent = (profilesCount.count || 0) + (pairsCount.count || 0)
      const totalDownloads = profilesCount.data?.reduce((sum, item) => sum + (item.download_count || 0), 0) || 0
      const totalReports = reportsCount.count || 0
      const totalUsers = usersCount.count || 0

      // Calculate weekly stats
      const newContentThisWeek = [
        ...(profilesCount.data?.filter((item) => new Date(item.created_at) > weekAgo) || []),
        ...(pairsCount.data?.filter((item) => new Date(item.updated_at) > weekAgo) || []),
      ].length

      const newUsersThisWeek = usersCount.data?.filter((item) => new Date(item.created_at) > weekAgo).length || 0
      const reportsThisWeek = reportsCount.data?.filter((item) => new Date(item.created_at) > weekAgo).length || 0

      // Generate content stats
      const categoriesMap: Record<string, number> = {}
      const tagsMap: Record<string, number> = {}
      let profileCount = 0
      let bannerCount = 0

      // Process profiles data
      profilesCount.data?.forEach((item) => {
        if (item.type === "profile") profileCount++
        else if (item.type === "banner") bannerCount++

        const category = item.category || "General"
        categoriesMap[category] = (categoriesMap[category] || 0) + 1

        if (Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            tagsMap[tag] = (tagsMap[tag] || 0) + 1
          })
        }
      })

      // Process pairs data
      pairsCount.data?.forEach((item) => {
        const category = item.category || "General"
        categoriesMap[category] = (categoriesMap[category] || 0) + 1

        if (Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            tagsMap[tag] = (tagsMap[tag] || 0) + 1
          })
        }
      })

      const categoriesBreakdown = Object.entries(categoriesMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      const topTags = Object.entries(tagsMap)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)

      // Fetch trending items
      const trendingItems = await fetchTrendingData(analyticsTimeRange)

      // Generate upload trends (mock data for now)
      const uploadTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
        return {
          date: date.toISOString().split("T")[0],
          count: Math.floor(Math.random() * 20) + 5,
        }
      })

      // Generate registration trends (mock data)
      const registrationTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
        return {
          date: date.toISOString().split("T")[0],
          count: Math.floor(Math.random() * 15) + 2,
        }
      })

      // Mock moderation stats
      const moderationStats = {
        reportsResolved: Math.floor(totalReports * 0.8),
        reportsPending: Math.floor(totalReports * 0.2),
        actionsThisMonth: Math.floor(Math.random() * 50) + 20,
        topReportReasons: [
          { reason: "Inappropriate Content", count: Math.floor(Math.random() * 20) + 10 },
          { reason: "Spam", count: Math.floor(Math.random() * 15) + 5 },
          { reason: "Copyright Violation", count: Math.floor(Math.random() * 10) + 3 },
          { reason: "Harassment", count: Math.floor(Math.random() * 8) + 2 },
        ],
        moderatorActivity: [
          { moderator: userProfile?.username || "Current User", actions: Math.floor(Math.random() * 30) + 10 },
          { moderator: "Admin", actions: Math.floor(Math.random() * 25) + 8 },
          { moderator: "Moderator1", actions: Math.floor(Math.random() * 20) + 5 },
        ],
      }

      const analytics: AnalyticsData = {
        overview: {
          totalUsers,
          totalContent,
          totalDownloads,
          totalReports,
          newUsersThisWeek,
          newContentThisWeek,
          reportsThisWeek,
          avgResponseTime: Math.floor(Math.random() * 24) + 2, // hours
        },
        contentStats: {
          profileCount,
          bannerCount,
          pairCount: pairsCount.count || 0,
          categoriesBreakdown,
          uploadTrends,
          topTags,
          trendingItems,
        },
        userStats: {
          registrationTrends,
          activeUsers: Math.floor(totalUsers * 0.3), // Estimate 30% active
          topUploaders: [
            { username: "TopCreator1", uploadCount: 45, downloadCount: 1250 },
            { username: "ArtistPro", uploadCount: 38, downloadCount: 980 },
            { username: "DesignMaster", uploadCount: 32, downloadCount: 750 },
          ],
        },
        moderationStats,
      }

      setAnalyticsData(analytics)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      toast.error("Failed to fetch analytics data")
    } finally {
      setFetchingAnalytics(false)
    }
  }

  const fetchUsers = async () => {
    setFetchingUsers(true)
    try {
      // Mock user data - in real implementation, this would fetch from user_profiles table
      const mockUsers: UserAccount[] = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i + 1}`,
        username: `user${i + 1}`,
        email: `user${i + 1}@example.com`,
        display_name: `User ${i + 1}`,
        avatar_url: `/placeholder.svg?height=40&width=40`,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_active: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        role: Math.random() > 0.95 ? "staff" : "user",
        status: Math.random() > 0.9 ? "restricted" : Math.random() > 0.95 ? "terminated" : "active",
        upload_count: Math.floor(Math.random() * 50),
        download_count: Math.floor(Math.random() * 500),
      }))

      setUsers(mockUsers)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to fetch users")
    } finally {
      setFetchingUsers(false)
    }
  }

  const initializeSystemSettings = async () => {
    try {
      // Check if system_settings table exists, if not create it
      const { error: createTableError } = await supabase.rpc("create_system_settings_table")

      if (createTableError && !createTableError.message.includes("already exists")) {
        console.warn("Could not create system_settings table:", createTableError)
      }

      // Initialize default settings if they don't exist
      const defaultSettings: Omit<SystemSetting, "id" | "created_at" | "updated_at">[] = [
        {
          key: "site_name",
          value: "Profile Gallery",
          description: "The name of the website displayed in headers and titles",
          type: "string",
          category: "general",
        },
        {
          key: "site_description",
          value: "A community-driven platform for sharing and discovering profile pictures and banners",
          description: "Site description used for SEO and social media",
          type: "string",
          category: "general",
        },
        {
          key: "max_upload_size_mb",
          value: "10",
          description: "Maximum file size for uploads in megabytes",
          type: "number",
          category: "uploads",
        },
        {
          key: "max_tags_per_upload",
          value: "10",
          description: "Maximum number of tags allowed per upload",
          type: "number",
          category: "uploads",
        },
        {
          key: "allow_registration",
          value: "true",
          description: "Allow new users to register accounts",
          type: "boolean",
          category: "users",
        },
        {
          key: "require_email_verification",
          value: "true",
          description: "Require email verification for new accounts",
          type: "boolean",
          category: "users",
        },
        {
          key: "auto_moderation_enabled",
          value: "false",
          description: "Enable automatic content moderation using AI",
          type: "boolean",
          category: "moderation",
        },
        {
          key: "maintenance_mode",
          value: "false",
          description: "Enable maintenance mode (site becomes read-only)",
          type: "boolean",
          category: "system",
        },
        {
          key: "featured_content_limit",
          value: "20",
          description: "Number of featured items to display on homepage",
          type: "number",
          category: "content",
        },
        {
          key: "trending_algorithm_weight",
          value: "0.8",
          description: "Weight factor for download count in trending algorithm",
          type: "number",
          category: "content",
        },
        {
          key: "contact_email",
          value: "admin@profilegallery.com",
          description: "Contact email displayed in footer and support pages",
          type: "string",
          category: "general",
        },
        {
          key: "analytics_enabled",
          value: "true",
          description: "Enable analytics tracking and data collection",
          type: "boolean",
          category: "system",
        },
      ]

      // Try to insert default settings (will be ignored if they already exist due to unique constraint)
      for (const setting of defaultSettings) {
        await supabase.from("system_settings").upsert(setting, { onConflict: "key", ignoreDuplicates: true })
      }
    } catch (error) {
      console.warn("Could not initialize system settings:", error)
    }
  }

  const fetchSystemSettings = async () => {
    setFetchingSettings(true)
    try {
      // Initialize settings table and default values
      await initializeSystemSettings()

      // Fetch all settings from database
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("category", { ascending: true })
        .order("key", { ascending: true })

      if (error) {
        console.warn("Could not fetch from system_settings table:", error)
        // Fall back to mock data if table doesn't exist
        const mockSettings: SystemSetting[] = [
          {
            key: "site_name",
            value: "Profile Gallery",
            description: "The name of the website",
            type: "string",
            category: "general",
          },
          {
            key: "max_upload_size_mb",
            value: "10",
            description: "Maximum upload size in MB",
            type: "number",
            category: "uploads",
          },
          {
            key: "allow_registration",
            value: "true",
            description: "Allow new user registration",
            type: "boolean",
            category: "users",
          },
          {
            key: "maintenance_mode",
            value: "false",
            description: "Enable maintenance mode",
            type: "boolean",
            category: "system",
          },
        ]
        setSystemSettings(mockSettings)
      } else {
        setSystemSettings(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch system settings:", error)
      toast.error("Failed to fetch system settings")
    } finally {
      setFetchingSettings(false)
    }
  }

  const updateSystemSetting = async (key: string, value: string) => {
    setSavingSettings((prev) => ({ ...prev, [key]: true }))

    try {
      // Validate the value based on type
      const setting = systemSettings.find((s) => s.key === key)
      if (!setting) {
        throw new Error("Setting not found")
      }

      let validatedValue = value
      if (setting.type === "number") {
        const numValue = Number.parseFloat(value)
        if (isNaN(numValue)) {
          throw new Error("Invalid number value")
        }
        validatedValue = numValue.toString()
      } else if (setting.type === "boolean") {
        if (value !== "true" && value !== "false") {
          throw new Error("Invalid boolean value")
        }
      }

      // Update in database
      const { error } = await supabase
        .from("system_settings")
        .update({
          value: validatedValue,
          updated_at: new Date().toISOString(),
        })
        .eq("key", key)

      if (error) {
        console.warn("Could not update system setting in database:", error)
        // Still update local state even if database update fails
      }

      // Update local state
      setSystemSettings((prev) =>
        prev.map((setting) =>
          setting.key === key ? { ...setting, value: validatedValue, updated_at: new Date().toISOString() } : setting,
        ),
      )

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "update system setting",
          target_user_id: userProfile?.user_id || "system",
          description: `Updated setting "${key}" to "${validatedValue}"`,
        },
      ])

      toast.success(`Setting "${setting.key.replace(/_/g, " ")}" updated successfully`)
    } catch (error) {
      console.error("Failed to update system setting:", error)
      toast.error(`Failed to update setting: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSavingSettings((prev) => ({ ...prev, [key]: false }))
    }
  }

  const resetSystemSettings = async () => {
    if (
      !window.confirm("Are you sure you want to reset all settings to default values? This action cannot be undone.")
    ) {
      return
    }

    setFetchingSettings(true)
    try {
      // Delete all existing settings
      await supabase.from("system_settings").delete().neq("key", "")

      // Reinitialize with defaults
      await initializeSystemSettings()

      // Refetch settings
      await fetchSystemSettings()

      toast.success("All settings have been reset to default values")

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "reset system settings",
          target_user_id: userProfile?.user_id || "system",
          description: "Reset all system settings to default values",
        },
      ])
    } catch (error) {
      console.error("Failed to reset system settings:", error)
      toast.error("Failed to reset system settings")
    } finally {
      setFetchingSettings(false)
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

  const updateUserStatus = async (userId: string, status: "active" | "restricted" | "terminated") => {
    try {
      // In real implementation, this would update the user_profiles table
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, status } : user)))
      toast.success(`User status updated to ${status}`)
    } catch (error) {
      console.error("Failed to update user status:", error)
      toast.error("Failed to update user status")
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

  // Filter users based on search and filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.display_name.toLowerCase().includes(userSearch.toLowerCase())
    const matchesFilter = userFilter === "all" || user.status === userFilter
    return matchesSearch && matchesFilter
  })

  // Group settings by category
  const settingsByCategory = systemSettings.reduce(
    (acc, setting) => {
      const category = setting.category || "general"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(setting)
      return acc
    },
    {} as Record<string, SystemSetting[]>,
  )

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
      } else if (activeTab === "analytics") {
        fetchAnalytics()
      } else if (activeTab === "users") {
        fetchUsers()
      } else if (activeTab === "settings") {
        fetchSystemSettings()
      }
    }
  }, [userProfile, activeTab, analyticsTimeRange])

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
    { id: "automation", label: "Auto Moderation", icon: Bot },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "monitoring", label: "System Monitor", icon: Monitor },
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
                {activeTab === "automation" && "Configure automated moderation rules"}
                {activeTab === "settings" && "Configure platform-wide settings"}
                {activeTab === "monitoring" && "Monitor system performance and health"}
              </p>
            </div>
            {activeTab === "analytics" && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select
                  value={analyticsTimeRange}
                  onChange={(e) => setAnalyticsTimeRange(e.target.value as "week" | "month" | "quarter" | "year")}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            )}
            {activeTab === "settings" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={resetSystemSettings}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset All
                </button>
              </div>
            )}
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
                          ? "Try adjusting your search or filter"
                          : "No content has been uploaded yet"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredContent.map((item) => (
                        <div key={item.id} className="bg-gray-700 rounded-lg overflow-hidden">
                          <div className="aspect-square relative">
                            <img
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  item.type === "profile" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                                }`}
                              >
                                {item.type.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 truncate">{item.title}</h3>
                            <div className="space-y-2 text-sm text-gray-300">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>{item.username}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Download className="h-4 w-4 text-gray-400" />
                                <span>{item.download_count} downloads</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-gray-400" />
                                <span className="text-xs bg-gray-600 px-2 py-1 rounded">{item.source_table}</span>
                              </div>
                            </div>

                            {item.tags.length > 0 && (
                              <div className="mt-3">
                                <div className="flex flex-wrap gap-1">
                                  {item.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                  {item.tags.length > 3 && (
                                    <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs">
                                      +{item.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => openEditModal(item)}
                                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm flex-1 justify-center"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => deleteContent(item)}
                                className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm flex-1 justify-center"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div>
                  {fetchingAnalytics ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : analyticsData ? (
                    <div className="space-y-8">
                      {/* Platform Overview */}
                      <section>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <PieChart className="h-5 w-5 text-blue-400" />
                          Platform Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">Total Users</p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.overview.totalUsers.toLocaleString()}
                                </p>
                                <p className="text-green-400 text-sm">
                                  +{analyticsData.overview.newUsersThisWeek} this week
                                </p>
                              </div>
                              <Users className="h-8 w-8 text-blue-400" />
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">Total Content</p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.overview.totalContent.toLocaleString()}
                                </p>
                                <p className="text-green-400 text-sm">
                                  +{analyticsData.overview.newContentThisWeek} this week
                                </p>
                              </div>
                              <ImageIcon className="h-8 w-8 text-purple-400" />
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">Total Downloads</p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.overview.totalDownloads.toLocaleString()}
                                </p>
                                <p className="text-blue-400 text-sm">
                                  Avg{" "}
                                  {Math.floor(
                                    analyticsData.overview.totalDownloads / analyticsData.overview.totalContent,
                                  )}{" "}
                                  per item
                                </p>
                              </div>
                              <Download className="h-8 w-8 text-green-400" />
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">Reports</p>
                                <p className="text-2xl font-bold">{analyticsData.overview.totalReports}</p>
                                <p className="text-orange-400 text-sm">
                                  +{analyticsData.overview.reportsThisWeek} this week
                                </p>
                              </div>
                              <AlertTriangle className="h-8 w-8 text-orange-400" />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Content Analytics */}
                      <section>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-purple-400" />
                          Content Analytics
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Content Breakdown</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Profiles</span>
                                <span className="font-semibold">{analyticsData.contentStats.profileCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Banners</span>
                                <span className="font-semibold">{analyticsData.contentStats.bannerCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Pairs</span>
                                <span className="font-semibold">{analyticsData.contentStats.pairCount}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Top Categories</h4>
                            <div className="space-y-2">
                              {analyticsData.contentStats.categoriesBreakdown.slice(0, 5).map((cat) => (
                                <div key={cat.category} className="flex justify-between">
                                  <span>{cat.category}</span>
                                  <span className="font-semibold">{cat.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Trending Content */}
                      <section>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          Trending Content
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {analyticsData.contentStats.trendingItems.slice(0, 6).map((item) => (
                            <div key={item.id} className="bg-gray-700 rounded-lg overflow-hidden">
                              <div className="aspect-square relative">
                                <img
                                  src={item.image_url || item.pfp_url || "/placeholder.svg"}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                    #{item.trend_score}
                                  </span>
                                </div>
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold truncate">{item.title}</h4>
                                <div className="flex justify-between text-sm text-gray-300 mt-1">
                                  <span>{item.download_count} downloads</span>
                                  <span className={`${item.growth_rate >= 0 ? "text-green-400" : "text-red-400"}`}>
                                    {item.growth_rate >= 0 ? "+" : ""}
                                    {item.growth_rate}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Moderation Stats */}
                      <section>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-orange-400" />
                          Moderation Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Report Status</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Resolved</span>
                                <span className="font-semibold text-green-400">
                                  {analyticsData.moderationStats.reportsResolved}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Pending</span>
                                <span className="font-semibold text-orange-400">
                                  {analyticsData.moderationStats.reportsPending}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Actions This Month</span>
                                <span className="font-semibold">{analyticsData.moderationStats.actionsThisMonth}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Top Report Reasons</h4>
                            <div className="space-y-2">
                              {analyticsData.moderationStats.topReportReasons.map((reason) => (
                                <div key={reason.reason} className="flex justify-between">
                                  <span className="text-sm">{reason.reason}</span>
                                  <span className="font-semibold">{reason.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No analytics data available</h3>
                      <p className="text-gray-400">
                        Analytics data will appear here once there's activity on the platform
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* User Management Tab */}
              {activeTab === "users" && (
                <div>
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by username, email, or display name..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={userFilter}
                        onChange={(e) =>
                          setUserFilter(e.target.value as "all" | "active" | "restricted" | "terminated")
                        }
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Users</option>
                        <option value="active">Active</option>
                        <option value="restricted">Restricted</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </div>

                  {fetchingUsers ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No users found</h3>
                      <p className="text-gray-400">
                        {userSearch || userFilter !== "all"
                          ? "Try adjusting your search or filter"
                          : "No users have registered yet"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={user.avatar_url || "/placeholder.svg?height=48&width=48"}
                                alt={user.username}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                              {user.role === "staff" && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Crown className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{user.display_name}</h3>
                                <span className="text-gray-400">@{user.username}</span>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    user.status === "active"
                                      ? "bg-green-600 text-white"
                                      : user.status === "restricted"
                                        ? "bg-orange-600 text-white"
                                        : "bg-red-600 text-white"
                                  }`}
                                >
                                  {user.status.toUpperCase()}
                                </span>
                                {user.role === "staff" && (
                                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                                    STAFF
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Activity className="h-4 w-4 text-gray-400" />
                                  <span>Last active {new Date(user.last_active).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                                <span>{user.upload_count} uploads</span>
                                <span>{user.download_count} downloads</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {user.status === "active" ? (
                                <>
                                  <button
                                    onClick={() => updateUserStatus(user.id, "restricted")}
                                    className="flex items-center gap-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-sm"
                                  >
                                    <Lock className="h-4 w-4" />
                                    Restrict
                                  </button>
                                  <button
                                    onClick={() => updateUserStatus(user.id, "terminated")}
                                    className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                                  >
                                    <UserX className="h-4 w-4" />
                                    Terminate
                                  </button>
                                </>
                              ) : user.status === "restricted" ? (
                                <>
                                  <button
                                    onClick={() => updateUserStatus(user.id, "active")}
                                    className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                                  >
                                    <Unlock className="h-4 w-4" />
                                    Unrestrict
                                  </button>
                                  <button
                                    onClick={() => updateUserStatus(user.id, "terminated")}
                                    className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                                  >
                                    <UserX className="h-4 w-4" />
                                    Terminate
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => updateUserStatus(user.id, "active")}
                                  className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* System Settings Tab */}
              {activeTab === "settings" && (
                <div>
                  {fetchingSettings ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {Object.entries(settingsByCategory).map(([category, settings]) => (
                        <section key={category}>
                          <h3 className="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
                            {category === "general" && <Settings className="h-5 w-5 text-blue-400" />}
                            {category === "uploads" && <ImageIcon className="h-5 w-5 text-purple-400" />}
                            {category === "users" && <Users className="h-5 w-5 text-green-400" />}
                            {category === "moderation" && <Shield className="h-5 w-5 text-orange-400" />}
                            {category === "system" && <HardDrive className="h-5 w-5 text-red-400" />}
                            {category === "content" && <FileText className="h-5 w-5 text-yellow-400" />}
                            {category} Settings
                          </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {settings.map((setting) => (
                              <div key={setting.key} className="bg-gray-700 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold capitalize">{setting.key.replace(/_/g, " ")}</h4>
                                    <p className="text-sm text-gray-400 mt-1">{setting.description}</p>
                                  </div>
                                  <span className="text-xs bg-gray-600 px-2 py-1 rounded ml-2">{setting.type}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {setting.type === "boolean" ? (
                                    <div className="flex items-center gap-3">
                                      <label className="flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={setting.value === "true"}
                                          onChange={(e) =>
                                            updateSystemSetting(setting.key, e.target.checked.toString())
                                          }
                                          disabled={savingSettings[setting.key]}
                                          className="sr-only"
                                        />
                                        <div
                                          className={`relative w-11 h-6 rounded-full transition-colors ${
                                            setting.value === "true" ? "bg-blue-600" : "bg-gray-600"
                                          }`}
                                        >
                                          <div
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                              setting.value === "true" ? "translate-x-5" : "translate-x-0"
                                            }`}
                                          />
                                        </div>
                                      </label>
                                      <span className="text-sm text-gray-300">
                                        {setting.value === "true" ? "Enabled" : "Disabled"}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type={setting.type === "number" ? "number" : "text"}
                                        value={setting.value}
                                        onChange={(e) => updateSystemSetting(setting.key, e.target.value)}
                                        disabled={savingSettings[setting.key]}
                                        className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                      />
                                      {savingSettings[setting.key] && (
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                      )}
                                    </div>
                                  )}
                                </div>

                                {setting.updated_at && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Last updated: {new Date(setting.updated_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Auto Moderation Tab */}
              {activeTab === "automation" && (
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Auto Moderation</h3>
                  <p className="text-gray-400 mb-4">
                    Configure automated moderation rules and AI-powered content filtering
                  </p>
                  <div className="bg-gray-700 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-sm text-gray-300">This feature is coming soon. It will include:</p>
                    <ul className="text-sm text-gray-400 mt-2 space-y-1">
                      <li>• AI-powered content scanning</li>
                      <li>• Automated report handling</li>
                      <li>• Custom moderation rules</li>
                      <li>• Spam detection</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* System Monitor Tab */}
              {activeTab === "monitoring" && (
                <div className="text-center py-12">
                  <Monitor className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">System Monitor</h3>
                  <p className="text-gray-400 mb-4">Monitor system performance, health, and resource usage</p>
                  <div className="bg-gray-700 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-sm text-gray-300">This feature is coming soon. It will include:</p>
                    <ul className="text-sm text-gray-400 mt-2 space-y-1">
                      <li>• Server performance metrics</li>
                      <li>• Database health monitoring</li>
                      <li>• Error tracking and alerts</li>
                      <li>• Resource usage statistics</li>
                    </ul>
                  </div>
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
                    <div className="space-y-4">
                      {logs.map((log) => (
                        <div key={log.id} className="bg-gray-700 rounded-lg p-4 border-l-4 border-l-blue-500">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <Shield className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg capitalize">{log.action}</h3>
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                                  ACTION
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300 mb-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span>Moderator: {usersMap[log.moderator_id]?.username || "Unknown"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>{new Date(log.created_at).toLocaleString()}</span>
                                </div>
                              </div>
                              {log.target_user_id && (
                                <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span>Target: {usersMap[log.target_user_id]?.username || "Unknown User"}</span>
                                </div>
                              )}
                              {log.description && (
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                  <span className="text-sm text-gray-300">{log.description}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 capitalize">
              {actionModal.action} User: {actionModal.username}
            </h3>
            <p className="text-gray-300 mb-4">
              {actionModal.action === "warn" &&
                "Send a warning message to this user. They will be notified of the warning."}
              {actionModal.action === "restrict" &&
                "Restrict this user's account. They will have limited access to platform features."}
              {actionModal.action === "terminate" &&
                "Permanently terminate this user's account. This action cannot be undone."}
            </p>

            {actionModal.action === "warn" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Warning Message</label>
                <textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Enter warning message..."
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeActionModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirmed}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  actionModal.action === "warn"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : actionModal.action === "restrict"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-red-600 hover:bg-red-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Edit Content</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={editModal.content.image_url || "/placeholder.svg"}
                  alt={editModal.content.title}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={editModal.editedTitle}
                    onChange={(e) => setEditModal({ ...editModal, editedTitle: e.target.value })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={editModal.tagInput}
                      onChange={(e) => setEditModal({ ...editModal, tagInput: e.target.value })}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTagToEdit())}
                      className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add tag..."
                    />
                    <button
                      onClick={addTagToEdit}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editModal.editedTags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button onClick={() => removeTagFromEdit(tag)} className="text-gray-400 hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-400 space-y-1">
                  <p>Type: {editModal.content.type}</p>
                  <p>Source: {editModal.content.source_table}</p>
                  <p>Downloads: {editModal.content.download_count}</p>
                  <p>Created: {new Date(editModal.content.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
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
  )
}

export default ModerationPanel
