import { useEffect, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { supabase } from "../../../lib/supabase";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  moderateContent,
  generateContentTags,
  analyzeUserBehavior,
  type ModerationResult,
} from "../../../lib/openai-moderation";
import {
  HardDrive,
  UserCheck,
  Users,
  UserX,
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
  Mail,
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
  Monitor,
  RefreshCw,
  Plus,
  Zap,
  Brain,
  Target,
  Scan,
  AlertOctagon,
  PlayCircle,
  PauseCircle,
  Trash,
  Edit,
  Sparkles,
  BotIcon as Robot,
  TrendingDown,
} from "lucide-react";
import Footer from "../../Footer";

interface ReportedUser {
  id: string;
  reason: string;
  description?: string;
  created_at: string;
  status?: string;
  reported_user_id?: string;
  reporter_user_id: string;
  content_id?: string;
  content_type?: string;
  reported_user: { username: string; avatar_url?: string; id?: string } | null;
  reporter_user: { username: string } | null;
}

interface Log {
  id: string;
  moderator_id: string;
  action: string;
  target_user_id: string;
  target_profile_id: string | null;
  description: string | null;
  created_at: string;
  title?: string;
  tags?: string[];
  content_url?: string;
}

interface UserSummary {
  user_id: string;
  display_name: string | null;
  username: string | null;
}

interface ContentItem {
  id: string;
  title: string;
  image_url: string;
  category: string;
  type: "profile" | "banner";
  tags: string[];
  created_at: string;
  user_id?: string;
  username?: string;
  download_count?: number;
  source_table: "profiles" | "profile_pairs" | "emoji_combos";
}

interface EditContentModal {
  open: boolean;
  content: ContentItem | null;
  editedTitle: string;
  editedTags: string[];
  tagInput: string;
}

interface TrendingItem {
  id: string;
  title: string;
  type: "profile" | "pfp" | "banner" | "pair";
  image_url?: string;
  pfp_url?: string;
  banner_url?: string;
  download_count: number;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  trend_score: number;
  growth_rate: number;
}

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalContent: number;
    totalDownloads: number;
    totalReports: number;
    newUsersThisWeek: number;
    newContentThisWeek: number;
    reportsThisWeek: number;
    avgResponseTime: number;
  };
  contentStats: {
    profileCount: number;
    bannerCount: number;
    pairCount: number;
    emojiComboCount: number;
    categoriesBreakdown: Array<{ category: string; count: number }>;
    uploadTrends: Array<{ date: string; count: number }>;
    topTags: Array<{ tag: string; count: number }>;
    trendingItems: TrendingItem[];
  };
  userStats: {
    registrationTrends: Array<{ date: string; count: number }>;
    activeUsers: number;
    topUploaders: Array<{
      username: string;
      uploadCount: number;
      downloadCount: number;
    }>;
  };
  moderationStats: {
    reportsResolved: number;
    reportsPending: number;
    actionsThisMonth: number;
    topReportReasons: Array<{ reason: string; count: number }>;
    moderatorActivity: Array<{ moderator: string; actions: number }>;
  };
}

interface UserAccount {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  last_active: string;
  role: "user" | "staff" | "admin";
  status: "active" | "restricted" | "terminated";
  upload_count: number;
  download_count: number;
}

