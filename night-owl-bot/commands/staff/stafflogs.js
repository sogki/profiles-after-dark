import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

export const data = new SlashCommandBuilder()
    .setName('stafflogs')
    .setDescription('Fetches the latest staff logs from the staff log channel.')
    .addIntegerOption(option =>
        option
            .setName('amount')
            .setDescription('Number of logs to fetch (default 5, max 20)')
            .setMinValue(1)
            .setMaxValue(20)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
    const amount = interaction.options.getInteger('amount') || 5;
    const channelId = process.env.STAFF_LOG_CHANNEL_ID;

    if (!channelId) {
        return await interaction.reply({
            content: '⚠️ Staff log channel is not configured.',
            ephemeral: true,
        });
    }

    try {
        const channel = await interaction.client.channels.fetch(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
            return await interaction.reply({
                content: '⚠️ Could not access the staff log channel.',
                ephemeral: true,
            });
        }

        const messages = await channel.messages.fetch({ limit: amount });
        const logs = messages.filter(m => m.embeds.length > 0).map(m => m.embeds[0]).slice(0, amount);

        if (logs.length === 0) {
            return await interaction.reply({
                content: '⚠️ No staff logs found.',
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🛡️ Latest ${logs.length} Staff Logs`)
            .setColor('Blurple')
            .setTimestamp();

        logs.reverse().forEach((log, index) => {
            embed.addFields({
                name: `#${index + 1} • ${log.title || 'Log Entry'}`,
                value: `${log.description ? log.description.substring(0, 200) : 'No description.'}`,
            });
        });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });

    } catch (error) {
        console.error('Error fetching staff logs:', error);
        await interaction.reply({
            content: '⚠️ Failed to fetch staff logs. Please try again later.',
            ephemeral: true,
        });
    }
}
