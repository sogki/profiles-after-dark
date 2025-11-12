"use client";

import { Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import toast from "react-hot-toast";

interface ReportContentButtonProps {
  contentId: string;
  contentType: 'profile' | 'profile_pair' | 'emote' | 'wallpaper' | 'emoji_combo' | 'single_upload';
  contentUrl?: string;
  reportedUserId?: string;
  reportedUsername?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'text';
  showOnHover?: boolean;
}

export default function ReportContentButton({
  contentId,
  contentType,
  contentUrl,
  reportedUserId,
  reportedUsername,
  className = '',
  variant = 'icon',
  showOnHover = true
}: ReportContentButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to report content');
      return;
    }

    navigate('/report-form', {
      state: {
        contentId,
        contentType,
        contentUrl,
        reportedUserId,
        reportedUsername
      }
    });
  };

  const getContentTypeLabel = (type: string): string => {
    switch (type) {
      case 'profile': return 'profile';
      case 'profile_pair': return 'profile pair';
      case 'emote': return 'emote';
      case 'wallpaper': return 'wallpaper';
      case 'emoji_combo': return 'emoji combo';
      case 'single_upload': return 'upload';
      default: return 'content';
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleReportClick}
        className={`p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200 ${showOnHover ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} ${className}`}
        title={`Report ${getContentTypeLabel(contentType)}`}
        aria-label={`Report ${getContentTypeLabel(contentType)}`}
      >
        <Flag className="h-4 w-4" />
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleReportClick}
        className={`text-sm text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center gap-1.5 ${className}`}
      >
        <Flag className="h-3.5 w-3.5" />
        <span>Report</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleReportClick}
      className={`px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium ${className}`}
    >
      <Flag className="h-4 w-4" />
      <span>Report</span>
    </button>
  );
}

