import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Settings, Shield, Users, Lock, Unlock, Save, RefreshCw, UserCheck, UserX, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../../context/authContext'

interface StaffPermission {
  id: string
  user_id: string
  permission_key: string
  granted: boolean
  granted_by: string | null
  granted_at: string
  user_profiles?: {
    username: string | null
    display_name: string | null
  } | null
}

interface StaffMember {
  user_id: string
  username: string | null
  display_name: string | null
  role: string | null
}

// Define all available permissions
const AVAILABLE_PERMISSIONS = [
  { key: 'view_reports', label: 'View Reports', description: 'Can view and access reports', category: 'Moderation' },
  { key: 'handle_reports', label: 'Handle Reports', description: 'Can resolve, dismiss, and handle reports', category: 'Moderation' },
  { key: 'view_appeals', label: 'View Appeals', description: 'Can view user appeals', category: 'Moderation' },
  { key: 'handle_appeals', label: 'Handle Appeals', description: 'Can approve or deny appeals', category: 'Moderation' },
  { key: 'view_feedback', label: 'View Feedback', description: 'Can view user feedback', category: 'Moderation' },
  { key: 'view_support_tickets', label: 'View Support Tickets', description: 'Can view support tickets', category: 'Moderation' },
  { key: 'respond_support_tickets', label: 'Respond to Support Tickets', description: 'Can respond to support tickets', category: 'Moderation' },
  { key: 'view_content', label: 'View Content', description: 'Can view content management', category: 'Content' },
  { key: 'moderate_content', label: 'Moderate Content', description: 'Can delete, hide, or moderate content', category: 'Content' },
  { key: 'view_users', label: 'View Users', description: 'Can view user management', category: 'Users' },
  { key: 'manage_users', label: 'Manage Users', description: 'Can ban, warn, or modify users', category: 'Users' },
  { key: 'view_logs', label: 'View Logs', description: 'Can view moderation logs', category: 'System' },
  { key: 'view_analytics', label: 'View Analytics', description: 'Can view analytics and monitoring', category: 'System' },
  { key: 'view_developer', label: 'View Developer Tools', description: 'Can access developer tools and API info', category: 'System' },
]

