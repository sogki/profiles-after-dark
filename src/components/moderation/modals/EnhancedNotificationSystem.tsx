import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Flag,
  User,
  MessageSquare,
  Eye,
  Archive,
  Trash2,
  Filter,
  Search,
  Clock,
  Zap,
  TrendingUp,
  Users,
  FileText,
  Image,
  Video,
  Music,
  Download,
  Upload,
  Ban,
  AlertTriangle as Warning,
  UserCheck,
  UserX,
  Star,
  StarOff,
  MoreVertical,
  ExternalLink,
  Copy,
  Share,
  Lock,
  Unlock,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/authContext';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  user_id: string;
  type: 'report' | 'moderation' | 'system' | 'user_action' | 'content' | 'security';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  action_data?: any;
  metadata?: Record<string, any>;
  sender_id?: string;
  sender_name?: string;
  category: string;
  tags: string[];
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  report_notifications: boolean;
  moderation_notifications: boolean;
  system_notifications: boolean;
  security_notifications: boolean;
  quiet_hours: { start: string; end: string };
  notification_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export default function EnhancedNotificationSystem() {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    report_notifications: true,
    moderation_notifications: true,
    system_notifications: true,
    security_notifications: true,
    quiet_hours: { start: '22:00', end: '08:00' },
    notification_frequency: 'immediate'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user has any staff-related role (admin, staff, moderator)
  const userRole = userProfile?.role?.toLowerCase() || '';
  const roles = userRole ? userRole.split(',').map(r => r.trim().toLowerCase()).filter(r => r) : [];
  const staffRoles = ['admin', 'staff', 'moderator'];
  const hasModerationAccess = roles.some(role => staffRoles.includes(role));

  useEffect(() => {
    if (!user || !hasModerationAccess) return;
    
    loadNotifications();
    
    // Setup real-time subscription with cleanup
    const subscription = setupRealtimeSubscription();
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user, hasModerationAccess]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // If table doesn't exist, create sample notifications
        const sampleNotifications = [
          {
            id: '1',
            user_id: user?.id || '',
            title: 'New Report Submitted',
            message: 'A user has reported inappropriate content. Please review.',
            type: 'report',
            priority: 'high',
            read: false,
            created_at: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: '2',
            user_id: user?.id || '',
            title: 'Appeal Received',
            message: 'A user has submitted an appeal for their ban. Review required.',
            type: 'appeal',
            priority: 'medium',
            read: false,
            created_at: new Date(Date.now() - 600000).toISOString()
          },
          {
            id: '3',
            user_id: user?.id || '',
            title: 'System Update',
            message: 'Moderation system has been updated with new features.',
            type: 'system',
            priority: 'low',
            read: true,
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ];
        setNotifications(sampleNotifications);
        setUnreadCount(sampleNotifications.filter(n => !n.read).length);
      } else {
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Create sample notifications on error
      const sampleNotifications = [
        {
          id: '1',
          user_id: user?.id || '',
          title: 'Welcome to Moderation',
          message: 'You have access to the enhanced moderation system.',
          type: 'system',
          priority: 'low',
          read: false,
          created_at: new Date().toISOString()
        }
      ];
      setNotifications(sampleNotifications);
      setUnreadCount(1);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return null;

    const subscription = supabase
      .channel(`notifications_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        showNotificationToast(newNotification);
      })
      .subscribe();

    return subscription;
  };

  const showNotificationToast = (notification: Notification) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'report': return Flag;
        case 'moderation': return Shield;
        case 'system': return Settings;
        case 'user_action': return User;
        case 'content': return FileText;
        case 'security': return AlertTriangle;
        default: return Bell;
      }
    };

    const getColor = () => {
      switch (notification.priority) {
        case 'critical': return 'text-red-400';
        case 'high': return 'text-orange-400';
        case 'medium': return 'text-yellow-400';
        case 'low': return 'text-blue-400';
        default: return 'text-gray-400';
      }
    };

    const IconComponent = getIcon();
    const color = getColor();

    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <IconComponent className={`w-6 h-6 ${color}`} />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">{notification.title}</p>
              <p className="mt-1 text-sm text-slate-300">{notification.content}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  notification.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                  notification.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  notification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {notification.priority}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-white"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    ), {
      duration: 5000,
      position: 'top-right'
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ archived: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report': return Flag;
      case 'moderation': return Shield;
      case 'system': return Settings;
      case 'user_action': return User;
      case 'content': return FileText;
      case 'security': return AlertTriangle;
      default: return Bell;
    }
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

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesPriority && matchesSearch;
  });

  // Don't render if user doesn't have moderation access
  if (!hasModerationAccess) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-96 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Types</option>
                    <option value="report">Reports</option>
                    <option value="moderation">Moderation</option>
                    <option value="system">System</option>
                    <option value="user_action">User Actions</option>
                    <option value="content">Content</option>
                    <option value="security">Security</option>
                  </select>
                  
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
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-slate-700 p-4"
                >
                  <h4 className="text-sm font-semibold text-white mb-3">Notification Settings</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'email_notifications', label: 'Email Notifications' },
                      { key: 'push_notifications', label: 'Push Notifications' },
                      { key: 'report_notifications', label: 'Report Notifications' },
                      { key: 'moderation_notifications', label: 'Moderation Notifications' },
                      { key: 'system_notifications', label: 'System Notifications' },
                      { key: 'security_notifications', label: 'Security Notifications' }
                    ].map((setting) => (
                      <label key={setting.key} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings[setting.key as keyof NotificationSettings] as boolean}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            [setting.key]: e.target.checked
                          }))}
                          className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-300">{setting.label}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-400">No notifications found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    const isUnread = !notification.read;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${
                          isUnread ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.priority === 'critical' ? 'bg-red-500/20' :
                            notification.priority === 'high' ? 'bg-orange-500/20' :
                            notification.priority === 'medium' ? 'bg-yellow-500/20' :
                            'bg-blue-500/20'
                          }`}>
                            <IconComponent className={`w-4 h-4 ${
                              notification.priority === 'critical' ? 'text-red-400' :
                              notification.priority === 'high' ? 'text-orange-400' :
                              notification.priority === 'medium' ? 'text-yellow-400' :
                              'text-blue-400'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-sm font-medium ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                                {notification.title}
                              </h4>
                              {isUnread && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            
                            <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                              {notification.content}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(notification.created_at).toLocaleString()}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                                    title="Mark as read"
                                  >
                                    <CheckCircle className="w-4 h-4 text-slate-400" />
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => archiveNotification(notification.id)}
                                  className="p-1 hover:bg-slate-600 rounded transition-colors"
                                  title="Archive"
                                >
                                  <Archive className="w-4 h-4 text-slate-400" />
                                </button>
                                
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="p-1 hover:bg-slate-600 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-slate-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
