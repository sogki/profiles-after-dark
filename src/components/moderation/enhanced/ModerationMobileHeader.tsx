import { BarChart3, Bot, CreditCard, FileText, Flag, Menu, UserCog, Users } from "lucide-react";
import type { ModerationView } from "./types";

interface ModerationMobileHeaderProps {
  activeView: ModerationView;
  setActiveView: (view: ModerationView) => void;
  clearReportId: (view?: string) => void;
  setSidebarOpen: (value: boolean) => void;
  canManageSubscriptions: boolean;
  isAdmin: boolean;
}

export default function ModerationMobileHeader({
  activeView,
  setActiveView,
  clearReportId,
  setSidebarOpen,
  canManageSubscriptions,
  isAdmin,
}: ModerationMobileHeaderProps) {
  return (
    <>
      <div className="mb-4 lg:hidden flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Moderation Panel</h1>
        <div className="w-10" />
      </div>

      <div className="mb-6 lg:hidden">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[
            { id: "dashboard", icon: BarChart3, label: "Dashboard" },
            { id: "reports", icon: Flag, label: "Reports" },
            { id: "content", icon: FileText, label: "Content" },
            { id: "users", icon: Users, label: "Users" },
            { id: "discord-bot", icon: Bot, label: "Discord" },
            { id: "subscriptions", icon: CreditCard, label: "Subs", show: canManageSubscriptions },
            { id: "roles", icon: UserCog, label: "Roles", show: isAdmin },
          ]
            .filter((item) => item.show ?? true)
            .map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  clearReportId(item.id);
                  setActiveView(item.id as ModerationView);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
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
  );
}

