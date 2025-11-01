// warn.js

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logStaffAction } from '../../utils/staffLogger.js';
import { getNextCaseId, insertModCase } from '../../utils/supabase.js';

export const data = new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warns a user in the server.')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to warn')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the warning')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export const category = 'Moderation'; // Command category

export async function execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
        return await interaction.reply({
            content: '⚠️ Could not find that user in this server.',
            ephemeral: true,
        });
    }

    try {
        // Attempt to DM the user
        await member.send(`⚠️ You have been warned in **${interaction.guild.name}**.\nReason: ${reason}`)
            .catch(() => console.log('Unable to DM the user before warning.'));

        // Get next case ID
        const nextCaseNumber = await getNextCaseId(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('⚠️ User Warned')
            .setColor('Yellow')
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
            action: 'warn',
            reason,
            timestamp: new Date().toISOString(),
        });

        await logStaffAction(
            interaction.client,
            `⚠️ **${target.tag}** (${target.id}) was warned by **${interaction.user.tag}**.\nReason: ${reason}\nCase ID: #${nextCaseNumber}`,
            interaction.user
        );

    } catch (error) {
        console.error('Error warning user:', error);
        await interaction.reply({
            content: '⚠️ Failed to warn the user. Please try again later.',
            ephemeral: true,
        });
    }
}
