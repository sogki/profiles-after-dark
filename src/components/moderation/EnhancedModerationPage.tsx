import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useModerationSystem } from './hooks/useModerationSystem';
import { motion } from 'framer-motion';
import {
  Shield,
  Settings,
  Bell,
  MessageSquare,
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
  PieChart,
  LineChart,
  BarChart,
  Scatter,
  AreaChart,
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
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Import child components
import EnhancedReportModal from './modals/EnhancedReportModal';
import EnhancedModerationPanel from './EnhancedModerationPanel';
import ModerationMessaging from './modals/ModerationMessaging';
import EnhancedNotificationSystem from './modals/EnhancedNotificationSystem';
import ModerationAnalytics from './modals/ModerationAnalytics';
import ContentManagementView from './views/ContentManagementView';
import LogsView from './views/LogsView';
import AutomationView from './views/AutomationView';
import MonitoringView from './views/MonitoringView';
import AppealsView from './views/AppealsView';
import EnhancedUserManagementView from './views/EnhancedUserManagementView';
import AnnouncementsView from './views/AnnouncementsView';

export default function EnhancedModerationPage() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'dashboard' | 'reports' | 'content' | 'logs' | 'analytics' | 'users' | 'automation' | 'announcements' | 'settings' | 'monitoring' | 'appeals' | 'messaging' | 'notifications'>('dashboard');
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
  
  // Memoize filtered reports to prevent unnecessary re-renders - MUST be called before any returns
  const filteredReports = React.useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = !searchQuery || 
        report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reported_user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [reports, searchQuery, filterStatus, filterPriority]);

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
  const hasModerationAccess = userProfile?.role === 'admin' || userProfile?.role === 'moderator' || userProfile?.role === 'staff';
  
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

  const handleReportAction = (reportId: string, action: 'resolve' | 'dismiss', reportTitle: string) => {
    setConfirmAction({ type: action, reportId, reportTitle });
    setShowConfirmDialog(true);
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
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'automation', label: 'Automation', icon: Bot },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor },
    { id: 'appeals', label: 'Appeals', icon: AlertTriangle },
    { id: 'messaging', label: 'Messaging', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Enhanced Header */}
      <div className="bg-[#1A1A1A] border-b border-slate-800/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-3 text-white hover:text-purple-400 transition-colors group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-600/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 text-purple-400" />
                </div>
                <div>
                  <span className="font-bold text-base sm:text-lg block">Moderation Panel</span>
                  <span className="text-xs text-slate-400 hidden sm:block">Enhanced Management System</span>
                </div>
              </button>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-3 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-700/50">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={`${userProfile.display_name || userProfile.username}'s avatar`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-purple-500/50 shadow-lg shadow-purple-500/20"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
                <div className="text-xs sm:text-sm hidden sm:block">
                  <div className="text-white font-semibold">{userProfile?.display_name || userProfile?.username}</div>
                  <div className="text-purple-400 text-xs font-medium capitalize">{userProfile?.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)] relative overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-16 lg:inset-y-0 left-0 z-50 lg:z-auto w-64 flex-shrink-0 bg-[#1A1A1A] border-r border-slate-800/30 flex-col transform transition-transform duration-300 h-full lg:h-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 lg:p-6 border-b border-slate-800/30 flex items-center justify-between">
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-white mb-1">Admin Panel</h2>
              <p className="text-xs text-slate-400">Profiles After Dark</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {/* Dashboard - No Group */}
            <button
              onClick={() => {
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
                    { id: 'logs', label: 'Logs', icon: Clock }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
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
                    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                    { id: 'monitoring', label: 'Monitoring', icon: Monitor },
                    { id: 'settings', label: 'Settings', icon: Settings }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
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
        <main className="flex-1 overflow-y-auto min-w-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {/* Mobile Header with Sidebar Toggle */}
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
                      onClick={() => setActiveView(item.id as any)}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                        <p className="text-slate-400 text-sm">Overview and quick stats</p>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#2D2D2D] hover:bg-slate-700 text-white rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium">Logout</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { title: 'Total Reports', value: stats?.totalReports || 0, icon: Flag },
                        { title: 'Pending Reports', value: stats?.pendingReports || 0, icon: Clock },
                        { title: 'Resolved Reports', value: stats?.resolvedReports || 0, icon: CheckCircle },
                        { title: 'Active Users', value: stats?.activeUsers || 0, icon: Users }
                      ].map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                          <div
                            key={stat.title}
                            className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-400 text-xs mb-1">{stat.title}</p>
                              <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                            <IconComponent className="w-8 h-8 text-slate-400 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-[#1A1A1A] rounded-lg border border-slate-800/30 p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
                      <div className="space-y-3">
                        {stats.recentActivity && stats.recentActivity.length > 0 ? (
                          stats.recentActivity.slice(0, 5).map((activity, index) => {
                            const activityType = activity.type || 'general';
                            const IconComponent = activityType === 'fanart' ? Heart : FileText;
                            const iconColor = activityType === 'fanart' ? 'text-pink-400' : 'text-purple-400';
                            
                            return (
                              <div
                                key={activity.id || index}
                                className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between"
                              >
                                <div className="flex items-center space-x-4 flex-1 min-w-0">
                                  <IconComponent className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm truncate">
                                      {typeof activity.action === 'string' 
                                        ? activity.action 
                                        : typeof activity.title === 'string'
                                          ? activity.title
                                          : activity.action?.title || activity.title?.title || 'Unknown activity'}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                      activityType === 'fanart' ? 'text-pink-400' : 'text-purple-400'
                                    }`}>
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
                              </div>
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

                {/* Reports View */}
                {activeView === 'reports' && (
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
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
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

                    <div className="bg-slate-800 rounded-xl border border-slate-700">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-700/50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Report</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Priority</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {filteredReports.map((report) => (
                              <tr key={report.id} className="hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-white">
                                      {report.title || report.description || 'Report'}
                                    </div>
                                    <div className="text-sm text-slate-400 truncate max-w-xs">
                                      {report.reason && `Reason: ${report.reason}`}
                                    </div>
                                    {report.details && (
                                      <div className="text-xs text-slate-500 truncate max-w-xs mt-1">
                                        {report.details}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-white">
                                    {report.reported_user?.username || report.reported_user?.display_name || 'Unknown User'}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    Reported by: {report.reporter?.username || report.reporter?.display_name || 'Unknown'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    report.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                                    report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {report.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
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
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                  <div>
                                    <div>{new Date(report.created_at).toLocaleDateString()}</div>
                                    <div className="text-xs text-slate-500">
                                      {new Date(report.created_at).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => setSelectedReport(report)}
                                      className="text-purple-400 hover:text-purple-300"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleReportAction(report.id, 'resolve', report.title || 'Report')}
                                      className="text-green-400 hover:text-green-300"
                                      title="Resolve Report"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleReportAction(report.id, 'dismiss', report.title || 'Report')}
                                      className="text-red-400 hover:text-red-300"
                                      title="Dismiss Report"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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

                {/* Automation View */}
                {activeView === 'automation' && (
                  <AutomationView />
                )}

                {/* Monitoring View */}
                {activeView === 'monitoring' && (
                  <MonitoringView />
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

                {activeView === 'analytics' && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Analytics</h2>
                    <button
                      onClick={() => setShowAnalytics(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Open Analytics Dashboard
                    </button>
                  </div>
                )}

                {activeView === 'settings' && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white">Auto-refresh</span>
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white">Refresh Interval (seconds)</span>
                        <input
                          type="number"
                          value={refreshInterval / 1000}
                          onChange={(e) => setRefreshInterval(parseInt(e.target.value) * 1000)}
                          className="w-20 px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                      </div>
                    </div>
                  </div>
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
    </div>
  );
}
