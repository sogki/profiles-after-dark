import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface ContentItem {
  id: string;
  user_id: string;
  title: string;
  type: 'profile' | 'banner';
  image_url: string;
  category: string;
  download_count: number;
  tags: string[];
  created_at: string;
  status?: 'approved' | 'pending' | 'rejected';
  ai_analysis?: {
    is_appropriate: boolean;
    confidence: number;
    tags: string[];
    risk_level: 'low' | 'medium' | 'high';
  };
  user?: {
    username: string;
    display_name: string;
  };
}

export default function ContentManagementView() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'profile' | 'banner'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [aiScanInProgress, setAiScanInProgress] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      // First, get the profiles without the join
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get unique user IDs from profiles
      const userIds = [...new Set(profilesData?.map(p => p.user_id) || [])];
      
      // Fetch user data separately
      let usersMap: Record<string, { username: string; display_name: string }> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name')
          .in('user_id', userIds);
        
        if (!usersError && usersData) {
          usersMap = usersData.reduce((acc, user) => {
            acc[user.user_id] = { username: user.username, display_name: user.display_name };
            return acc;
          }, {} as Record<string, { username: string; display_name: string }>);
        }
      }

      // Combine profiles with user data
      const contentWithUsers = profilesData?.map(profile => ({
        ...profile,
        user: usersMap[profile.user_id] || { username: 'Unknown', display_name: 'Unknown User' }
      })) || [];

      setContent(contentWithUsers);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleContentAction = async (contentId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', contentId);
        
        if (error) throw error;
        setContent(prev => prev.filter(item => item.id !== contentId));
        toast.success('Content deleted successfully');
      } else {
        // For now, just simulate status update since profiles table doesn't have status field
        // In a real implementation, you might want to add a status field to the profiles table
        setContent(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
            : item
        ));
        toast.success(`Content ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      }
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Failed to update content');
    }
  };

  const runAIScan = async () => {
    setAiScanInProgress(true);
    try {
      // Simulate AI scan
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('AI scan completed');
    } catch (error) {
      console.error('Error running AI scan:', error);
      toast.error('Failed to run AI scan');
    } finally {
      setAiScanInProgress(false);
    }
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Content Management</h2>
          <p className="text-slate-400 text-sm sm:text-base">Manage uploaded profiles and banners with AI assistance</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={runAIScan}
            disabled={aiScanInProgress}
            className="flex items-center px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            {aiScanInProgress ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bot className="w-4 h-4 mr-2" />
            )}
            <span className="hidden sm:inline">{aiScanInProgress ? 'Scanning...' : 'Run AI Scan'}</span>
            <span className="sm:hidden">{aiScanInProgress ? 'Scanning...' : 'AI Scan'}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 text-sm"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value="all">All Types</option>
            <option value="profile">Profiles</option>
            <option value="banner">Banners</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredContent.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
          >
            {/* Content Preview */}
            <div className="aspect-square bg-slate-700 relative">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  item.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {item.status}
                </span>
              </div>
              {item.ai_analysis && (
                <div className="absolute top-2 right-2">
                  <div className={`w-3 h-3 rounded-full ${
                    item.ai_analysis.risk_level === 'low' ? 'bg-green-400' :
                    item.ai_analysis.risk_level === 'medium' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                </div>
              )}
            </div>

            {/* Content Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400 capitalize">{item.type}</span>
                <span className="text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="text-sm text-white font-medium mb-1">
                {item.title}
              </div>
              
              <div className="text-xs text-slate-400 mb-1">
                by {item.user?.display_name || item.user?.username || 'Unknown User'}
              </div>
              
              {item.ai_analysis && (
                <div className="flex items-center space-x-2 mb-3">
                  <Bot className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-slate-400">
                    {item.ai_analysis.confidence}% confidence
                  </span>
                </div>
              )}

              {/* AI Analysis Tags */}
              {item.ai_analysis?.tags && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.ai_analysis.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.open(item.file_url, '_blank')}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleContentAction(item.id, 'approve')}
                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleContentAction(item.id, 'reject')}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleContentAction(item.id, 'delete')}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredContent.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">No content found</p>
        </div>
      )}
    </div>
  );
}
