import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/authContext';
import { handleReportOrAppeal, resolveReportWithAction, ResolutionAction } from '../../../lib/moderationUtils';
import { formatStatus } from '../../../lib/formatStatus';
import ReportResolutionModal from '../modals/ReportResolutionModal';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Calendar,
  Loader2,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

interface Report {
  id: string;
  title?: string;
  description?: string;
  details?: string;
  reason: string;
  status: string;
  priority?: string;
  urgent?: boolean;
  reporter_user_id: string;
  reported_user_id?: string;
  content_id?: string;
  content_type?: string;
  evidence?: string;
  created_at: string;
  updated_at?: string;
  handled_by?: string;
  handled_at?: string;
  reporter?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  reported_user?: {
    username: string;
    display_name: string;
    avatar_url?: string;
    banner_url?: string;
    bio?: string;
    user_id: string;
  };
}

interface ContentPreview {
  id: string;
  title?: string;
  image_url?: string;
  pfp_url?: string;
  banner_url?: string;
  category?: string;
  type?: string;
  user_id?: string;
  user?: {
    username: string;
    display_name: string;
  };
}

export default function ReportDetailView() {
  const params = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = params.reportId || searchParams.get('reportId');
  const { user, userProfile } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [handling, setHandling] = useState(false);
  const [contentPreview, setContentPreview] = useState<ContentPreview | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);

  // Check if user has any staff-related role (admin, staff, moderator)
  const userRole = userProfile?.role?.toLowerCase() || '';
  const roles = userRole ? userRole.split(',').map(r => r.trim().toLowerCase()).filter(r => r) : [];
  const staffRoles = ['admin', 'staff', 'moderator'];
  const hasModerationAccess = roles.some(role => staffRoles.includes(role));

  useEffect(() => {
    if (!hasModerationAccess) {
      navigate('/moderation');
      return;
    }

    if (reportId) {
      loadReport();
    }
  }, [reportId, hasModerationAccess, navigate]);

  const loadReport = async () => {
    if (!reportId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('Error loading report:', error);
        if (error.code === 'PGRST116') {
          toast.error('Report not found');
        } else {
          toast.error('Failed to load report: ' + error.message);
        }
        navigate('/moderation?view=reports');
        return;
      }

      if (!data) {
        toast.error('Report not found');
        navigate('/moderation?view=reports');
        return;
      }

      // Check if user can view this report (only handler can view in_progress reports)
      if (data.status === 'in_progress' && data.handled_by && data.handled_by !== user?.id) {
        toast.error('This report is being handled by another staff member');
        navigate('/moderation?view=reports');
        return;
      }

      // Get reporter and reported user info
      const userIds = [data.reporter_user_id];
      if (data.reported_user_id) {
        userIds.push(data.reported_user_id);
      }

      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, avatar_url, banner_url, bio')
        .in('user_id', userIds);

      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.user_id] = { 
          username: user.username, 
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          banner_url: user.banner_url,
          bio: user.bio,
          user_id: user.user_id
        };
        return acc;
      }, {} as Record<string, any>);

      const reportData = {
        ...data,
        reporter: usersMap[data.reporter_user_id] ? {
          username: usersMap[data.reporter_user_id].username,
          display_name: usersMap[data.reporter_user_id].display_name,
          avatar_url: usersMap[data.reporter_user_id].avatar_url
        } : undefined,
        reported_user: data.reported_user_id ? usersMap[data.reported_user_id] : undefined
      };

      setReport(reportData);

      // Load content preview if content_id exists
      if (data.content_id) {
        await loadContentPreview(data.content_id, data.content_type);
      } else if (data.reported_user_id && !data.content_id) {
        // If reported_user_id exists but no content_id, it's a user profile report
        // Set the content preview from the reported_user data
        if (reportData.reported_user) {
          setContentPreview({
            id: reportData.reported_user.user_id,
            title: reportData.reported_user.display_name || reportData.reported_user.username,
            image_url: reportData.reported_user.avatar_url || undefined,
            banner_url: reportData.reported_user.banner_url || undefined,
            type: 'user_profile',
            user_id: reportData.reported_user.user_id,
            user: {
              username: reportData.reported_user.username,
              display_name: reportData.reported_user.display_name
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load report');
      navigate('/moderation');
    } finally {
      setLoading(false);
    }
  };

  const loadContentPreview = async (contentId: string, contentType?: string) => {
    if (!contentId) return;

    setLoadingContent(true);
    try {
      // Check if it's a user profile report (content_id starts with "user-")
      if (contentId.startsWith('user-')) {
        const userId = contentId.replace('user-', '');
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name, avatar_url, banner_url, bio')
          .eq('user_id', userId)
          .single();

        if (userData) {
          setContentPreview({
            id: userData.user_id,
            title: userData.display_name || userData.username,
            image_url: userData.avatar_url || undefined,
            banner_url: userData.banner_url || undefined,
            type: 'user_profile',
            user_id: userData.user_id,
            user: {
              username: userData.username,
              display_name: userData.display_name
            }
          });
        }
        setLoadingContent(false);
        return;
      }

      // Try to fetch from different content tables
      // First, try profiles table
      let content: any = null;
      let tableName = 'profiles';

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, user_profiles:user_id(username, display_name)')
        .eq('id', contentId)
        .single();

      if (!profileError && profileData) {
        content = profileData;
        tableName = 'profiles';
      } else {
        // Try profile_pairs
        const { data: pairData, error: pairError } = await supabase
          .from('profile_pairs')
          .select('*, user_profiles:user_id(username, display_name)')
          .eq('id', contentId)
          .single();

        if (!pairError && pairData) {
          content = pairData;
          tableName = 'profile_pairs';
        } else {
          // Try emotes
          const { data: emoteData, error: emoteError } = await supabase
            .from('emotes')
            .select('*, user_profiles:user_id(username, display_name)')
            .eq('id', contentId)
            .single();

          if (!emoteError && emoteData) {
            content = emoteData;
            tableName = 'emotes';
          } else {
            // Try wallpapers
            const { data: wallpaperData, error: wallpaperError } = await supabase
              .from('wallpapers')
              .select('*, user_profiles:user_id(username, display_name)')
              .eq('id', contentId)
              .single();

            if (!wallpaperError && wallpaperData) {
              content = wallpaperData;
              tableName = 'wallpapers';
            } else {
              // Try emoji_combos
              const { data: comboData, error: comboError } = await supabase
                .from('emoji_combos')
                .select('*, user_profiles:user_id(username, display_name)')
                .eq('id', contentId)
                .single();

              if (!comboError && comboData) {
                content = comboData;
                tableName = 'emoji_combos';
              }
            }
          }
        }
      }

      if (content) {
        setContentPreview({
          id: content.id,
          title: content.title,
          image_url: content.image_url,
          pfp_url: content.pfp_url,
          banner_url: content.banner_url,
          category: content.category,
          type: content.type || tableName,
          user_id: content.user_id,
          user: content.user_profiles ? {
            username: content.user_profiles.username,
            display_name: content.user_profiles.display_name
          } : undefined
        });
      }
    } catch (error) {
      console.error('Error loading content preview:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleAction = async (action: 'resolve' | 'dismiss') => {
    if (!reportId || !user?.id) {
      toast.error('You must be logged in to handle reports');
      return;
    }

    // If resolving, show the resolution modal
    if (action === 'resolve') {
      setShowResolutionModal(true);
      return;
    }

    // For dismiss, handle directly
    setHandling(true);
    try {
      await handleReportOrAppeal('report', reportId, user.id, action);
      toast.success('Report dismissed successfully');
      navigate('/moderation?view=reports');
    } catch (error: any) {
      console.error('Error handling report:', error);
      const errorMessage = error?.message || 'An unexpected error occurred';
      toast.error(`Failed to handle report: ${errorMessage}`);
    } finally {
      setHandling(false);
    }
  };

  const handleResolveWithAction = async (resolutionAction: ResolutionAction) => {
    if (!reportId || !user?.id || !report) {
      toast.error('Missing required information');
      return;
    }

    setHandling(true);
    try {
      await resolveReportWithAction(
        reportId,
        user.id,
        resolutionAction,
        report.reported_user_id,
        report.content_id,
        report.content_type
      );
      toast.success('Report resolved successfully');
      navigate('/moderation?view=reports');
    } catch (error: any) {
      console.error('Error resolving report:', error);
      const errorMessage = error?.message || 'An unexpected error occurred';
      toast.error(`Failed to resolve report: ${errorMessage}`);
      throw error; // Re-throw to let modal handle it
    } finally {
      setHandling(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400">Report not found</p>
          <button
            onClick={() => navigate('/moderation?view=reports')}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              navigate('/moderation?view=reports');
              // Clear reportId from URL
              window.history.replaceState({}, '', '/moderation?view=reports');
            }}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Reports</span>
          </button>
        </div>

        {/* Report Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {report.title || report.description || 'Report'}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-slate-400">
              <span className={`px-2 py-1 rounded-full ${
                report.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                report.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {formatStatus(report.status)}
              </span>
              {report.urgent && (
                <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                  URGENT
                </span>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Reporter</h3>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-white">
                  {report.reporter?.display_name || report.reporter?.username || 'Unknown'}
                </span>
              </div>
            </div>
            {report.reported_user && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Reported User</h3>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-white">
                    {report.reported_user.display_name || report.reported_user.username || 'Unknown'}
                  </span>
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Reason</h3>
              <span className="text-white">{report.reason}</span>
            </div>
            {report.priority && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Priority</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  report.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  report.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {report.priority}
                </span>
              </div>
            )}
          </div>

          {/* Content Preview */}
          {(loadingContent || contentPreview || (report.content_id && !report.content_id.startsWith('general-') && !report.content_id.startsWith('system-'))) && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3">Reported Content</h3>
              {loadingContent ? (
                <div className="bg-slate-700/50 rounded-lg p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              ) : contentPreview ? (
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  {contentPreview.type === 'user_profile' ? (
                    // User Profile Preview
                    <div className="space-y-4">
                      <div className="relative">
                        {contentPreview.banner_url && (
                          <img
                            src={contentPreview.banner_url}
                            alt="Banner"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        )}
                        {contentPreview.image_url && (
                          <img
                            src={contentPreview.image_url}
                            alt="Avatar"
                            className={`w-20 h-20 rounded-full border-4 border-slate-800 ${contentPreview.banner_url ? 'absolute bottom-0 left-4 transform translate-y-1/2' : ''}`}
                          />
                        )}
                      </div>
                      <div className={contentPreview.banner_url ? 'pt-12' : ''}>
                        <h4 className="text-lg font-semibold text-white mb-1">
                          {contentPreview.title}
                        </h4>
                        {contentPreview.user && (
                          <p className="text-sm text-slate-400 mb-2">
                            @{contentPreview.user.username}
                          </p>
                        )}
                        <Link
                          to={`/user/${contentPreview.user?.username || contentPreview.user_id}`}
                          className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ) : contentPreview.pfp_url && contentPreview.banner_url ? (
                    // Profile Pair Preview
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={contentPreview.banner_url}
                          alt="Banner"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <img
                          src={contentPreview.pfp_url}
                          alt="Profile"
                          className="w-24 h-24 rounded-full border-4 border-slate-800 absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2"
                        />
                      </div>
                      <div className="pt-14 text-center">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {contentPreview.title || 'Profile Pair'}
                        </h4>
                        {contentPreview.user && (
                          <p className="text-sm text-slate-400">
                            By @{contentPreview.user.username}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : contentPreview.image_url ? (
                    // Single Content Preview
                    <div className="space-y-4">
                      <img
                        src={contentPreview.image_url}
                        alt={contentPreview.title || 'Content'}
                        className="w-full h-64 object-contain rounded-lg bg-slate-800"
                      />
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {contentPreview.title || 'Content'}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-slate-400">
                            {contentPreview.category && (
                              <span className="px-2 py-1 rounded bg-slate-600">
                                {contentPreview.category}
                              </span>
                            )}
                            {contentPreview.type && (
                              <span className="px-2 py-1 rounded bg-slate-600">
                                {contentPreview.type}
                              </span>
                            )}
                          </div>
                          {contentPreview.user && (
                            <p className="text-sm text-slate-400">
                              By @{contentPreview.user.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-slate-700/50 rounded-lg p-4 text-slate-400 text-sm">
                  Unable to load content preview
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {(report.description || report.details) && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
              <div className="bg-slate-700/50 rounded-lg p-4 text-white">
                {report.description || report.details}
              </div>
            </div>
          )}

          {/* Evidence */}
          {report.evidence && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Evidence</h3>
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {report.evidence.split(',').map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Evidence {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {report.status === 'pending' || report.status === 'in_progress' ? (
            <div className="flex items-center space-x-4 pt-4 border-t border-slate-700">
              <button
                onClick={() => handleAction('resolve')}
                disabled={handling}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {handling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Resolve</span>
              </button>
              <button
                onClick={() => handleAction('dismiss')}
                disabled={handling}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {handling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Dismiss</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Resolution Modal */}
      {report && (
        <ReportResolutionModal
          isOpen={showResolutionModal}
          onClose={() => setShowResolutionModal(false)}
          report={{
            id: report.id,
            reported_user_id: report.reported_user_id,
            content_id: report.content_id,
            content_type: report.content_type,
            reported_user: report.reported_user
          }}
          onResolve={handleResolveWithAction}
        />
      )}
    </div>
  );
}

