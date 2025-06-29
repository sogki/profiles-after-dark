import type React from "react"
import { useState } from "react"
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
} from "lucide-react"

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

const moderationStats = {
  totalReports: 0,
  resolvedReports: 0,
  averageResponseTime: "1 hour",
  accuracyRate: "100.0%",
  activeReports: 1,
  thisWeekReports: 1,
}

export default function ReportContent() {
  const [openFaqs, setOpenFaqs] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [reportForm, setReportForm] = useState({
    category: "",
    description: "",
    evidence: "",
    urgent: false,
  })
  const [showReportForm, setShowReportForm] = useState(false)

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
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <AlertCircle className="w-20 h-20 text-red-400 animate-pulse" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl font-bold text-white mb-6"
            >
              Report Content
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-slate-300 max-w-3xl mx-auto mb-8"
            >
              Help us maintain a safe and welcoming community by reporting content or behavior that violates our
              guidelines. Your reports help protect all users and improve the platform experience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => setShowReportForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
              >
                Submit a Report
              </button>
              <a
                href="#guidelines"
                className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 border border-slate-600 hover:border-slate-500"
              >
                View Guidelines
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Moderation Stats */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              Community Safety Statistics
            </h2>
            <p className="text-slate-400">Our commitment to maintaining a safe platform</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {moderationStats.totalReports.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Total Reports</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {moderationStats.resolvedReports.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">{moderationStats.activeReports}</div>
              <div className="text-sm text-slate-400">Active Reports</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">{moderationStats.averageResponseTime}</div>
              <div className="text-sm text-slate-400">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">{moderationStats.accuracyRate}</div>
              <div className="text-sm text-slate-400">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-1">{moderationStats.thisWeekReports}</div>
              <div className="text-sm text-slate-400">This Week</div>
            </div>
          </div>
        </motion.div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        {/* Main Content */}
        <section className="flex-1">
          {/* Report Categories */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <Flag className="w-8 h-8 text-red-400" />
              Report Categories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reportCategories.map((category, idx) => {
                const IconComponent = category.icon
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 ${getSeverityColor(category.severity)} p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105`}
                    onClick={() => setSelectedCategory(selectedCategory === category.title ? null : category.title)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${getSeverityColor(category.severity)}`}>
                        <IconComponent className={`w-6 h-6 ${getSeverityTextColor(category.severity)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-white">{category.title}</h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getSeverityTextColor(category.severity)} bg-slate-700`}
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
          <div className="mb-12" id="guidelines">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <HelpCircle className="w-8 h-8 text-blue-400" />
              How to Report
            </h2>
            <div className="space-y-6">
              {reportItems.map(({ title, description }, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:shadow-2xl transition-all duration-300 hover:border-slate-600"
                >
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    {title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed pl-10">{description}</p>
                </motion.div>
              ))}
            </div>
          </div>

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
        </section>

        {/* Sidebar */}
        <aside className="w-full lg:w-96">
          {/* FAQ Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 sticky top-8">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-green-400" />
              Frequently Asked Questions
            </h2>

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
                  onClick={() => setShowReportForm(true)}
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
      </main>

      {/* Report Form Modal */}
      <AnimatePresence>
        {showReportForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowReportForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <Flag className="w-8 h-8 text-red-400" />
                <h2 className="text-2xl font-bold text-white">Submit a Report</h2>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Report Category *</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a category...</option>
                    {reportCategories.map((cat) => (
                      <option key={cat.title} value={cat.title}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Evidence (URLs, Screenshots, etc.)
                  </label>
                  <textarea
                    value={reportForm.evidence}
                    onChange={(e) => setReportForm({ ...reportForm, evidence: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Provide any additional evidence or context..."
                  />
                </div>

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

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}