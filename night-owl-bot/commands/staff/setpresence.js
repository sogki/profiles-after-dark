import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import { logStaffAction } from '../../utils/staffLogger.js';
dotenv.config();

export const data = new SlashCommandBuilder()
    .setName('setpresence')
    .setDescription('Change the bot\'s online presence (Staff only).')
    .addStringOption(option =>
        option
            .setName('status')
            .setDescription('Presence status')
            .setRequired(true)
            .addChoices(
                { name: 'Online', value: 'online' },
                { name: 'Idle', value: 'idle' },
                { name: 'Do Not Disturb', value: 'dnd' },
                { name: 'Invisible', value: 'invisible' },
            ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
    const status = interaction.options.getString('status');

    try {
        await interaction.client.user.setPresence({
            status: status,
        });

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Bot Presence Updated')
            .setColor('DarkPurple')
            .addFields(
                { name: 'Presence', value: status, inline: true },
                { name: 'By', value: `${interaction.user.tag}`, inline: true },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        await logStaffAction(interaction.client, `${interaction.user.tag} updated bot presence to ${status}.`, interaction.user);
    } catch (error) {
        console.error(error);
        await interaction.reply('⚠️ Failed to update bot presence. Please try again later.');
    }
}
