import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Clock, Eye, Flag, Search, Shield } from "lucide-react";
import { formatStatus } from "../../../lib/formatStatus";

interface ReportsViewProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterPriority: string;
  setFilterPriority: (value: string) => void;
  filteredReports: any[];
  filteredDismissedReports: any[];
  activeReportsCollapsed: boolean;
  setActiveReportsCollapsed: (value: boolean) => void;
  dismissedReportsCollapsed: boolean;
  setDismissedReportsCollapsed: (value: boolean) => void;
  handleReportAction: (reportId: string, action: "handle" | "resolve" | "dismiss", reportTitle: string) => void;
  navigateToReport: (reportId: string) => void;
}

export default function ReportsView({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filteredReports,
  filteredDismissedReports,
  activeReportsCollapsed,
  setActiveReportsCollapsed,
  dismissedReportsCollapsed,
  setDismissedReportsCollapsed,
  handleReportAction,
  navigateToReport,
}: ReportsViewProps) {
  return (
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
              if (e.target.value === "dismissed") setDismissedReportsCollapsed(false);
            }}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">{formatStatus("pending")}</option>
            <option value="in_progress">{formatStatus("in_progress")}</option>
            <option value="resolved">{formatStatus("resolved")}</option>
            <option value="dismissed">{formatStatus("dismissed")}</option>
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

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <button
          onClick={() => setActiveReportsCollapsed(!activeReportsCollapsed)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-white">Active Reports</h3>
            <span className="px-2 py-1 text-xs rounded-full bg-slate-700 text-slate-300">{filteredReports.length}</span>
          </div>
          {activeReportsCollapsed ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
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
                        <h3 className="text-base font-semibold text-white mb-1 truncate">{report.title || report.description || "Report"}</h3>
                        <p className="text-sm text-slate-400 truncate">{report.reason || "No reason provided"}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                          report.status === "pending"
                            ? "bg-orange-500/20 text-orange-400"
                            : report.status === "resolved"
                            ? "bg-green-500/20 text-green-400"
                            : report.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {formatStatus(report.status)}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Reported User:</span>
                        <span className="text-white font-medium">{report.reported_user?.username || report.reported_user?.display_name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Reporter:</span>
                        <span className="text-white">{report.reporter?.username || report.reporter?.display_name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Date:</span>
                        <div className="flex items-center space-x-1 text-slate-300">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-slate-700">
                      {report.status === "pending" && (
                        <button
                          onClick={() => handleReportAction(report.id, "handle", report.title || "Report")}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Handle Report</span>
                        </button>
                      )}
                      {report.status === "in_progress" && (
                        <button
                          onClick={() => navigateToReport(report.id)}
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

      {filteredDismissedReports.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <button
            onClick={() => setDismissedReportsCollapsed(!dismissedReportsCollapsed)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-white">Dismissed Reports</h3>
              <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">{filteredDismissedReports.length}</span>
            </div>
            {dismissedReportsCollapsed ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
          </button>
          {!dismissedReportsCollapsed && (
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDismissedReports.map((report) => (
                  <div key={report.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 opacity-75">
                    <h3 className="text-base font-semibold text-white mb-1 truncate">{report.title || report.description || "Report"}</h3>
                    <p className="text-sm text-slate-400 truncate">{report.reason || "No reason provided"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

