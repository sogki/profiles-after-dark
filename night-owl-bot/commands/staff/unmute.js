// unmute.js

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logStaffAction } from '../../utils/staffLogger.js';
import { getNextCaseId, insertModCase } from '../../utils/supabase.js';

export const data = new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmutes a user in the server.')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to unmute')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for the unmute')
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

    const muteRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');

    if (!muteRole) {
        return await interaction.reply({
            content: '⚠️ Mute role not found. Please create a "Muted" role first.',
            ephemeral: true,
        });
    }

    if (!member.roles.cache.has(muteRole.id)) {
        return await interaction.reply({
            content: '⚠️ This user is not muted.',
            ephemeral: true,
        });
    }

    if (!member.manageable) {
        return await interaction.reply({
            content: '⚠️ I cannot unmute this user. Check my permissions and role hierarchy.',
            ephemeral: true,
        });
    }

    try {
        await member.roles.remove(muteRole, reason);

        await member.send(`You have been unmuted in **${interaction.guild.name}**.\nReason: ${reason}`)
            .catch(() => console.log('Unable to DM the user after unmuting.'));

        // Get next case ID for this guild
        const nextCaseNumber = await getNextCaseId(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('🔊 User Unmuted')
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
            action: 'unmute',
            reason,
            timestamp: new Date().toISOString(),
        });

        await logStaffAction(
            interaction.client,
            `🔊 **${target.tag}** (${target.id}) was unmuted by **${interaction.user.tag}**.\nReason: ${reason}\nCase ID: #${nextCaseNumber}`,
            interaction.user
        );

    } catch (error) {
        console.error('Error unmuting user:', error);
        await interaction.reply({
            content: '⚠️ Failed to unmute the user. Please try again later.',
            ephemeral: true,
        });
    }
}
