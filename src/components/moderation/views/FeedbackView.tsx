import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { MessageSquare, CheckCircle, XCircle, Clock, User, Filter, Search, Trash2, Eye, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

type Feedback = {
  id: string
  user_id: string | null
  type: 'general' | 'bug' | 'feature' | 'improvement'
  message: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  response: string | null
  user_agent: string | null
  platform: string | null
  created_at: string
  updated_at: string
  user_profiles?: {
    username: string | null
    display_name: string | null
  } | null
}

export default function FeedbackView() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all')
  const [filterType, setFilterType] = useState<'all' | 'general' | 'bug' | 'feature' | 'improvement'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadFeedback()
    setCurrentPage(1) // Reset to first page when filters change
  }, [filterStatus, filterType])

  const loadFeedback = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      if (filterType !== 'all') {
        query = query.eq('type', filterType)
      }

      const { data, error } = await query

      if (error) throw error

      // Fetch user profiles for feedback items that have user_id
      const userIds = (data || []).filter(f => f.user_id).map(f => f.user_id)
      let userProfilesMap: Record<string, { username: string | null; display_name: string | null }> = {}

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds)

        if (profiles) {
          profiles.forEach(profile => {
            userProfilesMap[profile.user_id] = {
              username: profile.username,
              display_name: profile.display_name
            }
          })
        }
      }

      // Combine feedback with user profiles
      const feedbackWithUsers = (data || []).map(item => ({
        ...item,
        user_profiles: item.user_id ? userProfilesMap[item.user_id] || null : null
      }))

      setFeedback(feedbackWithUsers)
    } catch (error: any) {
      console.error('Error loading feedback:', error)
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const updateFeedbackStatus = async (id: string, status: Feedback['status'], response?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get the feedback item to find the user_id
      const feedbackItem = feedback.find(f => f.id === id)
      if (!feedbackItem) {
        toast.error('Feedback not found')
        return
      }

      const responseText = response || customMessage || null
      
      const { error } = await supabase
        .from('feedback')
        .update({
          status,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
          response: responseText,
        })
        .eq('id', id)

      if (error) throw error

      // Send notification to the user who submitted the feedback (if they have a user_id)
      if (feedbackItem.user_id && (status === 'reviewed' || status === 'resolved')) {
        try {
          const statusMessage = status === 'resolved' ? 'resolved' : 'reviewed'
          const notificationMessage = responseText 
            ? `Your feedback has been ${statusMessage}. Staff response: ${responseText}`
            : `Your feedback has been ${statusMessage} by our team.`

          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: feedbackItem.user_id,
              content: `Feedback ${status === 'resolved' ? 'Resolved' : 'Reviewed'}: ${notificationMessage}`,
              type: 'info',
              read: false,
              priority: 'medium',
              action_url: '/settings?tab=support'
            })

          if (notifError) {
            console.error('Error creating notification:', notifError)
            // Don't fail the whole operation if notification fails
          }
        } catch (notifErr) {
          console.error('Error sending notification:', notifErr)
          // Don't fail the whole operation if notification fails
        }
      }

      toast.success(`Feedback marked as ${status}${responseText ? ' with response' : ''}`)
      setCustomMessage('')
      loadFeedback()
      setSelectedFeedback(null)
    } catch (error: any) {
      console.error('Error updating feedback:', error)
      toast.error('Failed to update feedback')
    }
  }

  const deleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Feedback deleted')
      loadFeedback()
      setSelectedFeedback(null)
    } catch (error: any) {
      console.error('Error deleting feedback:', error)
      toast.error('Failed to delete feedback')
    }
  }

  const getStatusColor = (status: Feedback['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'reviewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'dismissed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getTypeColor = (type: Feedback['type']) => {
    switch (type) {
      case 'bug': return 'bg-red-500/20 text-red-400'
      case 'feature': return 'bg-purple-500/20 text-purple-400'
      case 'improvement': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const filteredFeedback = feedback.filter((item) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.message.toLowerCase().includes(query) ||
        item.user_profiles?.username?.toLowerCase().includes(query) ||
        item.user_profiles?.display_name?.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-purple-400" />
            User Feedback
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Review and manage user feedback submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Status:</span>
            <div className="flex gap-2">
              {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Type:</span>
            <div className="flex gap-2">
              {(['all', 'general', 'bug', 'feature', 'improvement'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No feedback found</h3>
          <p className="text-slate-400">No feedback matches your current filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedFeedback.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 hover:border-purple-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedFeedback(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                    {item.user_profiles && (
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <User className="w-3 h-3" />
                        <span>{item.user_profiles.display_name || item.user_profiles.username || 'Unknown User'}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-white text-sm line-clamp-2">{item.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFeedback(item)
                    }}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredFeedback.length)} of {filteredFeedback.length} feedback items
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Feedback Details</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(selectedFeedback.type)}`}>
                    {selectedFeedback.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFeedback(null)
                  setCustomMessage('')
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400">User</label>
                <p className="text-white">
                  {selectedFeedback.user_profiles?.display_name || selectedFeedback.user_profiles?.username || 'Anonymous'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">Message</label>
                <p className="text-white bg-slate-700/50 p-3 rounded-lg mt-1 whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">Submitted</label>
                  <p className="text-white text-sm">{formatDate(selectedFeedback.created_at)}</p>
                </div>
                {selectedFeedback.reviewed_at && (
                  <div>
                    <label className="text-sm font-medium text-slate-400">Reviewed</label>
                    <p className="text-white text-sm">{formatDate(selectedFeedback.reviewed_at)}</p>
                  </div>
                )}
              </div>

              {selectedFeedback.response && (
                <div>
                  <label className="text-sm font-medium text-slate-400">Previous Response</label>
                  <p className="text-white bg-slate-700/50 p-3 rounded-lg mt-1 whitespace-pre-wrap">
                    {selectedFeedback.response}
                  </p>
                </div>
              )}

              {/* Custom Message Input */}
              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">
                  Custom Message to User (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a custom message that will be sent to the user along with the notification..."
                  rows={4}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This message will be included in the notification sent to the user when you update the feedback status.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
                {selectedFeedback.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'reviewed', customMessage)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'resolved', customMessage)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Resolved
                    </button>
                    <button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'dismissed', customMessage)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                )}
                {selectedFeedback.status === 'reviewed' && (
                  <>
                    <button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'resolved', customMessage)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Resolved
                    </button>
                    <button
                      onClick={() => updateFeedbackStatus(selectedFeedback.id, 'pending', customMessage)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Reopen
                    </button>
                  </>
                )}
                {(selectedFeedback.status === 'resolved' || selectedFeedback.status === 'dismissed') && (
                  <button
                    onClick={() => {
                      setCustomMessage('')
                      updateFeedbackStatus(selectedFeedback.id, 'pending', '')
                    }}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => deleteFeedback(selectedFeedback.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

