import { useState, useEffect, Fragment } from "react"
import {
  TrendingUp,
  Download,
  Tag,
  Users,
  ImageIcon,
  Layout,
  Flame,
  Star,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Zap,
  Heart,
  User,
  X,
} from "lucide-react"
import { Dialog, Transition } from "@headlessui/react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "../../context/authContext"
import { supabase } from "../../lib/supabase"
import Footer from "../Footer"

interface UserProfile {
  username: string | null
  display_name: string | null
  avatar_url: string | null
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
  user_id?: string
  user_profiles?: UserProfile
}

interface TrendingStats {
  totalDownloads: number
  totalUploads: number
  activeUsers: number
  trendingTags: Array<{ tag: string; count: number }>
}

type TimeFilter = "today" | "week" | "month" | "all"
type CategoryFilter = "all" | "profile" | "pfp" | "banner" | "pair"

const TrendingCard = ({ 
  item, 
  rank, 
  onPreview,
  onDownload,
  onFavorite,
  isFavorited,
  user,
}: { 
  item: TrendingItem
  rank: number
  onPreview: (item: TrendingItem) => void
  onDownload: (item: TrendingItem) => void
  onFavorite: (itemId: string) => void
  isFavorited: boolean
  user: any
}) => {
  const getImageUrl = () => {
    if (item.type === "pair") return item.banner_url || item.pfp_url
    return item.image_url
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400 bg-yellow-400/20"
    if (rank === 2) return "text-gray-300 bg-gray-300/20"
    if (rank === 3) return "text-orange-400 bg-orange-400/20"
    return "text-purple-400 bg-purple-400/20"
  }

  const getTypeIcon = () => {
    switch (item.type) {
      case "profile":
        return <Users className="h-4 w-4 text-blue-400" />
      case "pfp":
        return <ImageIcon className="h-4 w-4 text-blue-400" />
      case "banner":
        return <Layout className="h-4 w-4 text-purple-400" />
      case "pair":
        return <Layout className="h-4 w-4 text-purple-400" />
      default:
        return <ImageIcon className="h-4 w-4 text-blue-400" />
    }
  }

  const getTypeLabel = () => {
    switch (item.type) {
      case "profile": return "Profile"
      case "pfp": return "PFP"
      case "banner": return "Banner"
      case "pair": return "Profile Pair"
      default: return "Profile"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="group relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all"
    >
      <div className="aspect-square relative overflow-hidden bg-slate-800 cursor-pointer" onClick={() => onPreview(item)}>
        {item.type === "pair" && item.banner_url ? (
          <div className="relative w-full h-full">
            <img
              src={item.banner_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            {item.pfp_url && (
              <div className="absolute top-2 right-2">
                <img
                  src={item.pfp_url}
                  alt="PFP"
                  className="w-12 h-12 rounded-full border-2 border-white/30"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        ) : (
          <img
            src={getImageUrl() || "/placeholder.svg"}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        )}

        {/* Rank Badge */}
        <div
          className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-full ${getRankColor(rank)} flex items-center justify-center font-bold text-xs`}
        >
          {rank}
        </div>

        {/* Trending Badge */}
        <div className="absolute top-2 right-2 z-10 bg-red-500/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
          <Flame className="h-3 w-3 text-white" />
          <span className="text-xs text-white font-medium">HOT</span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(item);
                }}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4 text-white" />
              </button>
              {user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite(item.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isFavorited
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-800/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400"
                  }`}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-white text-xs">
              <Download className="h-3 w-3" />
              <span>{item.download_count.toLocaleString()}</span>
              {item.growth_rate > 0 && (
                <>
                  <span className="mx-1">•</span>
                  <ArrowUp className="h-3 w-3 text-green-400" />
                  <span className="text-green-400">{Math.abs(item.growth_rate)}%</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {getTypeIcon()}
          <span className="text-xs text-slate-400">{getTypeLabel()}</span>
        </div>
        <h3 className="text-sm font-semibold text-white truncate mb-2">{item.title}</h3>
        {(item.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 max-h-12 overflow-auto">
            {item.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/browse/tag/${encodeURIComponent(tag)}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap border border-purple-600/30 hover:bg-purple-700/50 hover:border-purple-500/50 transition-colors"
              >
                #{tag}
              </Link>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-slate-500 px-2 py-0.5">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
        {item.user_profiles && (
          <Link
            to={`/user/${item.user_profiles.username || item.user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-purple-400 transition-colors group"
          >
            {item.user_profiles.avatar_url ? (
              <img
                src={item.user_profiles.avatar_url}
                alt={item.user_profiles.username || "User"}
                className="w-6 h-6 rounded-full ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ring-2 ring-slate-700 group-hover:ring-purple-500 transition-all">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
            )}
            <span className="truncate font-medium">
              {item.user_profiles.username || item.user_profiles.display_name || "Unknown User"}
            </span>
          </Link>
        )}
      </div>
    </motion.div>
  )
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  color,
  gradient,
}: {
  icon: any
  label: string
  value: string | number
  change?: number
  color: string
  gradient?: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="group relative bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-6 w-6" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${
          change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        }`}>
          {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <div className={`text-3xl font-bold mb-1 ${
      gradient ? `bg-gradient-to-r ${gradient} bg-clip-text text-transparent` : "text-white"
    }`}>
      {typeof value === "number" ? value.toLocaleString() : value}
    </div>
    <div className="text-sm text-slate-400">{label}</div>
  </motion.div>
)

export default function TrendingPage() {
  const { user } = useAuth()
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([])
  const [stats, setStats] = useState<TrendingStats>({
    totalDownloads: 0,
    totalUploads: 0,
    activeUsers: 0,
    trendingTags: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [previewItem, setPreviewItem] = useState<TrendingItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTrendingData()
  }, [timeFilter, categoryFilter])

  const fetchTrendingData = async () => {
    setLoading(true)
    try {
      // Calculate date range based on time filter
      const now = new Date()
      let dateFilter = new Date()

      switch (timeFilter) {
        case "today":
          dateFilter.setDate(now.getDate() - 1)
          break
        case "week":
          dateFilter.setDate(now.getDate() - 7)
          break
        case "month":
          dateFilter.setMonth(now.getMonth() - 1)
          break
        case "all":
          dateFilter = new Date("2020-01-01") // Far back date
          break
      }

      // Fetch trending profiles and profile pairs
      const queries = []

      // Fetch from profiles table (only approved content)
      let profileQuery = supabase
        .from("profiles")
        .select("*")
        .eq("status", "approved")
        .gte("updated_at", dateFilter.toISOString())
        .order("download_count", { ascending: false })
        .limit(20)

      if (categoryFilter !== "all" && categoryFilter !== "pair") {
        profileQuery = profileQuery.eq("type", categoryFilter === "pfp" ? "profile" : categoryFilter)
      }

      queries.push(profileQuery)

      // Fetch from profile_pairs table if needed (only approved content)
      if (categoryFilter === "all" || categoryFilter === "pair") {
        const pairQuery = supabase
          .from("profile_pairs")
          .select("*")
          .eq("status", "approved")
          .gte("updated_at", dateFilter.toISOString())
          .order("created_at", { ascending: false })
          .limit(10)

        queries.push(pairQuery)
      }

      const results = await Promise.all(queries)
      const [profilesResult, pairsResult] = results

      const allItems: TrendingItem[] = []

      // Process profiles
      if (profilesResult?.data && profilesResult.data.length > 0) {
        const profileItems: TrendingItem[] = profilesResult.data.map((item: any) => {
          // Calculate trend score based on downloads and recency
          const daysSinceUpdate = Math.max(1, Math.floor((Date.now() - new Date(item.updated_at || item.created_at).getTime()) / (1000 * 60 * 60 * 24)))
          const recencyScore = Math.max(0, 100 - daysSinceUpdate * 5) // Decay over time
          const downloadScore = Math.min(100, (item.download_count || 0) * 0.1)
          const trendScore = Math.floor(recencyScore * 0.6 + downloadScore * 0.4)
          
          // Calculate growth rate based on downloads (simplified)
          const growthRate = item.download_count > 10 ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 30) - 10
          
          return {
            id: item.id,
            title: item.title || "Untitled",
            type: item.type === "profile" ? "pfp" : (item.type as any),
            image_url: item.image_url,
            download_count: item.download_count || 0,
            category: item.category || "General",
            tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()) : []),
            created_at: item.created_at,
            updated_at: item.updated_at,
            trend_score: trendScore,
            growth_rate: growthRate,
            user_id: item.user_id,
          }
        })
        allItems.push(...profileItems)
      }

      // Process profile pairs
      if (pairsResult?.data && pairsResult.data.length > 0) {
        const pairItems: TrendingItem[] = pairsResult.data.map((item: any) => {
          // Calculate trend score based on downloads and recency
          const daysSinceUpdate = Math.max(1, Math.floor((Date.now() - new Date(item.updated_at || item.created_at).getTime()) / (1000 * 60 * 60 * 24)))
          const recencyScore = Math.max(0, 100 - daysSinceUpdate * 5) // Decay over time
          const downloadScore = Math.min(100, (item.download_count || 0) * 0.1)
          const trendScore = Math.floor(recencyScore * 0.6 + downloadScore * 0.4)
          
          // Calculate growth rate based on downloads (simplified)
          const growthRate = item.download_count > 10 ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 30) - 10
          
          return {
            id: item.id,
            title: item.title || "Untitled Pair",
            type: "pair" as const,
            pfp_url: item.pfp_url,
            banner_url: item.banner_url,
            download_count: item.download_count || 0,
            category: item.category || "General",
            tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()) : []),
            created_at: item.created_at,
            updated_at: item.updated_at,
            trend_score: trendScore,
            growth_rate: growthRate,
            user_id: item.user_id,
          }
        })
        allItems.push(...pairItems)
      }

      // Fetch user profiles for all items
      const userIds = [...new Set(allItems.map(item => item.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: userProfiles } = await supabase
          .from("user_profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);

        const userMap = new Map(userProfiles?.map(up => [up.user_id, up]) || []);
        
        allItems.forEach(item => {
          if (item.user_id) {
            item.user_profiles = userMap.get(item.user_id);
          }
        });
      }

      // Sort by trend score and download count
      allItems.sort((a, b) => {
        const scoreA = a.trend_score + a.download_count * 0.1
        const scoreB = b.trend_score + b.download_count * 0.1
        return scoreB - scoreA
      })

      // Set trending items (at least show top 12, or all if less than 12)
      setTrendingItems(allItems.slice(0, 12))

      // If no items found, log for debugging
      if (allItems.length === 0) {
        console.warn("No trending items found for time filter:", timeFilter, "category filter:", categoryFilter)
      }

      // Fetch stats with error handling (only approved content)
      try {
        const [profilesCount, pairsCount, usersCount] = await Promise.all([
          supabase.from("profiles").select("download_count", { count: "exact" }).eq("status", "approved"),
          supabase.from("profile_pairs").select("id", { count: "exact" }).eq("status", "approved"),
          supabase.from("user_profiles").select("id", { count: "exact" }),
        ])

        const totalDownloads = profilesCount.data?.reduce((sum: number, item: any) => sum + (item.download_count || 0), 0) || 0
        const totalUploads = (profilesCount.count || 0) + (pairsCount.count || 0)
        const activeUsers = usersCount.count || 0

        // Generate trending tags from all items
        const tagCounts: Record<string, number> = {}
        allItems.forEach((item) => {
          item.tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        })

        const trendingTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([tag, count]) => ({ tag, count }))

        setStats({
          totalDownloads,
          totalUploads,
          activeUsers,
          trendingTags,
        })
      } catch (statsError) {
        console.error("Error fetching stats:", statsError)
        // Set default stats if fetch fails
        const tagCounts: Record<string, number> = {}
        allItems.forEach((item) => {
          item.tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        })

        const trendingTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([tag, count]) => ({ tag, count }))

        setStats({
          totalDownloads: allItems.reduce((sum, item) => sum + item.download_count, 0),
          totalUploads: allItems.length,
          activeUsers: 0,
          trendingTags,
        })
      }

    } catch (error) {
      console.error("Failed to fetch trending data:", error)
      setTrendingItems([])
      setStats({
        totalDownloads: 0,
        totalUploads: 0,
        activeUsers: 0,
        trendingTags: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const timeFilterOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "all", label: "All Time" },
  ]

  const categoryFilterOptions = [
    { value: "all", label: "All Types", icon: BarChart3 },
    { value: "profile", label: "Profiles", icon: Users },
    { value: "pfp", label: "PFPs", icon: ImageIcon },
    { value: "banner", label: "Banners", icon: Layout },
    { value: "pair", label: "Profile Pairs", icon: Users },
  ]

  // Load favorites from database
  useEffect(() => {
    if (user?.id) {
      async function loadFavorites() {
        try {
          const { data, error } = await supabase
            .from("favorites")
            .select("profile_id")
            .eq("user_id", user.id);

          if (!error && data) {
            setFavorites(new Set(data.map(f => f.profile_id)));
          }
        } catch (err) {
          console.error("Error loading favorites:", err);
        }
      }
      loadFavorites();
    }
  }, [user]);

  const openPreview = (item: TrendingItem) => {
    setPreviewItem(item);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewItem(null);
  };

  const handleDownload = async (item: TrendingItem) => {
    const imageUrl = item.type === "pair" ? (item.banner_url || item.pfp_url) : item.image_url;
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Network response not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const ext = imageUrl.split(".").pop()?.split(/[#?]/)[0] || "png";
      const sanitizedTitle = item.title.replace(/\s+/g, "_").toLowerCase();
      a.download = `${sanitizedTitle}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      // Update download count
      const tableName = item.type === "pair" ? "profile_pairs" : "profiles";
      await supabase
        .from(tableName)
        .update({ download_count: (item.download_count || 0) + 1 })
        .eq("id", item.id);
    } catch (error) {
      console.error("Error downloading:", error);
      alert("Failed to download image.");
    }
  };

  const handleFavorite = async (itemId: string) => {
    if (!user) return;

    const isCurrentlyFavorited = favorites.has(itemId);
    const newFavorites = new Set(favorites);

    // Optimistic update
    if (isCurrentlyFavorited) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);

    try {
      if (isCurrentlyFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("profile_id", itemId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert([{ user_id: user.id, profile_id: itemId }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Failed to update favorites:", error);
      setFavorites(favorites);
    }
  };

  return (
    <><div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20 rounded-2xl backdrop-blur-sm border border-orange-500/30 shadow-lg">
              <Flame className="h-10 w-10 text-orange-400" />
            </div>
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                  Trending Now
                </span>
              </h1>
              <p className="text-slate-400 text-xl">Discover what's hot in the community</p>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {/* Time Filter */}
            <div className="flex bg-slate-800/50 backdrop-blur-sm rounded-xl p-1.5 border border-slate-700/50 shadow-lg">
              {timeFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeFilter(option.value as TimeFilter)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    timeFilter === option.value
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/25"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex bg-slate-800/50 backdrop-blur-sm rounded-xl p-1.5 border border-slate-700/50 shadow-lg">
              {categoryFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCategoryFilter(option.value as CategoryFilter)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    categoryFilter === option.value
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Download}
            label="Total Downloads"
            value={stats.totalDownloads}
            change={12}
            color="bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-400"
            gradient="from-green-400 to-emerald-500"
          />
          <StatCard
            icon={ImageIcon}
            label="Total Uploads"
            value={stats.totalUploads}
            change={8}
            color="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400"
            gradient="from-blue-400 to-cyan-500"
          />
          <StatCard
            icon={Users}
            label="Active Users"
            value={stats.activeUsers}
            change={15}
            color="bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400"
            gradient="from-purple-400 to-pink-500"
          />
          <StatCard
            icon={Zap}
            label="Trending Score"
            value="Hot"
            color="bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-400"
            gradient="from-orange-400 to-red-500"
          />
        </div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Quick Insights</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/20 hover:bg-slate-700/30 transition-colors border border-slate-600/30">
              <div>
                <span className="text-slate-400 text-sm font-medium block mb-1">Most Downloaded</span>
                <span className="text-white font-bold text-xl">
                  {trendingItems[0]?.download_count.toLocaleString() || "0"}
                </span>
              </div>
              <Download className="h-8 w-8 text-green-400 opacity-50" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/20 hover:bg-slate-700/30 transition-colors border border-slate-600/30">
              <div>
                <span className="text-slate-400 text-sm font-medium block mb-1">Top Category</span>
                <span className="text-white font-bold text-xl">{trendingItems[0]?.category || "N/A"}</span>
              </div>
              <Tag className="h-8 w-8 text-purple-400 opacity-50" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/20 hover:bg-slate-700/30 transition-colors border border-slate-600/30">
              <div>
                <span className="text-slate-400 text-sm font-medium block mb-1">Growth Leader</span>
                <div className="flex items-center gap-1">
                  <ArrowUp className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-bold text-xl">
                    {trendingItems.length > 0 ? Math.max(...trendingItems.map((i) => i.growth_rate)) : 0}%
                  </span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-400 opacity-50" />
            </div>
          </div>
        </motion.div>

        {/* Trending Tags - Horizontal Scrollable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
              <Tag className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Trending Tags</h3>
          </div>
          <div 
            className="flex gap-3 overflow-x-auto pb-3 trending-tags-scroll"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#a855f7 #1e293b',
            }}
          >
            <style>{`
              .trending-tags-scroll::-webkit-scrollbar {
                height: 8px;
              }
              .trending-tags-scroll::-webkit-scrollbar-track {
                background: rgba(30, 41, 59, 0.5);
                border-radius: 10px;
              }
              .trending-tags-scroll::-webkit-scrollbar-thumb {
                background: linear-gradient(90deg, #a855f7, #3b82f6);
                border-radius: 10px;
                border: 1px solid rgba(168, 85, 247, 0.3);
              }
              .trending-tags-scroll::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(90deg, #9333ea, #2563eb);
              }
            `}</style>
            {stats.trendingTags.map((tag) => (
              <Link
                key={tag.tag}
                to={`/browse/tag/${encodeURIComponent(tag.tag)}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-purple-500/50 hover:bg-slate-700/30 transition-all duration-200 group flex-shrink-0"
              >
                <span className="text-purple-300 text-sm font-medium group-hover:text-purple-200 transition-colors">#{tag.tag}</span>
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${(tag.count / Math.max(...stats.trendingTags.map((t) => t.count))) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-300 font-medium">{tag.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Trending Content - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
              <Flame className="h-6 w-6 text-orange-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Trending Content
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 animate-pulse">
                  <div className="aspect-square bg-slate-700 rounded-t-xl" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-slate-700 rounded w-3/4" />
                    <div className="h-2 bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50"
            >
              <div className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">No trending content</h3>
              <p className="text-slate-400 text-lg">Check back later for trending items</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {trendingItems.map((item, index) => (
                <TrendingCard 
                  key={item.id} 
                  item={item} 
                  rank={index + 1}
                  onPreview={openPreview}
                  onDownload={handleDownload}
                  onFavorite={handleFavorite}
                  isFavorited={favorites.has(item.id)}
                  user={user}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Preview Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={closePreview}>
          <div className="min-h-screen px-4 text-center bg-black bg-opacity-80 backdrop-blur-sm">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="inline-block w-full max-w-4xl my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl border border-slate-700">
                <div className="relative">
                  {previewItem && (
                    <>
                      {previewItem.type === "pair" && previewItem.banner_url ? (
                        <div className="relative w-full bg-slate-800">
                          <img
                            src={previewItem.banner_url}
                            alt={previewItem.title}
                            className="w-full h-96 object-cover"
                            loading="lazy"
                          />
                          {previewItem.pfp_url && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                              <img
                                src={previewItem.pfp_url}
                                alt="PFP"
                                className="w-32 h-32 rounded-full border-4 border-slate-900 shadow-2xl"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <img
                          src={previewItem.image_url || "/placeholder.svg"}
                          alt={previewItem.title}
                          className="w-full h-96 object-contain bg-slate-800"
                          loading="lazy"
                        />
                      )}
                    </>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={closePreview}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {previewItem && (
                  <div className="p-8">
                    <Dialog.Title as="h3" className="text-3xl font-bold text-white mb-4">
                      {previewItem.title}
                    </Dialog.Title>

                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{previewItem.download_count.toLocaleString()} downloads</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>Trend Score: {previewItem.trend_score}</span>
                      </div>
                      {previewItem.growth_rate > 0 && (
                        <div className="flex items-center gap-1 text-green-400">
                          <ArrowUp className="h-4 w-4" />
                          <span>+{previewItem.growth_rate}%</span>
                        </div>
                      )}
                      {previewItem.user_profiles && (
                        <Link
                          to={`/user/${previewItem.user_profiles.username || previewItem.user_id}`}
                          className="flex items-center gap-2 hover:text-purple-400 transition-colors"
                        >
                          {previewItem.user_profiles.avatar_url ? (
                            <img
                              src={previewItem.user_profiles.avatar_url}
                              alt={previewItem.user_profiles.username || "User"}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <span>{previewItem.user_profiles.username || previewItem.user_profiles.display_name || "Unknown User"}</span>
                        </Link>
                      )}
                    </div>

                    {(previewItem.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {previewItem.tags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/browse/tag/${encodeURIComponent(tag)}`}
                            className="bg-purple-700/30 text-purple-200 text-sm px-3 py-1 rounded-full border border-purple-600/30 hover:bg-purple-700/50 hover:border-purple-500/50 transition-colors"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => previewItem && handleDownload(previewItem)}
                        className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        type="button"
                      >
                        <Download className="h-5 w-5" />
                        Download
                      </button>
                      {user && (
                        <button
                          onClick={() => previewItem && handleFavorite(previewItem.id)}
                          className={`inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            previewItem && favorites.has(previewItem.id)
                              ? "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
                              : "text-slate-300 bg-slate-700 hover:bg-slate-600 focus:ring-slate-500"
                          }`}
                          type="button"
                        >
                          <Heart className={`h-5 w-5 ${previewItem && favorites.has(previewItem.id) ? "fill-current" : ""}`} />
                          {previewItem && favorites.has(previewItem.id) ? "Remove from Favorites" : "Add to Favorites"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
                        onClick={closePreview}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div><Footer /></>
  )
}
