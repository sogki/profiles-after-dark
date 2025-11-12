import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Image,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bot,
  Sparkles,
  Loader2,
  Clock,
  User,
  Tag,
  MoreVertical,
  CheckSquare,
  Square,
  Smile,
  Monitor,
  BsFillEmojiHeartEyesFill,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/authContext';

type ContentType = 'profiles' | 'profile_pairs' | 'emotes' | 'wallpapers' | 'emoji_combos' | 'single_uploads';

interface ContentItem {
  id: string;
  user_id: string;
  title?: string;
  name?: string; // For emoji combos
  type?: 'profile' | 'banner';
  image_url?: string | null;
  pfp_url?: string | null;
  banner_url?: string | null;
  combo_text?: string;
  description?: string;
  category: string;
  download_count?: number;
  tags: string[] | null;
  created_at: string;
  status: 'approved' | 'pending' | 'rejected';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  contentType: ContentType;
  user?: {
    username: string | null;
    display_name: string | null;
  };
}

export default function ContentManagementView() {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('pending');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [content]);

  const calculateStats = () => {
    const stats = {
      total: content.length,
      pending: content.filter(c => c.status === 'pending').length,
      approved: content.filter(c => c.status === 'approved').length,
      rejected: content.filter(c => c.status === 'rejected').length
    };
    setStats(stats);
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const allContent: ContentItem[] = [];

      // Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profilesError && profilesData) {
        allContent.push(...profilesData.map(p => ({
          ...p,
          contentType: 'profiles' as ContentType,
          status: (p.status || 'pending') as 'approved' | 'pending' | 'rejected'
        })));
      }

      // Load profile pairs
      const { data: pairsData, error: pairsError } = await supabase
        .from('profile_pairs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pairsError && pairsData) {
        allContent.push(...pairsData.map(p => ({
          ...p,
          contentType: 'profile_pairs' as ContentType,
          status: (p.status || 'pending') as 'approved' | 'pending' | 'rejected'
        })));
      }

      // Load emotes
      const { data: emotesData, error: emotesError } = await supabase
        .from('emotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!emotesError && emotesData) {
        allContent.push(...emotesData.map(e => ({
          ...e,
          contentType: 'emotes' as ContentType,
          status: (e.status || 'pending') as 'approved' | 'pending' | 'rejected'
        })));
      }

      // Load wallpapers
      const { data: wallpapersData, error: wallpapersError } = await supabase
        .from('wallpapers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!wallpapersError && wallpapersData) {
        allContent.push(...wallpapersData.map(w => ({
          ...w,
          contentType: 'wallpapers' as ContentType,
          status: (w.status || 'pending') as 'approved' | 'pending' | 'rejected'
        })));
      }

      // Load emoji combos
      const { data: combosData, error: combosError } = await supabase
        .from('emoji_combos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!combosError && combosData) {
        allContent.push(...combosData.map(c => ({
          ...c,
          contentType: 'emoji_combos' as ContentType,
          status: (c.status || 'pending') as 'approved' | 'pending' | 'rejected'
        })));
      }

      // Load single_uploads if table exists
      try {
        const { data: singleData, error: singleError } = await supabase
          .from('single_uploads')
          .select('*')
          .order('created_at', { ascending: false });

        if (!singleError && singleData) {
          allContent.push(...singleData.map(s => ({
            ...s,
            contentType: 'single_uploads' as ContentType,
            status: (s.status || 'pending') as 'approved' | 'pending' | 'rejected'
          })));
        }
      } catch (e) {
        // Table might not exist, ignore
      }

      // Get unique user IDs
      const userIds = [...new Set(allContent.map(c => c.user_id))];
      
      // Fetch user data
      let usersMap: Record<string, { username: string | null; display_name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds);
        
        if (!usersError && usersData) {
          usersMap = usersData.reduce((acc, user) => {
            acc[user.user_id] = { username: user.username, display_name: user.display_name };
            return acc;
          }, {} as Record<string, { username: string | null; display_name: string | null }>);
        }
      }

      // Combine with user data
      const contentWithUsers = allContent.map(item => ({
        ...item,
        user: usersMap[item.user_id] || { username: null, display_name: null }
      }));

      setContent(contentWithUsers);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const sendContentNotification = async (
    userId: string,
    contentType: ContentType,
    contentTitle: string,
    action: 'approve' | 'reject',
    contentId: string
  ) => {
    try {
      const contentTypeLabel = getContentTypeLabel(contentType);
      const emoji = action === 'approve' ? '✅' : '❌';
      const title = action === 'approve' 
        ? `${emoji} Content Approved!`
        : `${emoji} Content Rejected`;
      
      const message = action === 'approve'
        ? `Your ${contentTypeLabel.toLowerCase()} "${contentTitle}" has been approved and is now visible to the community!`
        : `Your ${contentTypeLabel.toLowerCase()} "${contentTitle}" has been rejected. Please review our community guidelines and try again.`;

      // Determine the action URL based on content type
      let actionUrl = '';
      switch (contentType) {
        case 'profiles':
          actionUrl = `/gallery/profiles`;
          break;
        case 'profile_pairs':
          actionUrl = `/gallery`;
          break;
        case 'emotes':
          actionUrl = `/gallery/emotes`;
          break;
        case 'wallpapers':
          actionUrl = `/gallery/wallpapers`;
          break;
        case 'emoji_combos':
          actionUrl = `/gallery/emoji-combos`;
          break;
        default:
          actionUrl = `/gallery`;
      }

      // Use database function to create notification (bypasses RLS for staff)
      const { data, error } = await supabase.rpc('create_content_approval_notification', {
        target_user_id: userId,
        notification_content: `${title}: ${message}`,
        notification_type: action === 'approve' ? 'success' : 'warning',
        notification_action_url: actionUrl
      });

      if (error) {
        console.error('Error creating notification:', error);
        // Don't throw - notification failure shouldn't block the approval
      } else {
        console.log('Notification created successfully:', data);
      }
    } catch (error) {
      console.error('Error in sendContentNotification:', error);
      // Don't throw - notification failure shouldn't block the approval
    }
  };

  const handleContentAction = async (contentId: string, contentType: ContentType, action: 'approve' | 'reject' | 'delete') => {
    if (!user) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    setProcessingItems(prev => new Set(prev).add(contentId));

    try {
      // Get the content item to find the uploader
      const contentItem = content.find(item => item.id === contentId && item.contentType === contentType);

      if (action === 'delete') {
        const { error } = await supabase
          .from(contentType)
          .delete()
          .eq('id', contentId);
        
        if (error) throw error;
        setContent(prev => prev.filter(item => item.id !== contentId));
        toast.success('Content deleted successfully');
      } else {
        // Try to update with status column first
        const updateData: any = {
          status: action === 'approve' ? 'approved' : 'rejected'
        };

        // Try to add reviewed_by and reviewed_at if columns exist
        updateData.reviewed_by = user.id;
        updateData.reviewed_at = new Date().toISOString();

        const { error } = await supabase
          .from(contentType)
          .update(updateData)
          .eq('id', contentId);
        
        if (error) {
          // If error is about missing columns (status, reviewed_at, or reviewed_by), 
          // the migration hasn't been run yet - show helpful error
          if (error.message?.includes('status') || 
              error.message?.includes('reviewed_at') || 
              error.message?.includes('reviewed_by') ||
              error.code === 'PGRST204') {
            toast.error('Database migration required: Please run the migration to add approval status columns');
            console.error('Migration required. Error:', error);
            return;
          } else {
            throw error;
          }
        }
        
        setContent(prev => prev.map(item => 
          item.id === contentId && item.contentType === contentType
            ? { ...item, ...updateData }
            : item
        ));
        
        // Send notification to the content uploader
        if (contentItem && contentItem.user_id && action !== 'delete') {
          await sendContentNotification(
            contentItem.user_id,
            contentType,
            getContentTitle(contentItem),
            action,
            contentId
          );
        }
        
        toast.success(`Content ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      }
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error(`Failed to ${action} content`);
    } finally {
      setProcessingItems(prev => {
        const next = new Set(prev);
        next.delete(contentId);
        return next;
      });
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to perform bulk action');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    setProcessingItems(new Set(selectedItems));

    try {
      for (const itemId of selectedItems) {
        const item = content.find(c => c.id === itemId);
        if (!item) continue;

        if (action === 'delete') {
          await supabase
            .from(item.contentType)
            .delete()
            .eq('id', itemId);
        } else {
          const updateData: any = {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
          };

          const { error: updateError } = await supabase
            .from(item.contentType)
            .update(updateData)
            .eq('id', itemId);
          
          // If error is about missing columns, migration hasn't been run
          if (updateError && (
            updateError.message?.includes('status') || 
            updateError.message?.includes('reviewed_at') || 
            updateError.message?.includes('reviewed_by') ||
            updateError.code === 'PGRST204'
          )) {
            toast.error('Database migration required: Please run the migration to add approval status columns');
            console.error('Migration required. Error:', updateError);
            throw updateError;
          } else if (updateError) {
            throw updateError;
          }
        }
      }

      // Send notifications for approved/rejected items
      if (action !== 'delete') {
        const notificationPromises = selectedItems.map(async (itemId) => {
          const item = content.find(c => c.id === itemId);
          if (item && item.user_id) {
            await sendContentNotification(
              item.user_id,
              item.contentType,
              getContentTitle(item),
              action,
              itemId
            );
          }
        });
        
        // Send all notifications in parallel (don't wait for them to complete)
        Promise.all(notificationPromises).catch(err => {
          console.error('Error sending bulk notifications:', err);
        });
      }

      if (action === 'delete') {
        setContent(prev => prev.filter(item => !selectedItems.includes(item.id)));
      } else {
        setContent(prev => prev.map(item => 
          selectedItems.includes(item.id)
            ? { 
                ...item, 
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewed_by: user.id || null,
                reviewed_at: new Date().toISOString()
              }
            : item
        ));
      }

      toast.success(`Bulk ${action} completed for ${selectedItems.length} items`);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    } finally {
      setProcessingItems(new Set());
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = !searchQuery || 
      getContentTitle(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || item.contentType === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'profiles': return 'Profile';
      case 'profile_pairs': return 'Profile Pair';
      case 'emotes': return 'Emote';
      case 'wallpapers': return 'Wallpaper';
      case 'emoji_combos': return 'Emoji Combo';
      case 'single_uploads': return 'Single Upload';
      default: return type;
    }
  };

  const getContentTitle = (item: ContentItem): string => {
    // Emoji combos use 'name' instead of 'title'
    if (item.contentType === 'emoji_combos') {
      return item.name || item.combo_text || 'Untitled Combo';
    }
    return item.title || 'Untitled';
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'profiles': return Image;
      case 'profile_pairs': return User;
      case 'emotes': return Smile;
      case 'wallpapers': return Monitor;
      case 'emoji_combos': return Sparkles;
      default: return FileText;
    }
  };

  const getPreviewUrl = (item: ContentItem) => {
    if (item.contentType === 'profile_pairs') {
      return item.pfp_url || item.banner_url || null;
    }
    return item.image_url || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Content Management</h2>
            <p className="text-slate-400">Review and approve user-uploaded content</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Content</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-400 mb-1">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-green-500/10 rounded-lg border border-green-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400 mb-1">Approved</p>
                <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-red-500/10 rounded-lg border border-red-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-400 mb-1">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, username, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Types</option>
            <option value="profiles">Profiles</option>
            <option value="profile_pairs">Profile Pairs</option>
            <option value="emotes">Emotes</option>
            <option value="wallpapers">Wallpapers</option>
            <option value="emoji_combos">Emoji Combos</option>
            <option value="single_uploads">Single Uploads</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  if (selectedItems.length === filteredContent.length) {
                    setSelectedItems([]);
                  } else {
                    setSelectedItems(filteredContent.map(item => item.id));
                  }
                }}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                {selectedItems.length === filteredContent.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={processingItems.size > 0}
                className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve All
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={processingItems.size > 0}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject All
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={processingItems.size > 0}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredContent.map((item, index) => {
            const isSelected = selectedItems.includes(item.id);
            const isProcessing = processingItems.has(item.id);
            const isExpanded = expandedItems.has(item.id);
            const previewUrl = getPreviewUrl(item);
            const TypeIcon = getContentTypeIcon(item.contentType);
            const isPending = item.status === 'pending';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-slate-800/50 rounded-xl border overflow-hidden transition-all relative ${
                  isSelected ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-slate-700/50'
                } ${isPending ? 'ring-2 ring-yellow-500/30' : ''}`}
              >
                {/* Content Preview */}
                {previewUrl ? (
                  <div className="aspect-square bg-slate-700/50 relative group">
                    {/* Checkbox - positioned over image */}
                    <div className="absolute top-2 left-2 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemSelection(item.id);
                        }}
                        className={`p-1.5 rounded-lg backdrop-blur-sm transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-900/70 text-slate-400 hover:bg-slate-800/70'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Status Badge - positioned over image */}
                    <div className="absolute top-2 right-2 z-20">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                        item.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <img
                      src={previewUrl}
                      alt={getContentTitle(item)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(previewUrl, '_blank');
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-900/80 rounded-lg backdrop-blur-sm"
                      >
                        <Eye className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-slate-700/50 flex items-center justify-center relative">
                    {/* Checkbox - positioned over placeholder */}
                    <div className="absolute top-2 left-2 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemSelection(item.id);
                        }}
                        className={`p-1.5 rounded-lg backdrop-blur-sm transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-900/70 text-slate-400 hover:bg-slate-800/70'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Status Badge - positioned over placeholder */}
                    <div className="absolute top-2 right-2 z-20">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                        item.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <TypeIcon className="w-12 h-12 text-slate-500" />
                  </div>
                )}

                {/* Content Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TypeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-400 truncate">
                        {getContentTypeLabel(item.contentType)}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleItemExpansion(item.id)}
                      className="p-1 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">
                    {getContentTitle(item)}
                  </h3>
                  
                  <p className="text-xs text-slate-400 mb-3">
                    by {item.user?.display_name || item.user?.username || 'Unknown User'}
                  </p>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2 border-t border-slate-700/50">
                          {item.description && (
                            <p className="text-xs text-slate-300 line-clamp-2">{item.description}</p>
                          )}
                          {item.combo_text && (
                            <p className="text-xs text-slate-300 font-mono bg-slate-900/50 p-2 rounded">
                              {item.combo_text}
                            </p>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 5).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-500">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    <button
                      onClick={() => handleContentAction(item.id, item.contentType, 'approve')}
                      disabled={isProcessing || item.status === 'approved'}
                      className="flex-1 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs font-medium"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleContentAction(item.id, item.contentType, 'reject')}
                      disabled={isProcessing || item.status === 'rejected'}
                      className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs font-medium"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      Reject
                    </button>
                    <button
                      onClick={() => handleContentAction(item.id, item.contentType, 'delete')}
                      disabled={isProcessing}
                      className="p-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-400 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredContent.length === 0 && (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">No content found</p>
          {searchQuery || filterType !== 'all' || filterStatus !== 'all' && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterStatus('all');
              }}
              className="mt-4 text-sm text-purple-400 hover:text-purple-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
