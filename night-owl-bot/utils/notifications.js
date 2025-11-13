import { getSupabase } from './supabase.js';

/**
 * Creates a notification for a user, but only if one with the same notification_id doesn't already exist.
 * This prevents duplicate notifications from being sent multiple times.
 * 
 * @param {string} userId - The user ID to send the notification to
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error, follow, like, comment, system)
 * @param {Object} options - Additional options
 * @param {string} options.action_url - Optional action URL
 * @param {Object} options.metadata - Optional metadata object
 * @param {string} options.notification_id - Unique identifier to prevent duplicates (required)
 * @returns {Promise<Object|null>} The created notification or null if duplicate
 */
export async function createNotificationIfNotExists(userId, title, message, type, options = {}) {
  const { action_url, metadata = {}, notification_id } = options;

  if (!notification_id) {
    console.error('createNotificationIfNotExists: notification_id is required to prevent duplicates');
    return null;
  }

  try {
    const db = await getSupabase();

    // Check if a notification with this notification_id already exists for this user
    // Fetch recent notifications and filter in JavaScript (more reliable than JSONB queries)
    const { data: existingNotifications, error: checkError } = await db
      .from('notifications')
      .select('id, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100); // Check last 100 notifications (should be enough)

    if (checkError) {
      console.error('Error checking for existing notification:', checkError);
      // Continue anyway - better to send duplicate than miss a notification
    }

    // Check if any existing notification has the same notification_id in metadata
    const duplicate = existingNotifications?.find(
      notif => notif.metadata?.notification_id === notification_id
    );

    if (duplicate) {
      console.log(`Notification with ID ${notification_id} already exists for user ${userId}, skipping`);
      return duplicate;
    }

    // Create the notification with the notification_id in metadata
    const notificationData = {
      user_id: userId,
      title,
      message,
      type,
      action_url: action_url || null,
      metadata: {
        ...metadata,
        notification_id, // Store the unique identifier in metadata
      }
    };

    const { data: newNotification, error: insertError } = await db
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating notification:', insertError);
      return null;
    }

    console.log(`Created notification ${newNotification.id} for user ${userId} with notification_id ${notification_id}`);
    return newNotification;
  } catch (error) {
    console.error('Error in createNotificationIfNotExists:', error);
    return null;
  }
}

/**
 * Creates a notification for account linking events
 * Uses a unique notification_id based on the Discord ID to prevent duplicates
 */
export async function createAccountLinkingNotification(userId, discordId, discordUsername) {
  // Create a unique notification_id based on the Discord ID
  // This ensures we only send one notification per account linking event
  const notificationId = `account_linked_${discordId}`;

  return await createNotificationIfNotExists(
    userId,
    'Discord Account Linked',
    `Your Discord account (${discordUsername}) has been successfully linked to your Profiles After Dark account!`,
    'success',
    {
      action_url: '/profile-settings',
      metadata: {
        discord_id: discordId,
        discord_username: discordUsername,
        linked_at: new Date().toISOString()
      },
      notification_id: notificationId
    }
  );
}

