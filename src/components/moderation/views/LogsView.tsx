import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  UserCheck,
  UserX,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface ModerationLog {
  id: string;
  action: string;
  moderator_id: string;
  target_user_id?: string;
  target_profile_id?: string;
  description?: string;
  created_at: string;
  moderator?: {
    username: string;
    display_name: string;
  };
  target_user?: {
    username: string;
    display_name: string;
  };
}

export default function LogsView() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterModerator, setFilterModerator] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // First, get the logs without the join
      const { data: logsData, error: logsError } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Get unique user IDs from logs
      const userIds = [...new Set([
        ...(logsData?.map(l => l.moderator_id) || []),
        ...(logsData?.map(l => l.target_user_id).filter(Boolean) || [])
      ])];
      
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

      // Combine logs with user data
      const logsWithUsers = logsData?.map(log => ({
        ...log,
        moderator: usersMap[log.moderator_id] || { username: 'Unknown', display_name: 'Unknown Moderator' },
        target_user: log.target_user_id ? usersMap[log.target_user_id] : undefined
      })) || [];

      setLogs(logsWithUsers);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'ban':
      case 'ban_user':
        return <Ban className="w-4 h-4 text-red-400" />;
      case 'unban':
      case 'unban_user':
        return <UserCheck className="w-4 h-4 text-green-400" />;
      case 'warn':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'approve':
      case 'approve_content':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'reject':
      case 'reject_content':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'delete':
      case 'delete_content':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Shield className="w-4 h-4 text-blue-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'ban':
      case 'ban_user':
      case 'reject':
      case 'reject_content':
      case 'delete':
      case 'delete_content':
        return 'text-red-400 bg-red-500/20';
      case 'unban':
      case 'unban_user':
      case 'approve':
      case 'approve_content':
        return 'text-green-400 bg-green-500/20';
      case 'warn':
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-blue-400 bg-blue-500/20';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.moderator?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesModerator = filterModerator === 'all' || log.moderator_id === filterModerator;
    
    return matchesSearch && matchesAction && matchesModerator;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueModerators = [...new Set(logs.map(log => log.moderator_id))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Moderation Logs</h2>
          <p className="text-slate-400">View recent moderation actions and system events</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadLogs}
            className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>
              {action.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={filterModerator}
          onChange={(e) => setFilterModerator(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Moderators</option>
          {uniqueModerators.map(moderatorId => (
            <option key={moderatorId} value={moderatorId}>
              {logs.find(log => log.moderator_id === moderatorId)?.moderator?.username || moderatorId}
            </option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          <table className="w-full">
            <thead className="bg-slate-700 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-600 shadow-lg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700">Moderator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider min-w-32 bg-slate-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${getActionColor(log.action)}`}>
                          {log.action}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {log.moderator?.display_name || log.moderator?.username || 'Unknown'}
                        </div>
                        <div className="text-sm text-slate-400">
                          {log.moderator?.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.target_user ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {log.target_user.display_name || log.target_user.username}
                          </div>
                          <div className="text-sm text-slate-400">
                            {log.target_user.username}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">System Action</span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm text-white break-words">
                      {log.description || 'No description provided'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400 min-w-32">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Footer */}
        <div className="bg-slate-700/30 px-6 py-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Showing {filteredLogs.length} of {logs.length} logs</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">No logs found</p>
        </div>
      )}
    </div>
  );
}
