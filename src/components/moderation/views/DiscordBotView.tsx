import { useEffect, useMemo, useState } from 'react';
import { Bot, Link2, Users, Crown, RefreshCw, Save, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/authContext';
import {
  getDiscordBotDashboard,
  getDiscordGuildChannels,
  getDiscordBotLoggingSettings,
  updateDiscordBotLoggingSettings,
  getDiscordSetupLink,
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
  const [setupLink, setSetupLink] = useState('');

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
          .map((channel) => ({ id: channel.id, name: channel.name }))
      );

      if (isAdmin) {
        const linkResponse = await getDiscordSetupLink();
        setSetupLink(linkResponse.data?.url || '');
      }
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
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500" />
          <p className="text-slate-400">Loading Discord Bot dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/75 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Bot className="h-6 w-6 text-purple-400" />
              Discord Bot
            </h2>
            <p className="mt-1 text-slate-400">Guild stats, linking coverage, flair premium status, and log routing.</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-white transition-colors hover:bg-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Discord Setup Dashboard</h3>
              <p className="mt-1 text-sm text-slate-400">
                Setup presets, rules embed builder, and role creation now live in the dedicated Dev portal dashboard.
              </p>
            </div>
            <button
              onClick={() => setupLink && window.open(setupLink, '_blank', 'noopener,noreferrer')}
              disabled={!setupLink}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              Open Setup Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
          <p className="text-sm text-slate-400">Guild Members</p>
          <p className="mt-1 text-2xl font-bold text-white">{dashboard?.guild.member_count || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
          <p className="text-sm text-slate-400">Linked Accounts</p>
          <p className="mt-1 text-2xl font-bold text-white">{dashboard?.stats.linked_users || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
          <p className="text-sm text-slate-400">Unlinked Accounts</p>
          <p className="mt-1 text-2xl font-bold text-white">{dashboard?.stats.unlinked_users || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
          <p className="text-sm text-slate-400">Flair Premium Users</p>
          <p className="mt-1 text-2xl font-bold text-white">{dashboard?.stats.premium_subscribers || 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Logging Settings</h3>
          <button
            onClick={handleSave}
            disabled={!isAdmin || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {LOGGING_KEYS.map((key) => (
            <label key={key} className="block">
              <span className="mb-1 block text-sm text-slate-300">{LOGGING_LABELS[key]}</span>
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

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  filter === option.id ? 'bg-purple-600 text-white' : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[520px] space-y-2 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.user_id}
              className="flex flex-col gap-2 rounded-lg border border-slate-700/60 bg-slate-900/60 px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium text-white">{user.display_name || user.username || 'Unknown user'}</p>
                <p className="text-xs text-slate-400">{user.user_id}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
                    user.linked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/40 text-slate-300'
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {user.linked ? 'Linked' : 'Not linked'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
                    user.flair_subscription_tier === 'premium'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-slate-600/40 text-slate-300'
                  }`}
                >
                  <Crown className="h-3.5 w-3.5" />
                  {user.flair_subscription_tier}
                </span>
                {user.discord_username && (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-700/60 px-2 py-1 text-xs text-slate-200">
                    <Users className="h-3.5 w-3.5" />
                    {user.discord_username}
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && <p className="text-sm text-slate-400">No users found for this filter.</p>}
        </div>
      </div>
    </div>
  );
}
