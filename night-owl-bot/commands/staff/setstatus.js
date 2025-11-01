import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import { logStaffAction } from '../../utils/staffLogger.js';
dotenv.config();

export const data = new SlashCommandBuilder()
    .setName('setstatus')
    .setDescription('Change the bot status (Staff only).')
    .addStringOption(option =>
        option
            .setName('type')
            .setDescription('Activity type')
            .setRequired(true)
            .addChoices(
                { name: 'Playing', value: 'Playing' },
                { name: 'Watching', value: 'Watching' },
                { name: 'Listening', value: 'Listening' },
                { name: 'Competing', value: 'Competing' },
            ))
    .addStringOption(option =>
        option
            .setName('status')
            .setDescription('The status text')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
    const type = interaction.options.getString('type');
    const status = interaction.options.getString('status');

    try {
        await interaction.client.user.setPresence({
            activities: [{ name: status, type: type.toUpperCase() }],
            status: 'online',
        });

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Bot Status Updated')
            .setColor('DarkPurple')
            .addFields(
                { name: 'Type', value: type, inline: true },
                { name: 'Status', value: status, inline: true },
                { name: 'By', value: `${interaction.user.tag}`, inline: true },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        await logStaffAction(interaction.client, `${interaction.user.tag} updated bot status to ${type} ${status}.`, interaction.user);
    } catch (error) {
        console.error(error);
        await interaction.reply('⚠️ Failed to update bot status. Please try again later.');
    }
}
