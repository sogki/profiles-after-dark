import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  Loader2, 
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Users,
  Clock
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/authContext';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title?: string | null;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'system';
  priority: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  action_url?: string | null;
  action_text?: string | null;
  is_dismissible: boolean;
  target_roles?: string[] | null;
  created_at: string;
  created_by?: string | null;
  updated_at?: string;
}

const typeOptions = [
  { value: 'info', label: 'Info', icon: Info, color: 'bg-blue-600' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-yellow-600' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'bg-green-600' },
  { value: 'error', label: 'Error', icon: AlertCircle, color: 'bg-red-600' },
  { value: 'system', label: 'System', icon: Megaphone, color: 'bg-purple-600' },
];

const roleOptions = ['admin', 'moderator', 'staff', 'user'];

export default function AnnouncementsView() {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'scheduled'>('all');
  
  // Form state
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    message: '',
    type: 'info',
    priority: 0,
    is_active: true,
    start_date: null,
    end_date: null,
    action_url: '',
    action_text: 'Learn More',
    is_dismissible: true,
    target_roles: null,
  });

  useEffect(() => {
    fetchAnnouncements();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('realtime:announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAnnouncements(data || []);
    } catch (error) {
      console.error('Failed to fetch announcements', error);
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 0,
      is_active: true,
      start_date: null,
      end_date: null,
      action_url: '',
      action_text: 'Learn More',
      is_dismissible: true,
      target_roles: null,
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.message?.trim()) {
      toast.error('Announcement message cannot be empty');
      return;
    }

    try {
      const announcementData = {
        ...formData,
        message: formData.message.trim(),
        title: formData.title?.trim() || null,
        action_url: formData.action_url?.trim() || null,
        action_text: formData.action_text?.trim() || 'Learn More',
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        target_roles: formData.target_roles && formData.target_roles.length > 0 ? formData.target_roles : null,
        created_by: userProfile?.user_id || null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Announcement updated successfully');
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([announcementData]);

        if (error) throw error;
        toast.success('Announcement created successfully');
      }

      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to save announcement', error);
      toast.error('Failed to save announcement');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title || '',
      message: announcement.message,
      type: announcement.type,
      priority: announcement.priority,
      is_active: announcement.is_active,
      start_date: announcement.start_date || null,
      end_date: announcement.end_date || null,
      action_url: announcement.action_url || '',
      action_text: announcement.action_text || 'Learn More',
      is_dismissible: announcement.is_dismissible,
      target_roles: announcement.target_roles || null,
    });
    setEditingId(announcement.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement', error);
      toast.error('Failed to delete announcement');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to toggle announcement status', error);
      toast.error('Failed to update announcement');
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (filter === 'active') return announcement.is_active;
    if (filter === 'inactive') return !announcement.is_active;
    if (filter === 'scheduled') {
      const now = new Date();
      const start = announcement.start_date ? new Date(announcement.start_date) : null;
      const end = announcement.end_date ? new Date(announcement.end_date) : null;
      return (start && start > now) || (end && end > now);
    }
    return true;
  });

  const getStatusBadge = (announcement: Announcement) => {
    const now = new Date();
    const start = announcement.start_date ? new Date(announcement.start_date) : null;
    const end = announcement.end_date ? new Date(announcement.end_date) : null;

    if (!announcement.is_active) {
      return <span className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs">Inactive</span>;
    }
    if (start && start > now) {
      return <span className="px-2 py-1 bg-blue-600 text-blue-100 rounded text-xs">Scheduled</span>;
    }
    if (end && end < now) {
      return <span className="px-2 py-1 bg-orange-600 text-orange-100 rounded text-xs">Expired</span>;
    }
    return <span className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs">Active</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Megaphone className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-bold text-white">ANNOUNCEMENTS</h2>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreating(true);
          }}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive', 'scheduled'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === filterOption
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">
              {editingId ? 'Edit Announcement' : 'Create New Announcement'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                <input
                  type="number"
                  value={formData.priority || 0}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0"
                />
                <p className="text-xs text-slate-400 mt-1">Higher priority = shown first</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">End Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Action URL (Optional)</label>
                <input
                  type="text"
                  value={formData.action_url || ''}
                  onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="/path or https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Action Button Text</label>
                <input
                  type="text"
                  value={formData.action_text || 'Learn More'}
                  onChange={(e) => setFormData({ ...formData, action_text: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Learn More"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Message *</label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full min-h-[120px] p-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                rows={4}
                placeholder="Write your announcement message here..."
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.is_dismissible ?? true}
                  onChange={(e) => setFormData({ ...formData, is_dismissible: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Users can dismiss this announcement</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Roles (Optional - leave empty for all users)</label>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.target_roles?.includes(role) || false}
                      onChange={(e) => {
                        const currentRoles = formData.target_roles || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, target_roles: [...currentRoles, role] });
                        } else {
                          setFormData({ ...formData, target_roles: currentRoles.filter(r => r !== role) });
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save</span>
              </button>
              <button
                onClick={resetForm}
                className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white"
              >
                <X className="w-4 h-4 text-white" />
                <span>Cancel</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <Megaphone className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No announcements found</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const TypeIcon = typeOptions.find(opt => opt.value === announcement.type)?.icon || Info;
            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${typeOptions.find(opt => opt.value === announcement.type)?.color || 'bg-slate-600'}`}>
                      <TypeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.title && (
                          <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                        )}
                        {getStatusBadge(announcement)}
                        <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                          Priority: {announcement.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed mb-2">{announcement.message}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        {announcement.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Starts: {new Date(announcement.start_date).toLocaleString()}
                          </span>
                        )}
                        {announcement.end_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Ends: {new Date(announcement.end_date).toLocaleString()}
                          </span>
                        )}
                        {announcement.action_url && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Action: {announcement.action_url}
                          </span>
                        )}
                        {announcement.target_roles && announcement.target_roles.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Roles: {announcement.target_roles.join(', ')}
                          </span>
                        )}
                        {!announcement.is_dismissible && (
                          <span className="text-yellow-400">Non-dismissible</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(announcement.id, announcement.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        announcement.is_active
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {announcement.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
