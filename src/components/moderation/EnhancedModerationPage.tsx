import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useModerationSystem } from './hooks/useModerationSystem';
import { motion } from 'framer-motion';
import {
  Shield,
  Settings,
  Bell,
  MessageSquare,
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
  Moon,
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
  X,
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

export default function EnhancedModerationPage() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Check access first
  const hasModerationAccess = userProfile?.role === 'admin' || userProfile?.role === 'moderator' || userProfile?.role === 'staff';
  
  // Redirect if no access - do this before any other hooks
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

  // Now call hooks after access checks
  const [activeView, setActiveView] = useState<'dashboard' | 'reports' | 'content' | 'logs' | 'analytics' | 'users' | 'automation' | 'settings' | 'monitoring' | 'appeals' | 'messaging' | 'notifications'>('dashboard');
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

  // Memoize filtered reports to prevent unnecessary re-renders
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
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor },
    { id: 'appeals', label: 'Appeals', icon: AlertTriangle },
    { id: 'messaging', label: 'Messaging', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile-First Header */}
      <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors"
              >
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="font-bold text-base sm:text-lg">Enhanced Moderation</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={`${userProfile.display_name || userProfile.username}'s avatar`}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
                <div className="text-xs sm:text-sm hidden sm:block">
                  <div className="text-white font-medium">{userProfile?.display_name || userProfile?.username}</div>
                  <div className="text-slate-400 text-xs capitalize">{userProfile?.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile Navigation */}
        <div className="mb-6 md:hidden">
          <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-xl p-1 overflow-x-auto no-scrollbar">
            {navigationItems.slice(0, 6).map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeView === item.id
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <IconComponent className="h-3 w-3" />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* More Menu for Additional Items */}
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => setActiveView('settings' as any)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              More Options
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeView === item.id
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
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
                  <div className="space-y-6 sm:space-y-8">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                      {[
                        {
                          title: 'Total Reports',
                          value: stats?.totalReports || 0,
                          icon: Flag,
                          color: 'blue',
                          change: '+12%'
                        },
                        {
                          title: 'Pending Reports',
                          value: stats?.pendingReports || 0,
                          icon: Clock,
                          color: 'orange',
                          change: '-5%'
                        },
                        {
                          title: 'Resolved Reports',
                          value: stats?.resolvedReports || 0,
                          icon: CheckCircle,
                          color: 'green',
                          change: '+8%'
                        },
                        {
                          title: 'Active Users',
                          value: stats?.activeUsers || 0,
                          icon: Users,
                          color: 'purple',
                          change: '+3%'
                        }
                      ].map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                          <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-slate-800 rounded-xl p-3 sm:p-6 border border-slate-700"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-400 text-xs sm:text-sm font-medium truncate">{stat.title}</p>
                                <p className="text-lg sm:text-2xl font-bold text-white mt-1">{stat.value}</p>
                                <p className="text-xs text-green-400 mt-1">{stat.change}</p>
                              </div>
                              <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                                <IconComponent className={`w-4 h-4 sm:w-6 sm:h-6 text-${stat.color}-400`} />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700">
                      <div className="p-4 sm:p-6 border-b border-slate-700">
                        <h3 className="text-base sm:text-lg font-semibold text-white">Recent Activity</h3>
                      </div>
                      <div className="p-4 sm:p-6">
                        <div className="space-y-4">
                          {stats.recentActivity && stats.recentActivity.length > 0 ? (
                            stats.recentActivity.slice(0, 5).map((activity, index) => (
                              <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-slate-700/50 rounded-lg space-y-2 sm:space-y-0"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    activity.color === 'orange' ? 'bg-orange-400' :
                                    activity.color === 'green' ? 'bg-green-400' :
                                    activity.color === 'purple' ? 'bg-purple-400' : 'bg-blue-400'
                                  }`} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm sm:text-base truncate">{activity.action}</p>
                                    <p className="text-slate-400 text-xs sm:text-sm truncate">
                                      {activity.description}
                                    </p>
                                    <p className="text-slate-500 text-xs">
                                      {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    activity.type === 'report' ? 'bg-orange-500/20 text-orange-400' :
                                    activity.type === 'moderation' ? 'bg-purple-500/20 text-purple-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {activity.type}
                                  </span>
                                  <button
                                    onClick={() => {
                                      if (activity.type === 'report') {
                                        setSelectedReport({ id: activity.id.replace('report-', '') });
                                      }
                                    }}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                              <p className="text-slate-400">No recent activity</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reports View */}
                {activeView === 'reports' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Reports</h2>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center space-x-2">
                          <Search className="w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                          </select>
                          <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          >
                            <option value="all">All Priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl border border-slate-700">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-slate-700/50">
                            <tr>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Report</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden sm:table-cell">User</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden md:table-cell">Priority</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider hidden lg:table-cell">Date</th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {filteredReports.map((report) => (
                              <tr key={report.id} className="hover:bg-slate-700/50">
                                <td className="px-3 sm:px-6 py-4">
                                  <div>
                                    <div className="text-sm font-medium text-white truncate">
                                      {report.title || report.description || 'Report'}
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                                      {report.reason && `Reason: ${report.reason}`}
                                    </div>
                                    {report.details && (
                                      <div className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs mt-1">
                                        {report.details}
                                      </div>
                                    )}
                                    {/* Mobile: Show user info inline */}
                                    <div className="sm:hidden text-xs text-slate-400 mt-1">
                                      User: {report.reported_user?.username || report.reported_user?.display_name || 'Unknown'}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                  <div className="text-sm text-white">
                                    {report.reported_user?.username || report.reported_user?.display_name || 'Unknown User'}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    Reported by: {report.reporter?.username || report.reporter?.display_name || 'Unknown'}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    report.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                                    report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {report.status}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
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
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400 hidden lg:table-cell">
                                  <div>
                                    <div>{new Date(report.created_at).toLocaleDateString()}</div>
                                    <div className="text-xs text-slate-500">
                                      {new Date(report.created_at).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-1 sm:space-x-2">
                                    <button
                                      onClick={() => setSelectedReport(report)}
                                      className="text-purple-400 hover:text-purple-300 p-1"
                                      title="View Report"
                                    >
                                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleReportAction(report.id, 'resolve', report.title || 'Report')}
                                      className="text-green-400 hover:text-green-300 p-1"
                                      title="Resolve Report"
                                    >
                                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleReportAction(report.id, 'dismiss', report.title || 'Report')}
                                      className="text-red-400 hover:text-red-300 p-1"
                                      title="Dismiss Report"
                                    >
                                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
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
        </div>
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
