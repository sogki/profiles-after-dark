import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/authContext';
import { useModerationSystem } from './hooks/useModerationSystem';
import { motion } from 'framer-motion';
import {
  Shield,
  Settings,
  Bell,
  MessageSquare,
  Ticket,
  Megaphone,
  BarChart3,
  Users,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Upload,
  Zap,
  Target,
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Clock,
  User,
  Database,
  UserCog,
  ImageIcon,
  Search,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  FileText,
  Bot,
  Monitor,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  Scatter,
  AreaChart as AreaChartIcon,
  Gauge,
  Thermometer,
  Lightbulb,
  Award,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare as MessageSquareIcon,
  Image,
  Video,
  Music,
  UserCheck,
  UserX,
  Ban,
  AlertTriangle as Warning,
  Bell as BellIcon,
  Code,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Share,
  Lock,
  Unlock,
  Archive,
  Trash2,
  Edit,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Menu,
  X,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Maximize,
  Minimize,
  RotateCcw,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Phone,
  PhoneOff,
  Video as VideoIcon,
  VideoOff,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  SignalZero,
  SignalOne,
  SignalTwo,
  SignalThree,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryHigh,
  BatteryFull,
  Power,
  PowerOff,
  Plug,
  Unplug,
  Charging,
  Flash,
  FlashOff,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Flame,
  Snowflake,
  Umbrella,
  TreePine,
  Leaf,
  Flower,
  Heart,
  HeartOff,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  Sad,
  Surprised,
  Confused,
  Thinking,
  Wink,
  Kiss,
  Hug,
  Hand,
  ThumbUp,
  ThumbDown,
  Pointing,
  Wave,
  Clap,
  RaiseHand,
  Peace,
  Victory,
  Cross,
  Check,
  Plus,
  Minus,
  Equal,
  NotEqual,
  LessThan,
  GreaterThan,
  LessThanOrEqual,
  GreaterThanOrEqual,
  Infinity,
  Pi,
  Sigma,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Epsilon,
  Zeta,
  Eta,
  Theta,
  Iota,
  Kappa,
  Lambda,
  Mu,
  Nu,
  Xi,
  Omicron,
  Rho,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi,
  Omega
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getConfigValue } from '../../lib/config';
import { formatStatus } from '../../lib/formatStatus';
import { handleReportOrAppeal } from '../../lib/moderationUtils';
import Footer from '../Footer';

// Import child components
import EnhancedModerationPanel from './EnhancedModerationPanel';
import ModerationMessaging from './modals/ModerationMessaging';
import EnhancedNotificationSystem from './modals/EnhancedNotificationSystem';
import ModerationAnalytics from './modals/ModerationAnalytics';
import ContentManagementView from './views/ContentManagementView';
import LogsView from './views/LogsView';
import AutomationView from './views/AutomationView';
import AnalyticsMonitoringView from './views/AnalyticsMonitoringView';
import AppealsView from './views/AppealsView';
import EnhancedUserManagementView from './views/EnhancedUserManagementView';
import AnnouncementsView from './views/AnnouncementsView';
import ReportDetailView from './views/ReportDetailView';
import FeedbackView from './views/FeedbackView';
import SupportTicketsView from './views/SupportTicketsView';
import DeveloperView from './views/DeveloperView';
import SettingsView from './views/SettingsView';
import SubscriptionsManagementView from './views/SubscriptionsManagementView';
import RolesManagementView from './views/RolesManagementView';
import DiscordBotView from './views/DiscordBotView';
import DashboardView from './enhanced/DashboardView';
import ReportsView from './enhanced/ReportsView';
import ModerationSidebar from './enhanced/ModerationSidebar';
import ModerationMobileHeader from './enhanced/ModerationMobileHeader';
import type { ModerationView } from './enhanced/types';

