import { useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../../lib/supabase"
import { Loader2, MessageSquare, HelpCircle, Monitor, BookOpen, Mail, Users, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import toast from "react-hot-toast"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { notifyAllStaffOfFeedback } from "../../lib/moderationUtils"
import { notifyAllStaffOfNewTicket } from "../../lib/supportTicketUtils"

interface SupportSettingsProps {
  user: SupabaseUser | null
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function SupportSettings({ user, loading, setLoading }: SupportSettingsProps) {
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackType, setFeedbackType] = useState("general")
  const [showSystemInfo, setShowSystemInfo] = useState(false)
  const [showContactSupport, setShowContactSupport] = useState(false)
  const [contactSubject, setContactSubject] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [contactPriority, setContactPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")

  const submitFeedback = async () => {
    if (!feedbackText.trim() || !user) return

    setLoading(true)
    try {
      // Store feedback in a feedback table (if it exists) or send via API
      // For now, we'll use a simple approach - store in localStorage or send to an API endpoint
      const feedbackData = {
        user_id: user.id,
        type: feedbackType,
        message: feedbackText,
        created_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        platform: navigator.platform,
      }

      // Save feedback to database
      const { data: insertedFeedback, error } = await supabase
        .from("feedback")
        .insert({
          user_id: user.id,
          type: feedbackType,
          message: feedbackText,
          user_agent: navigator.userAgent,
          platform: navigator.platform,
        })
        .select()
        .single()

      if (error) {
        console.error("Failed to save feedback:", error)
        throw error
      }

      // Notify all staff members
      if (insertedFeedback) {
        try {
          // Get user profile for username
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("username")
            .eq("user_id", user.id)
            .single()

          await notifyAllStaffOfFeedback(insertedFeedback.id, {
            username: profile?.username,
            type: feedbackType,
            message: feedbackText
          })
        } catch (notifError) {
          console.error("Failed to notify staff of feedback:", notifError)
          // Don't fail the whole operation if notification fails
        }
      }

      toast.success("Thank you for your feedback! We'll review it soon.")
      setFeedbackText("")
      setFeedbackType("general")
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const submitContactSupport = async () => {
    if (!contactSubject.trim() || !contactMessage.trim() || !user) return

    setLoading(true)
    try {
      const { data: insertedFeedback, error } = await supabase
        .from("feedback")
        .insert({
          user_id: user.id,
          type: "support",
          subject: contactSubject,
          message: contactMessage,
          priority: contactPriority,
          user_agent: navigator.userAgent,
          platform: navigator.platform,
        })
        .select()
        .single()

      if (error) {
        console.error("Failed to save support request:", error)
        throw error
      }

      // Notify all staff members about new support ticket
      if (insertedFeedback) {
        try {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("username")
            .eq("user_id", user.id)
            .single()

          await notifyAllStaffOfNewTicket(insertedFeedback.id, {
            ticketNumber: insertedFeedback.ticket_number,
            subject: contactSubject,
            priority: contactPriority,
            username: profile?.username
          })
        } catch (notifError) {
          console.error("Failed to notify staff of support request:", notifError)
        }
      }

      toast.success("Support request submitted! We'll get back to you soon.")
      setContactSubject("")
      setContactMessage("")
      setContactPriority("medium")
      setShowContactSupport(false)
    } catch (error) {
      toast.error("Failed to submit support request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content - Feedback Form */}
      <div className="flex-1 space-y-5">
        {/* Feedback */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            Send Feedback
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Feedback Type</label>
              <select
                value={feedbackType}
                onChange={(e) => {
                  setFeedbackType(e.target.value)
                  if (e.target.value === "support") {
                    setShowContactSupport(true)
                  } else {
                    setShowContactSupport(false)
                  }
                }}
                className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement Suggestion</option>
                <option value="support">Contact Support</option>
              </select>
            </div>

            {showContactSupport || feedbackType === "support" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="What can we help you with?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                  <select
                    value={contactPriority}
                    onChange={(e) => setContactPriority(e.target.value as "low" | "medium" | "high" | "urgent")}
                    className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Standard issue</option>
                    <option value="high">High - Urgent issue</option>
                    <option value="urgent">Urgent - Critical problem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your Message</label>
                  <textarea
                    rows={6}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Describe your issue or question in detail..."
                  />
                </div>
                <button
                  onClick={submitContactSupport}
                  disabled={loading || !contactSubject.trim() || !contactMessage.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium text-white transition-colors"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Mail className="h-5 w-5 text-white" />}
                  Send Support Request
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your Feedback</label>
                  <textarea
                    rows={6}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Tell us what you think or report any issues you've encountered..."
                  />
                </div>
                <button
                  onClick={submitFeedback}
                  disabled={loading || !feedbackText.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium text-white transition-colors"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <MessageSquare className="h-5 w-5 text-white" />}
                  Send Feedback
                </button>
              </>
            )}
          </div>
        </div>

      {/* System Information - Collapsible */}
      <div className="border-t border-slate-700 pt-5">
        <button
          onClick={() => setShowSystemInfo(!showSystemInfo)}
          className="w-full flex items-center justify-between text-left mb-4 hover:opacity-80 transition-opacity"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Monitor className="h-5 w-5 text-slate-400" />
            System Information
          </h3>
          {showSystemInfo ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {showSystemInfo && (
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">App Version</p>
                <p className="font-medium text-white">v1.0.0</p>
              </div>
              <div>
                <p className="text-slate-400">Browser</p>
                <p className="font-medium text-white">
                  {(() => {
                    const ua = navigator.userAgent
                    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome"
                    if (ua.includes("Firefox")) return "Firefox"
                    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari"
                    if (ua.includes("Edg")) return "Edge"
                    return "Unknown"
                  })()}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Platform</p>
                <p className="font-medium text-white">{navigator.platform}</p>
              </div>
              <div>
                <p className="text-slate-400">Screen Resolution</p>
                <p className="font-medium text-white">
                  {window.screen.width}x{window.screen.height}
                </p>
              </div>
              <div>
                <p className="text-slate-400">User Agent</p>
                <p className="font-medium text-xs break-all text-white">{navigator.userAgent.substring(0, 50)}...</p>
              </div>
              <div>
                <p className="text-slate-400">Last Updated</p>
                <p className="font-medium text-white">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Sidebar - Help & Resources */}
      <div className="w-full lg:w-80 lg:sticky lg:top-4 h-fit">
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/30">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <HelpCircle className="h-5 w-5 text-green-400" />
            Help & Resources
          </h3>

          <p className="text-slate-300 mb-4 text-sm">
            Access help articles, join the community, and find answers to common questions.
          </p>

          <div className="space-y-3">
            <Link
              to="/help"
              className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-green-500/50 hover:bg-slate-700/50 transition-colors group"
            >
              <div className="p-2 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 transition-colors">
                <BookOpen className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Help Center</p>
                <p className="text-xs text-slate-400">View documentation and guides</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-green-400 transition-colors" />
            </Link>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                toast("Community Discord coming soon!", { icon: 'ℹ️' })
              }}
              className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-purple-500/50 hover:bg-slate-700/50 transition-colors group"
            >
              <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Community</p>
                <p className="text-xs text-slate-400">Join our Discord server</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
            </a>

            <a
              href="https://github.com/sogki/profiles-after-dark/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-yellow-500/50 hover:bg-slate-700/50 transition-colors group"
            >
              <div className="p-2 bg-yellow-600/20 rounded-lg group-hover:bg-yellow-600/30 transition-colors">
                <HelpCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Report Issues</p>
                <p className="text-xs text-slate-400">Submit bug reports on GitHub</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-yellow-400 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

