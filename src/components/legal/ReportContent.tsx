import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  Shield,
  Phone,
  Mail,
  MessageSquare,
  Flag,
  AlertTriangle,
  HelpCircle,
  FileText,
  Eye,
  Lock,
  BarChart3,
  Search,
  Image as ImageIcon,
  User,
} from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../../context/authContext"
import { useNavigate } from "react-router-dom"
import Footer from "../Footer"

const reportCategories = [
  {
    title: "Inappropriate Content",
    description: "Content that violates community guidelines including NSFW material, violence, or disturbing imagery",
    severity: "high",
    icon: AlertTriangle,
    examples: ["Adult content", "Graphic violence", "Disturbing imagery", "Inappropriate language"],
  },
  {
    title: "Harassment & Bullying",
    description: "Targeted harassment, bullying, threats, or abusive behavior towards other users",
    severity: "critical",
    icon: Shield,
    examples: ["Personal attacks", "Threats", "Doxxing", "Cyberbullying"],
  },
  {
    title: "Spam & Scams",
    description: "Unwanted promotional content, scams, phishing attempts, or repetitive posts",
    severity: "medium",
    icon: Flag,
    examples: ["Promotional spam", "Phishing links", "Fake giveaways", "Repetitive content"],
  },
  {
    title: "Copyright Violation",
    description: "Unauthorized use of copyrighted material, stolen artwork, or intellectual property theft",
    severity: "high",
    icon: FileText,
    examples: ["Stolen artwork", "Copyrighted images", "Trademark infringement", "Unauthorized use"],
  },
  {
    title: "Hate Speech",
    description: "Content promoting hatred, discrimination, or violence against individuals or groups",
    severity: "critical",
    icon: AlertCircle,
    examples: ["Discriminatory language", "Hate symbols", "Incitement to violence", "Prejudiced content"],
  },
  {
    title: "Privacy Violation",
    description: "Sharing personal information without consent or violating user privacy",
    severity: "high",
    icon: Lock,
    examples: ["Personal information sharing", "Private messages", "Unauthorized photos", "Doxxing"],
  },
]

const reportItems = [
  {
    title: "What can I report?",
    description:
      "You can report any content or behavior that violates our community guidelines or terms of service, including harassment, hate speech, spam, illegal content, or inappropriate material.",
  },
  {
    title: "How to report content?",
    description:
      "Most content has a report button or link. Click it, select the reason for reporting, and submit. You can also contact support if the report button is not available.",
  },
  {
    title: "What happens after I report?",
    description:
      "Reports are reviewed by our moderation team promptly. Depending on severity, content may be removed and the user may face warnings or suspension.",
  },
  {
    title: "Can I report anonymously?",
    description: "Yes, reports are confidential. Your identity is not shared with the person or content you report.",
  },
  {
    title: "What types of evidence should I provide?",
    description:
      "Include screenshots, URLs, or detailed descriptions to help moderators understand and act on the report effectively.",
  },
  {
    title: "How long does it take to resolve a report?",
    description:
      "We strive to review reports as quickly as possible, usually within 24-72 hours, but complex cases may take longer.",
  },
]

const faqs = [
  {
    question: "Who reviews the reports?",
    answer:
      "Our dedicated moderation team, trained to handle reports fairly and confidentially, reviews all submissions.",
  },
  {
    question: "Is reporting content the same as blocking a user?",
    answer:
      "No. Reporting alerts moderators about violations, while blocking prevents you from seeing or interacting with that user.",
  },
  {
    question: "Can I track the status of my report?",
    answer: "Currently, you cannot track reports individually, but we notify you if action is taken when appropriate.",
  },
  {
    question: "Are all reports investigated?",
    answer: "Yes, every report is reviewed, but not all result in action if the content complies with guidelines.",
  },
  {
    question: "Can I report content posted by minors?",
    answer: "Yes, protecting minors is a priority. Please report any concerning content involving minors immediately.",
  },
  {
    question: "What if I disagree with a moderation decision?",
    answer: "You can appeal moderation decisions by contacting our support team with additional context or evidence.",
  },
  {
    question: "How do you prevent false reports?",
    answer:
      "We have systems in place to detect patterns of abuse and may take action against users who consistently file false reports.",
  },
  {
    question: "Can I report content from other platforms?",
    answer:
      "We can only take action on content within our platform. For external content, please report to the relevant platform.",
  },
]

