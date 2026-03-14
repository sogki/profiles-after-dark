import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
  Heart,
  Monitor,
  PieChart as PieChartIcon,
  RefreshCw,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardViewProps {
  stats: any;
  loading: boolean;
  dashboardTimeRange: "7d" | "30d" | "90d";
  setDashboardTimeRange: (range: "7d" | "30d" | "90d") => void;
  refreshData: () => void;
  generateReportsOverTime: Array<{ date: string; reports: number; resolved: number; pending: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  priorityBreakdown: Array<{ name: string; value: number; color: string }>;
  systemHealthLoading: boolean;
  systemHealth: {
    api: { status: string; responseTime: number };
    database: { status: string; connections: string };
    memory: { usage: number; status: string };
  } | null;
  onGoToAnalytics: () => void;
}

export default function DashboardView({
  stats,
  loading,
  dashboardTimeRange,
  setDashboardTimeRange,
  refreshData,
  generateReportsOverTime,
  statusDistribution,
  priorityBreakdown,
  systemHealthLoading,
  systemHealth,
  onGoToAnalytics,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm">Overview and quick stats</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#2D2D2D] rounded-lg p-1 border border-slate-700/50">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDashboardTimeRange(range)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  dashboardTimeRange === range
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
          <button
            onClick={refreshData}
            className="flex items-center space-x-2 px-4 py-2 bg-[#2D2D2D] hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700/50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Reports", value: stats?.totalReports || 0, icon: FileText, color: "text-blue-400", bgColor: "bg-blue-500/10" },
          { title: "Pending Reports", value: stats?.pendingReports || 0, icon: Clock, color: "text-orange-400", bgColor: "bg-orange-500/10" },
          { title: "Resolved Reports", value: stats?.resolvedReports || 0, icon: CheckCircle, color: "text-green-400", bgColor: "bg-green-500/10" },
          { title: "Active Users", value: stats?.activeUsers || 0, icon: Users, color: "text-purple-400", bgColor: "bg-purple-500/10" },
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
              <p className="text-slate-400 text-xs mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
              <Legend wrapperStyle={{ color: "#9ca3af", fontSize: "12px" }} />
              <Area type="monotone" dataKey="reports" stroke="#9333ea" fillOpacity={1} fill="#9333ea33" name="Total Reports" />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="#10b98133" name="Resolved" />
              <Area type="monotone" dataKey="pending" stroke="#f59e0b" fillOpacity={1} fill="#f59e0b33" name="Pending" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

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
                <Pie data={statusDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value">
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-slate-400">No data available</p>
            </div>
          )}
        </div>
      </div>

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
            <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {priorityBreakdown.map((entry, index) => (
                <Cell key={`priority-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : systemHealth ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#2D2D2D] rounded-lg p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">API Status</span>
                {systemHealth.api.status === "Operational" ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-yellow-400" />}
              </div>
              <div className="text-2xl font-bold text-white">{systemHealth.api.status}</div>
              <div className="text-xs text-slate-400 mt-1">
                {systemHealth.api.responseTime > 0 ? `Response: ${systemHealth.api.responseTime}ms` : "No data"}
              </div>
            </div>
            <div className="bg-[#2D2D2D] rounded-lg p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Database</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{systemHealth.database.status}</div>
              <div className="text-xs text-slate-400 mt-1">{systemHealth.database.connections} connections</div>
            </div>
            <div className="bg-[#2D2D2D] rounded-lg p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Memory Usage</span>
                {systemHealth.memory.status === "warning" ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
              </div>
              <div className="text-2xl font-bold text-white">{systemHealth.memory.usage}%</div>
              <div className="text-xs text-slate-400 mt-1">{systemHealth.memory.status === "warning" ? "Above threshold" : "Normal"}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">Unable to load system health data</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-slate-800/30">
          <button
            onClick={onGoToAnalytics}
            className="w-full px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>View Full Analytics & Monitoring</span>
          </button>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-lg border border-slate-800/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Recent Activity</h2>
            <p className="text-slate-400 text-sm">Latest moderation actions</p>
          </div>
          <Clock className="w-5 h-5 text-purple-400" />
        </div>
        <div className="space-y-3">
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.slice(0, 5).map((activity: any, index: number) => {
              const activityType = activity.type || "general";
              const IconComponent = activityType === "fanart" ? Heart : FileText;
              const iconColor = activityType === "fanart" ? "text-pink-400" : "text-purple-400";
              return (
                <motion.div
                  key={activity.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between hover:bg-[#353535] transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${iconColor === "text-pink-400" ? "bg-pink-500/10" : "bg-purple-500/10"}`}>
                      <IconComponent className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {typeof activity.action === "string" ? activity.action : activity.title || "Unknown activity"}
                      </p>
                      <p className={`text-xs mt-1 ${iconColor}`}>{activityType === "fanart" ? "Fan art" : activity.description || "Moderation action"}</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
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
  );
}

