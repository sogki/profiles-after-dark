import { supabase } from './supabase';

/**
 * Get all staff members (admin, moderator, staff)
 */
export async function getAllStaffMembers() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, username, display_name, role')
      .in('role', ['admin', 'moderator', 'staff']);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching staff members:', error);
    return [];
  }
}

/**
 * Notify all staff members about a new report
 */
export async function notifyAllStaffOfReport(reportId: string, reportData: {
  reporterUsername?: string;
  reportedUsername?: string;
  reason: string;
  urgent?: boolean;
}) {
  try {
    const staffMembers = await getAllStaffMembers();
    
    if (staffMembers.length === 0) {
      console.warn('No staff members found to notify');
      return;
    }

    const reportedUser = reportData.reportedUsername || 'Unknown User';
    const reporterUser = reportData.reporterUsername || 'Unknown User';
    const title = reportData.urgent 
      ? `🚨 Urgent Report: ${reportedUser}` 
      : `📋 New Report: ${reportedUser}`;
    const message = reportData.urgent
      ? `Urgent report submitted by ${reporterUser} for ${reportData.reason}`
      : `New report submitted by ${reporterUser} for ${reportData.reason}`;

    const notifications = staffMembers.map(staff => ({
      user_id: staff.user_id,
      title,
      message,
      type: 'report' as const,
      read: false,
      action_url: `/moderation/reports/${reportId}`,
      metadata: {
        reportId,
        type: 'report',
        urgent: reportData.urgent || false
      },
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating staff notifications:', error);
      throw error;
    }

    return notifications.length;
  } catch (error) {
    console.error('Error notifying staff of report:', error);
    throw error;
  }
}

/**
 * Notify all staff members about a new appeal
 */
export async function notifyAllStaffOfAppeal(appealId: string, appealData: {
  username?: string;
  banType: string;
  urgent?: boolean;
}) {
  try {
    const staffMembers = await getAllStaffMembers();
    
    if (staffMembers.length === 0) {
      console.warn('No staff members found to notify');
      return;
    }

    const user = appealData.username || 'Unknown User';
    const title = appealData.urgent
      ? `🚨 Urgent Appeal: ${user}`
      : `📝 New Appeal: ${user}`;
    const message = appealData.urgent
      ? `Urgent appeal submitted by ${user} for ${appealData.banType} ban`
      : `New appeal submitted by ${user} for ${appealData.banType} ban`;

    const notifications = staffMembers.map(staff => ({
      user_id: staff.user_id,
      title,
      message,
      type: 'appeal' as const,
      read: false,
      action_url: `/moderation/appeals/${appealId}`,
      metadata: {
        appealId,
        type: 'appeal',
        urgent: appealData.urgent || false
      },
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating staff notifications:', error);
      throw error;
    }

    return notifications.length;
  } catch (error) {
    console.error('Error notifying staff of appeal:', error);
    throw error;
  }
}

/**
 * Mark report/appeal as handled and remove notifications for other staff
 */
export async function handleReportOrAppeal(
  type: 'report' | 'appeal',
  id: string,
  handlerId: string,
  action: 'resolve' | 'dismiss' | 'approve' | 'deny'
) {
  try {
    const table = type === 'report' ? 'reports' : 'appeals';
    const statusField = type === 'report' 
      ? (action === 'resolve' ? 'resolved' : 'dismissed')
      : (action === 'approve' ? 'approved' : 'denied');

    // Update the report/appeal
    const updateData: any = {
      status: statusField,
      handled_by: handlerId,
      handled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

    // Remove notifications for all staff except the handler
    // Find all notifications related to this report/appeal
    const { data: allNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, user_id, metadata')
      .eq('type', type)
      .neq('user_id', handlerId); // Exclude the handler

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      // Don't throw, just log - the report/appeal is already handled
    } else if (allNotifications) {
      // Filter notifications that match this report/appeal ID
      const matchingNotifications = allNotifications.filter(notif => {
        const metadata = notif.metadata as any;
        return metadata && (
          metadata.reportId === id || 
          metadata.appealId === id ||
          notif.action_url?.includes(`/${id}`)
        );
      });

      if (matchingNotifications.length > 0) {
        const notificationIds = matchingNotifications.map(n => n.id);
        
        // Delete the notifications
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .in('id', notificationIds);

        if (deleteError) {
          console.error('Error deleting notifications:', deleteError);
          // Don't throw - the report/appeal is already handled
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error(`Error handling ${type}:`, error);
    throw error;
  }
}

/**
 * Resolution action types
 */
export interface ResolutionAction {
  type: 'account' | 'content' | 'warning';
  action: string;
  duration?: number; // Duration in hours for suspensions
  message?: string; // Custom warning message
  reason: string;
}

/**
 * Handle report resolution with actions
 */
export async function resolveReportWithAction(
  reportId: string,
  handlerId: string,
  resolutionAction: ResolutionAction,
  reportedUserId?: string,
  contentId?: string,
  contentType?: string
) {
  try {
    // 1. Handle warning notification
    if (resolutionAction.type === 'warning' && resolutionAction.message && reportedUserId) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: reportedUserId,
          title: '⚠️ Warning from Staff',
          message: resolutionAction.message,
          type: 'warning',
          priority: 'high',
          read: false,
          metadata: {
            reportId,
            type: 'warning',
            reason: resolutionAction.reason
          },
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating warning notification:', notificationError);
        // Don't throw - continue with report resolution
      }
    }

    // 2. Handle account actions
    if (resolutionAction.type === 'account' && reportedUserId) {
      const updateData: any = {};

      if (resolutionAction.action === 'suspend') {
        const durationMs = (resolutionAction.duration || 24) * 60 * 60 * 1000;
        updateData.suspended_until = new Date(Date.now() + durationMs).toISOString();
        updateData.is_active = false;
      } else if (resolutionAction.action === 'readonly') {
        updateData.read_only_mode = true;
        updateData.read_only_until = null; // Permanent until manually removed
      } else if (resolutionAction.action === 'delete') {
        updateData.is_active = false;
        updateData.deleted_at = new Date().toISOString();
        // Account deletion will be handled by a separate function
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', reportedUserId);

        if (updateError) {
          console.error('Error updating user profile:', updateError);
          throw new Error(`Failed to update user account: ${updateError.message}`);
        }

        // Create notification for user about account action
        const actionMessages: Record<string, string> = {
          suspend: `Your account has been suspended for ${resolutionAction.duration || 24} hours. Reason: ${resolutionAction.reason}`,
          readonly: `Your account has been placed in read-only mode. You can only view content but cannot interact or upload. Reason: ${resolutionAction.reason}`,
          delete: `Your account has been deleted. Reason: ${resolutionAction.reason}`
        };

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: reportedUserId,
            title: resolutionAction.action === 'delete' ? '🚫 Account Deleted' : '⚠️ Account Action',
            message: actionMessages[resolutionAction.action] || `Account action: ${resolutionAction.reason}`,
            type: 'account_action',
            priority: 'high',
            read: false,
            metadata: {
              reportId,
              action: resolutionAction.action,
              reason: resolutionAction.reason
            },
            created_at: new Date().toISOString()
          });

        if (notificationError) {
          console.error('Error creating account action notification:', notificationError);
        }

        // If account deletion, send email (handled separately)
        if (resolutionAction.action === 'delete') {
          // Email will be sent via Supabase Auth or external service
          // This would typically be handled by a backend function
          console.log('Account deletion requested - email notification should be sent');
        }
      }
    }

    // 3. Handle content deletion
    if (resolutionAction.type === 'content' && resolutionAction.action === 'delete' && contentId && contentType) {
      let tableName = '';
      
      switch (contentType.toLowerCase()) {
        case 'profile':
        case 'pfp':
          tableName = 'profiles';
          break;
        case 'banner':
          tableName = 'profiles'; // Banners might be in profiles table
          break;
        case 'profile_pair':
        case 'combo':
          tableName = 'profile_pairs';
          break;
        case 'emote':
          tableName = 'emotes';
          break;
        case 'wallpaper':
          tableName = 'wallpapers';
          break;
        case 'emoji_combo':
          tableName = 'emoji_combos';
          break;
        default:
          throw new Error(`Unknown content type: ${contentType}`);
      }

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', contentId);

      if (deleteError) {
        console.error('Error deleting content:', deleteError);
        throw new Error(`Failed to delete content: ${deleteError.message}`);
      }

      // Notify user about content deletion
      if (reportedUserId) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: reportedUserId,
            title: '🗑️ Content Deleted',
            message: `Your ${contentType} has been deleted by staff. Reason: ${resolutionAction.reason}`,
            type: 'content_action',
            priority: 'medium',
            read: false,
            metadata: {
              reportId,
              contentId,
              contentType,
              reason: resolutionAction.reason
            },
            created_at: new Date().toISOString()
          });

        if (notificationError) {
          console.error('Error creating content deletion notification:', notificationError);
        }
      }
    }

    // 4. Log the moderation action
    const { error: logError } = await supabase
      .from('moderation_logs')
      .insert({
        moderator_id: handlerId,
        action: `resolve_report_${resolutionAction.type}_${resolutionAction.action}`,
        target_user_id: reportedUserId || null,
        description: `Resolved report ${reportId}: ${resolutionAction.type} action - ${resolutionAction.action}. Reason: ${resolutionAction.reason}`,
        metadata: {
          reportId,
          resolutionAction,
          contentId,
          contentType
        },
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging moderation action:', logError);
      // Don't throw - the action was successful
    }

    // 5. Finally, mark the report as resolved
    await handleReportOrAppeal('report', reportId, handlerId, 'resolve');

    return { success: true };
  } catch (error: any) {
    console.error('Error resolving report with action:', error);
    throw error;
  }
}

