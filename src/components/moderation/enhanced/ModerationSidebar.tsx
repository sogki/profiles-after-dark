import { BarChart3, ChevronDown, ChevronUp, X, Shield, Flag, AlertTriangle, MessageSquare, Ticket, Clock, FileText, Megaphone, Users, Bot, TrendingUp, Code, Settings, CreditCard, UserCog } from "lucide-react";
import type { ModerationView } from "./types";

interface ExpandedGroups {
  moderation: boolean;
  content: boolean;
  users: boolean;
  system: boolean;
}

interface ModerationSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  activeView: ModerationView;
  setActiveView: (view: ModerationView) => void;
  clearReportId: (view?: string) => void;
  expandedGroups: ExpandedGroups;
  setExpandedGroups: (updater: (prev: ExpandedGroups) => ExpandedGroups) => void;
  onNavigateHome: () => void;
  canManageSubscriptions: boolean;
  isAdmin: boolean;
}

export default function ModerationSidebar({
  sidebarOpen,
  setSidebarOpen,
  activeView,
  setActiveView,
  clearReportId,
  expandedGroups,
  setExpandedGroups,
  onNavigateHome,
  canManageSubscriptions,
  isAdmin,
}: ModerationSidebarProps) {
  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 flex-shrink-0 bg-[#1A1A1A] border-r border-slate-800/30 flex-col transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ height: "100%", maxHeight: "100vh", overflow: "hidden" }}
      >
        <div className="p-3 border-b border-slate-800/30 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-3 text-white hover:text-purple-400 transition-colors group flex-1"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-purple-600/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <Shield className="w-5 h-5 relative z-10 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm block truncate">Moderation Panel</span>
              <span className="text-xs text-slate-400 block truncate">Enhanced Moderation System</span>
            </div>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          <button
            onClick={() => {
              clearReportId("dashboard");
              setActiveView("dashboard");
              setSidebarOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 ${
              activeView === "dashboard"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-800/30"
            }`}
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className={`w-5 h-5 ${activeView === "dashboard" ? "text-white" : "text-slate-400"}`} />
              <span className="font-medium text-sm">Dashboard</span>
            </div>
          </button>

          <div>
            <button
              onClick={() => setExpandedGroups((prev) => ({ ...prev, moderation: !prev.moderation }))}
              className="w-full flex items-center justify-between px-2 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wider">Moderation</span>
              {expandedGroups.moderation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.moderation && (
              <div className="ml-2 space-y-1 mt-1">
                {[
                  { id: "reports", label: "Reports", icon: Flag },
                  { id: "appeals", label: "Appeals", icon: AlertTriangle },
                  { id: "feedback", label: "Feedback", icon: MessageSquare },
                  { id: "support-tickets", label: "Support Tickets", icon: Ticket },
                  { id: "logs", label: "Logs", icon: Clock },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        clearReportId(item.id);
                        setActiveView(item.id as ModerationView);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setExpandedGroups((prev) => ({ ...prev, content: !prev.content }))}
              className="w-full flex items-center justify-between px-2 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wider">Content</span>
              {expandedGroups.content ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.content && (
              <div className="ml-2 space-y-1 mt-1">
                {[
                  { id: "content", label: "Content", icon: FileText },
                  { id: "announcements", label: "Announcements", icon: Megaphone },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        clearReportId(item.id);
                        setActiveView(item.id as ModerationView);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setExpandedGroups((prev) => ({ ...prev, users: !prev.users }))}
              className="w-full flex items-center justify-between px-2 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wider">Users</span>
              {expandedGroups.users ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.users && (
              <div className="ml-2 space-y-1 mt-1">
                {[
                  { id: "users", label: "User Management", icon: Users, show: true },
                  { id: "subscriptions", label: "Subscriptions", icon: CreditCard, show: canManageSubscriptions },
                  { id: "roles", label: "Roles", icon: UserCog, show: isAdmin },
                ]
                  .filter((item) => item.show)
                  .map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          clearReportId(item.id);
                          setActiveView(item.id as ModerationView);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setExpandedGroups((prev) => ({ ...prev, system: !prev.system }))}
              className="w-full flex items-center justify-between px-2 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wider">System</span>
              {expandedGroups.system ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedGroups.system && (
              <div className="ml-2 space-y-1 mt-1">
                {[
                  { id: "automation", label: "AI Moderation", icon: Bot },
                  { id: "analytics", label: "Analytics & Monitoring", icon: TrendingUp },
                  { id: "developer", label: "Developer Tools", icon: Code },
                  { id: "settings", label: "Settings", icon: Settings },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        clearReportId(item.id);
                        setActiveView(item.id as ModerationView);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
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
    </>
  );
}

