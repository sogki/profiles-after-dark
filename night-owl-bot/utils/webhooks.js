import fetch from 'node-fetch';
import { supabase } from './supabase.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Sends a webhook notification to Discord
 * @param {string} guildId - Discord guild ID
 * @param {string} eventType - Event type (modlog, staff_action, notification, user_activity)
 * @param {Object} payload - Webhook payload
 */
export async function sendWebhookNotification(guildId, eventType, payload) {
    try {
        // Get webhook configuration from Supabase
        const { data: webhooks, error } = await supabase
            .from('discord_webhooks')
            .select('webhook_url')
            .eq('guild_id', guildId)
            .eq('event_type', eventType)
            .eq('enabled', true)
            .single();

        if (error || !webhooks) {
            // No webhook configured or error
            return;
        }

        const webhookUrl = webhooks.webhook_url;

        // Send webhook
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Webhook failed: ${response.status} ${response.statusText}`);
        }

        return response.ok;
    } catch (error) {
        console.error('Error sending webhook notification:', error);
        return false;
    }
}

/**
 * Syncs Discord user data to Supabase
 * @param {string} discordId - Discord user ID
 * @param {Object} userData - User data object
 */
export async function syncDiscordUser(discordId, userData) {
    try {
        const { guild_id, username, discriminator, avatar_url, web_user_id } = userData;

        const { data, error } = await supabase
            .from('discord_users')
            .upsert({
                discord_id: discordId,
                guild_id,
                username,
                discriminator,
                avatar_url,
                web_user_id,
                updated_at: new Date().toISOString(),
                joined_at: userData.joined_at || new Date().toISOString()
            }, { onConflict: 'discord_id,guild_id' })
            .select()
            .single();

        if (error) {
            console.error('Error syncing Discord user:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error syncing Discord user:', error);
        return null;
    }
}


