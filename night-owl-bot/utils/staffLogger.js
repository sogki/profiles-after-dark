import { ChannelType, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Logs a staff action to the configured STAFF_LOG_CHANNEL_ID with an embed.
 * @param {Client} client - The Discord client
 * @param {string} message - The message describing the staff action
 * @param {User} user - The user who performed the action
 */
export async function logStaffAction(client, message, user) {
    const channelId = process.env.STAFF_LOG_CHANNEL_ID;
    if (!channelId) return;

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) return;

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Staff Action Logged')
            .setDescription(message)
            .setColor('DarkPurple')
            .setTimestamp();

        if (user) {
            embed.setAuthor({
                name: `${user.tag}`,
                iconURL: user.displayAvatarURL({ size: 256 })
            });
        }

        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Failed to send staff log message:', error);
    }
}
