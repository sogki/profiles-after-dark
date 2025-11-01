// unban.js

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logStaffAction } from '../../utils/staffLogger.js';
import { getNextCaseId, insertModCase } from '../../utils/supabase.js';

export const data = new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user from the server.')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to unban')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the unban')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided.';

    try {
        // Fetch the ban info for the user to confirm they are banned
        const banInfo = await interaction.guild.bans.fetch(target.id).catch(() => null);

        if (!banInfo) {
            return await interaction.reply({
                content: '⚠️ This user is not currently banned from this server.',
                ephemeral: true,
            });
        }

        await interaction.guild.bans.remove(target.id, reason);

        // DM user about unban (might fail if user blocks DMs)
        await target.send(`✅ You have been unbanned from **${interaction.guild.name}**.\nReason: ${reason}`)
            .catch(() => console.log('Unable to DM the user after unbanning.'));

        // Get next case ID
        const nextCaseNumber = await getNextCaseId(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ User Unbanned')
            .setColor('Green')
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'Case ID', value: `#${nextCaseNumber}`, inline: true },
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });

        // Insert mod case into Supabase
        await insertModCase({
            case_id: nextCaseNumber,
            guild_id: interaction.guild.id,
            user_id: target.id,
            user_tag: target.tag,
            moderator_id: interaction.user.id,
            moderator_tag: interaction.user.tag,
            action: 'unban',
            reason,
            timestamp: new Date().toISOString(),
        });

        await logStaffAction(
            interaction.client,
            `✅ **${target.tag}** (${target.id}) was unbanned by **${interaction.user.tag}**.\nReason: ${reason}\nCase ID: #${nextCaseNumber}`,
            interaction.user
        );

    } catch (error) {
        console.error('Error unbanning user:', error);
        await interaction.reply({
            content: '⚠️ Failed to unban the user. Please try again later.',
            ephemeral: true,
        });
    }
}
