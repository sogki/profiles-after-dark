import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';

interface UserRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  role: string | null;
}

interface Props {
  isAdmin: boolean;
}

export default function RolesManagementView({ isAdmin }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'staff' | 'moderator' | 'admin'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'staff' | 'moderator' | 'admin'>('user');
  const [reason, setReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, role')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers((data || []) as UserRow[]);
    } catch (error) {
      console.error('Failed to load roles view users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const rows = useMemo(() => {
    return users.filter((row) => {
      const q = search.trim().toLowerCase();
      const currentRole = (row.role || 'user').split(',')[0].trim().toLowerCase();
      const matchesSearch =
        !q ||
        (row.username || '').toLowerCase().includes(q) ||
        (row.display_name || '').toLowerCase().includes(q);
      const matchesRole = filterRole === 'all' || currentRole === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, search, filterRole]);

  const selectedUser = rows.find((row) => row.user_id === selectedUserId) || null;

  useEffect(() => {
    if (!selectedUser) return;
    const primaryRole = ((selectedUser.role || 'user').split(',')[0].trim().toLowerCase() || 'user') as
      | 'user'
      | 'staff'
      | 'moderator'
      | 'admin';
    setNewRole(primaryRole);
    setReason('');
    setCustomMessage('');
  }, [selectedUserId]);

  const saveRole = async () => {
    if (!isAdmin || !selectedUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        p_target_user_id: selectedUser.user_id,
        p_new_role: newRole,
        p_reason: reason || null,
        p_custom_message: customMessage || null,
      });
      if (error) throw error;
      toast.success('Role updated');
      await loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-300">
        Only admins can access centralized role management.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Roles</h2>
          <p className="text-slate-400">Admin-only centralized role assignment</p>
        </div>
        <button
          onClick={loadUsers}
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
                placeholder="Search users..."
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white pl-9 pr-3 py-2"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
              className="rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2"
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="staff">Staff</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
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
                    <p className="inline-flex items-center gap-1 text-sm text-white">
                      <Shield className="w-3.5 h-3.5 text-purple-300" />
                      {(row.role || 'user').split(',')[0]}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h3 className="text-white font-semibold">Assign Role</h3>
          {!selectedUser ? (
            <p className="text-slate-400 text-sm">Select a user to assign role.</p>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                {selectedUser.display_name || selectedUser.username} ({selectedUser.username ? `@${selectedUser.username}` : 'no username'})
              </p>

              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as typeof newRole)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2"
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Internal reason (optional)"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2"
              />
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Custom message for user (optional)"
                rows={3}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 text-white px-3 py-2"
              />
              <button
                onClick={saveRole}
                disabled={saving}
                className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-3 py-2"
              >
                {saving ? 'Saving...' : 'Save Role'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

