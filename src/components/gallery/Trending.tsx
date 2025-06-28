import { useState, useEffect } from "react"
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
} from "lucide-react"
import { useAuth } from "../../context/authContext"
import { supabase } from "../../lib/supabase"

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

interface TrendingStats {
  totalDownloads: number
  totalUploads: number
  activeUsers: number
  trendingTags: Array<{ tag: string; count: number }>
}

type TimeFilter = "today" | "week" | "month" | "all"
type CategoryFilter = "all" | "profile" | "pfp" | "banner" | "pair"

const TrendingCard = ({ item, rank }: { item: TrendingItem; rank: number }) => {
  const getImageUrl = () => {
    if (item.type === "pair") return item.pfp_url || item.banner_url
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
        return <Users className="h-4 w-4" />
      case "pfp":
        return <ImageIcon className="h-4 w-4" />
      case "banner":
        return <Layout className="h-4 w-4" />
      case "pair":
        return <Users className="h-4 w-4" />
      default:
        return <ImageIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="group bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
      <div className="relative">
        {/* Rank Badge */}
        <div
          className={`absolute top-3 left-3 z-10 w-8 h-8 rounded-full ${getRankColor(rank)} flex items-center justify-center font-bold text-sm`}
        >
          {rank}
        </div>

        {/* Trending Badge */}
        <div className="absolute top-3 right-3 z-10 bg-red-500/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
          <Flame className="h-3 w-3 text-white" />
          <span className="text-xs text-white font-medium">HOT</span>
        </div>

        {/* Image */}
        <div className="aspect-video relative overflow-hidden">
          <img
            src={getImageUrl() || "/placeholder.svg"}
            alt={item.title}
            className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Growth Indicator */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
          {item.growth_rate > 0 ? (
            <ArrowUp className="h-3 w-3 text-green-400" />
          ) : (
            <ArrowDown className="h-3 w-3 text-red-400" />
          )}
          <span className="text-xs text-white font-medium">{Math.abs(item.growth_rate)}%</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-purple-600/20 rounded">{getTypeIcon()}</div>
          <span className="text-xs text-purple-300 font-medium uppercase tracking-wide">{item.type}</span>
        </div>

        <h3 className="text-white font-semibold text-lg mb-2 truncate">{item.title}</h3>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>{item.download_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{item.trend_score}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-purple-700/30 text-purple-200 text-xs px-2 py-0.5 rounded-full border border-purple-600/30"
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 3 && <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  color,
}: {
  icon: any
  label: string
  value: string | number
  change?: number
  color: string
}) => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
          {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-white mb-1">
      {typeof value === "number" ? value.toLocaleString() : value}
    </div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
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

      // Fetch from profiles table
      let profileQuery = supabase
        .from("profiles")
        .select("*")
        .gte("updated_at", dateFilter.toISOString())
        .order("download_count", { ascending: false })
        .limit(20)

      if (categoryFilter !== "all" && categoryFilter !== "pair") {
        profileQuery = profileQuery.eq("type", categoryFilter === "pfp" ? "profile" : categoryFilter)
      }

      queries.push(profileQuery)

      // Fetch from profile_pairs table if needed
      if (categoryFilter === "all" || categoryFilter === "pair") {
        const pairQuery = supabase
          .from("profile_pairs")
          .select("*")
          .gte("updated_at", dateFilter.toISOString())
          .order("created_at", { ascending: false })
          .limit(10)

        queries.push(pairQuery)
      }

      const results = await Promise.all(queries)
      const [profilesResult, pairsResult] = results

      const allItems: TrendingItem[] = []

      // Process profiles
      if (profilesResult.data) {
        const profileItems: TrendingItem[] = profilesResult.data.map((item, index) => ({
          id: item.id,
          title: item.title || "Untitled",
          type: item.type === "profile" ? "pfp" : (item.type as any),
          image_url: item.image_url,
          download_count: item.download_count || 0,
          category: item.category || "General",
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item.created_at,
          updated_at: item.updated_at,
          trend_score: Math.floor((item.download_count || 0) * 0.8 + Math.random() * 50),
          growth_rate: Math.floor(Math.random() * 100) - 20, // Simulated growth rate
        }))
        allItems.push(...profileItems)
      }

      // Process profile pairs
      if (pairsResult?.data) {
        const pairItems: TrendingItem[] = pairsResult.data.map((item, index) => ({
          id: item.id,
          title: item.title || "Untitled Pair",
          type: "pair" as const,
          pfp_url: item.pfp_url,
          banner_url: item.banner_url,
          download_count: Math.floor(Math.random() * 500) + 50, // Simulated downloads
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

      setTrendingItems(allItems.slice(0, 12))

      // Fetch stats
      const [profilesCount, pairsCount, usersCount] = await Promise.all([
        supabase.from("profiles").select("download_count", { count: "exact" }),
        supabase.from("profile_pairs").select("id", { count: "exact" }),
        supabase.from("user_profiles").select("id", { count: "exact" }),
      ])

      const totalDownloads = profilesCount.data?.reduce((sum, item) => sum + (item.download_count || 0), 0) || 0
      const totalUploads = (profilesCount.count || 0) + (pairsCount.count || 0)
      const activeUsers = usersCount.count || 0

      // Generate trending tags
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
    } catch (error) {
      console.error("Failed to fetch trending data:", error)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-xl">
            <TrendingUp className="h-8 w-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-white text-4xl font-bold">Trending Now</h1>
            <p className="text-gray-400 text-lg">Discover what's hot in the community</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Time Filter */}
          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
            {timeFilterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeFilter(option.value as TimeFilter)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  timeFilter === option.value
                    ? "bg-orange-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
            {categoryFilterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setCategoryFilter(option.value as CategoryFilter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  categoryFilter === option.value
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Download}
          label="Total Downloads"
          value={stats.totalDownloads}
          change={12}
          color="bg-green-600/20 text-green-400"
        />
        <StatCard
          icon={ImageIcon}
          label="Total Uploads"
          value={stats.totalUploads}
          change={8}
          color="bg-blue-600/20 text-blue-400"
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats.activeUsers}
          change={15}
          color="bg-purple-600/20 text-purple-400"
        />
        <StatCard icon={Zap} label="Trending Score" value="Hot" color="bg-orange-600/20 text-orange-400" />
      </div>

      {/* Trending Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Trending Grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-6 w-6 text-orange-400" />
            <h2 className="text-2xl font-bold text-white">Trending Content</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-xl animate-pulse">
                  <div className="aspect-video bg-gray-700 rounded-t-xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : trendingItems.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">No trending content</h3>
              <p className="text-gray-400">Check back later for trending items</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {trendingItems.map((item, index) => (
                <TrendingCard key={item.id} item={item} rank={index + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Tags */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Trending Tags</h3>
            </div>
            <div className="space-y-2">
              {stats.trendingTags.slice(0, 8).map((tag, index) => (
                <div key={tag.tag} className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">#{tag.tag}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        style={{ width: `${(tag.count / Math.max(...stats.trendingTags.map((t) => t.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6">{tag.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Most Downloaded</span>
                <span className="text-white font-medium">
                  {trendingItems[0]?.download_count.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Top Category</span>
                <span className="text-white font-medium">{trendingItems[0]?.category || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Growth Leader</span>
                <div className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-green-400" />
                  <span className="text-green-400 font-medium">
                    {Math.max(...trendingItems.map((i) => i.growth_rate))}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Badge */}
          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Featured</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Get your content featured by creating high-quality profiles that the community loves!
            </p>
            <div className="flex items-center gap-2 text-xs text-orange-300">
              <Flame className="h-3 w-3" />
              <span>Trending algorithm updates daily</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
