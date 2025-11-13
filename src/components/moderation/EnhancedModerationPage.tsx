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

export default function EnhancedModerationPage() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const reportId = params.reportId || searchParams.get('reportId');
  const [activeView, setActiveView] = useState<'dashboard' | 'reports' | 'content' | 'logs' | 'analytics' | 'users' | 'automation' | 'announcements' | 'settings' | 'appeals' | 'messaging' | 'notifications' | 'feedback' | 'support-tickets' | 'developer'>('dashboard');
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
      if (['dashboard', 'reports', 'content', 'logs', 'analytics', 'users', 'automation', 'announcements', 'settings', 'appeals', 'messaging', 'notifications', 'feedback', 'support-tickets', 'developer'].includes(view)) {
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
  
  // Redirect if no access - but hooks must be called first
  if (!user) {
    navigate('/');
    return null;
  }

  if (!hasModerationAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 text-center max-w-md mx-4">
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
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 flex-shrink-0 bg-[#1A1A1A] border-r border-slate-800/30 flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`} style={{ height: '100%', maxHeight: '100vh', overflow: 'hidden' }}>
          {/* Sidebar Header */}
          <div className="p-3 border-b border-slate-800/30 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 text-white hover:text-purple-400 transition-colors group flex-1"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Shield className="w-5 h-5 relative z-10 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm block truncate">Moderation Panel</span>
                <span className="text-xs text-slate-400 block truncate">Enhanced Moderation System</span>
              </div>
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {/* Dashboard - No Group */}
            <button
              onClick={() => {
                clearReportId('dashboard');
                setActiveView('dashboard');
                setSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ${
                activeView === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
               <div className="flex items-center space-x-3">
                 <BarChart3 className={`w-5 h-5 ${activeView === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
                 <span className="font-medium text-sm">Dashboard</span>
               </div>
            </button>

            {/* Moderation Group */}
            <div>
              <button
                onClick={() => setExpandedGroups(prev => ({ ...prev, moderation: !prev.moderation }))}
                className="w-full flex items-center justify-between px-2 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider">Moderation</span>
                {expandedGroups.moderation ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedGroups.moderation && (
                <div className="ml-2 space-y-1 mt-1">
                  {[
                    { id: 'reports', label: 'Reports', icon: Flag },
                    { id: 'appeals', label: 'Appeals', icon: AlertTriangle },
                    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                    { id: 'support-tickets', label: 'Support Tickets', icon: Ticket },
                    { id: 'logs', label: 'Logs', icon: Clock }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          clearReportId(item.id);
                          setActiveView(item.id as any);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content Group */}
            <div>
              <button
                onClick={() => setExpandedGroups(prev => ({ ...prev, content: !prev.content }))}
                className="w-full flex items-center justify-between px-2 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider">Content</span>
                {expandedGroups.content ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedGroups.content && (
                <div className="ml-2 space-y-1 mt-1">
                  {[
                    { id: 'content', label: 'Content', icon: FileText },
                    { id: 'announcements', label: 'Announcements', icon: Megaphone }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          clearReportId(item.id);
                          setActiveView(item.id as any);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Users Group */}
            <div>
              <button
                onClick={() => setExpandedGroups(prev => ({ ...prev, users: !prev.users }))}
                className="w-full flex items-center justify-between px-2 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider">Users</span>
                {expandedGroups.users ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedGroups.users && (
                <div className="ml-2 space-y-1 mt-1">
                  {[
                    { id: 'users', label: 'User Management', icon: Users }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          clearReportId(item.id);
                          setActiveView(item.id as any);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* System Group */}
            <div>
              <button
                onClick={() => setExpandedGroups(prev => ({ ...prev, system: !prev.system }))}
                className="w-full flex items-center justify-between px-2 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider">System</span>
                {expandedGroups.system ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedGroups.system && (
                <div className="ml-2 space-y-1 mt-1">
                  {[
                    { id: 'automation', label: 'AI Moderation', icon: Bot },
                    { id: 'analytics', label: 'Analytics & Monitoring', icon: TrendingUp },
                    { id: 'developer', label: 'Developer Tools', icon: Code },
                    { id: 'settings', label: 'Settings', icon: Settings }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          clearReportId(item.id);
                          setActiveView(item.id as any);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 min-w-0 h-full ${activeView === 'support-tickets' ? 'overflow-hidden' : 'overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900'}`}>
          <div className={`w-full max-w-none ${activeView === 'support-tickets' ? 'h-full' : 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6'}`}>
            {/* Mobile Header with Sidebar Toggle */}
            {activeView !== 'support-tickets' && (
              <>
                <div className="mb-4 lg:hidden flex items-center justify-between">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  <h1 className="text-xl font-bold text-white">Moderation Panel</h1>
                  <div className="w-10" /> {/* Spacer for centering */}
                </div>

                {/* Mobile Quick Actions - Icon Based */}
                <div className="mb-6 lg:hidden">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
                  { id: 'reports', icon: Flag, label: 'Reports' },
                  { id: 'content', icon: FileText, label: 'Content' },
                  { id: 'users', icon: Users, label: 'Users' }
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        clearReportId(item.id);
                        setActiveView(item.id as any);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={item.label}
                    >
                      <IconComponent className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-xs text-slate-400 hover:text-purple-400 px-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  More Options →
                </button>
              </div>
            </div>
              </>
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
                {/* Dashboard View */}
                {activeView === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                        <p className="text-slate-400 text-sm">Overview and quick stats</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-[#2D2D2D] rounded-lg p-1 border border-slate-700/50">
                          {(['7d', '30d', '90d'] as const).map((range) => (
                            <button
                              key={range}
                              onClick={() => setDashboardTimeRange(range)}
                              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                dashboardTimeRange === range
                                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={refreshData}
                          className="flex items-center space-x-2 px-4 py-2 bg-[#2D2D2D] hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700/50"
                        >
                          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                          <span className="text-sm font-medium hidden sm:inline">Refresh</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { title: 'Total Reports', value: stats?.totalReports || 0, icon: Flag, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
                        { title: 'Pending Reports', value: stats?.pendingReports || 0, icon: Clock, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
                        { title: 'Resolved Reports', value: stats?.resolvedReports || 0, icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10' },
                        { title: 'Active Users', value: stats?.activeUsers || 0, icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/10' }
                      ].map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                          <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-[#2D2D2D] rounded-lg p-4 border border-slate-800/30 hover:border-purple-500/30 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <IconComponent className={`w-5 h-5 ${stat.color}`} />
                              </div>
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-400 text-xs mb-1">{stat.title}</p>
                              <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Reports Over Time Chart */}
                      <div className="bg-[#1A1A1A] rounded-lg border border-slate-800/30 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-xl font-bold text-white mb-1">Reports Over Time</h2>
                            <p className="text-slate-400 text-sm">Report activity trends</p>
                          </div>
                          <Activity className="w-5 h-5 text-purple-400" />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={generateReportsOverTime}>
                            <defs>
                              <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#9ca3af"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                              stroke="#9ca3af"
                              style={{ fontSize: '12px' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                            />
                            <Legend 
                              wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="reports" 
                              stroke="#9333ea" 
                              fillOpacity={1} 
                              fill="url(#colorReports)"
                              name="Total Reports"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="resolved" 
                              stroke="#10b981" 
                              fillOpacity={1} 
                              fill="url(#colorResolved)"
                              name="Resolved"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="pending" 
                              stroke="#f59e0b" 
                              fillOpacity={1} 
                              fill="url(#colorPending)"
                              name="Pending"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Status Distribution Pie Chart */}
                      <div className="bg-[#1A1A1A] rounded-lg border border-slate-800/30 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-xl font-bold text-white mb-1">Status Distribution</h2>
                            <p className="text-slate-400 text-sm">Report status breakdown</p>
                          </div>
                          <PieChartIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        {statusDistribution.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                              <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {statusDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1f2937', 
                                  border: '1px solid #374151',
                                  borderRadius: '8px',
                                  color: '#fff'
                                }}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-[300px]">
                            <p className="text-slate-400">No data available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Priority Breakdown Chart */}
                    <div className="bg-[#1A1A1A] rounded-lg border border-slate-800/30 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-white mb-1">Priority Breakdown</h2>
                          <p className="text-slate-400 text-sm">Report priority distribution</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                      </div>
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsBarChart data={priorityBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9ca3af"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis 
                            stroke="#9ca3af"
                            style={{ fontSize: '12px' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {priorityBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* System Health Overview */}
                    <div className="bg-[#1A1A1A] rounded-lg border border-slate-800/30 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-white mb-1">System Health</h2>
                          <p className="text-slate-400 text-sm">Quick system status overview</p>
                        </div>
                        <Monitor className="w-5 h-5 text-purple-400" />
                      </div>
                      {systemHealthLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                      ) : systemHealth ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className={`bg-[#2D2D2D] rounded-lg p-4 border ${
                            systemHealth.api.status === 'Operational' ? 'border-green-500/20' :
                            systemHealth.api.status === 'Degraded' ? 'border-yellow-500/20' :
                            'border-red-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-400 text-sm">API Status</span>
                              {systemHealth.api.status === 'Operational' ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : systemHealth.api.status === 'Degraded' ? (
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                            <div className="text-2xl font-bold text-white">{systemHealth.api.status}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              {systemHealth.api.responseTime > 0 ? `Response: ${systemHealth.api.responseTime}ms` : 'No data'}
                            </div>
                          </div>
                          <div className={`bg-[#2D2D2D] rounded-lg p-4 border ${
                            systemHealth.database.status === 'Healthy' ? 'border-green-500/20' :
                            systemHealth.database.status === 'Degraded' ? 'border-yellow-500/20' :
                            'border-red-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-400 text-sm">Database</span>
                              {systemHealth.database.status === 'Healthy' ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : systemHealth.database.status === 'Degraded' ? (
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                            <div className="text-2xl font-bold text-white">{systemHealth.database.status}</div>
                            <div className="text-xs text-slate-400 mt-1">{systemHealth.database.connections} connections</div>
                          </div>
                          <div className={`bg-[#2D2D2D] rounded-lg p-4 border ${
                            systemHealth.memory.status === 'healthy' ? 'border-green-500/20' :
                            systemHealth.memory.status === 'warning' ? 'border-yellow-500/20' :
                            'border-red-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-400 text-sm">Memory Usage</span>
                              {systemHealth.memory.status === 'healthy' ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : systemHealth.memory.status === 'warning' ? (
                                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                            </div>
                            <div className="text-2xl font-bold text-white">{systemHealth.memory.usage}%</div>
                            <div className="text-xs text-slate-400 mt-1">
                              {systemHealth.memory.status === 'warning' ? 'Above threshold' : 'Normal'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-400">Unable to load system health data</p>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-slate-800/30">
                        <button
                          onClick={() => {
                            clearReportId('analytics');
                            setActiveView('analytics');
                          }}
                          className="w-full px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>View Full Analytics & Monitoring</span>
                        </button>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-[#1A1A1A] rounded-lg border border-slate-800/30 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-white mb-1">Recent Activity</h2>
                          <p className="text-slate-400 text-sm">Latest moderation actions</p>
                        </div>
                        <Clock className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="space-y-3">
                        {stats.recentActivity && stats.recentActivity.length > 0 ? (
                          stats.recentActivity.slice(0, 5).map((activity, index) => {
                            const activityType = activity.type || 'general';
                            const IconComponent = activityType === 'fanart' ? Heart : FileText;
                            const iconColor = activityType === 'fanart' ? 'text-pink-400' : 'text-purple-400';
                            
                            return (
                              <motion.div
                                key={activity.id || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between hover:bg-[#353535] transition-colors"
                              >
                                <div className="flex items-center space-x-4 flex-1 min-w-0">
                                  <div className={`p-2 rounded-lg ${iconColor === 'text-pink-400' ? 'bg-pink-500/10' : 'bg-purple-500/10'}`}>
                                    <IconComponent className={`w-5 h-5 ${iconColor}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm truncate">
                                      {typeof activity.action === 'string' 
                                        ? activity.action 
                                        : typeof activity.title === 'string'
                                          ? activity.title
                                          : activity.action?.title || activity.title?.title || 'Unknown activity'}
                                    </p>
                                    <p className={`text-xs mt-1 ${iconColor}`}>
                                      {activityType === 'fanart' ? 'Fan art' : activity.description || 'Moderation action'}
                                    </p>
                                    {activity.user && (
                                      <p className="text-slate-400 text-xs mt-1">
                                        User: {typeof activity.user === 'string' 
                                          ? activity.user 
                                          : activity.user.username || activity.user.display_name || 'Unknown'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-400 text-xs">
                                      {activity.created_at 
                                        ? new Date(activity.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                        : 'N/A'
                                      }
                                    </span>
                                  </div>
                                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                </div>
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-slate-400">No recent activity</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Report Detail View */}
                {reportId && (
                  <ReportDetailView />
                )}

                {/* Reports View */}
                {!reportId && activeView === 'reports' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">Reports</h2>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Search className="w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <select
                          value={filterStatus}
                          onChange={(e) => {
                            setFilterStatus(e.target.value);
                            // Auto-expand dismissed section if filtering by dismissed
                            if (e.target.value === 'dismissed') {
                              setDismissedReportsCollapsed(false);
                            }
                          }}
                          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">{formatStatus('pending')}</option>
                          <option value="in_progress">{formatStatus('in_progress')}</option>
                          <option value="resolved">{formatStatus('resolved')}</option>
                          <option value="dismissed">{formatStatus('dismissed')}</option>
                        </select>
                        <select
                          value={filterPriority}
                          onChange={(e) => setFilterPriority(e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="all">All Priority</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>

                    {/* Active Reports Section */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                      <button
                        onClick={() => setActiveReportsCollapsed(!activeReportsCollapsed)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-white">
                            Active Reports
                          </h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300">
                            {filteredReports.length}
                          </span>
                        </div>
                        {activeReportsCollapsed ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      
                      {!activeReportsCollapsed && (
                        <div className="p-4">
                          {filteredReports.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                              {filteredReports.map((report) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-white mb-1 truncate">
                                {report.title || report.description || 'Report'}
                              </h3>
                              <p className="text-sm text-slate-400 truncate">
                                {report.reason || 'No reason provided'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                              report.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                              report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                              report.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {formatStatus(report.status)}
                            </span>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Reported User:</span>
                              <span className="text-white font-medium">
                                {report.reported_user?.username || report.reported_user?.display_name || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Reporter:</span>
                              <span className="text-white">
                                {report.reporter?.username || report.reporter?.display_name || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Priority:</span>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  report.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                  report.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {report.priority || 'low'}
                                </span>
                                {report.urgent && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                                    URGENT
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Date:</span>
                              <div className="flex items-center space-x-1 text-slate-300">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {report.details && (
                            <div className="mb-4">
                              <p className="text-xs text-slate-500 line-clamp-2">
                                {report.details}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-end pt-4 border-t border-slate-700">
                            {report.status === 'pending' && (
                              <button
                                onClick={() => handleReportAction(report.id, 'handle', report.title || 'Report')}
                                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                              >
                                <Shield className="w-4 h-4" />
                                <span>Handle Report</span>
                              </button>
                            )}
                            {report.status === 'in_progress' && (
                              <button
                                onClick={() => navigate(`/moderation?reportId=${report.id}`)}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View Report</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                              <Flag className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                              <p className="text-slate-400">No active reports found</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dismissed Reports Section */}
                    {filteredDismissedReports.length > 0 && (
                      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <button
                          onClick={() => setDismissedReportsCollapsed(!dismissedReportsCollapsed)}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-white">
                              Dismissed Reports
                            </h3>
                            <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                              {filteredDismissedReports.length}
                            </span>
                          </div>
                          {dismissedReportsCollapsed ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        
                        {!dismissedReportsCollapsed && (
                          <div className="p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                              {filteredDismissedReports.map((report) => (
                                <motion.div
                                  key={report.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-red-500/10 opacity-75"
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-base font-semibold text-white mb-1 truncate">
                                        {report.title || report.description || 'Report'}
                                      </h3>
                                      <p className="text-sm text-slate-400 truncate">
                                        {report.reason || 'No reason provided'}
                                      </p>
                                    </div>
                                    <span className="px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 bg-red-500/20 text-red-400">
                                      {formatStatus(report.status)}
                                    </span>
                                  </div>

                                  <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-400">Reported User:</span>
                                      <span className="text-white font-medium">
                                        {report.reported_user?.username || report.reported_user?.display_name || 'Unknown'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-400">Reporter:</span>
                                      <span className="text-white">
                                        {report.reporter?.username || report.reporter?.display_name || 'Unknown'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-400">Priority:</span>
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                          report.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                          report.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                          'bg-blue-500/20 text-blue-400'
                                        }`}>
                                          {report.priority || 'low'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-400">Date:</span>
                                      <div className="flex items-center space-x-1 text-slate-300">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {report.details && (
                                    <div className="mb-4">
                                      <p className="text-xs text-slate-500 line-clamp-2">
                                        {report.details}
                                      </p>
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Users View */}
                {activeView === 'users' && (
                  <EnhancedUserManagementView />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md mx-4"
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
