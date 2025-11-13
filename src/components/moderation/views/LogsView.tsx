import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Loader2,
  Upload,
  FileText,
  Heart,
  MessageSquare,
  Flag,
  UserPlus,
  Settings,
  Image as ImageIcon,
  Sticker,
  Layout,
  HardDrive,
  X,
  Trash2,
  Eye,
  X as XIcon,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: string;
  type: 'moderation' | 'upload' | 'user' | 'report' | 'download' | 'favorite' | 'feedback' | 'account' | 'backup' | 'deletion';
  action: string;
  description: string;
  user_id?: string;
  target_user_id?: string;
  user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  target_user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  created_at: string;
  metadata?: any;
}

export default function LogsView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [logDetails, setLogDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs: ActivityLog[] = [];
      const userIds = new Set<string>();

      // 1. Moderation Logs
      const { data: modLogs, error: modError } = await supabase
        .from('moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!modError && modLogs) {
        modLogs.forEach(log => {
          if (log.moderator_id) userIds.add(log.moderator_id);
          if (log.target_user_id) userIds.add(log.target_user_id);
          
          // Categorize account_updated logs as 'account' type instead of 'moderation'
          const logType = log.action === 'account_updated' ? 'account' : 'moderation';
          
          allLogs.push({
            id: log.id,
            type: logType,
            action: log.action || 'moderation_action',
            description: log.description || log.title || `${log.action} action`,
            user_id: log.moderator_id,
            target_user_id: log.target_user_id,
            created_at: log.created_at,
            metadata: log
          });
        });
      }

      // 2. Content Uploads - Profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, title, type, category, created_at, status')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!profilesError && profiles) {
        profiles.forEach(profile => {
          if (profile.user_id) userIds.add(profile.user_id);
          allLogs.push({
            id: profile.id,
            type: 'upload',
            action: 'upload_profile',
            description: `Uploaded ${profile.type} "${profile.title}" (${profile.category})`,
            user_id: profile.user_id,
            created_at: profile.created_at,
            metadata: { content_type: 'profile', status: profile.status }
          });
        });
      }

      // 3. Content Uploads - Emotes
      const { data: emotes, error: emotesError } = await supabase
        .from('emotes')
        .select('id, user_id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!emotesError && emotes) {
        emotes.forEach(emote => {
          if (emote.user_id) userIds.add(emote.user_id);
          allLogs.push({
            id: emote.id,
            type: 'upload',
            action: 'upload_emote',
            description: `Uploaded emote "${emote.title}"`,
            user_id: emote.user_id,
            created_at: emote.created_at,
            metadata: { content_type: 'emote', status: emote.status }
          });
        });
      }

      // 4. Content Uploads - Wallpapers
      const { data: wallpapers, error: wallpapersError } = await supabase
        .from('wallpapers')
        .select('id, user_id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!wallpapersError && wallpapers) {
        wallpapers.forEach(wallpaper => {
          if (wallpaper.user_id) userIds.add(wallpaper.user_id);
          allLogs.push({
            id: wallpaper.id,
            type: 'upload',
            action: 'upload_wallpaper',
            description: `Uploaded wallpaper "${wallpaper.title}"`,
            user_id: wallpaper.user_id,
            created_at: wallpaper.created_at,
            metadata: { content_type: 'wallpaper', status: wallpaper.status }
          });
        });
      }

      // 5. Content Uploads - Emoji Combos
      try {
        const { data: emojiCombos, error: emojiCombosError } = await supabase
          .from('emoji_combos')
          .select('id, user_id, title, created_at, status')
          .order('created_at', { ascending: false })
          .limit(500);

        if (!emojiCombosError && emojiCombos) {
          emojiCombos.forEach(combo => {
            if (combo.user_id) userIds.add(combo.user_id);
            allLogs.push({
              id: combo.id,
              type: 'upload',
              action: 'upload_emoji_combo',
              description: `Uploaded emoji combo "${combo.title || 'Untitled'}"`,
              user_id: combo.user_id,
              created_at: combo.created_at,
              metadata: { content_type: 'emoji_combo', status: combo.status }
            });
          });
        }
      } catch (error) {
        console.warn('Error loading emoji combos:', error);
      }

      // 6. User Registrations
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!usersError && userProfiles) {
        userProfiles.forEach(profile => {
          if (profile.user_id) userIds.add(profile.user_id);
          // Account creation
          allLogs.push({
            id: `user-${profile.user_id}`,
            type: 'user',
            action: 'account_created',
            description: `Account created: @${profile.username || profile.user_id}`,
            user_id: profile.user_id,
            created_at: profile.created_at,
            metadata: { username: profile.username }
          });
        });
      }

      // Account updates are now tracked via moderation_logs with action 'account_updated'
      // They're already included in the moderation logs section above

      // 7. Reports
      try {
        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('id, user_id, reported_user_id, reason, details, created_at, status')
          .order('created_at', { ascending: false })
          .limit(500);

        if (!reportsError && reports) {
          reports.forEach(report => {
            if (report.user_id) userIds.add(report.user_id);
            if (report.reported_user_id) userIds.add(report.reported_user_id);
            allLogs.push({
              id: report.id,
              type: 'report',
              action: 'report_submitted',
              description: `Report submitted: ${report.reason || 'No reason provided'}`,
              user_id: report.user_id,
              target_user_id: report.reported_user_id,
              created_at: report.created_at,
              metadata: { status: report.status, details: report.details }
            });
          });
        }
      } catch (error) {
        console.warn('Error loading reports:', error);
      }

      // 8. Downloads
      const { data: downloads, error: downloadsError } = await supabase
        .from('downloads')
        .select('id, user_id, profile_id, downloaded_at')
        .order('downloaded_at', { ascending: false })
        .limit(500);

      if (!downloadsError && downloads) {
        downloads.forEach(download => {
          if (download.user_id) userIds.add(download.user_id);
          allLogs.push({
            id: download.id,
            type: 'download',
            action: 'content_downloaded',
            description: `Downloaded content`,
            user_id: download.user_id,
            created_at: download.downloaded_at,
            metadata: { profile_id: download.profile_id }
          });
        });
      }

      // 9. Favorites
      const { data: favorites, error: favoritesError } = await supabase
        .from('favorites')
        .select('id, user_id, profile_id, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!favoritesError && favorites) {
        favorites.forEach(favorite => {
          if (favorite.user_id) userIds.add(favorite.user_id);
          allLogs.push({
            id: favorite.id,
            type: 'favorite',
            action: 'content_favorited',
            description: `Favorited content`,
            user_id: favorite.user_id,
            created_at: favorite.created_at,
            metadata: { profile_id: favorite.profile_id }
          });
        });
      }

      // 10. Feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback')
        .select('id, user_id, type, message, created_at, status')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!feedbackError && feedback) {
        feedback.forEach(item => {
          if (item.user_id) userIds.add(item.user_id);
          allLogs.push({
            id: item.id,
            type: 'feedback',
            action: 'feedback_submitted',
            description: `Feedback submitted: ${item.type} - ${item.message.substring(0, 50)}${item.message.length > 50 ? '...' : ''}`,
            user_id: item.user_id,
            created_at: item.created_at,
            metadata: { type: item.type, status: item.status }
          });
        });
      }

      // 11. Account Backups
      const { data: backups, error: backupsError } = await supabase
        .from('account_backups')
        .select('id, user_id, created_at, restored_at, version')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!backupsError && backups) {
        backups.forEach(backup => {
          if (backup.user_id) userIds.add(backup.user_id);
          // Backup created/uploaded
          allLogs.push({
            id: `backup-created-${backup.id}`,
            type: 'backup',
            action: 'backup_uploaded',
            description: `Account backup created (version ${backup.version || '1.0'})`,
            user_id: backup.user_id,
            created_at: backup.created_at,
            metadata: { backup_id: backup.id, version: backup.version }
          });
          // Backup restored/downloaded
          if (backup.restored_at) {
            allLogs.push({
              id: `backup-restored-${backup.id}`,
              type: 'backup',
              action: 'backup_downloaded',
              description: `Account backup restored (version ${backup.version || '1.0'})`,
              user_id: backup.user_id,
              created_at: backup.restored_at,
              metadata: { backup_id: backup.id, version: backup.version }
            });
          }
        });
      }

      // 12. Account Deletion Logs (from moderation_logs with specific actions)
      const { data: deletionLogs, error: deletionError } = await supabase
        .from('moderation_logs')
        .select('*')
        .in('action', ['account_deletion_started', 'account_deletion_cancelled', 'account_deleted'])
        .order('created_at', { ascending: false })
        .limit(500);

      if (!deletionError && deletionLogs) {
        deletionLogs.forEach(log => {
          if (log.target_user_id) userIds.add(log.target_user_id);
          if (log.moderator_id) userIds.add(log.moderator_id);
          allLogs.push({
            id: log.id,
            type: 'deletion',
            action: log.action,
            description: log.description || log.title || `${log.action.replace(/_/g, ' ')}`,
            user_id: log.target_user_id || log.moderator_id,
            target_user_id: log.target_user_id,
            created_at: log.created_at,
            metadata: log
          });
        });
      }

      // Fetch all user data including avatars
      let usersMap: Record<string, { username: string; display_name: string; avatar_url?: string }> = {};
      if (userIds.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', Array.from(userIds));
        
        if (!usersError && usersData) {
          usersMap = usersData.reduce((acc, user) => {
            acc[user.user_id] = { 
              username: user.username, 
              display_name: user.display_name,
              avatar_url: user.avatar_url || undefined
            };
            return acc;
          }, {} as Record<string, { username: string; display_name: string; avatar_url?: string }>);
        }
      }

      // Combine logs with user data and sort by date
      const logsWithUsers = allLogs.map(log => ({
        ...log,
        user: log.user_id ? usersMap[log.user_id] : undefined,
        target_user: log.target_user_id ? usersMap[log.target_user_id] : undefined
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setLogs(logsWithUsers);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type: string, action: string) => {
    if (type === 'moderation') {
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
    }
    
    switch (type) {
      case 'upload':
        if (action.includes('emote')) return <Sticker className="w-4 h-4 text-orange-400" />;
        if (action.includes('wallpaper')) return <ImageIcon className="w-4 h-4 text-indigo-400" />;
        if (action.includes('emoji')) return <Sticker className="w-4 h-4 text-yellow-400" />;
        return <Upload className="w-4 h-4 text-purple-400" />;
      case 'user':
        return <UserPlus className="w-4 h-4 text-green-400" />;
      case 'report':
        return <Flag className="w-4 h-4 text-red-400" />;
      case 'download':
        return <Download className="w-4 h-4 text-blue-400" />;
      case 'favorite':
        return <Heart className="w-4 h-4 text-pink-400" />;
      case 'feedback':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'account':
        return <Settings className="w-4 h-4 text-slate-400" />;
      case 'backup':
        if (action.includes('downloaded') || action.includes('restored')) {
          return <Download className="w-4 h-4 text-blue-400" />;
        }
        return <HardDrive className="w-4 h-4 text-green-400" />;
      case 'deletion':
        if (action.includes('cancelled')) {
          return <X className="w-4 h-4 text-yellow-400" />;
        }
        return <Trash2 className="w-4 h-4 text-red-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionColor = (type: string, action: string) => {
    if (type === 'moderation') {
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
    }
    
    switch (type) {
      case 'upload':
        return 'text-purple-400 bg-purple-500/20';
      case 'user':
        return 'text-green-400 bg-green-500/20';
      case 'report':
        return 'text-red-400 bg-red-500/20';
      case 'download':
        return 'text-blue-400 bg-blue-500/20';
      case 'favorite':
        return 'text-pink-400 bg-pink-500/20';
      case 'feedback':
        return 'text-cyan-400 bg-cyan-500/20';
      case 'account':
        return 'text-slate-400 bg-slate-500/20';
      case 'backup':
        if (action.includes('downloaded') || action.includes('restored')) {
          return 'text-blue-400 bg-blue-500/20';
        }
        return 'text-green-400 bg-green-500/20';
      case 'deletion':
        if (action.includes('cancelled')) {
          return 'text-yellow-400 bg-yellow-500/20';
        }
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'moderation': return 'Moderation';
      case 'upload': return 'Upload';
      case 'user': return 'User';
      case 'report': return 'Report';
      case 'download': return 'Download';
      case 'favorite': return 'Favorite';
      case 'feedback': return 'Feedback';
      case 'account': return 'Account';
      case 'backup': return 'Backup';
      case 'deletion': return 'Deletion';
      default: return type;
    }
  };

  const loadLogDetails = async (log: ActivityLog) => {
    setSelectedLog(log);
    setViewMode('detail');
    setLoadingDetails(true);
    setLogDetails(null);

    try {
      let details: any = { ...log.metadata };

      // Load additional details based on log type
      if (log.type === 'account' && log.action === 'account_updated' && log.user_id) {
        // For account updates, use metadata if available (contains changes), otherwise fetch current profile
        if (log.metadata?.changes) {
          details.changes = log.metadata.changes;
          details.previous_profile = log.metadata.previous_profile;
          details.new_profile = log.metadata.new_profile;
        } else {
          // Fallback: fetch current profile if metadata doesn't have changes
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', log.user_id)
            .single();
          
          if (profile) {
            details.current_profile = profile;
          }
        }
      } else if (log.type === 'upload' && log.metadata?.content_type) {
        // For uploads, fetch the content details
        const tableName = log.metadata.content_type === 'profile' ? 'profiles' :
                         log.metadata.content_type === 'emote' ? 'emotes' :
                         log.metadata.content_type === 'wallpaper' ? 'wallpapers' :
                         log.metadata.content_type === 'emoji_combo' ? 'emoji_combos' : null;
        
        if (tableName && log.id) {
          const { data: content } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', log.id)
            .single();
          
          if (content) {
            details.content = content;
          }
        }
      } else if (log.type === 'report' && log.id) {
        // For reports, fetch full report details
        const { data: report } = await supabase
          .from('reports')
          .select('*')
          .eq('id', log.id)
          .single();
        
        if (report) {
          details.report = report;
        }
      } else if (log.type === 'moderation' && log.metadata) {
        // Moderation logs already have metadata
        details = log.metadata;
      } else if (log.type === 'backup' && log.metadata?.backup_id) {
        // For backups, fetch backup details
        const { data: backup } = await supabase
          .from('account_backups')
          .select('*')
          .eq('id', log.metadata.backup_id)
          .single();
        
        if (backup) {
          details.backup = backup;
        }
      }

      setLogDetails(details);
    } catch (error) {
      console.error('Error loading log details:', error);
      toast.error('Failed to load log details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const renderLogDetails = () => {
    if (!selectedLog) return null;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
          {getActionIcon(selectedLog.type, selectedLog.action)}
          <div>
            <h2 className="text-2xl font-bold text-white">Log Details</h2>
            <p className="text-sm text-slate-400">{getTypeLabel(selectedLog.type)} - {selectedLog.action.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Log Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Type:</span>
              <span className="ml-2 text-white">{getTypeLabel(selectedLog.type)}</span>
            </div>
            <div>
              <span className="text-slate-400">Action:</span>
              <span className="ml-2 text-white">{selectedLog.action.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-slate-400">Date:</span>
              <span className="ml-2 text-white">{new Date(selectedLog.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400">Description:</span>
              <span className="ml-2 text-white">{selectedLog.description}</span>
            </div>
          </div>
        </div>

        {/* Account Update Details */}
        {selectedLog.type === 'account' && selectedLog.action === 'account_updated' && (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">Account Changes</h3>
            {logDetails?.changes && Object.keys(logDetails.changes).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(logDetails.changes).map(([field, change]: [string, any]) => (
                  <div key={field} className="border-b border-slate-700 pb-3 last:border-b-0 last:pb-0">
                    <div className="text-sm font-medium text-slate-300 mb-2 capitalize">
                      {field.replace(/_/g, ' ')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Before</div>
                        <div className="text-sm text-red-300 bg-red-500/10 rounded px-2 py-1 break-words">
                          {change.before === null || change.before === undefined 
                            ? <span className="italic text-slate-500">(empty)</span>
                            : typeof change.before === 'object' 
                              ? JSON.stringify(change.before)
                              : String(change.before)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">After</div>
                        <div className="text-sm text-green-300 bg-green-500/10 rounded px-2 py-1 break-words">
                          {change.after === null || change.after === undefined 
                            ? <span className="italic text-slate-500">(empty)</span>
                            : typeof change.after === 'object' 
                              ? JSON.stringify(change.after)
                              : String(change.after)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : logDetails?.current_profile ? (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400">Username:</span>
                    <span className="ml-2 text-white">{logDetails.current_profile.username || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Display Name:</span>
                    <span className="ml-2 text-white">{logDetails.current_profile.display_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Bio:</span>
                    <span className="ml-2 text-white">{logDetails.current_profile.bio || 'No bio'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Role:</span>
                    <span className="ml-2 text-white">{logDetails.current_profile.role || 'user'}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Note: Change tracking not available for this log entry.</p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No change details available.</p>
            )}
          </div>
        )}

        {/* Upload Details */}
        {selectedLog.type === 'upload' && logDetails?.content && (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">Content Details</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Title:</span>
                  <span className="ml-2 text-white">{logDetails.content.title || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className="ml-2 text-white capitalize">{logDetails.content.status || 'N/A'}</span>
                </div>
                {logDetails.content.category && (
                  <div>
                    <span className="text-slate-400">Category:</span>
                    <span className="ml-2 text-white capitalize">{logDetails.content.category}</span>
                  </div>
                )}
                {logDetails.content.type && (
                  <div>
                    <span className="text-slate-400">Type:</span>
                    <span className="ml-2 text-white capitalize">{logDetails.content.type}</span>
                  </div>
                )}
              </div>
              {logDetails.content.tags && logDetails.content.tags.length > 0 && (
                <div>
                  <span className="text-slate-400">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {logDetails.content.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Details */}
        {selectedLog.type === 'report' && logDetails?.report && (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">Report Details</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Reason:</span>
                  <span className="ml-2 text-white">{logDetails.report.reason || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className="ml-2 text-white capitalize">{logDetails.report.status || 'N/A'}</span>
                </div>
              </div>
              {logDetails.report.details && (
                <div>
                  <span className="text-slate-400">Details:</span>
                  <p className="mt-1 text-white">{logDetails.report.details}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Backup Details */}
        {selectedLog.type === 'backup' && logDetails?.backup && (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">Backup Details</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Version:</span>
                  <span className="ml-2 text-white">{logDetails.backup.version || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Created:</span>
                  <span className="ml-2 text-white">{new Date(logDetails.backup.created_at).toLocaleString()}</span>
                </div>
                {logDetails.backup.restored_at && (
                  <div>
                    <span className="text-slate-400">Restored:</span>
                    <span className="ml-2 text-white">{new Date(logDetails.backup.restored_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
              {logDetails.backup.backup_data?.summary && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-2">Backup Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400">Total Content:</span>
                      <span className="ml-2 text-white">{logDetails.backup.backup_data.summary.totalContent || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Favorites:</span>
                      <span className="ml-2 text-white">{logDetails.backup.backup_data.summary.totalFavorites || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw Metadata */}
        {logDetails && Object.keys(logDetails).length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">Raw Data</h3>
            <pre className="bg-slate-900 rounded p-3 text-xs text-slate-300 overflow-auto max-h-64">
              {JSON.stringify(logDetails, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesType && matchesAction;
  });

  const uniqueTypes = [...new Set(logs.map(log => log.type))];
  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedLog(null);
    setLogDetails(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  // Detail View
  if (viewMode === 'detail' && selectedLog) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Logs</span>
        </button>

        {/* Detail Content */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading details...</p>
              </div>
            </div>
          ) : (
            renderLogDetails()
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Activity Logs</h2>
          <p className="text-slate-400">View all website activity including uploads, moderation, reports, and more</p>
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
      <div className="flex items-center space-x-4 flex-wrap gap-4">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
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
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>
              {getTypeLabel(type)}
            </option>
          ))}
        </select>
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
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          <table className="w-full">
            <thead className="bg-slate-700 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-600 shadow-lg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider min-w-32 bg-slate-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredLogs.map((log, index) => (
                <motion.tr
                  key={`${log.type}-${log.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-slate-700/50 cursor-pointer"
                  onClick={() => loadLogDetails(log)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${getActionColor(log.type, log.action)}`}>
                      {getTypeLabel(log.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {getActionIcon(log.type, log.action)}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user ? (
                      <div className="flex items-center space-x-3">
                        {log.user.avatar_url ? (
                          <img
                            src={log.user.avatar_url}
                            alt={log.user.display_name || log.user.username || 'User'}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/50"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center';
                                fallback.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                                parent.insertBefore(fallback, target);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">
                            {log.user.display_name || log.user.username || 'Unknown'}
                          </div>
                          <div className="text-sm text-slate-400">
                            @{log.user.username || 'unknown'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.target_user ? (
                      <div className="flex items-center space-x-3">
                        {log.target_user.avatar_url ? (
                          <img
                            src={log.target_user.avatar_url}
                            alt={log.target_user.display_name || log.target_user.username || 'User'}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-500/50"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center';
                                fallback.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                                parent.insertBefore(fallback, target);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">
                            {log.target_user.display_name || log.target_user.username}
                          </div>
                          <div className="text-sm text-slate-400">
                            @{log.target_user.username}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm text-white break-words">
                      {log.description || 'No description'}
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