export default function EnhancedModerationPage() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const reportId = params.reportId || searchParams.get('reportId');
  const [activeView, setActiveView] = useState<ModerationView>('dashboard');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'resolve' | 'dismiss';
    reportId: string;
    reportTitle: string;
  } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    moderation: true,
    content: true,
    users: true,
    system: true
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardTimeRange, setDashboardTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [systemHealth, setSystemHealth] = useState<{
    api: { status: string; responseTime: number };
    database: { status: string; connections: string };
    memory: { usage: number; status: string };
  } | null>(null);
  const [systemHealthLoading, setSystemHealthLoading] = useState(false);
  
  // Helper function to clear reportId when navigating away
  const clearReportId = useCallback((view?: string) => {
    if (reportId) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('reportId');
      if (view) {
        newSearchParams.set('view', view);
      }
      navigate(`/moderation?${newSearchParams.toString()}`, { replace: true });
    }
  }, [reportId, searchParams, navigate]);

  // Update activeView when reportId changes
  useEffect(() => {
    if (reportId) {
      // Don't change activeView, just ensure we're showing the report detail
    } else if (searchParams.get('view')) {
      const view = searchParams.get('view') as any;
      if (['dashboard', 'reports', 'content', 'logs', 'analytics', 'discord-bot', 'users', 'subscriptions', 'roles', 'automation', 'announcements', 'settings', 'appeals', 'messaging', 'notifications', 'feedback', 'support-tickets', 'developer'].includes(view)) {
        setActiveView(view);
      }
    }
  }, [reportId, searchParams]);
  
  // Call all hooks before any conditional returns
  const {
    reports,
    logs,
    users: moderationUsers,
    stats,
    loading,
    error,
    refreshData,
    handleReport,
    handleBulkAction,
    exportData
  } = useModerationSystem();
  
  // State for collapsible sections
  const [activeReportsCollapsed, setActiveReportsCollapsed] = useState(false);
  const [dismissedReportsCollapsed, setDismissedReportsCollapsed] = useState(true);

  // Memoize filtered reports (excluding dismissed) to prevent unnecessary re-renders - MUST be called before any returns
  const filteredReports = React.useMemo(() => {
    return reports.filter(report => {
      // Exclude dismissed reports from main list
      if (report.status === 'dismissed') return false;
      
      // Exclude in_progress reports that are being handled by other staff members
      if (report.status === 'in_progress' && report.handled_by && report.handled_by !== user?.id) {
        return false;
      }
      
      const matchesSearch = !searchQuery || 
        report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reported_user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [reports, searchQuery, filterStatus, filterPriority, user?.id]);

  // Memoize dismissed reports separately
  const filteredDismissedReports = React.useMemo(() => {
    return reports.filter(report => {
      // Only include dismissed reports
      if (report.status !== 'dismissed') return false;
      
      const matchesSearch = !searchQuery || 
        report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reported_user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
      
      return matchesSearch && matchesPriority;
    });
  }, [reports, searchQuery, filterPriority]);

  // Generate chart data from reports
  const generateReportsOverTime = React.useMemo(() => {
    const days = dashboardTimeRange === '7d' ? 7 : dashboardTimeRange === '30d' ? 30 : 90;
    const data: { date: string; reports: number; resolved: number; pending: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayReports = reports.filter(r => {
        const reportDate = new Date(r.created_at);
        return reportDate.toDateString() === date.toDateString();
      });
      
      data.push({
        date: dateStr,
        reports: dayReports.length,
        resolved: dayReports.filter(r => r.status === 'resolved').length,
        pending: dayReports.filter(r => r.status === 'pending').length
      });
    }
    
    return data;
  }, [reports, dashboardTimeRange]);

  // Status distribution for pie chart
  const statusDistribution = React.useMemo(() => {
    const statusCounts = reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: formatStatus('resolved'), value: statusCounts.resolved || 0, color: '#10b981' },
      { name: formatStatus('pending'), value: statusCounts.pending || 0, color: '#f59e0b' },
      { name: formatStatus('in_progress'), value: statusCounts.in_progress || 0, color: '#3b82f6' },
      { name: formatStatus('dismissed'), value: statusCounts.dismissed || 0, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [reports]);

  // Priority breakdown
  const priorityBreakdown = React.useMemo(() => {
    const priorityCounts = reports.reduce((acc, report) => {
      const priority = report.priority || 'low';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'High', value: priorityCounts.high || 0, color: '#ef4444' },
      { name: 'Medium', value: priorityCounts.medium || 0, color: '#f59e0b' },
      { name: 'Low', value: priorityCounts.low || 0, color: '#3b82f6' }
    ];
  }, [reports]);

  // Load system health data
  const loadSystemHealth = useCallback(async () => {
    if (activeView !== 'dashboard') return;
    
    setSystemHealthLoading(true);
    try {
      const apiUrl = await getConfigValue('API_URL').catch(() => 
        getConfigValue('VITE_API_URL').catch(() => 
          import.meta.env.VITE_API_URL || 'https://dev.profilesafterdark.com/api/v1'
        )
      );
      
      // Ensure API URL has /api/v1 prefix if it doesn't already
      const baseUrl = apiUrl.includes('/api/v1') ? apiUrl : `${apiUrl}/api/v1`;
      const healthResponse = await fetch(`${baseUrl}/monitoring/health`);
      const healthData = await healthResponse.json();
      
      if (healthData.success && healthData.data.services) {
        const services = healthData.data.services;
        const apiService = services.find((s: any) => s.id === 'api' || s.name === 'API Server');
        const dbService = services.find((s: any) => s.id === 'database' || s.name === 'Supabase Connection');
        const websiteService = services.find((s: any) => s.id === 'website' || s.name === 'Website');
        
        setSystemHealth({
          api: {
            status: apiService?.status === 'operational' ? 'Operational' : apiService?.status === 'degraded' ? 'Degraded' : 'Down',
            responseTime: apiService?.responseTime || 0
          },
          database: {
            status: dbService?.status === 'operational' ? 'Healthy' : dbService?.status === 'degraded' ? 'Degraded' : 'Down',
            connections: '23/50' // This would come from metrics if available
          },
          memory: {
            usage: 72, // This would come from metrics if available
            status: 'warning'
          }
        });
      }
    } catch (error) {
      console.error('Error loading system health:', error);
      // Set default values on error
      setSystemHealth({
        api: { status: 'Unknown', responseTime: 0 },
        database: { status: 'Unknown', connections: 'N/A' },
        memory: { usage: 0, status: 'unknown' }
      });
    } finally {
      setSystemHealthLoading(false);
    }
  }, [activeView]);

  // Load system health when dashboard is active
  useEffect(() => {
    if (activeView === 'dashboard') {
      loadSystemHealth();
      const interval = setInterval(loadSystemHealth, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [activeView, loadSystemHealth]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);
  
  // Now check access after all hooks are called
  // Check if user has any staff-related role (admin, staff, moderator)
  // Users with verified role alone should NOT see the mod panel
  // But users with admin/staff/moderator + verified should still see it
  const userRole = userProfile?.role?.toLowerCase() || '';
  const roles = userRole ? userRole.split(',').map(r => r.trim().toLowerCase()).filter(r => r) : [];
  const staffRoles = ['admin', 'staff', 'moderator'];
  const hasModerationAccess = roles.some(role => staffRoles.includes(role));
  const canManageSubscriptions = roles.some(role => ['admin', 'staff', 'moderator'].includes(role));
  const isAdmin = roles.includes('admin');
  
  // Redirect if no access - but hooks must be called first
  if (!user) {
    navigate('/');
    return null;
  }

  if (!hasModerationAccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="surface-elevated rounded-2xl p-8 text-center max-w-md mx-4">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">You do not have permission to access the moderation system.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleReportAction = async (reportId: string, action: 'handle' | 'resolve' | 'dismiss', reportTitle: string) => {
    if (action === 'handle') {
      // Handle the report immediately - this will mark it as in_progress and remove notifications for other staff
      if (user?.id) {
        try {
          await handleReport(reportId, 'in_progress', `Handled by ${userProfile?.username || 'moderator'}`);
          // Navigate to the report detail page within the mod panel
          navigate(`/moderation?reportId=${reportId}`);
        } catch (error: any) {
          console.error('Error handling report:', error);
          // The handleReport function already shows an error toast, but we can add more context here if needed
          if (error?.message) {
            console.error('Detailed error:', error.message);
          }
        }
      } else {
        toast.error('You must be logged in to handle reports');
      }
    } else {
      setConfirmAction({ type: action, reportId, reportTitle });
      setShowConfirmDialog(true);
    }
  };

  const confirmReportAction = async () => {
    if (!confirmAction) return;
    
    try {
      await handleReport(confirmAction.reportId, confirmAction.type, `${confirmAction.type === 'resolve' ? 'Resolved' : 'Dismissed'} by moderator`);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    } catch (error) {
      console.error('Error handling report action:', error);
    }
  };

  const cancelReportAction = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'logs', label: 'Logs', icon: Clock },
    { id: 'analytics', label: 'Analytics & Monitoring', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'automation', label: 'Automation', icon: Bot },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'appeals', label: 'Appeals', icon: AlertTriangle },
    { id: 'messaging', label: 'Messaging', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="flex relative" style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
        <ModerationSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeView={activeView}
          setActiveView={setActiveView}
          clearReportId={clearReportId}
          expandedGroups={expandedGroups}
          setExpandedGroups={setExpandedGroups}
          onNavigateHome={() => navigate('/')}
          canManageSubscriptions={canManageSubscriptions}
          isAdmin={isAdmin}
        />

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 h-full ${activeView === 'support-tickets' ? 'overflow-hidden' : 'overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900'}`}>
          <div className={`w-full max-w-none ${activeView === 'support-tickets' ? 'h-full' : 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6'}`}>
            {/* Mobile Header with Sidebar Toggle */}
            {activeView !== 'support-tickets' && (
              <ModerationMobileHeader
                activeView={activeView}
                setActiveView={setActiveView}
                clearReportId={clearReportId}
                setSidebarOpen={setSidebarOpen}
                canManageSubscriptions={canManageSubscriptions}
                isAdmin={isAdmin}
              />
            )}

            {/* Main Content */}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading moderation system...</p>
                  </div>
                </div>
              ) : (
                <>
                {activeView === 'dashboard' && (
                  <DashboardView
                    stats={stats}
                    loading={loading}
                    dashboardTimeRange={dashboardTimeRange}
                    setDashboardTimeRange={setDashboardTimeRange}
                    refreshData={refreshData}
                    generateReportsOverTime={generateReportsOverTime}
                    statusDistribution={statusDistribution}
                    priorityBreakdown={priorityBreakdown}
                    systemHealthLoading={systemHealthLoading}
                    systemHealth={systemHealth}
                    onGoToAnalytics={() => {
                      clearReportId('analytics');
                      setActiveView('analytics');
                    }}
                  />
                )}

                {/* Report Detail View */}
                {reportId && (
                  <ReportDetailView />
                )}

                {!reportId && activeView === 'reports' && (
                  <ReportsView
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    filterPriority={filterPriority}
                    setFilterPriority={setFilterPriority}
                    filteredReports={filteredReports}
                    filteredDismissedReports={filteredDismissedReports}
                    activeReportsCollapsed={activeReportsCollapsed}
                    setActiveReportsCollapsed={setActiveReportsCollapsed}
                    dismissedReportsCollapsed={dismissedReportsCollapsed}
                    setDismissedReportsCollapsed={setDismissedReportsCollapsed}
                    handleReportAction={handleReportAction}
                    navigateToReport={(id) => navigate(`/moderation?reportId=${id}`)}
                  />
                )}

                {/* Users View */}
                {activeView === 'users' && (
                  <EnhancedUserManagementView />
                )}

                {activeView === 'subscriptions' && (
                  <SubscriptionsManagementView canManageSubscriptions={canManageSubscriptions} />
                )}

                {activeView === 'roles' && (
                  <RolesManagementView isAdmin={isAdmin} />
                )}

                {/* Content Management View */}
                {activeView === 'content' && (
                  <ContentManagementView />
                )}

                {/* Logs View */}
                {activeView === 'logs' && (
                  <LogsView />
                )}

                {/* Feedback View */}
                {activeView === 'feedback' && (
                  <FeedbackView />
                )}

                {/* Support Tickets View */}
                {activeView === 'support-tickets' && (
                  <SupportTicketsView />
                )}

                {/* Developer View */}
                {activeView === 'developer' && (
                  <DeveloperView />
                )}

                {/* Automation View */}
                {activeView === 'automation' && (
                  <AutomationView />
                )}

                {/* Appeals View */}
                {activeView === 'appeals' && (
                  <AppealsView />
                )}

                {/* Announcements View */}
                {activeView === 'announcements' && (
                  <AnnouncementsView />
                )}

                {/* Other Views */}
                {activeView === 'messaging' && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Messaging</h2>
                    <button
                      onClick={() => setShowMessaging(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Open Messaging System
                    </button>
                  </div>
                )}

                {activeView === 'notifications' && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Notifications</h2>
                    <button
                      onClick={() => setShowNotifications(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Open Notification System
                    </button>
                  </div>
                )}

                {/* Analytics & Monitoring View */}
                {activeView === 'analytics' && (
                  <AnalyticsMonitoringView />
                )}

                {activeView === 'discord-bot' && (
                  <DiscordBotView />
                )}

                {activeView === 'settings' && (
                  <SettingsView />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 modal-backdrop-light flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-popup-shell p-6 max-w-md mx-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              {confirmAction.type === 'resolve' ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
              <h3 className="text-lg font-semibold text-white">
                {confirmAction.type === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
              </h3>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to {confirmAction.type} the report "{confirmAction.reportTitle}"? 
              This action cannot be undone.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={confirmReportAction}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  confirmAction.type === 'resolve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {confirmAction.type === 'resolve' ? 'Resolve' : 'Dismiss'}
              </button>
              <button
                onClick={cancelReportAction}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
