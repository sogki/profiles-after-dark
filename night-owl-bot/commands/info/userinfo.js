import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig } from '../../utils/config.js';

export const data = new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get information about a Discord user or link to web profile.')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to get information about')
            .setRequired(false)
    );

export const category = 'Info'; // Command category

export async function execute(interaction) {
    // Defer reply immediately to avoid timeout
    await interaction.deferReply();
    
    try {
        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || 'http://localhost:3000';
        const WEB_URL = config.WEB_URL || 'https://profilesafterdark.com';

        const target = interaction.options.getUser('target') || interaction.user;

        // Try to fetch Discord user from API
        let webUser = null;
        try {
            const response = await fetch(`${API_URL}/api/v1/discord/users/${target.id}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.web_user_id) {
                    webUser = result.data.web_user;
                }
            }
        } catch (error) {
            console.log('Could not fetch web user:', error);
        }

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle(`👤 ${target.tag}`)
            .setThumbnail(target.displayAvatarURL({ size: 256 }))
            .setColor('Blue')
            .addFields(
                { name: '🆔 User ID', value: target.id, inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '🤖 Bot', value: target.bot ? 'Yes' : 'No', inline: true }
            )
            .setTimestamp();

        if (member) {
            embed.addFields(
                { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🎭 Roles', value: member.roles.cache.size > 1 
                    ? member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(', ').slice(0, 1024) 
                    : 'None', inline: false }
            );

            if (member.premiumSince) {
                embed.addFields({
                    name: '⭐ Nitro Boost',
                    value: `Since <t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`,
                    inline: true
                });
            }
        }

        if (webUser) {
            embed.addFields({
                name: '🌐 Web Profile',
                value: `[View Profile](${WEB_URL}/users/${webUser.username || webUser.id})`,
                inline: true
            });
            embed.setFooter({ text: 'Linked to web account' });
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching user info:', error);
        await interaction.editReply({
            content: '⚠️ Failed to fetch user information. Please try again later.'
        });
    }
}