export default function SettingsView() {
  const { user, userProfile } = useAuth()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [permissions, setPermissions] = useState<StaffPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000)
  const [tableExists, setTableExists] = useState(true)

  const isAdmin = userProfile?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      loadStaffMembers()
      loadPermissions()
    }
    // Load auto-refresh settings from localStorage
    const savedAutoRefresh = localStorage.getItem('mod_panel_auto_refresh')
    const savedInterval = localStorage.getItem('mod_panel_refresh_interval')
    if (savedAutoRefresh !== null) {
      setAutoRefresh(savedAutoRefresh === 'true')
    }
    if (savedInterval) {
      setRefreshInterval(parseInt(savedInterval, 10))
    }
  }, [isAdmin])

  const loadStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, username, display_name, role')
        .in('role', ['admin', 'moderator', 'staff'])
        .order('role', { ascending: true })
        .order('username', { ascending: true })

      if (error) throw error
      setStaffMembers(data || [])
    } catch (error) {
      console.error('Error loading staff members:', error)
      toast.error('Failed to load staff members')
    }
  }

  const loadPermissions = async () => {
    try {
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('staff_permissions')
        .select('*')

      // Check if table doesn't exist (42P01) or other errors
      if (permissionsError) {
        // If table doesn't exist, just set empty permissions and continue
        if (permissionsError.code === '42P01' || permissionsError.message?.includes('does not exist')) {
          console.warn('staff_permissions table does not exist yet. Please run the migration.')
          setTableExists(false)
          setPermissions([])
          setLoading(false)
          return
        }
        throw permissionsError
      }
      
      // Table exists, set flag
      setTableExists(true)

      // Fetch user profiles separately
      const userIds = new Set<string>()
      if (permissionsData) {
        permissionsData.forEach(p => {
          if (p.user_id) userIds.add(p.user_id)
        })
      }

      let userProfilesMap: Record<string, { username: string | null; display_name: string | null }> = {}
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, username, display_name')
          .in('user_id', Array.from(userIds))

        if (profiles) {
          profiles.forEach(profile => {
            userProfilesMap[profile.user_id] = {
              username: profile.username,
              display_name: profile.display_name
            }
          })
        }
      }

      // Combine permissions with user profiles
      const permissionsWithUsers = (permissionsData || []).map(perm => ({
        ...perm,
        user_profiles: perm.user_id ? userProfilesMap[perm.user_id] || null : null
      }))

      setPermissions(permissionsWithUsers)
    } catch (error: any) {
      console.error('Error loading permissions:', error)
      // If table doesn't exist, just set empty permissions
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        setPermissions([])
      } else {
        // For other errors, show a toast
        toast.error('Failed to load permissions. Please ensure migrations are up to date.')
        setPermissions([])
      }
    } finally {
      setLoading(false)
    }
  }

  const getPermissionForStaff = (staffId: string, permissionKey: string): boolean => {
    const permission = permissions.find(p => p.user_id === staffId && p.permission_key === permissionKey)
    return permission ? permission.granted : false
  }

  const togglePermission = async (staffId: string, permissionKey: string, currentValue: boolean) => {
    if (!user?.id || !isAdmin) return

    try {
      const newValue = !currentValue

      // Check if permission exists
      const existing = permissions.find(p => p.user_id === staffId && p.permission_key === permissionKey)

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('staff_permissions')
          .update({
            granted: newValue,
            granted_by: user.id,
            granted_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            toast.error('Permissions table does not exist. Please run the migration first.')
            return
          }
          throw error
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('staff_permissions')
          .insert({
            user_id: staffId,
            permission_key: permissionKey,
            granted: newValue,
            granted_by: user.id
          })

        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            toast.error('Permissions table does not exist. Please run the migration first.')
            return
          }
          throw error
        }
      }

      await loadPermissions()
      toast.success(`Permission ${newValue ? 'granted' : 'revoked'}`)
    } catch (error: any) {
      console.error('Error updating permission:', error)
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        toast.error('Permissions table does not exist. Please run the migration first.')
      } else {
        toast.error('Failed to update permission')
      }
    }
  }

  const saveAutoRefreshSettings = () => {
    localStorage.setItem('mod_panel_auto_refresh', autoRefresh.toString())
    localStorage.setItem('mod_panel_refresh_interval', refreshInterval.toString())
    toast.success('Settings saved')
  }

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>)

  const staffToShow = selectedStaff 
    ? staffMembers.filter(s => s.user_id === selectedStaff)
    : staffMembers.filter(s => s.role === 'staff')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
            Settings
          </h2>
          <p className="text-slate-400 mt-1">Manage moderation panel settings and staff permissions</p>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5 text-purple-400" />
          General Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
            <div>
              <label className="text-sm font-medium text-white">Auto-refresh</label>
              <p className="text-xs text-slate-400 mt-1">Automatically refresh data at set intervals</p>
            </div>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-5 h-5 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
            <div>
              <label className="text-sm font-medium text-white">Refresh Interval</label>
              <p className="text-xs text-slate-400 mt-1">How often to refresh data (in seconds)</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={refreshInterval / 1000}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) * 1000)}
                min={5}
                max={300}
                className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-400">seconds</span>
            </div>
          </div>
          <button
            onClick={saveAutoRefreshSettings}
            className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>

      {/* Staff Permissions - Admin Only */}
      {isAdmin && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Staff Permissions
              </h3>
              <p className="text-sm text-slate-400 mt-1">Control what staff members can access in the moderation panel</p>
            </div>
            <select
              value={selectedStaff || 'all'}
              onChange={(e) => setSelectedStaff(e.target.value === 'all' ? null : e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Staff Members</option>
              {staffMembers
                .filter(s => s.role === 'staff')
                .map(staff => (
                  <option key={staff.user_id} value={staff.user_id}>
                    {staff.display_name || staff.username || 'Unknown'}
                  </option>
                ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
            </div>
          ) : !tableExists ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
              <p className="text-slate-300 font-medium mb-2">Permissions Table Not Found</p>
              <p className="text-slate-400 text-sm mb-4">
                The staff_permissions table does not exist yet. Please run the migration:
              </p>
              <code className="block bg-slate-900/50 p-3 rounded-lg text-xs text-slate-300 mb-4 font-mono">
                20250122000014_add_staff_permissions.sql
              </code>
              <p className="text-slate-400 text-xs">
                Once the migration is applied, permissions management will be available.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{category}</h4>
                  <div className="space-y-2">
                    {perms.map((permission) => (
                      <div
                        key={permission.key}
                        className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="text-sm font-semibold text-white">{permission.label}</h5>
                            </div>
                            <p className="text-xs text-slate-400">{permission.description}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          {staffToShow.map((staff) => {
                            const hasPermission = getPermissionForStaff(staff.user_id, permission.key)
                            return (
                              <div
                                key={staff.user_id}
                                className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700/20"
                              >
                                <div className="flex items-center gap-2">
                                  {hasPermission ? (
                                    <UserCheck className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <UserX className="w-4 h-4 text-slate-500" />
                                  )}
                                  <span className="text-sm text-white">
                                    {staff.display_name || staff.username || 'Unknown'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => togglePermission(staff.user_id, permission.key, hasPermission)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    hasPermission
                                      ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30'
                                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/30 hover:bg-slate-700'
                                  }`}
                                >
                                  {hasPermission ? 'Granted' : 'Denied'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {staffToShow.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-sm">No staff members found</p>
            </div>
          )}
        </div>
      )}

      {/* Info for Non-Admins */}
      {!isAdmin && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Limited Access</h3>
          </div>
          <p className="text-sm text-slate-300 mb-4">
            You have limited access to settings. Only administrators can manage staff permissions and system-wide settings.
          </p>
          <p className="text-xs text-slate-400">
            Contact an administrator if you need access to additional features.
          </p>
        </div>
      )}
    </div>
  )
}

