import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, Shield, Flag, AlertTriangle, FileText, Lock, Eye, X, Loader2 } from "lucide-react"
import { supabase } from "../../../lib/supabase"
import toast from "react-hot-toast"

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

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportedUserId?: string
  reportedUsername?: string
  contentId?: string
  contentType?: "profile" | "banner" | "comment" | "message"
  reporterUserId: string
  onReportSubmitted?: () => void
}

interface ReportForm {
  category: string
  description: string
  evidence: string
  urgent: boolean
}

export default function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUsername,
  contentId,
  contentType,
  reporterUserId,
  onReportSubmitted,
}: ReportModalProps) {
  const [reportForm, setReportForm] = useState<ReportForm>({
    category: "",
    description: "",
    evidence: "",
    urgent: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reportForm.category || !reportForm.description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    // Check authentication before proceeding
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      toast.error("You must be logged in to submit reports")
      console.error("Authentication error:", authError)
      return
    }

    // Ensure we have either a reported user or content to report
    if (!reportedUserId && !contentId) {
      toast.error("No target specified for report")
      return
    }

    setIsSubmitting(true)

    try {
      // Build the report data object with all required fields
      const reportData: any = {
        reporter_user_id: user.id, // Use the authenticated user's ID
        reason: reportForm.category, // This is the required field that was missing!
        description: reportForm.description, // Add description if the column exists
        urgent: reportForm.urgent,
        created_at: new Date().toISOString(),
      }

      // Add reported_user_id only if we have one (it can be null for content reports)
      if (reportedUserId) {
        reportData.reported_user_id = reportedUserId
      }

      // Add content info if we have it
      if (contentId) {
        reportData.content_id = contentId
      }
      if (contentType) {
        reportData.content_type = contentType
      }

      // Add evidence if we have it
      if (reportForm.evidence) {
        reportData.evidence = reportForm.evidence
      }

      console.log("Submitting report:", reportData)

      const { data: reportRecord, error: reportError } = await supabase
        .from("reports")
        .insert([reportData])
        .select()
        .single()

      if (reportError) {
        console.error("Failed to create report:", reportError)

        // Provide specific error messages
        if (reportError.code === "42501") {
          toast.error("Permission denied. Please try logging out and back in.")
        } else if (reportError.code === "23502") {
          // NOT NULL constraint violation
          const missingField = reportError.message.match(/column "([^"]+)"/)?.[1] || "unknown field"
          toast.error(`Missing required field: ${missingField}`)
        } else {
          toast.error(`Failed to submit report: ${reportError.message}`)
        }
        return
      }

      console.log("Report created successfully:", reportRecord)

      // Try to log the report submission in moderation logs (if the table exists)
      try {
        const logData = {
          moderator_id: user.id,
          action: "submit report",
          target_user_id: reportedUserId || "system",
          target_profile_id: contentId || null,
          description: `User reported ${reportedUsername || "content"} for: ${reportForm.category} - ${reportForm.description}`,
          created_at: new Date().toISOString(),
        }

        const { error: logError } = await supabase.from("moderation_logs").insert([logData])

        if (logError) {
          console.warn("Failed to log report submission:", logError)
          // Don't fail the entire operation for logging issues
        }
      } catch (logError) {
        console.warn("Moderation logs table may not exist:", logError)
      }

      toast.success("Report submitted successfully")

      // Reset form
      setReportForm({
        category: "",
        description: "",
        evidence: "",
        urgent: false,
      })
      setSelectedCategory(null)

      // Notify parent component
      onReportSubmitted?.()

      // Close modal
      onClose()
    } catch (error) {
      console.error("Failed to submit report:", error)
      toast.error("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return

    setReportForm({
      category: "",
      description: "",
      evidence: "",
      urgent: false,
    })
    setSelectedCategory(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Flag className="w-8 h-8 text-red-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Submit a Report</h2>
                  {reportedUsername && <p className="text-slate-400">Reporting: @{reportedUsername}</p>}
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Categories */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-4">Report Category *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportCategories.map((category, idx) => {
                    const IconComponent = category.icon
                    const isSelected = reportForm.category === category.title

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className={`bg-slate-700/50 backdrop-blur-sm rounded-xl border-2 ${
                          isSelected
                            ? getSeverityColor(category.severity) + " ring-2 ring-blue-500/50"
                            : "border-slate-600 hover:border-slate-500"
                        } p-4 cursor-pointer transition-all duration-300 ${
                          isSelected ? "transform scale-105" : "hover:scale-102"
                        }`}
                        onClick={() => {
                          setReportForm({ ...reportForm, category: category.title })
                          setSelectedCategory(selectedCategory === category.title ? null : category.title)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getSeverityColor(category.severity)}`}>
                            <IconComponent className={`w-5 h-5 ${getSeverityTextColor(category.severity)}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getSeverityTextColor(
                                  category.severity,
                                )} bg-slate-700`}
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
                                        <span
                                          key={exIdx}
                                          className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs"
                                        >
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Please provide details about what you're reporting..."
                  required
                />
              </div>

              {/* Evidence */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Evidence (URLs, Screenshots, etc.)
                </label>
                <textarea
                  value={reportForm.evidence}
                  onChange={(e) => setReportForm({ ...reportForm, evidence: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Provide any additional evidence or context..."
                />
              </div>

              {/* Urgent checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={reportForm.urgent}
                  onChange={(e) => setReportForm({ ...reportForm, urgent: e.target.checked })}
                  className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                />
                <label htmlFor="urgent" className="text-sm text-slate-300">
                  This is an urgent safety concern
                </label>
              </div>

              {/* Privacy Notice */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white mb-1">Privacy Notice</h4>
                    <p className="text-sm text-slate-300">
                      Your report will be reviewed confidentially by our moderation team. Your identity will not be
                      shared with the reported user.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reportForm.category || !reportForm.description.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
