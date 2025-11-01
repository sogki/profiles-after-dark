import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Edit3, Save, X, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';

export default function AnnouncementsView() {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncement();
    
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
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            if (payload.new?.is_active) {
              setAnnouncement(payload.new.message);
            } else {
              setAnnouncement(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, message, is_active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data.length > 0 && data[0].is_active) {
        setAnnouncement(data[0].message);
      } else {
        setAnnouncement(null);
      }
    } catch (error) {
      console.error('Failed to fetch announcement', error);
      toast.error('Failed to fetch announcement');
    } finally {
      setLoading(false);
    }
  };

  const saveAnnouncement = async () => {
    if (!announcementDraft.trim()) {
      toast.error('Announcement message cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .upsert(
          [
            {
              id: 1,
              message: announcementDraft.trim(),
              is_active: true,
            },
          ],
          { onConflict: 'id' }
        );

      if (error) throw error;

      toast.success('Announcement saved successfully');
      setAnnouncement(announcementDraft.trim());
      setIsEditingAnnouncement(false);
    } catch (error) {
      toast.error('Failed to save announcement');
      console.error(error);
    }
  };

  const deleteAnnouncement = async () => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: false })
        .eq('id', 1);

      if (error) throw error;

      toast.success('Announcement deleted');
      setAnnouncement(null);
      setIsEditingAnnouncement(false);
      setAnnouncementDraft('');
    } catch (error) {
      toast.error('Failed to delete announcement');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading announcement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Megaphone className="w-6 h-6 text-white" />
        <h2 className="text-2xl font-bold text-white">ANNOUNCEMENTS</h2>
      </div>

      {/* Announcement Content */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isEditingAnnouncement ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 space-y-4"
          >
            <textarea
              value={announcementDraft}
              onChange={(e) => setAnnouncementDraft(e.target.value)}
              className="w-full min-h-[120px] p-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
              rows={4}
              placeholder="Write your announcement here..."
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={saveAnnouncement}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  setIsEditingAnnouncement(false);
                  setAnnouncementDraft(announcement || '');
                }}
                className="flex items-center space-x-2 bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              {announcement && (
                <button
                  onClick={deleteAnnouncement}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-slate-700 rounded-lg p-4 min-h-[100px]">
              <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">
                {announcement || 'No active announcements.'}
              </p>
            </div>
            <button
              onClick={() => {
                setAnnouncementDraft(announcement || '');
                setIsEditingAnnouncement(true);
              }}
              className="w-full flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg transition-colors text-sm font-medium text-white"
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span>Edit Announcement</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

