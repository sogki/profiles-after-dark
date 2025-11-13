import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Bot,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Paperclip,
  Smile,
  Image,
  FileText,
  Video,
  Music,
  Download,
  Eye,
  Flag,
  Ban,
  AlertTriangle as Warning,
  UserCheck,
  UserX,
  Bell,
  BellOff,
  Archive,
  Trash2,
  Edit,
  Copy,
  Share,
  Lock,
  Unlock,
  Star,
  StarOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/authContext';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'action';
  attachments?: string[];
  created_at: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  thread_id?: string;
  reply_to?: string;
  reactions?: { emoji: string; users: string[] }[];
  edited?: boolean;
  edited_at?: string;
}

interface Thread {
  id: string;
  title: string;
  participants: string[];
  last_message: string;
  last_message_at: string;
  unread_count: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'archived' | 'resolved';
  tags: string[];
  created_by: string;
  created_at: string;
}

interface ModerationMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModerationMessaging({ isOpen, onClose }: ModerationMessagingProps) {
  const { user, userProfile } = useAuth();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user has any staff-related role (admin, staff, moderator)
  const userRole = userProfile?.role?.toLowerCase() || '';
  const roles = userRole ? userRole.split(',').map(r => r.trim().toLowerCase()).filter(r => r) : [];
  const staffRoles = ['admin', 'staff', 'moderator'];
  const hasModerationAccess = roles.some(role => staffRoles.includes(role));

  useEffect(() => {
    if (!hasModerationAccess) return;
    
    loadThreads();
    if (activeThread) {
      loadMessages(activeThread);
    }
  }, [hasModerationAccess, activeThread]);

