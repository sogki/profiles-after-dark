import { useEffect, useMemo, useState } from 'react';
import { Bot, Link2, Users, Crown, RefreshCw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/authContext';
import {
  getDiscordBotDashboard,
  getDiscordGuildChannels,
  getDiscordBotLoggingSettings,
  updateDiscordBotLoggingSettings,
} from '../../../lib/discordBotApi';

interface DashboardUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  linked: boolean;
  discord_id: string | null;
  discord_username: string | null;
  flair_subscription_tier: string;
  flair_status: string;
}

interface DashboardState {
  guild: {
    id: string | null;
    name: string | null;
    member_count: number;
    online_count: number;
  };
  stats: {
    premium_subscribers: number;
    linked_users: number;
    unlinked_users: number;
    total_users: number;
  };
  users: DashboardUser[];
}

const LOGGING_KEYS = [
  'DISCORD_LOG_CHANNEL_SUBMISSIONS',
  'DISCORD_LOG_CHANNEL_CONTENT_REVIEW',
  'DISCORD_LOG_CHANNEL_FLAIR',
  'DISCORD_LOG_CHANNEL_ACCOUNT_LINKING',
  'DISCORD_LOG_CHANNEL_ADMIN',
] as const;

const LOGGING_LABELS: Record<(typeof LOGGING_KEYS)[number], string> = {
  DISCORD_LOG_CHANNEL_SUBMISSIONS: 'Content submissions',
  DISCORD_LOG_CHANNEL_CONTENT_REVIEW: 'Content review actions',
  DISCORD_LOG_CHANNEL_FLAIR: 'Flair subscription events',
  DISCORD_LOG_CHANNEL_ACCOUNT_LINKING: 'Account linking events',
  DISCORD_LOG_CHANNEL_ADMIN: 'Admin-only events',
};

export default function DiscordBotView() {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([]);
  const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all');

  const roles = useMemo(
    () =>
      (userProfile?.role || '')
        .split(',')
        .map((role) => role.trim().toLowerCase())
        .filter(Boolean),
    [userProfile?.role]
  );
  const isAdmin = roles.includes('admin');

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardResponse, settingsResponse, channelsResponse] = await Promise.all([
        getDiscordBotDashboard(),
        getDiscordBotLoggingSettings(),
        getDiscordGuildChannels(),
      ]);
      setDashboard(dashboardResponse.data);
      setSettings(settingsResponse.data.settings || {});
      const rawChannels = Array.isArray(channelsResponse.data?.channels)
        ? channelsResponse.data.channels
        : [];
      setChannels(
        rawChannels
          .filter((channel): channel is { id: string; name: string } =>
            Boolean(channel && typeof channel.id === 'string' && typeof channel.name === 'string')
          )
          .map((channel) => ({
            id: channel.id,
            name: channel.name,
          }))
      );
    } catch (error) {
      console.error('Failed to load Discord bot data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load Discord bot data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const users = dashboard?.users || [];
    if (filter === 'linked') return users.filter((user) => user.linked);
    if (filter === 'unlinked') return users.filter((user) => !user.linked);
    return users;
  }, [dashboard?.users, filter]);

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Only admins can update logging settings.');
      return;
    }
    setSaving(true);
    try {
      await updateDiscordBotLoggingSettings(settings);
      toast.success('Discord bot logging settings saved.');
      await loadData();
    } catch (error) {
      console.error('Failed to save logging settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Discord Bot dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/75 rounded-xl border border-slate-700/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bot className="w-6 h-6 text-purple-400" />
              Discord Bot
            </h2>
            <p className="text-slate-400 mt-1">Guild stats, linking coverage, flair premium status, and log routing.</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
          <p className="text-slate-400 text-sm">Guild Members</p>
          <p className="text-2xl font-bold text-white mt-1">{dashboard?.guild.member_count || 0}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
          <p className="text-slate-400 text-sm">Linked Accounts</p>
          <p className="text-2xl font-bold text-white mt-1">{dashboard?.stats.linked_users || 0}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
          <p className="text-slate-400 text-sm">Unlinked Accounts</p>
          <p className="text-2xl font-bold text-white mt-1">{dashboard?.stats.unlinked_users || 0}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
          <p className="text-slate-400 text-sm">Flair Premium Users</p>
          <p className="text-2xl font-bold text-white mt-1">{dashboard?.stats.premium_subscribers || 0}</p>
        </div>
      </div>

      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Logging Settings</h3>
          <button
            onClick={handleSave}
            disabled={!isAdmin || saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {LOGGING_KEYS.map((key) => (
            <label key={key} className="block">
              <span className="block text-sm text-slate-300 mb-1">{LOGGING_LABELS[key]}</span>
              <select
                value={settings[key] || ''}
                disabled={!isAdmin}
                onChange={(event) => setSettings((prev) => ({ ...prev, [key]: event.target.value.trim() }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70"
              >
                <option value="">Not set</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-white">User Link Status</h3>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'linked', label: 'Linked' },
              { id: 'unlinked', label: 'Unlinked' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id as typeof filter)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === option.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[520px] overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.user_id}
              className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <div>
                <p className="text-white font-medium">{user.display_name || user.username || 'Unknown user'}</p>
                <p className="text-xs text-slate-400">{user.user_id}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                    user.linked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/40 text-slate-300'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {user.linked ? 'Linked' : 'Not linked'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                    user.flair_subscription_tier === 'premium'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-slate-600/40 text-slate-300'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  {user.flair_subscription_tier}
                </span>
                {user.discord_username && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
                    <Users className="w-3.5 h-3.5" />
                    {user.discord_username}
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <p className="text-slate-400 text-sm">No users found for this filter.</p>
          )}
        </div>
      </div>
    </div>
  );
}
