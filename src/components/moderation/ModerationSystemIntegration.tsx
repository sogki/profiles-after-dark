import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download as DownloadIcon,
  Settings as SettingsIcon,
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
  FileText,
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
  Search,
  Filter as FilterIcon,
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
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Server,
  Database,
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
import { useModerationSystem } from './hooks/useModerationSystem';
import { useAuth } from '../../context/authContext';
import EnhancedReportModal from './modals/EnhancedReportModal';
import EnhancedModerationPanel from './EnhancedModerationPanel';
import ModerationMessaging from './modals/ModerationMessaging';
import EnhancedNotificationSystem from './modals/EnhancedNotificationSystem';
import ModerationAnalytics from './modals/ModerationAnalytics';
import toast from 'react-hot-toast';

interface ModerationSystemIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModerationSystemIntegration({ isOpen, onClose }: ModerationSystemIntegrationProps) {
  const { user, userProfile } = useAuth();
  const {
    reports,
    logs,
    users,
    stats,
    loading,
    error,
    loadReports,
    loadLogs,
    loadUsers,
    loadStats,
    handleReport,
    moderateContent,
    analyzeUser,
    refreshData
  } = useModerationSystem();

  const [activeView, setActiveView] = useState<'dashboard' | 'reports' | 'users' | 'analytics' | 'messaging' | 'notifications' | 'settings'>('dashboard');
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

  const hasModerationAccess = userProfile?.role === 'admin' || userProfile?.role === 'moderator' || userProfile?.role === 'staff';

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !hasModerationAccess) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, hasModerationAccess, refreshData]);

  // Real-time updates
  useEffect(() => {
    if (!hasModerationAccess) return;

    const setupRealtimeUpdates = () => {
      // This would set up real-time subscriptions for live updates
      console.log('Setting up real-time updates for moderation system');
    };

    setupRealtimeUpdates();
  }, [hasModerationAccess]);

  const handleReportAction = async (reportId: string, action: string, reason: string) => {
    try {
      await handleReport(reportId, action, reason);
      toast.success(`Report ${action} successfully`);
      setSelectedReport(null);
    } catch (error) {
      toast.error(`Failed to ${action} report`);
    }
  };

  const handleUserAction = async (userId: string, action: string, reason: string) => {
    try {
      // Implement user action handling
      toast.success(`User ${action} successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchQuery || 
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (!isOpen) {
    return null;
  }

  // Show loading state while user profile is loading
  if (!userProfile && user) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-slate-400">Loading your profile information...</p>
        </div>
      </div>
    );
  }

  if (!hasModerationAccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-2xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">You do not have permission to access the moderation system.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-7xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Enhanced Moderation System</h2>
                  <p className="text-slate-400">AI-powered content moderation and user management</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className="text-sm text-slate-400">Auto-refresh</span>
                </div>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-400 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={onClose}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex space-x-1 p-4 border-b border-slate-700">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'reports', label: 'Reports', icon: Flag },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'messaging', label: 'Messaging', icon: MessageSquare },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      activeView === tab.id
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
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
                    <div className="p-6 space-y-8">
                      {/* Stats Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            title: 'AI Accuracy',
                            value: `${stats?.aiAccuracy || 0}%`,
                            icon: Zap,
                            color: 'purple',
                            change: '+2%'
                          },
                          {
                            title: 'Response Time',
                            value: `${stats?.responseTime || 0}h`,
                            icon: Target,
                            color: 'green',
                            change: '-0.3h'
                          }
                        ].map((stat, index) => {
                          const IconComponent = stat.icon;
                          return (
                            <motion.div
                              key={stat.title}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                                  <IconComponent className={`w-6 h-6 text-${stat.color}-400`} />
                                </div>
                                <span className="text-sm text-green-400 font-medium">{stat.change}</span>
                              </div>
                              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                              <div className="text-sm text-slate-400">{stat.title}</div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Recent Activity */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
                          <h3 className="text-lg font-semibold text-white mb-4">Recent Reports</h3>
                          <div className="space-y-4">
                            {reports.slice(0, 5).map((report) => (
                              <div key={report.id} className="flex items-center gap-3 p-3 bg-slate-600/50 rounded-lg">
                                <div className={`w-3 h-3 rounded-full ${
                                  report.priority === 'critical' ? 'bg-red-500' :
                                  report.priority === 'high' ? 'bg-orange-500' :
                                  report.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`} />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">{report.reason}</div>
                                  <div className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  report.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                                  report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {report.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
                          <h3 className="text-lg font-semibold text-white mb-4">Moderation Actions</h3>
                          <div className="space-y-4">
                            {logs.slice(0, 5).map((log) => (
                              <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-600/50 rounded-lg">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                  <Shield className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-white">{log.action}</div>
                                  <div className="text-xs text-slate-400">{log.description}</div>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(log.created_at).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other Views */}
                  {activeView === 'reports' && (
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">Reports Management</h2>
                      <p className="text-slate-400">Enhanced reports management coming soon...</p>
                    </div>
                  )}

                  {activeView === 'users' && (
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
                      <p className="text-slate-400">Enhanced user management coming soon...</p>
                    </div>
                  )}

                  {activeView === 'messaging' && (
                    <div className="p-6">
                      <button
                        onClick={() => setShowMessaging(true)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Open Messaging System
                      </button>
                    </div>
                  )}

                  {activeView === 'notifications' && (
                    <div className="p-6">
                      <button
                        onClick={() => setShowNotifications(true)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Open Notification System
                      </button>
                    </div>
                  )}

                  {activeView === 'analytics' && (
                    <div className="p-6">
                      <button
                        onClick={() => setShowAnalytics(true)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Open Analytics Dashboard
                      </button>
                    </div>
                  )}

                  {activeView === 'settings' && (
                    <div className="p-6">
                      <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
                        <h3 className="text-lg font-semibold text-white mb-4">Moderation Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">Auto-refresh</span>
                            <input
                              type="checkbox"
                              checked={autoRefresh}
                              onChange={(e) => setAutoRefresh(e.target.checked)}
                              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">Refresh Interval</span>
                            <select
                              value={refreshInterval}
                              onChange={(e) => setRefreshInterval(Number(e.target.value))}
                              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value={10000}>10 seconds</option>
                              <option value={30000}>30 seconds</option>
                              <option value={60000}>1 minute</option>
                              <option value={300000}>5 minutes</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modals */}
            <EnhancedReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              reporterUserId={user?.id || ''}
              onReportSubmitted={() => {
                setShowReportModal(false);
                refreshData();
              }}
            />

            <ModerationMessaging
              isOpen={showMessaging}
              onClose={() => setShowMessaging(false)}
            />

            {isOpen && <EnhancedNotificationSystem />}

            <ModerationAnalytics
              isOpen={showAnalytics}
              onClose={() => setShowAnalytics(false)}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}