  useEffect(() => {
    if (activeThread) {
      // For now, skip real-time subscription since moderation_messages table doesn't exist
      // This can be implemented when the database schema is ready
      console.log('Real-time subscription would be set up for thread:', activeThread);
      return () => {};
    }
  }, [activeThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadThreads = async () => {
    try {
      // Create a general staff chat thread if it doesn't exist
      const { data: existingThreads, error: threadsError } = await supabase
        .from('moderation_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (threadsError) {
        // If table doesn't exist, create a default staff chat
        const defaultThread = {
          id: 'staff-general',
          title: 'General Staff Chat',
          participants: ['staff'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message: 'Welcome to the staff chat!',
          unread_count: 0
        };
        setThreads([defaultThread]);
      } else {
        setThreads(existingThreads || []);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      // Create default thread on error
      const defaultThread = {
        id: 'staff-general',
        title: 'General Staff Chat',
        participants: ['staff'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message: 'Welcome to the staff chat!',
        unread_count: 0
      };
      setThreads([defaultThread]);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('moderation_messages')
        .select(`
          *,
          sender:user_id(username, display_name)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        // If table doesn't exist, create sample messages for demo
        const sampleMessages = [
          {
            id: '1',
            thread_id: threadId,
            user_id: user?.id || 'system',
            content: 'Welcome to the staff chat! This is where moderators can communicate.',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            sender: { username: 'System', display_name: 'System' }
          },
          {
            id: '2',
            thread_id: threadId,
            user_id: user?.id || 'system',
            content: 'Remember to coordinate moderation actions and share important updates here.',
            created_at: new Date(Date.now() - 1800000).toISOString(),
            sender: { username: 'System', display_name: 'System' }
          }
        ];
        setMessages(sampleMessages);
      } else {
        setMessages(messagesData || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Create sample messages on error
      const sampleMessages = [
        {
          id: '1',
          thread_id: threadId,
          user_id: user?.id || 'system',
          content: 'Welcome to the staff chat! This is where moderators can communicate.',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender: { username: 'System', display_name: 'System' }
        }
      ];
      setMessages(sampleMessages);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!activeThread) return;

    try {
      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fileName = `moderation_attachments/${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from('moderation-files')
            .upload(fileName, file);

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('moderation-files')
            .getPublicUrl(fileName);

          attachmentUrls.push(urlData.publicUrl);
        }
      }

      // Create message
      const messageData = {
        thread_id: activeThread,
        sender_id: user?.id,
        sender_name: userProfile?.display_name || userProfile?.username || 'Unknown',
        sender_role: userProfile?.role || 'user',
        content: newMessage.trim(),
        message_type: attachments.length > 0 ? 'file' : 'text',
        attachments: attachmentUrls,
        priority: 'medium',
        created_at: new Date().toISOString()
      };

      // Try to insert message into database
      const { data, error } = await supabase
        .from('moderation_messages')
        .insert([messageData])
        .select();

      if (error) {
        // If table doesn't exist, simulate message sending
        const newMessageObj = {
          id: Date.now().toString(),
          thread_id: activeThread,
          user_id: user?.id || '',
          content: newMessage.trim(),
          attachments: attachmentUrls,
          created_at: new Date().toISOString(),
          sender: { username: userProfile?.username || 'You', display_name: userProfile?.display_name || 'You' }
        };
        
        setMessages(prev => [...prev, newMessageObj]);
        toast.success('Message sent (simulated)');
      } else {
        setMessages(prev => [...prev, ...(data || [])]);
        toast.success('Message sent');
      }

      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const createThread = async (title: string, participants: string[], priority: string = 'medium') => {
    try {
      const threadData = {
        title,
        participants: [...participants, user?.id],
        last_message: 'Thread created',
        last_message_at: new Date().toISOString(),
        priority,
        status: 'active',
        tags: [],
        created_by: user?.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('moderation_threads')
        .insert([threadData])
        .select()
        .single();

      if (error) throw error;

      setActiveThread(data.id);
      await loadThreads();
      toast.success('Thread created');
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread');
    }
  };

  const handleFileUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = fileArray.filter(file => file.size <= maxSize);
    
    if (validFiles.length !== fileArray.length) {
      toast.error('Some files are too large (max 10MB)');
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'archived': return 'text-gray-400 bg-gray-500/20';
      case 'resolved': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = !searchQuery || 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.last_message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || thread.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || thread.status === filterStatus;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  if (!hasModerationAccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-2xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">You do not have permission to access moderation messaging.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-6xl h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Moderation Messaging</h2>
                  <p className="text-slate-400">Team communication and coordination</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar - Threads List */}
              <div className="w-80 border-r border-slate-700 flex flex-col">
                {/* Search and Filters */}
                <div className="p-4 border-b border-slate-700 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search threads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Priority</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Threads List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setActiveThread(thread.id)}
                      className={`p-4 border-b border-slate-700 cursor-pointer transition-colors ${
                        activeThread === thread.id ? 'bg-purple-600/20' : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white truncate">{thread.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(thread.priority)}`}>
                            {thread.priority}
                          </span>
                          {thread.unread_count > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                              {thread.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-400 truncate mb-2">{thread.last_message}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {new Date(thread.last_message_at).toLocaleString()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(thread.status)}`}>
                          {thread.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create Thread Button */}
                <div className="p-4 border-t border-slate-700">
                  <button
                    onClick={() => {
                      const title = prompt('Enter thread title:');
                      if (title) {
                        createThread(title, []);
                      }
                    }}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create New Thread
                  </button>
                </div>
              </div>

              {/* Main Content - Messages */}
              <div className="flex-1 flex flex-col">
                {activeThread ? (
                  <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.sender_role === 'admin' ? 'bg-red-500' :
                            message.sender_role === 'moderator' ? 'bg-purple-500' :
                            'bg-slate-600'
                          }`}>
                            {message.sender_role === 'admin' ? (
                              <Shield className="w-4 h-4 text-white" />
                            ) : message.sender_role === 'moderator' ? (
                              <UserCheck className="w-4 h-4 text-white" />
                            ) : (
                              <User className="w-4 h-4 text-white" />
                            )}
                          </div>
                          
                          <div className={`flex-1 max-w-[70%] ${
                            message.sender_id === user?.id ? 'items-end' : 'items-start'
                          } flex flex-col`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">{message.sender_name}</span>
                              <span className="text-xs text-slate-400">{message.sender_role}</span>
                              <span className="text-xs text-slate-500">
                                {new Date(message.created_at).toLocaleString()}
                              </span>
                            </div>
                            
                            <div className={`p-3 rounded-lg ${
                              message.sender_id === user?.id 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-slate-700 text-white'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-600/50 rounded">
                                      <FileText className="w-4 h-4" />
                                      <a
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-400 hover:text-blue-300 truncate"
                                      >
                                        {attachment.split('/').pop()}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="border-t border-slate-700 p-4">
                      {attachments.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded-lg">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-white">{file.name}</span>
                              <button
                                onClick={() => removeAttachment(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                          <Paperclip className="w-4 h-4 text-slate-400" />
                        </button>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                          className="hidden"
                        />
                        
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() && attachments.length === 0}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Select a Thread</h3>
                      <p className="text-slate-400">Choose a thread from the sidebar to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
