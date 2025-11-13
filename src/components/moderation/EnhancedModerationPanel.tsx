import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Users,
  Flag,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  BarChart3,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  TrendingUp,
  AlertCircle,
  UserCheck,
  UserX,
  Ban,
  AlertTriangle as Warning,
  Bell,
  Activity,
  Target,
  FileText,
  Image,
  Video,
  Music,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/authContext';
import toast from 'react-hot-toast';

interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  activeUsers: number;
  bannedUsers: number;
  contentRemoved: number;
  aiAccuracy: number;
  responseTime: number;
}

interface Report {
  id: string;
  reporter_user_id: string;
  reported_user_id?: string;
  content_id?: string;
  content_type?: string;
  reason: string;
  description: string;
  urgency: string;
  status: string;
  created_at: string;
  handled_at?: string;
  handled_by?: string;
  evidence?: string;
  evidence_urls?: string[];
  auto_moderation_result?: any;
}

interface ModerationLog {
  id: string;
  moderator_id: string;
  action: string;
  target_user_id?: string;
  target_profile_id?: string;
  description: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  role: string;
  is_active: boolean;
  created_at: string;
  moderation_count: number;
  trust_score: number;
}

export default function EnhancedModerationPanel() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'users' | 'content' | 'analytics' | 'settings' | 'roles'>('dashboard');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user has moderation permissions
  const hasModerationAccess = userProfile?.role === 'admin' || userProfile?.role === 'moderator' || userProfile?.role === 'staff';

  useEffect(() => {
    if (!hasModerationAccess) {
      toast.error('You do not have permission to access the moderation panel');
      return;
    }
    
    loadModerationData();
  }, [hasModerationAccess]);

  const loadModerationData = useCallback(async () => {
    setLoading(true);
    try {
      // Load stats
      await loadStats();
      
      // Load reports
      await loadReports();
      
      // Load logs
      await loadLogs();
      
      // Load users
      await loadUsers();
    } catch (error) {
      console.error('Error loading moderation data:', error);
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = async () => {
    try {
      const [
        { count: totalReports },
        { count: pendingReports },
        { count: resolvedReports },
        { count: activeUsers },
        { count: bannedUsers },
        { count: contentRemoved }
      ] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
        supabase.from('moderation_actions').select('*', { count: 'exact', head: true }).eq('action', 'remove_content')
      ]);

      setStats({
        totalReports: totalReports || 0,
        pendingReports: pendingReports || 0,
        resolvedReports: resolvedReports || 0,
        activeUsers: activeUsers || 0,
        bannedUsers: bannedUsers || 0,
        contentRemoved: contentRemoved || 0,
        aiAccuracy: 87.5, // Placeholder - would be calculated from actual data
        responseTime: 2.3 // Placeholder - would be calculated from actual data
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleReportAction = async (reportId: string, action: string, reason: string) => {
    setIsProcessing(true);
    try {
      // Update report status
      const { error: reportError } = await supabase
        .from('reports')
        .update({
          status: action === 'dismiss' ? 'dismissed' : 'resolved',
          handled_at: new Date().toISOString(),
          handled_by: user?.id
        })
        .eq('id', reportId);

      if (reportError) throw reportError;

      // Log the action
      const { error: logError } = await supabase
        .from('moderation_logs')
        .insert([{
          moderator_id: user?.id,
          action: `handle_report_${action}`,
          description: `Report ${action}: ${reason}`,
          created_at: new Date().toISOString()
        }]);

      if (logError) throw logError;

      // Execute additional actions based on the action type
      if (action === 'remove_content') {
        // Remove the reported content
        const report = reports.find(r => r.id === reportId);
        if (report?.content_id) {
          await supabase
            .from('profiles')
            .delete()
            .eq('id', report.content_id);
        }
      }

      toast.success(`Report ${action} successfully`);
      await loadReports();
      setSelectedReport(null);
    } catch (error) {
      console.error('Error handling report:', error);
      toast.error('Failed to handle report');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserAction = async (userId: string, action: string, reason: string) => {
    setIsProcessing(true);
    try {
      let updateData: any = {};
      
      switch (action) {
        case 'warn':
          // Add warning to user
          await supabase.from('user_warnings').insert([{
            user_id: userId,
            moderator_id: user?.id,
            message: reason,
            created_at: new Date().toISOString()
          }]);
          break;
          
        case 'restrict':
          updateData = { is_active: false, restricted_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
          break;
          
        case 'ban':
          updateData = { is_active: false, role: 'banned' };
          break;
          
        case 'unban':
          updateData = { is_active: true, role: 'user', restricted_until: null };
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', userId);

        if (error) throw error;
      }

      // Log the action
      await supabase.from('moderation_logs').insert([{
        moderator_id: user?.id,
        action: `user_${action}`,
        target_user_id: userId,
        description: `User ${action}: ${reason}`,
        created_at: new Date().toISOString()
      }]);

      toast.success(`User ${action} successfully`);
      await loadUsers();
    } catch (error) {
      console.error('Error handling user action:', error);
      toast.error('Failed to handle user action');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchQuery || 
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesUrgency = filterUrgency === 'all' || report.urgency === filterUrgency;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  if (!hasModerationAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You do not have permission to access the moderation panel.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading moderation panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-xl">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Moderation Panel</h1>
              <p className="text-slate-400">Advanced content and user management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">AI Active</span>
            </div>
            <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-800/50 rounded-xl p-1 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'reports', label: 'Reports', icon: Flag },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'content', label: 'Content', icon: Image },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
            ...(userProfile?.role === 'admin' ? [{ id: 'roles', label: 'Role Management', icon: Shield }] : [])
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Total Reports',
                  value: stats?.totalReports || 0,
                  icon: Flag,
                  color: 'blue',
                  change: '+12%'
                },
                {
                  title: 'Pending Reports',
                  value: stats?.pendingReports || 0,
                  icon: Clock,
                  color: 'orange',
                  change: '+5%'
                },
                {
                  title: 'Active Users',
                  value: stats?.activeUsers || 0,
                  icon: Users,
                  color: 'green',
                  change: '+8%'
                },
                {
                  title: 'AI Accuracy',
                  value: `${stats?.aiAccuracy || 0}%`,
                  icon: Zap,
                  color: 'purple',
                  change: '+2%'
                }
              ].map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                        <IconComponent className={`w-6 h-6 text-${stat.color}-400`} />
                      </div>
                      <span className="text-sm text-green-400 font-medium">{stat.change}</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.title}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Reports</h3>
                <div className="space-y-4">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        report.urgency === 'critical' ? 'bg-red-500' :
                        report.urgency === 'high' ? 'bg-orange-500' :
                        report.urgency === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{report.reason}</div>
                        <div className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                        report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Moderation Actions</h3>
                <div className="space-y-4">
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Shield className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{log.action}</div>
                        <div className="text-xs text-slate-400">{log.description}</div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Urgency</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          report.urgency === 'critical' ? 'bg-red-500/20 text-red-400' :
                          report.urgency === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          report.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {report.urgency.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          report.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                          report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{report.reason}</h3>
                      <p className="text-slate-300 mb-4">{report.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>Reported: {new Date(report.created_at).toLocaleString()}</span>
                        {report.handled_at && (
                          <span>Handled: {new Date(report.handled_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                      {report.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReportAction(report.id, 'approve', 'Report approved')}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'dismiss', 'Report dismissed')}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <div key={user.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={user.avatar_url || '/default-avatar.png'}
                      alt={user.username}
                      className="w-12 h-12 rounded-full border-2 border-slate-600"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{user.display_name || user.username}</h3>
                      <p className="text-slate-400">@{user.username}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Role:</span>
                      <span className="text-white">{user.role}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Status:</span>
                      <span className={`${
                        user.is_active ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Trust Score:</span>
                      <span className="text-white">{user.trust_score || 50}/100</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUserAction(user.user_id, 'warn', 'User warned')}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Warning className="w-4 h-4 inline mr-1" />
                      Warn
                    </button>
                    <button
                      onClick={() => handleUserAction(user.user_id, 'restrict', 'User restricted')}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4 inline mr-1" />
                      Restrict
                    </button>
                    <button
                      onClick={() => handleUserAction(user.user_id, 'ban', 'User banned')}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4 inline mr-1" />
                      Ban
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Detail Modal */}
        <AnimatePresence>
          {selectedReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedReport(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Report Details</h2>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Report Information</h3>
                    <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reason:</span>
                        <span className="text-white">{selectedReport.reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Urgency:</span>
                        <span className={`${
                          selectedReport.urgency === 'critical' ? 'text-red-400' :
                          selectedReport.urgency === 'high' ? 'text-orange-400' :
                          selectedReport.urgency === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                        }`}>
                          {selectedReport.urgency.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className={`${
                          selectedReport.status === 'pending' ? 'text-orange-400' :
                          selectedReport.status === 'resolved' ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {selectedReport.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-slate-300 bg-slate-700/50 rounded-lg p-4">{selectedReport.description}</p>
                  </div>

                  {selectedReport.evidence && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Evidence</h3>
                      <p className="text-slate-300 bg-slate-700/50 rounded-lg p-4">{selectedReport.evidence}</p>
                    </div>
                  )}

                  {selectedReport.status === 'pending' && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          handleReportAction(selectedReport.id, 'approve', 'Report approved');
                          setSelectedReport(null);
                        }}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Approve Report
                      </button>
                      <button
                        onClick={() => {
                          handleReportAction(selectedReport.id, 'dismiss', 'Report dismissed');
                          setSelectedReport(null);
                        }}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Dismiss Report
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
