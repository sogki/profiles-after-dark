import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Eye,
  Edit,
  Key,
  UserX,
  UserCheck,
  Ban,
  AlertTriangle,
  Settings,
  Camera,
  Image,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Lock,
  Unlock,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  email?: string;
}

interface UserAction {
  id: string;
  action: string;
  moderator_id: string;
  target_user_id: string;
  reason?: string;
  created_at: string;
  moderator?: {
    username: string;
    display_name: string;
  };
}

export default function EnhancedUserManagementView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [actionModal, setActionModal] = useState({
    open: false,
    action: '',
    reason: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserActions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('moderation_logs')
        .select(`
          *,
          moderator:moderator_id(username, display_name)
        `)
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserActions(data);
      }
    } catch (error) {
      console.error('Error loading user actions:', error);
    }
  };

  const handleUserAction = async (action: string, reason?: string) => {
    if (!selectedUser) return;

    try {
      // Log the action
      const { error: logError } = await supabase
        .from('moderation_logs')
        .insert({
          action,
          moderator_id: 'current_moderator', // Replace with actual moderator ID
          target_user_id: selectedUser.user_id,
          description: reason || `User ${action}ed`,
          created_at: new Date().toISOString()
        });

      if (logError) throw logError;

      // Update user status if needed
      if (action === 'ban' || action === 'unban') {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ is_active: action === 'unban' })
          .eq('user_id', selectedUser.user_id);

        if (updateError) throw updateError;
      }

      // Send notification to user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedUser.user_id,
          title: `Account ${action === 'ban' ? 'Suspended' : action === 'unban' ? 'Restored' : 'Updated'}`,
          message: reason || `Your account has been ${action}ed by a moderator.`,
          type: 'account_action',
          priority: 'high',
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.warn('Failed to send notification:', notificationError);
      }

      toast.success(`User ${action}ed successfully`);
      setActionModal({ open: false, action: '', reason: '' });
      loadUsers();
      loadUserActions(selectedUser.user_id);
    } catch (error) {
      console.error('Error performing user action:', error);
      toast.error('Failed to perform action');
    }
  };

  const updateUserProfile = async (userData: Partial<UserProfile>) => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(userData)
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      // Send notification to user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: editingUser.user_id,
          title: 'Profile Updated',
          message: 'Your profile information has been updated by a moderator.',
          type: 'profile_update',
          priority: 'medium',
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.warn('Failed to send notification:', notificationError);
      }

      toast.success('User profile updated successfully');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error('Failed to update user profile');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'banned' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-slate-400">Manage user accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadUsers}
            className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="staff">Staff</option>
          <option value="user">User</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6"
          >
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{user.display_name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {user.is_active ? 'Active' : 'Banned'}
                  </span>
                </div>
                
                <p className="text-slate-400 text-sm mb-1">@{user.username}</p>
                <p className="text-slate-500 text-xs mb-3">
                  {user.role} • Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
                
                {user.bio && (
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">{user.bio}</p>
                )}
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserModal(true);
                      loadUserActions(user.user_id);
                    }}
                    className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => setEditingUser(user)}
                    className="flex items-center px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">No users found</p>
        </div>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="space-y-6">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Profile Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center overflow-hidden">
                          {selectedUser.avatar_url ? (
                            <img
                              src={selectedUser.avatar_url}
                              alt={selectedUser.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-10 h-10 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-white font-medium">{selectedUser.display_name}</h5>
                          <p className="text-slate-400 text-sm">@{selectedUser.username}</p>
                          <p className="text-slate-500 text-xs">{selectedUser.role}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Status:</span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            selectedUser.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {selectedUser.is_active ? 'Active' : 'Banned'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Joined:</span>
                          <span className="text-white ml-2">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {selectedUser.bio && (
                        <div>
                          <span className="text-slate-400 text-sm">Bio:</span>
                          <p className="text-white text-sm mt-1">{selectedUser.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setActionModal({ open: true, action: selectedUser.is_active ? 'ban' : 'unban', reason: '' })}
                        className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                          selectedUser.is_active 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {selectedUser.is_active ? <Ban className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                        {selectedUser.is_active ? 'Ban User' : 'Unban User'}
                      </button>
                      <button
                        onClick={() => setActionModal({ open: true, action: 'reset_password', reason: '' })}
                        className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Reset Password
                      </button>
                      <button
                        onClick={() => setActionModal({ open: true, action: 'change_username', reason: '' })}
                        className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Change Username
                      </button>
                      <button
                        onClick={() => setActionModal({ open: true, action: 'send_warning', reason: '' })}
                        className="flex items-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Send Warning
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Actions History */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Action History</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {userActions.length > 0 ? (
                      userActions.map((action) => (
                        <div key={action.id} className="flex items-center space-x-3 p-3 bg-slate-600/50 rounded-lg">
                          <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center">
                            <Activity className="w-4 h-4 text-slate-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{action.action}</p>
                            <p className="text-slate-400 text-xs">
                              by {action.moderator?.display_name || 'Unknown'} • {new Date(action.created_at).toLocaleDateString()}
                            </p>
                            {action.description && (
                              <p className="text-slate-300 text-xs mt-1">{action.description}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-sm">No actions recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Modal */}
      <AnimatePresence>
        {actionModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setActionModal({ open: false, action: '', reason: '' })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {actionModal.action === 'ban' ? 'Ban User' :
                 actionModal.action === 'unban' ? 'Unban User' :
                 actionModal.action === 'reset_password' ? 'Reset Password' :
                 actionModal.action === 'change_username' ? 'Change Username' :
                 'Send Warning'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={actionModal.reason}
                    onChange={(e) => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for this action..."
                    rows={3}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleUserAction(actionModal.action, actionModal.reason)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setActionModal({ open: false, action: '', reason: '' })}
                    className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
