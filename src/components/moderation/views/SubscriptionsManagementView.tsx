import { useEffect, useMemo, useState } from 'react';
import { Crown, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

interface UserRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  role: string | null;
}

interface SubscriptionRow {
  user_id: string;
  subscription_tier: 'free' | 'premium';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string | null;
}

interface Props {
  canManageSubscriptions: boolean;
}

export default function SubscriptionsManagementView({ canManageSubscriptions }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [subsByUserId, setSubsByUserId] = useState<Record<string, SubscriptionRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trialing' | 'past_due' | 'canceled'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [reason, setReason] = useState('');
  const [forceReset, setForceReset] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tier, setTier] = useState<'free' | 'premium'>('free');
  const [status, setStatus] = useState<'active' | 'trialing' | 'past_due' | 'canceled'>('active');
  const [periodEnd, setPeriodEnd] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: userData, error: userErr }, { data: subData, error: subErr }] = await Promise.all([
        supabase.from('user_profiles').select('user_id, username, display_name, role').order('created_at', { ascending: false }),
        supabase.rpc('staff_list_flair_subscriptions'),
      ]);

      if (userErr) throw userErr;
      if (subErr) throw subErr;

      const subMap: Record<string, SubscriptionRow> = {};
      (subData || []).forEach((row) => {
        subMap[row.user_id] = row as SubscriptionRow;
      });

      setUsers((userData || []) as UserRow[]);
      setSubsByUserId(subMap);
    } catch (error) {
      console.error('Failed to load subscriptions view data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rows = useMemo(() => {
    return users
      .map((user) => ({
        ...user,
        subscription: subsByUserId[user.user_id] || {
          user_id: user.user_id,
          subscription_tier: 'free' as const,
          status: 'active' as const,
          current_period_end: null,
        },
      }))
      .filter((row) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          (row.username || '').toLowerCase().includes(q) ||
          (row.display_name || '').toLowerCase().includes(q);
        const matchesTier = tierFilter === 'all' || row.subscription.subscription_tier === tierFilter;
        const matchesStatus = statusFilter === 'all' || row.subscription.status === statusFilter;
        return matchesSearch && matchesTier && matchesStatus;
      });
  }, [users, subsByUserId, search, tierFilter, statusFilter]);

  const selectedUser = rows.find((row) => row.user_id === selectedUserId) || null;

  useEffect(() => {
    if (!selectedUser) return;
    setTier(selectedUser.subscription.subscription_tier);
    setStatus(selectedUser.subscription.status);
    setPeriodEnd(
      selectedUser.subscription.current_period_end
        ? new Date(selectedUser.subscription.current_period_end).toISOString().slice(0, 16)
        : ''
    );
    setCustomMessage('');
    setReason('');
    setForceReset(false);
  }, [selectedUserId]);

  const saveSubscription = async () => {
    if (!selectedUser || !canManageSubscriptions) return;
    setSaving(true);
    try {
      const pCurrentPeriodEnd = periodEnd ? new Date(periodEnd).toISOString() : null;
      const { error } = await supabase.rpc('staff_manage_flair_subscription', {
        p_target_user_id: selectedUser.user_id,
        p_subscription_tier: tier,
        p_status: status,
        p_current_period_end: pCurrentPeriodEnd,
        p_custom_message: customMessage || null,
        p_force_reset: forceReset,
        p_reason: reason || null,
      });
      if (error) throw error;
      toast.success('Subscription updated');
      await loadData();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  if (!canManageSubscriptions) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-300">
        Staff or admin permissions are required for subscription management.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Subscriptions</h2>
          <p className="text-slate-400">Centralized premium/free subscription controls</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-white"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username/display name..."
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white pl-9 pr-3 py-2"
              />
            </div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
              className="rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2"
            >
              <option value="all">All tiers</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          <div className="max-h-[55vh] overflow-y-auto divide-y divide-slate-700">
            {loading ? (
              <div className="py-8 text-slate-400 text-center">Loading users...</div>
            ) : (
              rows.map((row) => (
                <button
                  key={row.user_id}
                  onClick={() => setSelectedUserId(row.user_id)}
                  className={`w-full text-left px-3 py-3 hover:bg-slate-700/40 transition ${
                    selectedUserId === row.user_id ? 'bg-slate-700/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">{row.display_name || row.username || 'Unknown'}</p>
                      <p className="text-slate-400 text-xs">@{row.username || 'unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white inline-flex items-center gap-1">
                        {row.subscription.subscription_tier === 'premium' && <Crown className="w-3.5 h-3.5 text-yellow-300" />}
                        {row.subscription.subscription_tier}
                      </p>
                      <p className="text-xs text-slate-400">{row.subscription.status}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h3 className="text-white font-semibold">Adjust Subscription</h3>
          {!selectedUser ? (
            <p className="text-slate-400 text-sm">Select a user to edit subscription state.</p>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                {selectedUser.display_name || selectedUser.username} ({selectedUser.username ? `@${selectedUser.username}` : 'no username'})
              </p>

              <select value={tier} onChange={(e) => setTier(e.target.value as typeof tier)} className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2">
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2">
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past due</option>
                <option value="canceled">Canceled</option>
              </select>
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2"
              />
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Internal reason (optional)"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2"
              />
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Custom message to user (optional)"
                rows={3}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2"
              />
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <input type="checkbox" checked={forceReset} onChange={(e) => setForceReset(e.target.checked)} />
                Force reset Stripe links
              </label>
              <button
                onClick={saveSubscription}
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-2"
              >
                {saving ? 'Saving...' : 'Save Subscription'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