export default function ReportContent() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [openFaqs, setOpenFaqs] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [moderationStats, setModerationStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    averageResponseTime: "0 hours",
    accuracyRate: "0%",
    activeReports: 0,
    thisWeekReports: 0,
    loading: true,
  })

  // Fetch real stats from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const [
          { count: totalReports },
          { count: resolvedReports },
          { count: pendingReports },
          { data: recentReports },
          { data: resolvedReportsData },
        ] = await Promise.all([
          supabase.from('reports').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
          supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('reports').select('created_at').gte('created_at', weekAgo.toISOString()),
          supabase.from('reports').select('created_at, handled_at, updated_at').eq('status', 'resolved'),
        ])

        const thisWeekReports = recentReports?.length || 0
        const total = totalReports || 0
        const resolved = resolvedReports || 0
        const active = pendingReports || 0

        // Calculate average response time using handled_at or updated_at when status is resolved
        let avgResponseTime = 0
        if (resolvedReportsData && resolvedReportsData.length > 0) {
          const responseTimes = resolvedReportsData
            .filter(r => r.created_at && (r.handled_at || r.updated_at))
            .map(r => {
              const created = new Date(r.created_at).getTime()
              const resolved = new Date(r.handled_at || r.updated_at).getTime()
              return (resolved - created) / (1000 * 60 * 60) // Convert to hours
            })
          if (responseTimes.length > 0) {
            avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          }
        }

        // Calculate accuracy rate (resolved / total * 100)
        const accuracyRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0"

        setModerationStats({
          totalReports: total,
          resolvedReports: resolved,
          averageResponseTime: avgResponseTime > 0 ? `${avgResponseTime.toFixed(1)} hours` : "N/A",
          accuracyRate: `${accuracyRate}%`,
          activeReports: active,
          thisWeekReports: thisWeekReports,
          loading: false,
        })
      } catch (error) {
        console.error('Error fetching moderation stats:', error)
        setModerationStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  const toggleFaq = (index: number) => {
    if (openFaqs.includes(index)) {
      setOpenFaqs(openFaqs.filter((i) => i !== index))
    } else {
      setOpenFaqs([...openFaqs, index])
    }
  }

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle report submission
    console.log("Report submitted:", reportForm)
    setShowReportForm(false)
    setReportForm({ category: "", description: "", evidence: "", urgent: false })
  }

  const searchContent = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const searchTerm = `%${query}%`
      const results: any[] = []

      // Search profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, title, image_url, user_id, type")
        .eq("status", "approved")
        .ilike("title", searchTerm)
        .limit(5)

      if (profiles) {
        profiles.forEach(p => {
          results.push({
            id: p.id,
            title: p.title,
            type: "profile",
            contentType: p.type === "banner" ? "banner" : "profile",
            imageUrl: p.image_url,
            userId: p.user_id
          })
        })
      }

      // Search profile pairs
      const { data: pairs } = await supabase
        .from("profile_pairs")
        .select("id, title, banner_url, pfp_url, user_id")
        .eq("status", "approved")
        .ilike("title", searchTerm)
        .limit(5)

      if (pairs) {
        pairs.forEach(p => {
          results.push({
            id: p.id,
            title: p.title,
            type: "profile_pair",
            contentType: "profile_pair",
            imageUrl: p.banner_url || p.pfp_url,
            userId: p.user_id
          })
        })
      }

      // Search emotes
      const { data: emotes } = await supabase
        .from("emotes")
        .select("id, title, image_url, user_id")
        .eq("status", "approved")
        .ilike("title", searchTerm)
        .limit(5)

      if (emotes) {
        emotes.forEach(e => {
          results.push({
            id: e.id,
            title: e.title,
            type: "emote",
            contentType: "emote",
            imageUrl: e.image_url,
            userId: e.user_id
          })
        })
      }

      // Search wallpapers
      const { data: wallpapers } = await supabase
        .from("wallpapers")
        .select("id, title, image_url, user_id")
        .eq("status", "approved")
        .ilike("title", searchTerm)
        .limit(5)

      if (wallpapers) {
        wallpapers.forEach(w => {
          results.push({
            id: w.id,
            title: w.title,
            type: "wallpaper",
            contentType: "wallpaper",
            imageUrl: w.image_url,
            userId: w.user_id
          })
        })
      }

      // Search emoji combos
      const { data: combos } = await supabase
        .from("emoji_combos")
        .select("id, name, user_id")
        .eq("status", "approved")
        .ilike("name", searchTerm)
        .limit(5)

      if (combos) {
        combos.forEach(c => {
          results.push({
            id: c.id,
            title: c.name,
            type: "emoji_combo",
            contentType: "emoji_combo",
            imageUrl: null,
            userId: c.user_id
          })
        })
      }

      setSearchResults(results)
    } catch (error) {
      console.error("Error searching content:", error)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchContent(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleReportContent = (content: any) => {
    if (!user) {
      alert("Please log in to report content")
      return
    }

    navigate('/report-form', {
      state: {
        contentId: content.id,
        contentType: content.contentType,
        contentUrl: content.imageUrl,
        reportedUserId: content.userId,
        reportedUsername: content.username
      }
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-500/10"
      case "high":
        return "border-orange-500 bg-orange-500/10"
      case "medium":
        return "border-yellow-500 bg-yellow-500/10"
      default:
        return "border-blue-500 bg-blue-500/10"
    }
  }

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-400"
      case "high":
        return "text-orange-400"
      case "medium":
        return "text-yellow-400"
      default:
        return "text-blue-400"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/20 rounded-xl">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Report Content</h1>
              <p className="text-slate-400">Help us maintain a safe and welcoming community</p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Search for Content to Report</h2>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 z-10 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for content to report..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
          
          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <div className="mt-4 bg-slate-700/30 rounded-xl border border-slate-600/50 max-h-96 overflow-y-auto">
              {searching ? (
                <div className="p-8 text-center text-slate-400">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="p-2">
                  <div className="text-xs text-slate-400 px-3 py-2 uppercase tracking-wider font-semibold">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleReportContent(result)}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-600/50 transition-colors flex items-center gap-3 group"
                    >
                      {result.imageUrl ? (
                        <img
                          src={result.imageUrl}
                          alt={result.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{result.title}</div>
                        <div className="text-xs text-slate-400 capitalize">{result.type.replace('_', ' ')}</div>
                      </div>
                      <Flag className="h-4 w-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">No content found matching "{searchQuery}"</div>
              )}
            </div>
          )}
          
          <button
            onClick={() => navigate('/report-form')}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/25"
          >
            Submit a General Report
          </button>
        </div>

        {/* Moderation Stats */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Community Safety Statistics</h2>
              <p className="text-sm text-slate-400">Our commitment to maintaining a safe platform</p>
            </div>
          </div>

          {moderationStats.loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Loading statistics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {moderationStats.totalReports.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Total Reports</div>
              </div>
              <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {moderationStats.resolvedReports.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Resolved</div>
              </div>
              <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4">
                <div className="text-2xl font-bold text-orange-400 mb-1">{moderationStats.activeReports}</div>
                <div className="text-xs text-slate-400">Active</div>
              </div>
              <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4">
                <div className="text-2xl font-bold text-purple-400 mb-1">{moderationStats.averageResponseTime}</div>
                <div className="text-xs text-slate-400">Avg Response</div>
              </div>
              <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4">
                <div className="text-2xl font-bold text-cyan-400 mb-1">{moderationStats.accuracyRate}</div>
                <div className="text-xs text-slate-400">Accuracy</div>
              </div>
              <div className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4">
                <div className="text-2xl font-bold text-yellow-400 mb-1">{moderationStats.thisWeekReports}</div>
                <div className="text-xs text-slate-400">This Week</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <section className="lg:col-span-2 space-y-6">
            {/* Report Categories */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Flag className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-semibold text-white">Report Categories</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportCategories.map((category, idx) => {
                  const IconComponent = category.icon
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className={`bg-slate-700/30 rounded-xl border ${getSeverityColor(category.severity)} p-5 hover:shadow-xl transition-all duration-300 cursor-pointer`}
                      onClick={() => setSelectedCategory(selectedCategory === category.title ? null : category.title)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(category.severity)}`}>
                          <IconComponent className={`w-5 h-5 ${getSeverityTextColor(category.severity)}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getSeverityTextColor(category.severity)} bg-slate-700/50`}
                            >
                              {category.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed mb-3">{category.description}</p>

                        <AnimatePresence>
                          {selectedCategory === category.title && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-slate-600 pt-3 mt-3">
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">Examples include:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {category.examples.map((example, exIdx) => (
                                    <span key={exIdx} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">
                                      {example}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Reporting Process */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl p-6" id="guidelines">
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">How to Report</h2>
              </div>
              <div className="space-y-4">
                {reportItems.map(({ title, description }, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-700/30 rounded-xl border border-slate-600/50 p-4 hover:border-slate-500/50 transition-all duration-300"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-3">
                      <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {idx + 1}
                      </div>
                      {title}
                    </h3>
                    <p className="text-slate-300 leading-relaxed pl-10 text-sm">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          {/* <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-red-900/50 to-orange-900/50 backdrop-blur-sm rounded-2xl border border-red-500/30 p-8 mb-12"
    >
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Emergency Situations</h2>
        <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
          If you encounter content involving immediate threats, self-harm, or illegal activities, please contact
          us immediately through these priority channels:
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:emergency@platform.com"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 justify-center"
          >
            <Mail className="w-5 h-5" />
            Emergency Email
          </a>
          <a
            href="tel:+1-800-EMERGENCY"
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 justify-center"
          >
            <Phone className="w-5 h-5" />
            Emergency Hotline
          </a>
        </div>
      </div>
    </motion.div> */}

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* FAQ Section */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                <MessageSquare className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>
              </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {faqs.map(({ question, answer }, idx) => {
                const isOpen = openFaqs.includes(idx)
                return (
                  <div key={idx} className="border-b border-slate-700 last:border-b-0">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center text-left py-3 font-semibold text-white hover:text-blue-400 transition-colors focus:outline-none group"
                      aria-expanded={isOpen}
                      aria-controls={`faq-content-${idx}`}
                    >
                      <span className="text-sm pr-2">{question}</span>
                      <motion.svg
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-5 h-5 ml-2 text-slate-400 group-hover:text-blue-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`faq-content-${idx}`}
                          key="content"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pb-3 text-slate-300 text-sm leading-relaxed">{answer}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/report-form')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
                >
                  <Flag className="w-4 h-4" />
                  Submit Report
                </button>
                <a
                  href="/guidelines"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
                >
                  <FileText className="w-4 h-4" />
                  Community Guidelines
                </a>
                {/* <a
      href="/contact"
      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
    >
      <MessageSquare className="w-4 h-4" />
      Contact Support
    </a> */}
              </div>
            </div>
          </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  )
}