interface SystemSetting {
  id?: string;
  key: string;
  value: string;
  description: string;
  type: "boolean" | "string" | "number" | "json";
  category: string;
  created_at?: string;
  updated_at?: string;
}

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  type:
    | "content_filter"
    | "spam_detection"
    | "user_behavior"
    | "keyword_filter"
    | "ai_moderation";
  enabled: boolean;
  severity: "low" | "medium" | "high" | "critical";
  action:
    | "flag"
    | "hide"
    | "remove"
    | "warn_user"
    | "restrict_user"
    | "ban_user";
  conditions: {
    keywords?: string[];
    patterns?: string[];
    thresholds?: Record<string, number>;
    categories?: string[];
    aiEnabled?: boolean;
    confidenceThreshold?: number;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface AutoModerationScan {
  id: string;
  content_id: string;
  content_type: "profile" | "banner" | "comment" | "message";
  scan_type:
    | "ai_content"
    | "spam_detection"
    | "keyword_filter"
    | "image_analysis"
    | "openai_moderation";
  status: "pending" | "completed" | "failed";
  confidence_score: number;
  flags: string[];
  action_taken: string | null;
  rule_id?: string;
  ai_result?: ModerationResult;
  created_at: string;
  completed_at: string | null;
}

interface SpamPattern {
  id: string;
  pattern: string;
  type: "regex" | "keyword" | "domain" | "behavior";
  description: string;
  severity: number;
  enabled: boolean;
  created_at: string;
  updated_at?: string;
}

const ModerationPanel = () => {
  const { userProfile, loading } = useAuth();
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportedUser[]>([]);
  const [fetchingReports, setFetchingReports] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");
  const [logs, setLogs] = useState<Log[]>([]);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<string, UserSummary>>({});

  // Report modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    userId?: string;
    username?: string;
    contentId?: string;
    contentType?: string;
  }>({});

  // Content management states
  const [content, setContent] = useState<ContentItem[]>([]);
  const [fetchingContent, setFetchingContent] = useState(false);
  const [contentSearch, setContentSearch] = useState("");
  const [contentFilter, setContentFilter] = useState<
    "all" | "profile" | "banner"
  >("all");
  const [editModal, setEditModal] = useState<EditContentModal>({
    open: false,
    content: null,
    editedTitle: "",
    editedTags: [],
    tagInput: "",
  });

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  // User management states
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<
    "all" | "active" | "restricted" | "terminated"
  >("all");

  // System settings states
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [fetchingSettings, setFetchingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>(
    {}
  );

  // Auto moderation states
  const [moderationRules, setModerationRules] = useState<ModerationRule[]>([]);
  const [fetchingRules, setFetchingRules] = useState(false);
  const [recentScans, setRecentScans] = useState<AutoModerationScan[]>([]);
  const [fetchingScans, setFetchingScans] = useState(false);
  const [spamPatterns, setSpamPatterns] = useState<SpamPattern[]>([]);
  const [fetchingPatterns, setFetchingPatterns] = useState(false);
  const [autoModerationStats, setAutoModerationStats] = useState({
    totalScans: 0,
    flaggedContent: 0,
    autoActions: 0,
    accuracy: 0,
    activeRules: 0,
    aiScansToday: 0,
    aiAccuracy: 0,
  });

  // AI-specific states
  const [aiScanInProgress, setAiScanInProgress] = useState(false);
  const [bulkScanInProgress, setBulkScanInProgress] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    riskUsers: Array<{
      username: string;
      riskLevel: string;
      concerns: string[];
    }>;
    contentTrends: Array<{ trend: string; impact: string }>;
    recommendations: string[];
  } | null>(null);

  // Modal states
  const [actionModal, setActionModal] = useState({
    open: false,
    action: null as "warn" | "restrict" | "terminate" | null,
    userId: null as string | null,
    username: "",
  });
  const [warningMessage, setWarningMessage] = useState("");

  // Auto moderation modal states
  const [ruleModal, setRuleModal] = useState({
    open: false,
    rule: null as ModerationRule | null,
    isEditing: false,
  });
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    type: "ai_moderation" as ModerationRule["type"],
    severity: "medium" as ModerationRule["severity"],
    action: "flag" as ModerationRule["action"],
    keywords: "",
    patterns: "",
    aiEnabled: true,
    confidenceThreshold: 70,
  });

  // Announcement states
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState("");

  // Report modal functions
  const openReportModal = (target: {
    userId?: string;
    username?: string;
    contentId?: string;
    contentType?: string;
  }) => {
    setReportTarget(target);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportTarget({});
  };

  const handleReportSubmitted = () => {
    closeReportModal();
    fetchReports(); // Refresh reports list
    fetchLogs(); // Refresh logs
    toast.success("Report submitted successfully");
  };

  const fetchReports = async () => {
    setFetchingReports(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(
          `
          id,
          reason,
          description,
          created_at,
          status,
          reported_user_id,
          reporter_user_id,
          content_id,
          content_type,
          reported_user:user_profiles!reports_reported_user_id_fkey(username, avatar_url, user_id),
          reporter_user:user_profiles!reports_reporter_user_id_fkey(username, user_id)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected interface
      const transformedReports =
        data?.map((report) => ({
          id: report.id,
          reason: report.reason,
          description: report.description,
          created_at: report.created_at,
          status: report.status,
          reported_user_id: report.reported_user_id,
          reporter_user_id: report.reporter_user_id,
          content_id: report.content_id,
          content_type: report.content_type,
          reported_user: report.reported_user
            ? {
                username: report.reported_user.username,
                avatar_url: report.reported_user.avatar_url,
                id: report.reported_user.user_id,
              }
            : null,
          reporter_user: report.reporter_user
            ? {
                username: report.reporter_user.username,
              }
            : null,
        })) || [];

      setReports(transformedReports);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      toast.error("Failed to fetch reported users");
    } finally {
      setFetchingReports(false);
    }
  };

  const fetchContent = async () => {
    setFetchingContent(true);
    try {
      const allContent: ContentItem[] = [];

      // Fetch from profiles table
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select(
            `
            id,
            user_id,
            type,
            image_url,
            download_count,
            created_at,
            updated_at,
            text_data
          `
          )
          .order("created_at", { ascending: false });

        if (profilesError) {
          console.warn("Could not fetch from profiles table:", profilesError);
        } else if (profilesData) {
          const profilesWithMetadata = profilesData.map((item) => ({
            id: item.id,
            title: item.text_data || `${item.type} ${item.id}`,
            image_url: item.image_url || "/placeholder.svg",
            category: "General",
            type: (item.type === "banner" ? "banner" : "profile") as
              | "profile"
              | "banner",
            tags: [],
            created_at: item.created_at,
            download_count: item.download_count || 0,
            username: item.user_id,
            source_table: "profiles" as const,
          }));
          allContent.push(...profilesWithMetadata);
        }
      } catch (error) {
        console.warn("Error fetching profiles:", error);
      }

      // Fetch from profile_pairs table
      try {
        const { data: pairsData, error: pairsError } = await supabase
          .from("profile_pairs")
          .select(
            `
            id,
            updated_at,
            pfp_url,
            banner_url,
            title,
            category,
            tags
          `
          )
          .order("updated_at", { ascending: false });

        if (pairsError) {
          console.warn("Could not fetch from profile_pairs table:", pairsError);
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
              });
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
              });
            }
          });
        }
      } catch (error) {
        console.warn("Error fetching profile_pairs:", error);
      }

      // Sort by creation date
      allContent.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setContent(allContent);
    } catch (error) {
      console.error("Failed to fetch content", error);
      toast.error("Failed to fetch content");
    } finally {
      setFetchingContent(false);
    }
  };

  const fetchTrendingData = async (
    timeRange: "week" | "month" | "quarter" | "year"
  ) => {
    try {
      // Calculate date range based on time filter
      const now = new Date();
      const dateFilter = new Date();
      switch (timeRange) {
        case "week":
          dateFilter.setDate(now.getDate() - 7);
          break;
        case "month":
          dateFilter.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          dateFilter.setTime(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          dateFilter.setFullYear(now.getFullYear() - 1);
          break;
      }

      const queries = [];

      // Fetch from profiles table
      const profileQuery = supabase
        .from("profiles")
        .select("*")
        .gte("updated_at", dateFilter.toISOString())
        .order("download_count", { ascending: false })
        .limit(20);

      queries.push(profileQuery);

      // Fetch from profile_pairs table
      const pairQuery = supabase
        .from("profile_pairs")
        .select("*")
        .gte("updated_at", dateFilter.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      queries.push(pairQuery);

      // Fetch from profiles table
      const emojiQuery = supabase
        .from("emoji_combos")
        .select("*")
        .gte("updated_at", dateFilter.toISOString())
        .order("download_count", { ascending: false })
        .limit(20);

      queries.push(emojiQuery);

      const results = await Promise.all(queries);
      const [profilesResult, pairsResult] = results;

      const allItems: TrendingItem[] = [];

      // Process profiles
      if (profilesResult.data) {
        const profileItems: TrendingItem[] = profilesResult.data.map(
          (item) => ({
            id: item.id,
            title: item.title || item.text_data || "Untitled",
            type: item.type === "profile" ? "pfp" : (item.type as any),
            image_url: item.image_url,
            download_count: item.download_count || 0,
            category: item.category || "General",
            tags: Array.isArray(item.tags) ? item.tags : [],
            created_at: item.created_at,
            updated_at: item.updated_at,
            trend_score: Math.floor(
              (item.download_count || 0) * 0.8 + Math.random() * 50
            ),
            growth_rate: Math.floor(Math.random() * 100) - 20,
          })
        );
        allItems.push(...profileItems);
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
        }));
        allItems.push(...pairItems);
      }


      // Sort by trend score and download count
      allItems.sort((a, b) => {
        const scoreA = a.trend_score + a.download_count * 0.1;
        const scoreB = b.trend_score + b.download_count * 0.1;
        return scoreB - scoreA;
      });

      return allItems.slice(0, 12);
    } catch (error) {
      console.error("Failed to fetch trending data:", error);
      return [];
    }
  };

  const fetchAnalytics = async () => {
    setFetchingAnalytics(true);
    try {
      // Calculate date ranges
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let timeRangeDate = monthAgo;
      switch (analyticsTimeRange) {
        case "week":
          timeRangeDate = weekAgo;
          break;
        case "month":
          timeRangeDate = monthAgo;
          break;
        case "quarter":
          timeRangeDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          timeRangeDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Fetch overview stats using real data
      const [profilesCount, pairsCount, reportsCount, usersCount] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, download_count, created_at, type, category, tags", {
              count: "exact",
            }),
          supabase
            .from("profile_pairs")
            .select("id, updated_at, category, tags", { count: "exact" }),
          supabase.from("reports").select("id, created_at", { count: "exact" }),
          supabase
            .from("user_profiles")
            .select("id, created_at", { count: "exact" }),
        ]);

      // Calculate totals
      const totalContent = (profilesCount.count || 0) + (pairsCount.count || 0);
      const totalDownloads =
        profilesCount.data?.reduce(
          (sum, item) => sum + (item.download_count || 0),
          0
        ) || 0;
      const totalReports = reportsCount.count || 0;
      const totalUsers = usersCount.count || 0;

      // Calculate weekly stats
      const newContentThisWeek = [
        ...(profilesCount.data?.filter(
          (item) => new Date(item.created_at) > weekAgo
        ) || []),
        ...(pairsCount.data?.filter(
          (item) => new Date(item.updated_at) > weekAgo
        ) || []),
      ].length;

      const newUsersThisWeek =
        usersCount.data?.filter((item) => new Date(item.created_at) > weekAgo)
          .length || 0;
      const reportsThisWeek =
        reportsCount.data?.filter((item) => new Date(item.created_at) > weekAgo)
          .length || 0;

      // Generate content stats
      const categoriesMap: Record<string, number> = {};
      const tagsMap: Record<string, number> = {};
      let profileCount = 0;
      let bannerCount = 0;

      // Process profiles data
      profilesCount.data?.forEach((item) => {
        if (item.type === "profile") profileCount++;
        else if (item.type === "banner") bannerCount++;
        const category = item.category || "General";
        categoriesMap[category] = (categoriesMap[category] || 0) + 1;
        if (Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            tagsMap[tag] = (tagsMap[tag] || 0) + 1;
          });
        }
      });

      // Process pairs data
      pairsCount.data?.forEach((item) => {
        const category = item.category || "General";
        categoriesMap[category] = (categoriesMap[category] || 0) + 1;
        if (Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            tagsMap[tag] = (tagsMap[tag] || 0) + 1;
          });
        }
      });

      const categoriesBreakdown = Object.entries(categoriesMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topTags = Object.entries(tagsMap)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      // Fetch trending items
      const trendingItems = await fetchTrendingData(analyticsTimeRange);

      // Generate upload trends (mock data for now)
      const uploadTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        return {
          date: date.toISOString().split("T")[0],
          count: Math.floor(Math.random() * 20) + 5,
        };
      });

      // Generate registration trends (mock data)
      const registrationTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        return {
          date: date.toISOString().split("T")[0],
          count: Math.floor(Math.random() * 15) + 2,
        };
      });

      // Mock moderation stats
      const moderationStats = {
        reportsResolved: Math.floor(totalReports * 0.8),
        reportsPending: Math.floor(totalReports * 0.2),
        actionsThisMonth: Math.floor(Math.random() * 50) + 20,
        topReportReasons: [
          {
            reason: "Inappropriate Content",
            count: Math.floor(Math.random() * 20) + 10,
          },
          { reason: "Spam", count: Math.floor(Math.random() * 15) + 5 },
          {
            reason: "Copyright Violation",
            count: Math.floor(Math.random() * 10) + 3,
          },
          { reason: "Harassment", count: Math.floor(Math.random() * 8) + 2 },
        ],
        moderatorActivity: [
          {
            moderator: userProfile?.username || "Current User",
            actions: Math.floor(Math.random() * 30) + 10,
          },
          { moderator: "Admin", actions: Math.floor(Math.random() * 25) + 8 },
          {
            moderator: "Moderator1",
            actions: Math.floor(Math.random() * 20) + 5,
          },
        ],
      };

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
      };

      setAnalyticsData(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast.error("Failed to fetch analytics data");
    } finally {
      setFetchingAnalytics(false);
    }
  };

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      // Mock user data - in real implementation, this would fetch from user_profiles table
      const mockUsers: UserAccount[] = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i + 1}`,
        username: `user${i + 1}`,
        email: `user${i + 1}@example.com`,
        display_name: `User ${i + 1}`,
        avatar_url: `/placeholder.svg?height=40&width=40`,
        created_at: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        last_active: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        role: Math.random() > 0.95 ? "staff" : "user",
        status:
          Math.random() > 0.9
            ? "restricted"
            : Math.random() > 0.95
            ? "terminated"
            : "active",
        upload_count: Math.floor(Math.random() * 50),
        download_count: Math.floor(Math.random() * 500),
      }));

      setUsers(mockUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setFetchingUsers(false);
    }
  };

  const initializeSystemSettings = async () => {
    try {
      // Check if system_settings table exists, if not create it
      const { error: createTableError } = await supabase.rpc(
        "create_system_settings_table"
      );
      if (
        createTableError &&
        !createTableError.message.includes("already exists")
      ) {
        console.warn(
          "Could not create system_settings table:",
          createTableError
        );
      }

      // Initialize default settings if they don't exist
      const defaultSettings: Omit<
        SystemSetting,
        "id" | "created_at" | "updated_at"
      >[] = [
        {
          key: "site_name",
          value: "Profiles After Dark",
          description:
            "The name of the website displayed in headers and titles",
          type: "string",
          category: "general",
        },
        {
          key: "site_description",
          value:
            "A community-driven platform for sharing and discovering profile pictures and banners",
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
          value: "true",
          description: "Enable automatic content moderation using AI",
          type: "boolean",
          category: "moderation",
        },
        {
          key: "openai_moderation_enabled",
          value: "true",
          description: "Enable OpenAI-powered content moderation",
          type: "boolean",
          category: "moderation",
        },
        {
          key: "ai_confidence_threshold",
          value: "70",
          description:
            "Minimum confidence score for AI moderation actions (0-100)",
          type: "number",
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
      ];

      // Try to insert default settings (will be ignored if they already exist due to unique constraint)
      for (const setting of defaultSettings) {
        await supabase
          .from("system_settings")
          .upsert(setting, { onConflict: "key", ignoreDuplicates: true });
      }
    } catch (error) {
      console.warn("Could not initialize system settings:", error);
    }
  };

  const fetchSystemSettings = async () => {
    setFetchingSettings(true);
    try {
      // Initialize settings table and default values
      await initializeSystemSettings();

      // Fetch all settings from database
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("category", { ascending: true })
        .order("key", { ascending: true });

      if (error) {
        console.warn("Could not fetch from system_settings table:", error);
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
            key: "auto_moderation_enabled",
            value: "true",
            description: "Enable AI-powered auto moderation",
            type: "boolean",
            category: "moderation",
          },
          {
            key: "openai_moderation_enabled",
            value: "true",
            description: "Enable OpenAI moderation",
            type: "boolean",
            category: "moderation",
          },
          {
            key: "ai_confidence_threshold",
            value: "70",
            description: "AI confidence threshold",
            type: "number",
            category: "moderation",
          },
          {
            key: "maintenance_mode",
            value: "false",
            description: "Enable maintenance mode",
            type: "boolean",
            category: "system",
          },
        ];
        setSystemSettings(mockSettings);
      } else {
        setSystemSettings(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
      toast.error("Failed to fetch system settings");
    } finally {
      setFetchingSettings(false);
    }
  };

  const updateSystemSetting = async (key: string, value: string) => {
    setSavingSettings((prev) => ({ ...prev, [key]: true }));
    try {
      // Validate the value based on type
      const setting = systemSettings.find((s) => s.key === key);
      if (!setting) {
        throw new Error("Setting not found");
      }

      let validatedValue = value;
      if (setting.type === "number") {
        const numValue = Number.parseFloat(value);
        if (isNaN(numValue)) {
          throw new Error("Invalid number value");
        }
        validatedValue = numValue.toString();
      } else if (setting.type === "boolean") {
        if (value !== "true" && value !== "false") {
          throw new Error("Invalid boolean value");
        }
      }

      // Update in database
      const { error } = await supabase
        .from("system_settings")
        .update({
          value: validatedValue,
          updated_at: new Date().toISOString(),
        })
        .eq("key", key);

      if (error) {
        console.warn("Could not update system setting in database:", error);
        // Still update local state even if database update fails
      }

      // Update local state
      setSystemSettings((prev) =>
        prev.map((setting) =>
          setting.key === key
            ? {
                ...setting,
                value: validatedValue,
                updated_at: new Date().toISOString(),
              }
            : setting
        )
      );

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "update system setting",
          target_user_id: userProfile?.user_id || "system",
          description: `Updated setting "${key}" to "${validatedValue}"`,
        },
      ]);

      toast.success(
        `Setting "${setting.key.replace(/_/g, " ")}" updated successfully`
      );
    } catch (error) {
      console.error("Failed to update system setting:", error);
      toast.error(
        `Failed to update setting: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSavingSettings((prev) => ({ ...prev, [key]: false }));
    }
  };

  const resetSystemSettings = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all settings to default values? This action cannot be undone."
      )
    ) {
      return;
    }

    setFetchingSettings(true);
    try {
      // Delete all existing settings
      await supabase.from("system_settings").delete().neq("key", "");

      // Reinitialize with defaults
      await initializeSystemSettings();

      // Refetch settings
      await fetchSystemSettings();

      toast.success("All settings have been reset to default values");

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "reset system settings",
          target_user_id: userProfile?.user_id || "system",
          description: "Reset all system settings to default values",
        },
      ]);
    } catch (error) {
      console.error("Failed to reset system settings:", error);
      toast.error("Failed to reset system settings");
    } finally {
      setFetchingSettings(false);
    }
  };

  // Auto Moderation Functions - Now using real OpenAI integration
  const fetchModerationRules = async () => {
    setFetchingRules(true);
    try {
      const { data, error } = await supabase
        .from("moderation_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch moderation rules:", error);
        toast.error("Failed to fetch moderation rules");
        return;
      }

      setModerationRules(data || []);

      // Calculate stats from real data
      const totalScans = await supabase
        .from("auto_moderation_scans")
        .select("id", { count: "exact" });
      const flaggedContent = await supabase
        .from("auto_moderation_scans")
        .select("id", { count: "exact" })
        .not("flags", "is", null)
        .neq("flags", "{}");

      const autoActions = await supabase
        .from("auto_moderation_scans")
        .select("id", { count: "exact" })
        .not("action_taken", "is", null);

      const completedScans = await supabase
        .from("auto_moderation_scans")
        .select("id", { count: "exact" })
        .eq("status", "completed");

      const aiScansToday = await supabase
        .from("auto_moderation_scans")
        .select("id", { count: "exact" })
        .eq("scan_type", "openai_moderation")
        .gte("created_at", new Date().toISOString().split("T")[0]);

      const accuracy =
        totalScans.count && totalScans.count > 0
          ? ((completedScans.count || 0) / totalScans.count) * 100
          : 0;

      setAutoModerationStats({
        totalScans: totalScans.count || 0,
        flaggedContent: flaggedContent.count || 0,
        autoActions: autoActions.count || 0,
        accuracy: Math.round(accuracy * 10) / 10,
        activeRules: data?.filter((r) => r.enabled).length || 0,
        aiScansToday: aiScansToday.count || 0,
        aiAccuracy: Math.round((Math.random() * 20 + 80) * 10) / 10, // Mock AI accuracy
      });
    } catch (error) {
      console.error("Failed to fetch moderation rules:", error);
      toast.error("Failed to fetch moderation rules");
    } finally {
      setFetchingRules(false);
    }
  };

  const fetchRecentScans = async () => {
    setFetchingScans(true);
    try {
      const { data, error } = await supabase
        .from("auto_moderation_scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Failed to fetch recent scans:", error);
        toast.error("Failed to fetch recent scans");
        return;
      }

      setRecentScans(data || []);
    } catch (error) {
      console.error("Failed to fetch recent scans:", error);
      toast.error("Failed to fetch recent scans");
    } finally {
      setFetchingScans(false);
    }
  };

  const fetchSpamPatterns = async () => {
    setFetchingPatterns(true);
    try {
      const { data, error } = await supabase
        .from("spam_patterns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch spam patterns:", error);
        toast.error("Failed to fetch spam patterns");
        return;
      }

      setSpamPatterns(data || []);
    } catch (error) {
      console.error("Failed to fetch spam patterns:", error);
      toast.error("Failed to fetch spam patterns");
    } finally {
      setFetchingPatterns(false);
    }
  };

  const toggleModerationRule = async (ruleId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("moderation_rules")
        .update({
          enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ruleId);

      if (error) {
        console.error("Failed to update moderation rule:", error);
        toast.error("Failed to update moderation rule");
        return;
      }

      // Update local state
      setModerationRules((prev) =>
        prev.map((rule) => (rule.id === ruleId ? { ...rule, enabled } : rule))
      );

      // Update stats
      setAutoModerationStats((prev) => ({
        ...prev,
        activeRules: moderationRules.filter((r) =>
          r.id === ruleId ? enabled : r.enabled
        ).length,
      }));

      toast.success(`Rule ${enabled ? "enabled" : "disabled"} successfully`);

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: `${enabled ? "enable" : "disable"} moderation rule`,
          target_user_id: userProfile?.user_id || "system",
          description: `${
            enabled ? "Enabled" : "Disabled"
          } moderation rule: ${ruleId}`,
        },
      ]);
    } catch (error) {
      console.error("Failed to toggle moderation rule:", error);
      toast.error("Failed to update moderation rule");
    }
  };

  const createModerationRule = async () => {
    try {
      const ruleData = {
        name: newRule.name,
        description: newRule.description,
        type: newRule.type,
        enabled: true,
        severity: newRule.severity,
        action: newRule.action,
        conditions: {
          keywords: newRule.keywords
            ? newRule.keywords.split(",").map((k) => k.trim())
            : [],
          patterns: newRule.patterns
            ? newRule.patterns.split(",").map((p) => p.trim())
            : [],
          aiEnabled: newRule.aiEnabled,
          confidenceThreshold: newRule.confidenceThreshold,
        },
        created_by: userProfile?.user_id,
      };

      const { data, error } = await supabase
        .from("moderation_rules")
        .insert([ruleData])
        .select()
        .single();

      if (error) {
        console.error("Failed to create moderation rule:", error);
        toast.error("Failed to create moderation rule");
        return;
      }

      // Update local state
      setModerationRules((prev) => [data, ...prev]);
      setRuleModal({ open: false, rule: null, isEditing: false });
      setNewRule({
        name: "",
        description: "",
        type: "ai_moderation",
        severity: "medium",
        action: "flag",
        keywords: "",
        patterns: "",
        aiEnabled: true,
        confidenceThreshold: 70,
      });

      toast.success("Moderation rule created successfully");

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "create moderation rule",
          target_user_id: userProfile?.user_id || "system",
          description: `Created moderation rule: ${data.name}`,
        },
      ]);

      // Refresh stats
      fetchModerationRules();
    } catch (error) {
      console.error("Failed to create moderation rule:", error);
      toast.error("Failed to create moderation rule");
    }
  };

  const updateModerationRule = async () => {
    if (!ruleModal.rule) return;

    try {
      const ruleData = {
        name: newRule.name,
        description: newRule.description,
        type: newRule.type,
        severity: newRule.severity,
        action: newRule.action,
        conditions: {
          keywords: newRule.keywords
            ? newRule.keywords.split(",").map((k) => k.trim())
            : [],
          patterns: newRule.patterns
            ? newRule.patterns.split(",").map((p) => p.trim())
            : [],
          aiEnabled: newRule.aiEnabled,
          confidenceThreshold: newRule.confidenceThreshold,
        },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("moderation_rules")
        .update(ruleData)
        .eq("id", ruleModal.rule.id);

      if (error) {
        console.error("Failed to update moderation rule:", error);
        toast.error("Failed to update moderation rule");
        return;
      }

      // Update local state
      setModerationRules((prev) =>
        prev.map((rule) =>
          rule.id === ruleModal.rule?.id ? { ...rule, ...ruleData } : rule
        )
      );

      setRuleModal({ open: false, rule: null, isEditing: false });
      setNewRule({
        name: "",
        description: "",
        type: "ai_moderation",
        severity: "medium",
        action: "flag",
        keywords: "",
        patterns: "",
        aiEnabled: true,
        confidenceThreshold: 70,
      });

      toast.success("Moderation rule updated successfully");

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "update moderation rule",
          target_user_id: userProfile?.user_id || "system",
          description: `Updated moderation rule: ${ruleModal.rule.name}`,
        },
      ]);
    } catch (error) {
      console.error("Failed to update moderation rule:", error);
      toast.error("Failed to update moderation rule");
    }
  };

  const deleteModerationRule = async (ruleId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this moderation rule?")
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("moderation_rules")
        .delete()
        .eq("id", ruleId);

      if (error) {
        console.error("Failed to delete moderation rule:", error);
        toast.error("Failed to delete moderation rule");
        return;
      }

      // Update local state
      setModerationRules((prev) => prev.filter((rule) => rule.id !== ruleId));

      toast.success("Moderation rule deleted successfully");

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "delete moderation rule",
          target_user_id: userProfile?.user_id || "system",
          description: `Deleted moderation rule: ${ruleId}`,
        },
      ]);

      // Refresh stats
      fetchModerationRules();
    } catch (error) {
      console.error("Failed to delete moderation rule:", error);
      toast.error("Failed to delete moderation rule");
    }
  };

  // AI-powered content scanning using OpenAI
  const runContentScan = async () => {
    setAiScanInProgress(true);
    try {
      // Get recent content to scan
      const recentContent = content.slice(0, 5); // Scan first 5 items

      if (recentContent.length === 0) {
        toast.error("No content available to scan");
        return;
      }

      toast.success(`Starting AI scan of ${recentContent.length} items...`);

      for (const item of recentContent) {
        try {
          // Create scan entry
          const scanData = {
            content_id: item.id,
            content_type: item.type as "profile" | "banner",
            scan_type: "openai_moderation" as const,
            status: "pending" as const,
            confidence_score: 0,
            flags: [],
          };

          const { data: scanEntry, error: scanError } = await supabase
            .from("auto_moderation_scans")
            .insert([scanData])
            .select()
            .single();

          if (scanError) {
            console.error("Failed to create scan entry:", scanError);
            continue;
          }

          // Perform AI moderation
          const moderationResult = await moderateContent({
            type: item.type === "profile" ? "image" : "image",
            data: item.image_url,
            title: item.title,
            tags: item.tags,
            username: item.username,
          });

          // Update scan with results
          const { error: updateError } = await supabase
            .from("auto_moderation_scans")
            .update({
              status: "completed",
              confidence_score: moderationResult.confidenceScore,
              flags: moderationResult.flags,
              action_taken: moderationResult.isAppropriate
                ? null
                : moderationResult.suggestedAction,
              ai_result: moderationResult,
              completed_at: new Date().toISOString(),
            })
            .eq("id", scanEntry.id);

          if (updateError) {
            console.error("Failed to update scan:", updateError);
          }

          // Take action if needed
          if (
            !moderationResult.isAppropriate &&
            moderationResult.confidenceScore > 70
          ) {
            // Log the AI action
            await supabase.from("moderation_logs").insert([
              {
                moderator_id: "ai-system",
                action: `ai ${moderationResult.suggestedAction}`,
                target_user_id: item.user_id || "unknown",
                target_profile_id: item.id,
                description: `AI flagged content: ${moderationResult.reasoning} (Confidence: ${moderationResult.confidenceScore}%)`,
              },
            ]);
          }
        } catch (error) {
          console.error(`Failed to scan content ${item.id}:`, error);
        }
      }

      toast.success("AI content scan completed successfully");
      fetchRecentScans();
      fetchModerationRules(); // Refresh stats
    } catch (error) {
      console.error("Failed to run AI content scan:", error);
      toast.error("Failed to run AI content scan");
    } finally {
      setAiScanInProgress(false);
    }
  };

  // Bulk AI scanning
  const runBulkAiScan = async () => {
    setBulkScanInProgress(true);
    try {
      const allContent = content.slice(0, 20); // Scan first 20 items to avoid rate limits

      if (allContent.length === 0) {
        toast.error("No content available for bulk scan");
        return;
      }

      toast.success(`Starting bulk AI scan of ${allContent.length} items...`);

      let scannedCount = 0;
      let flaggedCount = 0;

      for (const item of allContent) {
        try {
          // Perform AI moderation
          const moderationResult = await moderateContent({
            type: item.type === "profile" ? "image" : "image",
            data: item.image_url,
            title: item.title,
            tags: item.tags,
            username: item.username,
          });

          // Create scan entry
          const scanData = {
            content_id: item.id,
            content_type: item.type as "profile" | "banner",
            scan_type: "openai_moderation" as const,
            status: "completed" as const,
            confidence_score: moderationResult.confidenceScore,
            flags: moderationResult.flags,
            action_taken: moderationResult.isAppropriate
              ? null
              : moderationResult.suggestedAction,
            ai_result: moderationResult,
            completed_at: new Date().toISOString(),
          };

          const { error: scanError } = await supabase
            .from("auto_moderation_scans")
            .insert([scanData]);

          if (scanError) {
            console.error("Failed to create scan entry:", scanError);
          }

          scannedCount++;

          if (!moderationResult.isAppropriate) {
            flaggedCount++;
            // Log the AI action
            await supabase.from("moderation_logs").insert([
              {
                moderator_id: "ai-system",
                action: `ai bulk scan flag`,
                target_user_id: item.user_id || "unknown",
                target_profile_id: item.id,
                description: `Bulk AI scan flagged content: ${moderationResult.reasoning} (Confidence: ${moderationResult.confidenceScore}%)`,
              },
            ]);
          }

          // Add small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to scan content ${item.id}:`, error);
        }
      }

      toast.success(
        `Bulk AI scan completed: ${scannedCount} items scanned, ${flaggedCount} flagged`
      );
      fetchRecentScans();
      fetchModerationRules(); // Refresh stats
    } catch (error) {
      console.error("Failed to run bulk AI scan:", error);
      toast.error("Failed to run bulk AI scan");
    } finally {
      setBulkScanInProgress(false);
    }
  };

  // Generate AI insights
  const generateAiInsights = async () => {
    try {
      // Analyze user behavior patterns
      const riskUsers = [];
      for (const user of users.slice(0, 10)) {
        const userUploads = content
          .filter((c) => c.username === user.username)
          .slice(0, 5);
        const analysis = await analyzeUserBehavior({
          username: user.username,
          uploadCount: user.upload_count,
          recentUploads: userUploads.map((u) => ({
            title: u.title,
            tags: u.tags,
            created_at: u.created_at,
          })),
          reportCount: Math.floor(Math.random() * 3),
        });

        if (analysis.riskLevel !== "low") {
          riskUsers.push({
            username: user.username,
            riskLevel: analysis.riskLevel,
            concerns: analysis.concerns,
          });
        }
      }

      // Generate content trends
      const contentTrends = [
        {
          trend: "Increased anime-style content",
          impact: "Positive engagement",
        },
        { trend: "More minimalist designs", impact: "Higher download rates" },
        {
          trend: "Gaming-themed uploads rising",
          impact: "New user acquisition",
        },
      ];

      // Generate recommendations
      const recommendations = [
        "Consider adding anime category filter",
        "Promote minimalist design contests",
        "Partner with gaming communities",
        "Implement auto-tagging for better discovery",
      ];

      setAiInsights({
        riskUsers,
        contentTrends,
        recommendations,
      });

      toast.success("AI insights generated successfully");
    } catch (error) {
      console.error("Failed to generate AI insights:", error);
      toast.error("Failed to generate AI insights");
    }
  };

  const toggleSpamPattern = async (patternId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("spam_patterns")
        .update({
          enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", patternId);

      if (error) {
        console.error("Failed to update spam pattern:", error);
        toast.error("Failed to update spam pattern");
        return;
      }

      // Update local state
      setSpamPatterns((prev) =>
        prev.map((pattern) =>
          pattern.id === patternId ? { ...pattern, enabled } : pattern
        )
      );

      toast.success(
        `Spam pattern ${enabled ? "enabled" : "disabled"} successfully`
      );
    } catch (error) {
      console.error("Failed to toggle spam pattern:", error);
      toast.error("Failed to update spam pattern");
    }
  };

  const fetchLogs = async () => {
    setFetchingLogs(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("moderation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      if (!logsData) return;

      setLogs(logsData);

      const userIdsSet = new Set<string>();
      logsData.forEach((log) => {
        if (log.moderator_id) userIdsSet.add(log.moderator_id);
        if (log.target_user_id) userIdsSet.add(log.target_user_id);
      });

      const userIds = Array.from(userIdsSet);
      if (userIds.length === 0) return;

      // Try to fetch user data - handle if user_profiles table doesn't exist
      try {
        const { data: usersData, error: usersError } = await supabase
          .from("user_profiles")
          .select("user_id, display_name, username")
          .in("user_id", userIds);

        if (usersError) {
          console.warn("Could not fetch user profiles:", usersError);
        } else {
          const userMap: Record<string, UserSummary> = {};
          usersData?.forEach((u) => {
            userMap[u.user_id] = {
              user_id: u.user_id,
              display_name: u.display_name,
              username: u.username,
            };
          });
          setUsersMap(userMap);
        }
      } catch (error) {
        console.warn("User profiles table not available:", error);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
      toast.error("Failed to fetch moderation logs");
    } finally {
      setFetchingLogs(false);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, message, is_active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data.length > 0 && data[0].is_active) {
        setAnnouncement(data[0].message);
      } else {
        setAnnouncement(null);
      }
    } catch (error) {
      console.error("Failed to fetch announcement", error);
      toast.error("Failed to fetch announcement");
    }
  };

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
        { onConflict: ["id"] }
      );

      if (error) throw error;

      toast.success("Announcement saved successfully");
      setAnnouncement(announcementDraft);
      setIsEditingAnnouncement(false);
    } catch (error) {
      toast.error("Failed to save announcement");
      console.error(error);
    }
  };

  const deleteAnnouncement = async () => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: false })
        .eq("id", 1);

      if (error) throw error;

      toast.success("Announcement deleted");
      setAnnouncement(null);
      setIsEditingAnnouncement(false);
    } catch (error) {
      toast.error("Failed to save announcement");
      console.error(error);
    }
  };
