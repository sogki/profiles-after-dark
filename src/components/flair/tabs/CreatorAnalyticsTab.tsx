import { BarChart3, Download, Heart, Image, Users } from 'lucide-react';

import type { CreatorAnalyticsSummary } from '@/hooks/flair/useCreatorAnalytics';

interface CreatorAnalyticsTabProps {
  summary: CreatorAnalyticsSummary;
  loading: boolean;
}

const statCards = [
  { key: 'total_uploads', label: 'Total Uploads', icon: Image },
  { key: 'total_downloads', label: 'Total Downloads', icon: Download },
  { key: 'follower_count', label: 'Followers', icon: Users },
  { key: 'public_emote_uses', label: 'Public Emote Uses', icon: Heart },
] as const;

export default function CreatorAnalyticsTab({ summary, loading }: CreatorAnalyticsTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading creator analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Creator Analytics
        </h2>
        <p className="text-slate-400">Track your profile performance and content engagement.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          const value = summary[item.key];
          return (
            <div key={item.key} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                <Icon className="h-4 w-4 text-purple-300" />
              </div>
              <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-purple-300" />
          <h3 className="text-white font-semibold">Upload Breakdown</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2 text-slate-300">
            Profiles: <span className="text-white font-semibold">{summary.profile_uploads}</span>
          </div>
          <div className="rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2 text-slate-300">
            Emotes: <span className="text-white font-semibold">{summary.emote_uploads}</span>
          </div>
          <div className="rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2 text-slate-300">
            Wallpapers: <span className="text-white font-semibold">{summary.wallpaper_uploads}</span>
          </div>
          <div className="rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2 text-slate-300">
            Profile Pairs: <span className="text-white font-semibold">{summary.pair_uploads}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
