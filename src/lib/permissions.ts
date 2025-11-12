import { supabase } from './supabase'

export type PermissionKey = 
  | 'view_reports'
  | 'handle_reports'
  | 'view_appeals'
  | 'handle_appeals'
  | 'view_feedback'
  | 'view_support_tickets'
  | 'respond_support_tickets'
  | 'view_content'
  | 'moderate_content'
  | 'view_users'
  | 'manage_users'
  | 'view_logs'
  | 'view_analytics'
  | 'view_developer'

export interface UserPermissions {
  [key: string]: boolean
}

/**
 * Check if a user has a specific permission
 * Admins have all permissions by default
 */
export async function hasPermission(userId: string, permissionKey: PermissionKey): Promise<boolean> {
  try {
    // First check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (profile?.role === 'admin') {
      return true // Admins have all permissions
    }

    // Check staff permissions
    const { data: permission } = await supabase
      .from('staff_permissions')
      .select('granted')
      .eq('user_id', userId)
      .eq('permission_key', permissionKey)
      .single()

    // If no permission record exists, default to false for staff
    // If record exists, return the granted value
    return permission?.granted ?? false
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  try {
    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (profile?.role === 'admin') {
      // Admins have all permissions
      const allPermissions: UserPermissions = {}
      const permissionKeys: PermissionKey[] = [
        'view_reports',
        'handle_reports',
        'view_appeals',
        'handle_appeals',
        'view_feedback',
        'view_support_tickets',
        'respond_support_tickets',
        'view_content',
        'moderate_content',
        'view_users',
        'manage_users',
        'view_logs',
        'view_analytics',
        'view_developer'
      ]
      permissionKeys.forEach(key => {
        allPermissions[key] = true
      })
      return allPermissions
    }

    // Get staff permissions
    const { data: permissions } = await supabase
      .from('staff_permissions')
      .select('permission_key, granted')
      .eq('user_id', userId)

    const userPermissions: UserPermissions = {}
    if (permissions) {
      permissions.forEach(p => {
        userPermissions[p.permission_key] = p.granted
      })
    }

    return userPermissions
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return {}
  }
}

/**
 * Check if user can access a specific view
 */
export async function canAccessView(userId: string, view: string): Promise<boolean> {
  const viewPermissionMap: Record<string, PermissionKey> = {
    'reports': 'view_reports',
    'appeals': 'view_appeals',
    'feedback': 'view_feedback',
    'support-tickets': 'view_support_tickets',
    'content': 'view_content',
    'users': 'view_users',
    'logs': 'view_logs',
    'analytics': 'view_analytics',
    'developer': 'view_developer',
    'dashboard': 'view_reports', // Dashboard requires at least view_reports
  }

  const permissionKey = viewPermissionMap[view]
  if (!permissionKey) {
    // Views without specific permissions (like settings) are accessible to all staff
    return true
  }

  return hasPermission(userId, permissionKey)
}