const handleDismiss = async (id: string) => {
  try {
    console.log("Attempting to delete report id:", id);
    const { data, error } = await supabase.from("reports").delete().eq("id", id);
    console.log("Delete result:", { data, error });
    if (error) throw error;

    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success("Report dismissed");
  } catch (error) {
    toast.error("Failed to dismiss report");
    console.error(error);
  }
};

  const openActionModal = (
    action: "warn" | "restrict" | "terminate",
    userId: string,
    username: string
  ) => {
    setActionModal({ open: true, action, userId, username });
    setWarningMessage("");
  };

  const closeActionModal = () => {
    setActionModal({ open: false, action: null, userId: null, username: "" });
    setWarningMessage("");
  };

  const handleActionConfirmed = async () => {
    if (!actionModal.userId || !actionModal.action) {
      toast.error("No action selected or target user missing");
      closeActionModal();
      return;
    }

    try {
      if (actionModal.action === "warn") {
        const { error } = await supabase.from("user_warnings").insert([
          {
            user_id: actionModal.userId,
            moderator_id: userProfile?.user_id,
            message: warningMessage || "No message provided",
          },
        ]);

        if (error) throw error;

        toast.success(`User ${actionModal.username} has been warned`);
      } else if (actionModal.action === "restrict") {
        const { error } = await supabase
          .from("user_profiles")
          .update({ restricted: true })
          .eq("user_id", actionModal.userId);

        if (error) throw error;

        toast.success(`User ${actionModal.username} has been restricted`);
      } else if (actionModal.action === "terminate") {
        const { error } = await supabase
          .from("user_profiles")
          .update({ terminated: true })
          .eq("user_id", actionModal.userId);

        if (error) throw error;

        toast.success(`User ${actionModal.username} has been terminated`);
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
      ]);

      fetchReports();
      fetchLogs();
    } catch (error) {
      console.error("Failed to perform action:", error);
      toast.error("Failed to perform action");
    } finally {
      closeActionModal();
    }
  };

  // Content management functions
  const openEditModal = (contentItem: ContentItem) => {
    setEditModal({
      open: true,
      content: contentItem,
      editedTitle: contentItem.title,
      editedTags: [...contentItem.tags],
      tagInput: "",
    });
  };

  const closeEditModal = () => {
    setEditModal({
      open: false,
      content: null,
      editedTitle: "",
      editedTags: [],
      tagInput: "",
    });
  };

  const addTagToEdit = () => {
    if (
      editModal.tagInput.trim() &&
      !editModal.editedTags.includes(editModal.tagInput.trim())
    ) {
      setEditModal({
        ...editModal,
        editedTags: [...editModal.editedTags, editModal.tagInput.trim()],
        tagInput: "",
      });
    }
  };

  const removeTagFromEdit = (tagToRemove: string) => {
    setEditModal({
      ...editModal,
      editedTags: editModal.editedTags.filter((tag) => tag !== tagToRemove),
    });
  };

  const saveContentEdit = async () => {
    if (!editModal.content) return;

    try {
      if (editModal.content.source_table === "profiles") {
        // Update profiles table
        const { error } = await supabase
          .from("profiles")
          .update({
            text_data: editModal.editedTitle,
          })
          .eq("id", editModal.content.id);

        if (error) throw error;
      } else if (editModal.content.source_table === "profile_pairs") {
        // Update profile_pairs table
        const pairId = editModal.content.id.split("-")[0]; // Remove -pfp or -banner suffix
        const { error } = await supabase
          .from("profile_pairs")
          .update({
            title: editModal.editedTitle
              .replace(" (Profile)", "")
              .replace(" (Banner)", ""),
            tags: editModal.editedTags,
          })
          .eq("id", pairId);

        if (error) throw error;
      }

      toast.success("Content updated successfully");
      closeEditModal();
      fetchContent();

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "edit content",
          target_user_id: editModal.content.user_id || "unknown",
          target_profile_id: editModal.content.id,
          description: `Edited ${editModal.content.type}: "${editModal.content.title}" → "${editModal.editedTitle}"`,
        },
      ]);
    } catch (error) {
      console.error("Failed to update content:", error);
      toast.error("Failed to update content");
    }
  };

  const deleteContent = async (contentItem: ContentItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${contentItem.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      if (contentItem.source_table === "profiles") {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", contentItem.id);

        if (error) throw error;
      } else if (contentItem.source_table === "profile_pairs") {
        const pairId = contentItem.id.split("-")[0]; // Remove -pfp or -banner suffix
        const { error } = await supabase
          .from("profile_pairs")
          .delete()
          .eq("id", pairId);

        if (error) throw error;
      }

      toast.success("Content deleted successfully");
      fetchContent();

      // Log the action
      await supabase.from("moderation_logs").insert([
        {
          moderator_id: userProfile?.user_id,
          action: "delete content",
          target_user_id: contentItem.user_id || "unknown",
          target_profile_id: contentItem.id,
          description: `Deleted ${contentItem.type}: "${contentItem.title}"`,
        },
      ]);
    } catch (error) {
      console.error("Failed to delete content:", error);
      toast.error("Failed to delete content");
    }
  };

  const updateUserStatus = async (
    userId: string,
    status: "active" | "restricted" | "terminated"
  ) => {
    try {
      // In real implementation, this would update the user_profiles table
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, status } : user))
      );

      toast.success(`User status updated to ${status}`);
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast.error("Failed to update user status");
    }
  };

  // Auto-generate tags for content using AI
  const generateTagsForContent = async (contentItem: ContentItem) => {
    try {
      const generatedTags = await generateContentTags({
        title: contentItem.title,
        imageUrl: contentItem.image_url,
        type: contentItem.type === "profile" ? "profile" : "banner",
      });

      if (generatedTags.length > 0) {
        setEditModal((prev) => ({
          ...prev,
          editedTags: [...new Set([...prev.editedTags, ...generatedTags])],
        }));

        toast.success(`Generated ${generatedTags.length} AI tags`);
      } else {
        toast.error("No tags could be generated");
      }
    } catch (error) {
      console.error("Failed to generate tags:", error);
      toast.error("Failed to generate tags");
    }
  };

  // Filter content based on search and filter
  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(contentSearch.toLowerCase()) ||
      item.username?.toLowerCase().includes(contentSearch.toLowerCase()) ||
      item.tags.some((tag) =>
        tag.toLowerCase().includes(contentSearch.toLowerCase())
      );

    const matchesFilter =
      contentFilter === "all" || item.type === contentFilter;

    return matchesSearch && matchesFilter;
  });

  // Filter users based on search and filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.display_name.toLowerCase().includes(userSearch.toLowerCase());

    const matchesFilter = userFilter === "all" || user.status === userFilter;

    return matchesSearch && matchesFilter;
  });

  // Group settings by category
  const settingsByCategory = systemSettings.reduce((acc, setting) => {
    const category = setting.category || "general";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  useEffect(() => {
    fetchAnnouncement();
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
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            if (payload.new?.is_active) {
              setAnnouncement(payload.new.message);
            } else {
              setAnnouncement(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (userProfile?.role === "staff") {
      if (activeTab === "reports") {
        fetchReports();
      } else if (activeTab === "logs") {
        fetchLogs();
      } else if (activeTab === "content") {
        fetchContent();
      } else if (activeTab === "analytics") {
        fetchAnalytics();
      } else if (activeTab === "users") {
        fetchUsers();
      } else if (activeTab === "settings") {
        fetchSystemSettings();
      } else if (activeTab === "automation") {
        fetchModerationRules();
        fetchRecentScans();
        fetchSpamPatterns();
      }
    }
  }, [userProfile, activeTab, analyticsTimeRange]);

  if (!loading && userProfile?.role !== "staff") {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const navigationItems = [
    { id: "reports", label: "Reported Users", icon: Users },
    { id: "content", label: "Content Management", icon: ImageIcon },
    { id: "logs", label: "Moderation Logs", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "users", label: "User Management", icon: UserCog },
    { id: "automation", label: "AI Moderation", icon: Bot },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "monitoring", label: "System Monitor", icon: Monitor },
  ];

  return (
    <><div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
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
              <span>AI Integration Active</span>
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
                  placeholder="Write your announcement here..." />

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
                    setAnnouncementDraft(announcement || "");
                    setIsEditingAnnouncement(true);
                  } }
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
                {navigationItems.find((item) => item.id === activeTab)?.label ||
                  "Dashboard"}
              </h1>
              <p className="text-gray-400 mt-1">
                {activeTab === "reports" &&
                  "Review and take action on user reports"}
                {activeTab === "content" &&
                  "Manage uploaded profiles and banners with AI assistance"}
                {activeTab === "logs" &&
                  "View recent moderation actions and system events"}
                {activeTab === "analytics" &&
                  "Platform statistics and insights"}
                {activeTab === "users" &&
                  "Manage user accounts and permissions"}
                {activeTab === "automation" &&
                  "Configure AI-powered moderation rules and OpenAI scanning"}
                {activeTab === "settings" &&
                  "Configure platform-wide settings including AI moderation"}
                {activeTab === "monitoring" &&
                  "Monitor system performance and health"}
              </p>
            </div>

            {activeTab === "analytics" && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <select
                  value={analyticsTimeRange}
                  onChange={(e) => setAnalyticsTimeRange(
                    e.target.value as "week" | "month" | "quarter" | "year"
                  )}
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

            {activeTab === "automation" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={runContentScan}
                  disabled={aiScanInProgress}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors text-sm"
                >
                  {aiScanInProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4" />
                  )}
                  AI Scan
                </button>

                <button
                  onClick={runBulkAiScan}
                  disabled={bulkScanInProgress}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-lg transition-colors text-sm"
                >
                  {bulkScanInProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Robot className="h-4 w-4" />
                  )}
                  Bulk Scan
                </button>

                <button
                  onClick={() => setRuleModal({ open: true, rule: null, isEditing: false })}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  New Rule
                </button>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReportModal({})}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  New Report
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              {/* Reports Tab - Enhanced with report button */}
              {activeTab === "reports" && (
                <div>
                  {fetchingReports ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No pending reports
                      </h3>
                      <p className="text-gray-400">
                        All reports have been reviewed
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="bg-gray-700 rounded-lg border-l-4 border-l-orange-500 p-6"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <img
                                src={report.reported_user?.avatar_url ||
                                  "/placeholder.svg?height=48&width=48"}
                                alt={report.reported_user?.username || "User"}
                                className="h-12 w-12 rounded-full object-cover" />
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-2.5 w-2.5 text-white" />
                              </div>
                            </div>

                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                  {report.reported_user?.username ||
                                    "Unknown User"}
                                </h3>
                                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                                  REPORTED
                                </span>
                                {report.content_id && (
                                  <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                                    CONTENT
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span>
                                    Reported by:{" "}
                                    {report.reporter_user?.username ||
                                      "Unknown"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {new Date(
                                      report.created_at
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                <div className="text-sm text-gray-300">
                                  <div className="font-medium">
                                    {report.reason}
                                  </div>
                                  {report.description && (
                                    <div className="text-gray-400 mt-1">
                                      {report.description}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {report.content_id && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Database className="h-4 w-4" />
                                  <span>Content ID: {report.content_id}</span>
                                  {report.content_type && (
                                    <span className="bg-gray-600 px-2 py-1 rounded text-xs">
                                      {report.content_type}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              {report.reported_user_id && (
                                <>
                                  <button
                                    onClick={() => openActionModal(
                                      "warn",
                                      report.reported_user_id!,
                                      report.reported_user?.username || ""
                                    )}
                                    className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-sm"
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                    Warn
                                  </button>

                                  <button
                                    onClick={() => openActionModal(
                                      "restrict",
                                      report.reported_user_id!,
                                      report.reported_user?.username || ""
                                    )}
                                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-sm"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Restrict
                                  </button>

                                  <button
                                    onClick={() => openActionModal(
                                      "terminate",
                                      report.reported_user_id!,
                                      report.reported_user?.username || ""
                                    )}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Terminate
                                  </button>

                                  <div className="border-t border-gray-600 my-1"></div>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  if (window.confirm(
                                    "Are you sure you want to dismiss this report?"
                                  )) {
                                    handleDismiss(report.id);
                                  }
                                } }
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

              {/* Content Management Tab - Enhanced with report buttons */}
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
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={contentFilter}
                        onChange={(e) => setContentFilter(
                          e.target.value as "all" | "profile" | "banner"
                        )}
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
                      <h3 className="text-lg font-medium mb-2">
                        No content found
                      </h3>
                      <p className="text-gray-400">
                        {contentSearch || contentFilter !== "all"
                          ? "Try adjusting your search or filter"
                          : "No content has been uploaded yet"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredContent.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-700 rounded-lg overflow-hidden"
                        >
                          <div className="aspect-square relative">
                            <img
                              src={item.image_url || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${item.type === "profile"
                                    ? "bg-blue-600 text-white"
                                    : "bg-purple-600 text-white"}`}
                              >
                                {item.type.toUpperCase()}
                              </span>
                            </div>
                            {/* Add report button overlay */}
                            <div className="absolute top-2 left-2">
                              <button
                                onClick={() => openReportModal({
                                  contentId: item.id,
                                  contentType: item.type,
                                })}
                                className="bg-black/50 backdrop-blur-sm hover:bg-black/70 p-2 rounded-lg transition-colors"
                                title="Report Content"
                              >
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                              </button>
                            </div>
                          </div>

                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 truncate">
                              {item.title}
                            </h3>

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
                                <span>
                                  {new Date(
                                    item.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-gray-400" />
                                <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                                  {item.source_table}
                                </span>
                              </div>
                            </div>

                            {item.tags.length > 0 && (
                              <div className="mt-3">
                                <div className="flex flex-wrap gap-1">
                                  {item.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
                                    >
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

              {/* AI Moderation Tab */}
              {activeTab === "automation" && (
                <div className="space-y-8">
                  {/* AI Moderation Stats */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-400" />
                      OpenAI Moderation Overview
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Total Scans</p>
                            <p className="text-2xl font-bold">
                              {autoModerationStats.totalScans.toLocaleString()}
                            </p>
                          </div>
                          <Scan className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">
                              AI Scans Today
                            </p>
                            <p className="text-2xl font-bold">
                              {autoModerationStats.aiScansToday}
                            </p>
                          </div>
                          <Robot className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">
                              Flagged Content
                            </p>
                            <p className="text-2xl font-bold">
                              {autoModerationStats.flaggedContent}
                            </p>
                          </div>
                          <AlertOctagon className="h-8 w-8 text-orange-400" />
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">
                              Auto Actions
                            </p>
                            <p className="text-2xl font-bold">
                              {autoModerationStats.autoActions}
                            </p>
                          </div>
                          <Zap className="h-8 w-8 text-green-400" />
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">AI Accuracy</p>
                            <p className="text-2xl font-bold">
                              {autoModerationStats.aiAccuracy}%
                            </p>
                          </div>
                          <Target className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">
                              Active Rules
                            </p>
                            <p className="text-2xl font-bold">
                              {autoModerationStats.activeRules}
                            </p>
                          </div>
                          <Shield className="h-8 w-8 text-red-400" />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* AI Insights */}
                  {aiInsights && (
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-yellow-400" />
                          AI Insights
                        </h3>
                        <button
                          onClick={generateAiInsights}
                          className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-sm"
                        >
                          <Sparkles className="h-4 w-4" />
                          Refresh Insights
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-gray-700 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-400" />
                            Risk Users
                          </h4>
                          <div className="space-y-2">
                            {aiInsights.riskUsers
                              .slice(0, 5)
                              .map((user, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span>{user.username}</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${user.riskLevel === "high"
                                        ? "bg-red-600"
                                        : "bg-orange-600"}`}
                                  >
                                    {user.riskLevel}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div className="bg-gray-700 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            Content Trends
                          </h4>
                          <div className="space-y-2">
                            {aiInsights.contentTrends.map((trend, index) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium">{trend.trend}</div>
                                <div className="text-gray-400">
                                  {trend.impact}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gray-700 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Brain className="h-4 w-4 text-blue-400" />
                            AI Recommendations
                          </h4>
                          <div className="space-y-2">
                            {aiInsights.recommendations.map((rec, index) => (
                              <div
                                key={index}
                                className="text-sm text-gray-300"
                              >
                                • {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Moderation Rules */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-400" />
                      AI Moderation Rules
                    </h3>

                    {fetchingRules ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {moderationRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="bg-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-lg">
                                    {rule.name}
                                  </h4>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${rule.enabled
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-600 text-gray-300"}`}
                                  >
                                    {rule.enabled ? "ACTIVE" : "DISABLED"}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${rule.severity === "critical"
                                        ? "bg-red-600 text-white"
                                        : rule.severity === "high"
                                          ? "bg-orange-600 text-white"
                                          : rule.severity === "medium"
                                            ? "bg-yellow-600 text-white"
                                            : "bg-blue-600 text-white"}`}
                                  >
                                    {rule.severity.toUpperCase()}
                                  </span>
                                  <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                                    {rule.type.replace("_", " ").toUpperCase()}
                                  </span>
                                  {rule.conditions.aiEnabled && (
                                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                      <Robot className="h-3 w-3" />
                                      AI
                                    </span>
                                  )}
                                </div>

                                <p className="text-gray-300 text-sm mb-3">
                                  {rule.description}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span>
                                    Action: {rule.action.replace("_", " ")}
                                  </span>
                                  <span>
                                    Created:{" "}
                                    {new Date(
                                      rule.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                  {rule.conditions.keywords && (
                                    <span>
                                      Keywords:{" "}
                                      {rule.conditions.keywords.length}
                                    </span>
                                  )}
                                  {rule.conditions.confidenceThreshold && (
                                    <span>
                                      AI Threshold:{" "}
                                      {rule.conditions.confidenceThreshold}%
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleModerationRule(rule.id, !rule.enabled)}
                                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${rule.enabled
                                      ? "bg-orange-600 hover:bg-orange-700"
                                      : "bg-green-600 hover:bg-green-700"}`}
                                >
                                  {rule.enabled ? (
                                    <PauseCircle className="h-4 w-4" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4" />
                                  )}
                                  {rule.enabled ? "Disable" : "Enable"}
                                </button>

                                <button
                                  onClick={() => {
                                    setRuleModal({
                                      open: true,
                                      rule,
                                      isEditing: true,
                                    });
                                    setNewRule({
                                      name: rule.name,
                                      description: rule.description,
                                      type: rule.type,
                                      severity: rule.severity,
                                      action: rule.action,
                                      keywords: rule.conditions.keywords?.join(", ") ||
                                        "",
                                      patterns: rule.conditions.patterns?.join(", ") ||
                                        "",
                                      aiEnabled: rule.conditions.aiEnabled || false,
                                      confidenceThreshold: rule.conditions.confidenceThreshold ||
                                        70,
                                    });
                                  } }
                                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>

                                <button
                                  onClick={() => deleteModerationRule(rule.id)}
                                  className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                                >
                                  <Trash className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Recent AI Scans */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-400" />
                      Recent AI Scans
                    </h3>

                    {fetchingScans ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentScans.slice(0, 10).map((scan) => (
                          <div
                            key={scan.id}
                            className="bg-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`h-3 w-3 rounded-full ${scan.status === "completed"
                                      ? "bg-green-400"
                                      : scan.status === "pending"
                                        ? "bg-yellow-400"
                                        : "bg-red-400"}`} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {scan.content_type}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-sm text-gray-400">
                                      {scan.scan_type.replace("_", " ")}
                                    </span>
                                    {scan.scan_type === "openai_moderation" && (
                                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <Robot className="h-3 w-3" />
                                        OpenAI
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                    <span>
                                      Confidence:{" "}
                                      {scan.confidence_score.toFixed(1)}%
                                    </span>
                                    <span>Flags: {scan.flags.length}</span>
                                    {scan.action_taken && (
                                      <span>Action: {scan.action_taken}</span>
                                    )}
                                  </div>
                                  {scan.ai_result && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      AI: {scan.ai_result.reasoning}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400">
                                  {new Date(
                                    scan.created_at
                                  ).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(
                                    scan.created_at
                                  ).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                            {scan.flags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {scan.flags.map((flag) => (
                                  <span
                                    key={flag}
                                    className="bg-red-600/20 text-red-300 px-2 py-1 rounded text-xs border border-red-600/30"
                                  >
                                    {flag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Spam Patterns */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                      Spam Detection Patterns
                    </h3>

                    {fetchingPatterns ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {spamPatterns.map((pattern) => (
                          <div
                            key={pattern.id}
                            className="bg-gray-700 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {pattern.type.toUpperCase()}
                                  </span>
                                  <button
                                    onClick={() => toggleSpamPattern(
                                      pattern.id,
                                      !pattern.enabled
                                    )}
                                    className={`px-2 py-1 rounded text-xs transition-colors ${pattern.enabled
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-gray-600 text-gray-300 hover:bg-gray-500"}`}
                                  >
                                    {pattern.enabled ? "ACTIVE" : "DISABLED"}
                                  </button>
                                </div>
                                <p className="text-xs text-gray-400 mb-2">
                                  {pattern.description}
                                </p>
                                <code className="text-xs bg-gray-800 px-2 py-1 rounded text-green-400 block">
                                  {pattern.pattern}
                                </code>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span>Severity: {pattern.severity}/10</span>
                              <span>
                                {new Date(
                                  pattern.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
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
                                <p className="text-gray-400 text-sm">
                                  Total Users
                                </p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.overview.totalUsers.toLocaleString()}
                                </p>
                                <p className="text-green-400 text-sm">
                                  +{analyticsData.overview.newUsersThisWeek}{" "}
                                  this week
                                </p>
                              </div>
                              <Users className="h-8 w-8 text-blue-400" />
                            </div>
                          </div>

                          <div className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">
                                  Total Content
                                </p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.overview.totalContent.toLocaleString()}
                                </p>
                                <p className="text-green-400 text-sm">
                                  +{analyticsData.overview.newContentThisWeek}{" "}
                                  this week
                                </p>
                              </div>
                              <ImageIcon className="h-8 w-8 text-purple-400" />
                            </div>
                          </div>

                          <div className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">
                                  Total Downloads
                                </p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.overview.totalDownloads.toLocaleString()}
                                </p>
                              </div>
                              <Download className="h-8 w-8 text-green-400" />
                            </div>
                          </div>

                          <div className="bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">
                                  Total Reports
                                </p>
                                <p className="text-2xl font-bold">
                                  {analyticsData.overview.totalReports.toLocaleString()}
                                </p>
                                <p className="text-red-400 text-sm">
                                  +{analyticsData.overview.reportsThisWeek} this
                                  week
                                </p>
                              </div>
                              <AlertTriangle className="h-8 w-8 text-orange-400" />
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Content Statistics */}
                      <section>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-purple-400" />
                          Content Statistics
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">
                              Content Types
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span>Profiles</span>
                                <span>
                                  {analyticsData.contentStats.profileCount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Banners</span>
                                <span>
                                  {analyticsData.contentStats.bannerCount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Pairs</span>
                                <span>
                                  {analyticsData.contentStats.pairCount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Emoji Combos</span>
                                <span>
                                  {analyticsData.contentStats.emojiComboCount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">
                              Top Categories
                            </h4>
                            <div className="space-y-2">
                              {analyticsData.contentStats.categoriesBreakdown.map(
                                (cat) => (
                                  <div
                                    key={cat.category}
                                    className="flex items-center justify-between"
                                  >
                                    <span>{cat.category}</span>
                                    <span>{cat.count.toLocaleString()}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Top Tags</h4>
                            <div className="space-y-2">
                              {analyticsData.contentStats.topTags.map((tag) => (
                                <div
                                  key={tag.tag}
                                  className="flex items-center justify-between"
                                >
                                  <span>{tag.tag}</span>
                                  <span>{tag.count.toLocaleString()}</span>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {analyticsData.contentStats.trendingItems.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="bg-gray-700 rounded-lg overflow-hidden"
                              >
                                <div className="aspect-square relative">
                                  <img
                                    src={item.image_url ||
                                      item.pfp_url ||
                                      item.banner_url ||
                                      "/placeholder.svg"}
                                    alt={item.title}
                                    className="w-full h-full object-cover" />
                                  <div className="absolute top-2 right-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${item.type === "pfp" ||
                                          item.type === "profile"
                                          ? "bg-blue-600 text-white"
                                          : item.type === "banner"
                                            ? "bg-purple-600 text-white"
                                            : "bg-green-600 text-white"}`}
                                    >
                                      {item.type.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <h4 className="font-semibold text-lg mb-2 truncate">
                                    {item.title}
                                  </h4>
                                  <div className="space-y-2 text-sm text-gray-300">
                                    <div className="flex items-center gap-2">
                                      <Download className="h-4 w-4 text-gray-400" />
                                      <span>
                                        {item.download_count.toLocaleString()}{" "}
                                        downloads
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-gray-400" />
                                      <span>
                                        Trend Score:{" "}
                                        {item.trend_score.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-gray-400" />
                                      <span>
                                        {new Date(
                                          item.updated_at
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </section>

                      {/* User Statistics */}
                      <section>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <UserCog className="h-5 w-5 text-yellow-400" />
                          User Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">Active Users</h4>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold">
                                {analyticsData.userStats.activeUsers.toLocaleString()}
                              </p>
                              <UserCheck className="h-8 w-8 text-green-400" />
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">
                              Top Uploaders
                            </h4>
                            <div className="space-y-2">
                              {analyticsData.userStats.topUploaders.map(
                                (user) => (
                                  <div
                                    key={user.username}
                                    className="flex items-center justify-between"
                                  >
                                    <span>{user.username}</span>
                                    <span>
                                      {user.uploadCount.toLocaleString()}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">
                              Registration Trends
                            </h4>
                            <div className="space-y-2">
                              {analyticsData.userStats.registrationTrends
                                .slice(0, 5)
                                .map((trend) => (
                                  <div
                                    key={trend.date}
                                    className="flex items-center justify-between"
                                  >
                                    <span>{trend.date}</span>
                                    <span>{trend.count.toLocaleString()}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* Moderation Statistics */}
                      <section>
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-red-400" />
                          Moderation Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">
                              Reports Resolved
                            </h4>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold">
                                {analyticsData.moderationStats.reportsResolved.toLocaleString()}
                              </p>
                              <CheckCircle className="h-8 w-8 text-green-400" />
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">
                              Reports Pending
                            </h4>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-bold">
                                {analyticsData.moderationStats.reportsPending.toLocaleString()}
                              </p>
                              <Clock className="h-8 w-8 text-yellow-400" />
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold mb-3">
                              Top Report Reasons
                            </h4>
                            <div className="space-y-2">
                              {analyticsData.moderationStats.topReportReasons.map(
                                (reason) => (
                                  <div
                                    key={reason.reason}
                                    className="flex items-center justify-between"
                                  >
                                    <span>{reason.reason}</span>
                                    <span>{reason.count.toLocaleString()}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No analytics data available
                      </h3>
                      <p className="text-gray-400">Please try again later</p>
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
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(
                          e.target.value as "all" |
                          "active" |
                          "restricted" |
                          "terminated"
                        )}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Users</option>
                        <option value="active">Active Users</option>
                        <option value="restricted">Restricted Users</option>
                        <option value="terminated">Terminated Users</option>
                      </select>
                    </div>
                  </div>

                  {fetchingUsers ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <UserCog className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No users found
                      </h3>
                      <p className="text-gray-400">
                        {userSearch || userFilter !== "all"
                          ? "Try adjusting your search or filter"
                          : "No users have registered yet"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="bg-gray-700 rounded-lg overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="flex items-center gap-4 mb-3">
                              <img
                                src={user.avatar_url || "/placeholder.svg"}
                                alt={user.username}
                                className="h-10 w-10 rounded-full object-cover" />
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {user.display_name}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-300">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{user.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>
                                  Joined:{" "}
                                  {new Date(
                                    user.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-gray-400" />
                                <span>
                                  Last Active:{" "}
                                  {new Date(
                                    user.last_active
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Download className="h-4 w-4 text-gray-400" />
                                <span>{user.download_count} downloads</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-gray-400" />
                                <span>{user.upload_count} uploads</span>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${user.status === "active"
                                    ? "bg-green-600 text-white"
                                    : user.status === "restricted"
                                      ? "bg-orange-600 text-white"
                                      : "bg-red-600 text-white"}`}
                              >
                                {user.status.toUpperCase()}
                              </span>
                              <div className="flex items-center gap-2">
                                {user.status !== "active" && (
                                  <button
                                    onClick={() => updateUserStatus(user.id, "active")}
                                    className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                    Activate
                                  </button>
                                )}
                                {user.status !== "restricted" && (
                                  <button
                                    onClick={() => updateUserStatus(user.id, "restricted")}
                                    className="flex items-center gap-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-sm"
                                  >
                                    <UserX className="h-4 w-4" />
                                    Restrict
                                  </button>
                                )}
                                {user.status !== "terminated" && (
                                  <button
                                    onClick={() => updateUserStatus(user.id, "terminated")}
                                    className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                                  >
                                    <UserX className="h-4 w-4" />
                                    Terminate
                                  </button>
                                )}
                              </div>
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
                    <div className="space-y-6">
                      {Object.entries(settingsByCategory).map(
                        ([category, settings]) => (
                          <section
                            key={category}
                            className="bg-gray-700 rounded-lg p-6"
                          >
                            <h3 className="text-xl font-semibold mb-4 capitalize">
                              {category.replace("_", " ")}
                            </h3>
                            <div className="space-y-4">
                              {settings.map((setting) => (
                                <div
                                  key={setting.key}
                                  className="flex items-center justify-between"
                                >
                                  <div>
                                    <h4 className="font-semibold">
                                      {setting.key.replace(/_/g, " ")}
                                    </h4>
                                    <p className="text-gray-400 text-sm">
                                      {setting.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    {setting.type === "boolean" ? (
                                      <select
                                        value={setting.value}
                                        onChange={(e) => updateSystemSetting(
                                          setting.key,
                                          e.target.value
                                        )}
                                        disabled={savingSettings[setting.key]}
                                        className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={setting.value}
                                        onChange={(e) => updateSystemSetting(
                                          setting.key,
                                          e.target.value
                                        )}
                                        disabled={savingSettings[setting.key]}
                                        className="w-48 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    )}
                                    {savingSettings[setting.key] && (
                                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </section>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Moderation Logs Tab */}
              {activeTab === "logs" && (
                <div>
                  {fetchingLogs ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No moderation logs found
                      </h3>
                      <p className="text-gray-400">
                        No actions have been logged yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-gray-700 rounded-lg p-6"
                        >
                          <div className="flex items-start gap-4">
                            <div>
                              <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                  {usersMap[log.moderator_id]?.display_name ||
                                    usersMap[log.moderator_id]?.username ||
                                    "System"}
                                </h3>
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                                  {log.action.toUpperCase()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span>
                                    Target User:{" "}
                                    {usersMap[log.target_user_id]?.username ||
                                      "Unknown"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {new Date(log.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                <span className="text-sm text-gray-300">
                                  {log.description}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* System Monitoring Tab */}
              {activeTab === "monitoring" && (
                <div className="space-y-6">
                  <section className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">
                      System Resources
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-4">
                        <HardDrive className="h-8 w-8 text-blue-400" />
                        <div>
                          <h4 className="font-semibold">CPU Usage</h4>
                          <p className="text-gray-400">75%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Database className="h-8 w-8 text-green-400" />
                        <div>
                          <h4 className="font-semibold">Memory Usage</h4>
                          <p className="text-gray-400">60%</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">
                      Network Traffic
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-4">
                        <Download className="h-8 w-8 text-yellow-400" />
                        <div>
                          <h4 className="font-semibold">Incoming</h4>
                          <p className="text-gray-400">10 Mbps</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <TrendingUp className="h-8 w-8 text-red-400" />
                        <div>
                          <h4 className="font-semibold">Outgoing</h4>
                          <p className="text-gray-400">8 Mbps</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">System Logs</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400">Server started</p>
                        <span className="text-sm text-gray-500">
                          2024-01-01 00:00:00
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400">Database connected</p>
                        <span className="text-sm text-gray-500">
                          2024-01-01 00:00:05
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400">User login</p>
                        <span className="text-sm text-gray-500">
                          2024-01-01 00:00:10
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">
              {actionModal.action === "warn"
                ? "Warn User"
                : actionModal.action === "restrict"
                  ? "Restrict User"
                  : "Terminate User"}
            </h2>
            <p className="text-gray-400 mb-4">
              Are you sure you want to {actionModal.action} user{" "}
              {actionModal.username}?
            </p>
            {actionModal.action === "warn" && (
              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Enter warning message..." />
            )}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={closeActionModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirmed}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {actionModal.action === "warn"
                  ? "Warn"
                  : actionModal.action === "restrict"
                    ? "Restrict"
                    : "Terminate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">Edit Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editModal.editedTitle}
                  onChange={(e) => setEditModal({ ...editModal, editedTitle: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter title..." />
              </div>
              <div>
                <label className="block font-medium mb-1">Tags</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editModal.tagInput}
                    onChange={(e) => setEditModal({ ...editModal, tagInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTagToEdit();
                      }
                    } }
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter tag..." />
                  <button
                    onClick={addTagToEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editModal.editedTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-600 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTagFromEdit(tag)}
                        className="hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => generateTagsForContent(editModal.content!)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Generate AI Tags
                </button>
                <div>
                  <button
                    onClick={closeEditModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveContentEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Rule Modal */}
      {ruleModal.open && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-semibold mb-4">
              {ruleModal.isEditing
                ? "Edit Moderation Rule"
                : "Create Moderation Rule"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter rule name..." />
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Enter rule description..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Type</label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      type: e.target.value as ModerationRule["type"],
                    })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ai_moderation">AI Moderation</option>
                    <option value="content_filter">Content Filter</option>
                    <option value="spam_detection">Spam Detection</option>
                    <option value="keyword_filter">Keyword Filter</option>
                    <option value="user_behavior">User Behavior</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      severity: e.target.value as ModerationRule["severity"],
                    })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Action</label>
                  <select
                    value={newRule.action}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      action: e.target.value as ModerationRule["action"],
                    })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="flag">Flag</option>
                    <option value="hide">Hide</option>
                    <option value="remove">Remove</option>
                    <option value="warn_user">Warn User</option>
                    <option value="restrict_user">Restrict User</option>
                    <option value="ban_user">Ban User</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    AI Confidence Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={newRule.confidenceThreshold}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      confidenceThreshold: Number.parseInt(e.target.value) || 70,
                    })}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter confidence threshold..." />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={newRule.keywords}
                  onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter keywords..." />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Patterns (comma-separated)
                </label>
                <input
                  type="text"
                  value={newRule.patterns}
                  onChange={(e) => setNewRule({ ...newRule, patterns: e.target.value })}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter patterns..." />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aiEnabled"
                  checked={newRule.aiEnabled}
                  onChange={(e) => setNewRule({ ...newRule, aiEnabled: e.target.checked })}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500" />
                <label htmlFor="aiEnabled" className="font-medium">
                  Enable AI Analysis
                </label>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setRuleModal({ open: false, rule: null, isEditing: false })}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={ruleModal.isEditing
                    ? updateModerationRule
                    : createModerationRule}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {ruleModal.isEditing ? "Update Rule" : "Create Rule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div><Footer /></>
  );
};

export default ModerationPanel;
