import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, AlertCircle, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom';

interface Announcement {
  id: string;
  title?: string | null;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'system';
  priority: number;
  action_url?: string | null;
  action_text?: string | null;
  is_dismissible: boolean;
  created_at: string;
}

interface AnnouncementBannerProps {
  announcement: Announcement;
  onDismiss: (id: string) => void;
}

const typeConfig = {
  info: {
    icon: Info,
    bgGradient: 'bg-gradient-to-r from-slate-800/95 via-blue-900/30 to-slate-800/95',
    borderColor: 'border-blue-500/50',
    textColor: 'text-slate-100',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    buttonBg: 'bg-blue-500/20 hover:bg-blue-500/30',
    buttonBorder: 'border-blue-500/50',
  },
  warning: {
    icon: AlertTriangle,
    bgGradient: 'bg-gradient-to-r from-slate-800/95 via-yellow-900/30 to-slate-800/95',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-slate-100',
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20',
    buttonBg: 'bg-yellow-500/20 hover:bg-yellow-500/30',
    buttonBorder: 'border-yellow-500/50',
  },
  success: {
    icon: CheckCircle,
    bgGradient: 'bg-gradient-to-r from-slate-800/95 via-green-900/30 to-slate-800/95',
    borderColor: 'border-green-500/50',
    textColor: 'text-slate-100',
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/20',
    buttonBg: 'bg-green-500/20 hover:bg-green-500/30',
    buttonBorder: 'border-green-500/50',
  },
  error: {
    icon: AlertCircle,
    bgGradient: 'bg-gradient-to-r from-slate-800/95 via-red-900/30 to-slate-800/95',
    borderColor: 'border-red-500/50',
    textColor: 'text-slate-100',
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/20',
    buttonBg: 'bg-red-500/20 hover:bg-red-500/30',
    buttonBorder: 'border-red-500/50',
  },
  system: {
    icon: Megaphone,
    bgGradient: 'bg-gradient-to-r from-slate-800/95 via-purple-900/30 to-slate-800/95',
    borderColor: 'border-purple-500/50',
    textColor: 'text-slate-100',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    buttonBg: 'bg-purple-500/20 hover:bg-purple-500/30',
    buttonBorder: 'border-purple-500/50',
  },
};

export default function AnnouncementBanner({ announcement, onDismiss }: AnnouncementBannerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[announcement.type] || typeConfig.info;
  const Icon = config.icon;

  // Track view
  useEffect(() => {
    if (isVisible && user) {
      trackView();
    }
  }, [announcement.id, user, isVisible]);

  const trackView = async () => {
    try {
      await supabase.rpc('track_announcement_view', {
        p_announcement_id: announcement.id,
        p_user_id: user?.id || null,
      });
    } catch (error) {
      console.error('Failed to track announcement view:', error);
    }
  };

  const handleDismiss = async () => {
    if (!announcement.is_dismissible || !user) return;

    try {
      const { error } = await supabase
        .from('announcement_dismissals')
        .insert({
          announcement_id: announcement.id,
          user_id: user.id,
        });

      if (error) throw error;

      setIsVisible(false);
      setTimeout(() => onDismiss(announcement.id), 300);
    } catch (error) {
      console.error('Failed to dismiss announcement:', error);
    }
  };

  const handleAction = () => {
    if (announcement.action_url) {
      if (announcement.action_url.startsWith('/')) {
        navigate(announcement.action_url);
      } else {
        window.open(announcement.action_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`${config.bgGradient} ${config.borderColor} border-b backdrop-blur-sm shadow-xl`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-4 relative">
            {/* Centered content with icon */}
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <div className="flex items-center gap-3 justify-center">
                <div className={`${config.iconBg} p-2 rounded-lg flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div className="flex flex-col items-center">
                  {announcement.title && (
                    <h3 className={`${config.textColor} font-semibold text-sm mb-1`}>
                      {announcement.title}
                    </h3>
                  )}
                  <p className={`${config.textColor} text-sm leading-relaxed`}>
                    {announcement.message}
                  </p>
                </div>
              </div>
              {announcement.action_url && (
                <button
                  onClick={handleAction}
                  className={`${config.buttonBg} ${config.buttonBorder} ${config.textColor} px-4 py-2 rounded-lg border backdrop-blur-sm text-sm font-medium transition-all duration-200 flex items-center gap-1.5 hover:shadow-lg mt-2`}
                >
                  {announcement.action_text || 'Learn More'}
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Close button on the right */}
            {announcement.is_dismissible && user && (
              <button
                onClick={handleDismiss}
                className={`${config.textColor} hover:bg-slate-700/50 p-2 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0 absolute right-0`}
                aria-label="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

