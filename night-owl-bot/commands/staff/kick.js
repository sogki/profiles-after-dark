// kick.js

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logStaffAction } from '../../utils/staffLogger.js';
import { getNextCaseId, insertModCase } from '../../utils/supabase.js';

export const data = new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from the server.')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to kick')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the kick')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

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

    if (!member.kickable) {
        return await interaction.reply({
            content: '⚠️ I cannot kick this user. Check my permissions and role hierarchy.',
            ephemeral: true,
        });
    }

    try {
        await member.send(`You have been kicked from **${interaction.guild.name}**.\nReason: ${reason}`)
            .catch(() => console.log('Unable to DM the user before kicking.'));
        await member.kick(reason);

        // Get next case ID for this guild
        const nextCaseNumber = await getNextCaseId(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('👢 User Kicked')
            .setColor('Orange')
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
            action: 'kick',
            reason,
            timestamp: new Date().toISOString(),
        });

        await logStaffAction(
            interaction.client,
            `👢 **${target.tag}** (${target.id}) was kicked by **${interaction.user.tag}**.\nReason: ${reason}\nCase ID: #${nextCaseNumber}`,
            interaction.user
        );

    } catch (error) {
        console.error('Error kicking user:', error);
        await interaction.reply({
            content: '⚠️ Failed to kick the user. Please try again later.',
            ephemeral: true,
        });
    }
}
