import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { Ticket, CheckCircle, XCircle, Clock, User, Filter, Search, Trash2, Eye, ChevronLeft, ChevronRight, Send, AlertCircle, UserCheck, Lock, Unlock, ArrowRight, MessageSquare, MoreVertical, X, Copy, Archive, Zap, RotateCcw, Mail, Calendar, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../../context/authContext'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { notifyUserOfTicketUpdate, sendTicketEmailNotification } from '../../../lib/supportTicketUtils'

type SupportTicket = {
  id: string
  user_id: string | null
  type: 'support'
  subject: string | null
  message: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  ticket_number: string | null
  assigned_to: string | null
  owner_id: string | null
  is_locked: boolean
  locked_at: string | null
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
  owner_profile?: {
    username: string | null
    display_name: string | null
  } | null
}

type ConversationMessage = {
  id: string
  ticket_id: string
  user_id: string | null
  message: string
  is_staff: boolean
  created_at: string
  user_profiles?: {
    username: string | null
    display_name: string | null
  } | null
}

export default function SupportTicketsView() {
  const { user, userProfile } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')
  const [filterAssigned, setFilterAssigned] = useState<'all' | 'me' | 'unassigned'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [conversations, setConversations] = useState<ConversationMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [staffMembers, setStaffMembers] = useState<Array<{ id: string; username: string | null; display_name: string | null; role: string | null }>>([])
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferTo, setTransferTo] = useState<string>('')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; ticket: SupportTicket } | null>(null)
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)
  const [sendEmail, setSendEmail] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const itemsPerPage = 10

  const isAdmin = userProfile?.role === 'admin'
  const isStaff = userProfile?.role && ['admin', 'moderator', 'staff'].includes(userProfile.role)

  useEffect(() => {
    loadStaffMembers()
    loadTickets()
    setCurrentPage(1)
  }, [filterStatus, filterPriority, filterAssigned])

  useEffect(() => {
    if (selectedTicket) {
      loadConversations(selectedTicket.id)
      requestAnimationFrame(() => {
        setTimeout(() => {
          const messagesContainer = document.getElementById('messages-container')
          if (messagesContainer) {
            messagesContainer.scrollTop = 0
          }
        }, 100)
      })
      
      const channel = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_conversations',
          filter: `ticket_id=eq.${selectedTicket.id}`
        }, () => {
          loadConversations(selectedTicket.id)
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'feedback',
          filter: `id=eq.${selectedTicket.id}`
        }, () => {
          loadTickets()
          loadConversations(selectedTicket.id)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedTicket])

  useEffect(() => {
    if (messagesEndRef.current && selectedTicket && conversations.length > 0) {
      const messagesContainer = document.getElementById('messages-container')
      if (messagesContainer) {
        const scrollBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight
        const isNearBottom = scrollBottom < 150
        
        if (isNearBottom) {
          setTimeout(() => {
            if (messagesContainer && messagesEndRef.current) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight
            }
          }, 100)
        }
      }
    }
  }, [conversations, selectedTicket])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }

    const handleScroll = () => {
      setContextMenu(null)
    }

    const handleResize = () => {
      setContextMenu(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const loadStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, role')
        .in('role', ['admin', 'moderator', 'staff'])

      if (error) throw error
      setStaffMembers(data || [])
    } catch (error) {
      console.error('Error loading staff members:', error)
    }
  }

  const loadTickets = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .eq('type', 'support')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority)
      }

      if (filterAssigned === 'me') {
        query = query.eq('owner_id', user?.id)
      } else if (filterAssigned === 'unassigned') {
        query = query.is('owner_id', null)
      }

      if (searchQuery.trim()) {
        query = query.or(`subject.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%,ticket_number.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Fetch user profiles separately
      const userIds = new Set<string>()
      if (data) {
        data.forEach(ticket => {
          if (ticket.user_id) userIds.add(ticket.user_id)
          if (ticket.owner_id) userIds.add(ticket.owner_id)
        })
      }

      let userProfilesMap: Record<string, { username: string | null; display_name: string | null }> = {}
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name')
          .in('user_id', Array.from(userIds))

        if (profiles) {
          profiles.forEach(profile => {
            userProfilesMap[profile.user_id] = {
              username: profile.username,
              display_name: profile.display_name
            }
          })
        }
      }

      // Combine tickets with user profiles
      const ticketsWithUsers = (data || []).map(ticket => ({
        ...ticket,
        user_profiles: ticket.user_id ? userProfilesMap[ticket.user_id] || null : null,
        owner_profile: ticket.owner_id ? userProfilesMap[ticket.owner_id] || null : null
      }))

      setTickets(ticketsWithUsers)
    } catch (error) {
      console.error('Error loading tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async (ticketId: string) => {
    setLoadingConversations(true)
    try {
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('ticket_conversations')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (conversationsError) throw conversationsError

      // Fetch user profiles separately
      const userIds = new Set<string>()
      if (conversationsData) {
        conversationsData.forEach(msg => {
          if (msg.user_id) userIds.add(msg.user_id)
        })
      }

      let userProfilesMap: Record<string, { username: string | null; display_name: string | null }> = {}
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name')
          .in('user_id', Array.from(userIds))

        if (profiles) {
          profiles.forEach(profile => {
            userProfilesMap[profile.user_id] = {
              username: profile.username,
              display_name: profile.display_name
            }
          })
        }
      }

      // Combine conversations with user profiles
      const conversationsWithUsers = (conversationsData || []).map(msg => ({
        ...msg,
        user_profiles: msg.user_id ? userProfilesMap[msg.user_id] || null : null
      }))

      const { data: ticketData, error: ticketError } = await supabase
        .from('feedback')
        .select('message, created_at, user_id')
        .eq('id', ticketId)
        .single()

      if (ticketError) throw ticketError

      const allMessages: ConversationMessage[] = []

      if (ticketData) {
        allMessages.push({
          id: `initial-${ticketId}`,
          ticket_id: ticketId,
          user_id: ticketData.user_id,
          message: ticketData.message,
          is_staff: false,
          created_at: ticketData.created_at,
          user_profiles: selectedTicket?.user_profiles || null
        })
      }

      if (conversationsWithUsers) {
        allMessages.push(...conversationsWithUsers)
      }

      setConversations(allMessages)
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversation')
    } finally {
      setLoadingConversations(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !user?.id) return

    const canRespond = isAdmin || selectedTicket.owner_id === user.id || (!selectedTicket.is_locked && userProfile?.role && ['admin', 'moderator', 'staff'].includes(userProfile.role))

    if (!canRespond) {
      toast.error('This ticket is locked to another staff member')
      return
    }

    try {
      const { error } = await supabase
        .from('ticket_conversations')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: newMessage.trim(),
          is_staff: true
        })

      if (error) throw error

      await loadConversations(selectedTicket.id)
      await loadTickets()

      if (selectedTicket.user_id) {
        try {
          await notifyUserOfTicketUpdate(
            selectedTicket.user_id,
            selectedTicket.id,
            selectedTicket.ticket_number,
            'reply',
            userProfile?.display_name || userProfile?.username || 'Staff'
          )

          if (sendEmail && selectedTicket.user_id) {
            const { data: userData } = await supabase.auth.admin.getUserById(selectedTicket.user_id)
            if (userData?.user?.email) {
              await sendTicketEmailNotification(
                userData.user.email,
                selectedTicket.ticket_number,
                selectedTicket.id,
                newMessage.trim(),
                userProfile?.display_name || userProfile?.username || 'Staff'
              )
            }
          }
        } catch (notifError) {
          console.error('Error sending notifications:', notifError)
        }
      }

      setNewMessage('')
      toast.success('Message sent' + (sendEmail ? ' and email notification sent' : ''))
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const transferTicket = async (ticketId?: string, targetUserId?: string) => {
    const ticket = ticketId ? tickets.find(t => t.id === ticketId) : selectedTicket
    const targetId = targetUserId || transferTo

    if (!ticket || !targetId || !user?.id) return

    try {
      const { error } = await supabase
        .from('feedback')
        .update({ owner_id: targetId })
        .eq('id', ticket.id)

      if (error) throw error

      const targetStaff = staffMembers.find(s => s.id === targetId)
      const staffName = targetStaff?.display_name || targetStaff?.username || 'Staff'

      await supabase
        .from('ticket_conversations')
        .insert({
          ticket_id: ticket.id,
          user_id: user.id,
          message: `Ticket transferred to ${staffName}`,
          is_staff: true
        })

      await loadTickets()
      if (selectedTicket?.id === ticket.id) {
        await loadConversations(ticket.id)
      }

      toast.success('Ticket transferred successfully')
      setShowTransferModal(false)
      setTransferTo('')
    } catch (error) {
      console.error('Error transferring ticket:', error)
      toast.error('Failed to transfer ticket')
    }
  }

  const updateTicketStatus = async (ticketId: string, status?: SupportTicket['status'], priority?: SupportTicket['priority']) => {
    try {
      const updates: any = {}
      if (status) updates.status = status
      if (priority) updates.priority = priority

      const { error } = await supabase
        .from('feedback')
        .update(updates)
        .eq('id', ticketId)

      if (error) throw error

      await loadTickets()
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = tickets.find(t => t.id === ticketId)
        if (updatedTicket) {
          setSelectedTicket({ ...updatedTicket, ...updates })
        }
      }

      toast.success('Ticket updated')
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast.error('Failed to update ticket')
    }
  }

  const deleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', ticketId)

      if (error) throw error

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null)
      }

      await loadTickets()
      toast.success('Ticket deleted successfully')
      setShowDeleteModal(false)
      setTicketToDelete(null)
    } catch (error) {
      console.error('Error deleting ticket:', error)
      toast.error('Failed to delete ticket')
    }
  }

  const handleDeleteClick = (ticket: SupportTicket) => {
    setTicketToDelete(ticket)
    setShowDeleteModal(true)
    setContextMenu(null)
  }

  const copyTicketNumber = (ticketNumber: string | null) => {
    if (ticketNumber) {
      navigator.clipboard.writeText(ticketNumber)
      toast.success('Ticket number copied to clipboard')
    }
  }

  const handleContextMenu = (e: React.MouseEvent, ticket: SupportTicket) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Calculate position with viewport bounds checking
    const menuWidth = 200 // Approximate menu width
    const menuHeight = 400 // Approximate menu height (max)
    const padding = 10 // Padding from viewport edges
    
    let x = e.clientX
    let y = e.clientY
    
    // Adjust if menu would go off right edge
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding
    }
    
    // Adjust if menu would go off left edge
    if (x < padding) {
      x = padding
    }
    
    // Adjust if menu would go off bottom edge (account for taskbar)
    const viewportHeight = window.innerHeight
    const taskbarHeight = 50 // Approximate taskbar height
    const availableHeight = viewportHeight - taskbarHeight
    
    if (y + menuHeight > availableHeight) {
      // Position above cursor instead
      y = e.clientY - menuHeight
      // If that goes off top, position at top
      if (y < padding) {
        y = padding
      }
    }
    
    // Ensure menu doesn't go below viewport
    if (y + menuHeight > viewportHeight - padding) {
      y = viewportHeight - menuHeight - padding
    }
    
    setContextMenu({ x, y, ticket })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      case 'reviewed':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      case 'resolved':
        return 'bg-green-500/10 border-green-500/30 text-green-400'
      case 'dismissed':
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      case 'medium':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      case 'low':
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        ticket.subject?.toLowerCase().includes(query) ||
        ticket.message.toLowerCase().includes(query) ||
        ticket.ticket_number?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const canAccessTicket = (ticket: SupportTicket) => {
    return isAdmin || ticket.owner_id === user?.id || !ticket.is_locked
  }

  return (
    <div className="h-full w-full flex" style={{ height: '100%', overflow: 'hidden' }}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.3) rgba(15, 23, 42, 0.2);
        }
      `}</style>

      {/* Left Panel - Ticket List */}
      <div className="w-80 flex flex-col bg-slate-900/50 border-r border-slate-800/50" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="p-1.5 bg-purple-600/20 rounded-lg">
                <Ticket className="w-4 h-4 text-purple-400" />
              </div>
              Support Tickets
            </h2>
            <button
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
              className="p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors"
              title={filtersCollapsed ? "Show Filters" : "Hide Filters"}
            >
              <Filter className={`w-4 h-4 transition-colors ${filtersCollapsed ? 'text-slate-500' : 'text-purple-400'}`} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        {!filtersCollapsed && (
          <div className="flex-shrink-0 p-4 border-b border-slate-800/50 bg-slate-900/60">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filterStatus === status
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Priority</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => setFilterPriority(priority)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filterPriority === priority
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Assignment</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'me', 'unassigned'] as const).map((assigned) => (
                    <button
                      key={assigned}
                      onClick={() => setFilterAssigned(assigned)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filterAssigned === assigned
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {assigned === 'me' ? 'My Tickets' : assigned === 'all' ? 'All' : 'Unassigned'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ minHeight: 0 }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-sm">No tickets found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/30">
              {paginatedTickets.map((ticket) => {
                const isLocked = ticket.is_locked && ticket.owner_id !== user?.id && !isAdmin
                const canAccess = canAccessTicket(ticket)
                const isOwner = ticket.owner_id === user?.id
                return (
                  <div
                    key={ticket.id}
                    onContextMenu={(e) => handleContextMenu(e, ticket)}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (canAccess) {
                        setSelectedTicket(ticket)
                      } else {
                        toast.error('This ticket is locked to another staff member')
                      }
                    }}
                    className={`relative p-4 cursor-pointer transition-all ${
                      selectedTicket?.id === ticket.id 
                        ? 'bg-purple-600/10 border-l-4 border-purple-500' 
                        : 'hover:bg-slate-800/30 border-l-4 border-transparent'
                    } ${isLocked ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        {ticket.ticket_number && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-mono font-bold text-purple-400">{ticket.ticket_number}</span>
                            {ticket.is_locked && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/30">
                                <Lock className="w-3 h-3 text-yellow-400" />
                              </span>
                            )}
                            {isOwner && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-xs text-green-400 font-medium">
                                You
                              </span>
                            )}
                          </div>
                        )}
                        {ticket.subject && (
                          <h3 className="text-sm font-semibold text-white mb-1.5 line-clamp-1">{ticket.subject}</h3>
                        )}
                        <p className="text-xs text-slate-400 line-clamp-2 mb-2">{ticket.message}</p>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-slate-400">{ticket.user_profiles?.display_name || ticket.user_profiles?.username || 'Unknown'}</span>
                          </div>
                          {ticket.owner_profile && (
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-purple-400 font-medium">{ticket.owner_profile.display_name || ticket.owner_profile.username}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-900/30" style={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {selectedTicket ? (
          <>
            {/* Ticket Header - Fixed */}
            <div className="flex-shrink-0 p-5 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm" style={{ flexShrink: 0 }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    {selectedTicket.ticket_number && (
                      <span className="text-base font-mono font-bold text-purple-400">{selectedTicket.ticket_number}</span>
                    )}
                    {selectedTicket.is_locked && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-xs text-yellow-400 font-medium">
                        <Lock className="w-3.5 h-3.5" />
                        Locked
                      </span>
                    )}
                  </div>
                  {selectedTicket.subject && (
                    <h2 className="text-lg font-bold text-white mb-3">{selectedTicket.subject}</h2>
                  )}
                  <div className="flex items-center gap-3 flex-wrap mb-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-0.5">User</p>
                        <p className="text-sm font-semibold text-white">{selectedTicket.user_profiles?.display_name || selectedTicket.user_profiles?.username || 'Unknown User'}</p>
                      </div>
                    </div>
                    {selectedTicket.owner_profile && (
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-500/30">
                          <UserCheck className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium mb-0.5">Assigned To</p>
                          <p className="text-sm font-bold text-purple-400">{selectedTicket.owner_profile.display_name || selectedTicket.owner_profile.username}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(isAdmin || selectedTicket.owner_id === user?.id) && (
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="p-2.5 hover:bg-slate-800/50 rounded-lg transition-colors"
                      title="Transfer Ticket"
                    >
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, selectedTicket.status, e.target.value as SupportTicket['priority'])}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as SupportTicket['status'])}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Messages Area - Scrollable */}
            <div 
              id="messages-container" 
              className="flex-1 overflow-y-auto custom-scrollbar p-6" 
              style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}
            >
              {loadingConversations ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {conversations.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.is_staff ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] rounded-xl p-4 shadow-lg ${
                          msg.is_staff 
                            ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' 
                            : 'bg-slate-800/80 text-white border border-slate-700/50'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {msg.is_staff ? (
                              <UserCheck className="w-4 h-4 text-purple-200" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                            <span className={`text-xs font-semibold ${
                              msg.is_staff ? 'text-purple-100' : 'text-slate-400'
                            }`}>
                              {msg.is_staff ? 'Staff' : 'User'}: {msg.user_profiles?.display_name || msg.user_profiles?.username || 'Unknown'}
                            </span>
                            <span className={`text-xs ${
                              msg.is_staff ? 'text-purple-200/70' : 'text-slate-500'
                            }`}>
                              • {formatDate(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input - Fixed */}
            {canAccessTicket(selectedTicket) && (
              <div className="flex-shrink-0 p-5 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-sm" style={{ flexShrink: 0 }}>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                      rows={3}
                      className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2 font-medium shadow-lg shadow-purple-500/20 disabled:shadow-none"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                  <button
                    onClick={() => setSendEmail(!sendEmail)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      sendEmail
                        ? 'bg-purple-600/20 border-2 border-purple-500/50 text-purple-300 hover:bg-purple-600/30'
                        : 'bg-slate-800/50 border-2 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <Mail className={`w-4 h-4 ${sendEmail ? 'text-purple-400' : 'text-slate-500'}`} />
                    <span>{sendEmail ? 'Email notifications enabled' : 'Enable email notifications'}</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="p-4 bg-slate-800/50 rounded-2xl inline-block mb-4">
                <MessageSquare className="w-16 h-16 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No ticket selected</h3>
              <p className="text-slate-400 text-sm">Select a ticket from the list to view the conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[9999] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[200px] max-h-[80vh] overflow-y-auto custom-scrollbar"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            maxWidth: `${Math.min(200, window.innerWidth - contextMenu.x - 20)}px`
          }}
        >
          <button
            onClick={() => {
              setSelectedTicket(contextMenu.ticket)
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Ticket
          </button>
          <button
            onClick={() => {
              copyTicketNumber(contextMenu.ticket.ticket_number)
            }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Ticket Number
          </button>
          <div className="border-t border-slate-700 my-1"></div>
          {(isAdmin || contextMenu.ticket.owner_id === user?.id) && (
            <>
              <button
                onClick={() => {
                  setShowTransferModal(true)
                  setSelectedTicket(contextMenu.ticket)
                  setContextMenu(null)
                }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Transfer Ticket
              </button>
              <button
                onClick={() => {
                  const priorities: SupportTicket['priority'][] = ['low', 'medium', 'high', 'urgent']
                  const currentIndex = priorities.indexOf(contextMenu.ticket.priority)
                  const nextIndex = (currentIndex + 1) % priorities.length
                  updateTicketStatus(contextMenu.ticket.id, contextMenu.ticket.status, priorities[nextIndex])
                  setContextMenu(null)
                }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Change Priority
              </button>
            </>
          )}
          <div className="border-t border-slate-700 my-1"></div>
          <button
            onClick={() => {
              updateTicketStatus(contextMenu.ticket.id, 'reviewed')
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Reviewed
          </button>
          <button
            onClick={() => {
              updateTicketStatus(contextMenu.ticket.id, 'resolved')
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-slate-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Resolved
          </button>
          <button
            onClick={() => {
              updateTicketStatus(contextMenu.ticket.id, 'dismissed')
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Dismiss Ticket
          </button>
          {contextMenu.ticket.status !== 'pending' && (
            <button
              onClick={() => {
                updateTicketStatus(contextMenu.ticket.id, 'pending')
                setContextMenu(null)
              }}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reopen Ticket
            </button>
          )}
          {isStaff && (
            <>
              <div className="border-t border-slate-700 my-1"></div>
              <button
                onClick={() => handleDeleteClick(contextMenu.ticket)}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Ticket
              </button>
            </>
          )}
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-2">Transfer Ticket</h3>
            <p className="text-sm text-slate-400 mb-4">
              Transfer this ticket to another staff member. Only admins and the current owner can transfer tickets.
            </p>
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select staff member...</option>
              {staffMembers
                .filter(s => s.id !== user?.id)
                .map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.display_name || staff.username} ({staff.role})
                  </option>
                ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false)
                  setTransferTo('')
                }}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => transferTicket()}
                disabled={!transferTo}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Transfer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ticketToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl border border-red-500/30 p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Ticket</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-slate-300 mb-4">
                Are you sure you want to delete this ticket? This action <span className="font-semibold text-red-400">cannot be undone</span>.
              </p>
              
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  {ticketToDelete.ticket_number && (
                    <span className="text-sm font-mono font-semibold text-purple-400">{ticketToDelete.ticket_number}</span>
                  )}
                </div>
                {ticketToDelete.subject && (
                  <p className="text-sm font-semibold text-white mb-1">{ticketToDelete.subject}</p>
                )}
                <p className="text-xs text-slate-400 line-clamp-2">{ticketToDelete.message}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(ticketToDelete.status)}`}>
                    {ticketToDelete.status}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(ticketToDelete.priority)}`}>
                    {ticketToDelete.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setTicketToDelete(null)
                }}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (ticketToDelete) {
                    deleteTicket(ticketToDelete.id)
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Ticket
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
