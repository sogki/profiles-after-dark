import { supabase } from './supabase';
import { getAllStaffMembers } from './moderationUtils';

/**
 * Create notification for support ticket events
 */
export async function createTicketNotification(
  userId: string,
  title: string,
  message: string,
  ticketId: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  try {
    // Check if notifications table uses 'title' and 'message' or 'content'
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: title,
        message: message,
        type: type,
        action_url: `/moderation?view=support-tickets&ticket=${ticketId}`,
        metadata: { ticket_id: ticketId }
      } as any);

    if (error) {
      // Try with 'content' field if title/message fails
      if (error.message?.includes('column') && (error.message.includes('title') || error.message.includes('message'))) {
        const { error: contentError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            content: `${title}: ${message}`,
            type: type,
            action_url: `/moderation?view=support-tickets&ticket=${ticketId}`,
            metadata: { ticket_id: ticketId }
          } as any);
        
        if (contentError) {
          console.error('Error creating ticket notification:', contentError);
          throw contentError;
        }
      } else {
        console.error('Error creating ticket notification:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error in createTicketNotification:', error);
    throw error;
  }
}

/**
 * Notify all staff members about a new support ticket
 */
export async function notifyAllStaffOfNewTicket(ticketId: string, ticketData: {
  ticketNumber: string | null;
  subject: string | null;
  priority: string;
  username?: string;
}) {
  try {
    const staffMembers = await getAllStaffMembers();
    
    if (staffMembers.length === 0) {
      console.warn('No staff members found to notify');
      return;
    }

    const priorityEmoji = ticketData.priority === 'urgent' ? '🚨' : 
                         ticketData.priority === 'high' ? '⚠️' : '📋';
    const user = ticketData.username || 'Unknown User';
    const title = `${priorityEmoji} New Support Ticket: ${ticketData.ticketNumber || ticketId}`;
    const message = `${user} submitted a new support ticket${ticketData.subject ? `: "${ticketData.subject}"` : ''} (Priority: ${ticketData.priority})`;

    const notifications = staffMembers.map(staff => ({
      user_id: staff.user_id,
      title,
      message,
      type: ticketData.priority === 'urgent' ? 'error' : ticketData.priority === 'high' ? 'warning' : 'info',
      action_url: `/moderation?view=support-tickets&ticket=${ticketId}`,
      metadata: { ticket_id: ticketId, ticket_number: ticketData.ticketNumber }
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
    console.error('Error notifying staff of new ticket:', error);
    throw error;
  }
}

/**
 * Notify user about ticket updates
 */
export async function notifyUserOfTicketUpdate(
  userId: string,
  ticketId: string,
  ticketNumber: string | null,
  updateType: 'reply' | 'resolved' | 'assigned' | 'status_change',
  staffName?: string
) {
  try {
    let title = '';
    let message = '';
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    switch (updateType) {
      case 'reply':
        title = `💬 New Reply on Ticket ${ticketNumber || ticketId}`;
        message = staffName 
          ? `${staffName} replied to your support ticket`
          : 'You have a new reply on your support ticket';
        type = 'info';
        break;
      case 'resolved':
        title = `✅ Ticket Resolved: ${ticketNumber || ticketId}`;
        message = 'Your support ticket has been marked as resolved';
        type = 'success';
        break;
      case 'assigned':
        title = `👤 Ticket Assigned: ${ticketNumber || ticketId}`;
        message = staffName 
          ? `Your ticket has been assigned to ${staffName}`
          : 'Your ticket has been assigned to a staff member';
        type = 'info';
        break;
      case 'status_change':
        title = `📝 Ticket Updated: ${ticketNumber || ticketId}`;
        message = 'Your support ticket status has been updated';
        type = 'info';
        break;
    }

    await createTicketNotification(userId, title, message, ticketId, type);
  } catch (error) {
    console.error('Error notifying user of ticket update:', error);
    throw error;
  }
}

/**
 * Send email notification for ticket response
 * This will be implemented with an email service (Resend, SendGrid, etc.)
 */
export async function sendTicketEmailNotification(
  userEmail: string,
  ticketNumber: string | null,
  ticketId: string,
  message: string,
  staffName?: string
) {
  try {
    // TODO: Implement email sending using your email service
    // For now, this is a placeholder that logs the email
    console.log('Email notification would be sent:', {
      to: userEmail,
      ticketNumber,
      ticketId,
      message,
      staffName
    });

    // Example implementation with a hypothetical email service:
    // const emailService = getEmailService();
    // await emailService.send({
    //   to: userEmail,
    //   subject: `Re: Support Ticket ${ticketNumber || ticketId}`,
    //   html: generateTicketEmailTemplate(ticketNumber, message, staffName, ticketId),
    //   replyTo: `ticket-${ticketId}@yourdomain.com` // For email replies
    // });

    return true;
  } catch (error) {
    console.error('Error sending ticket email notification:', error);
    throw error;
  }
}

/**
 * Generate email template for ticket response
 */
function generateTicketEmailTemplate(
  ticketNumber: string | null,
  message: string,
  staffName?: string,
  ticketId?: string
): string {
  const replyEmail = ticketId ? `ticket-${ticketId}@yourdomain.com` : 'support@yourdomain.com';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .message { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
        .reply-note { background: #fff3cd; padding: 10px; border-radius: 4px; margin-top: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Support Ticket Response</h2>
          <p>Ticket: ${ticketNumber || 'N/A'}</p>
        </div>
        <div class="content">
          ${staffName ? `<p><strong>From:</strong> ${staffName}</p>` : ''}
          <div class="message">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div class="reply-note">
            <strong>💡 Reply to this email to respond to your ticket.</strong><br>
            Your reply will be added to the ticket conversation.
          </div>
          <div class="footer">
            <p>This is an automated message from Profiles After Dark Support.</p>
            <p>Do not reply directly to this email address. Use the reply function in your email client.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

