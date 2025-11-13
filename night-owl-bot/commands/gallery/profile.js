import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig } from '../../utils/config.js';

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a profile picture from the gallery.')
    .addStringOption(option =>
        option.setName('id')
            .setDescription('Profile picture ID')
            .setRequired(true)
    );

export const category = 'Gallery'; // Command category

export async function execute(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || 'http://localhost:3000';
        const WEB_URL = config.WEB_URL || 'https://profilesafterdark.com';

        const profileId = interaction.options.getString('id');

        const response = await fetch(`${API_URL}/api/v1/profiles/${profileId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                return await interaction.editReply({
                    content: '⚠️ Profile not found. Please check the ID and try again.',
                });
            }
            throw new Error(`HTTP ${response.status}`);
        }

        const { data: profile, success } = await response.json();

        if (!success || !profile) {
            return await interaction.editReply({
                content: '⚠️ Failed to fetch profile data.',
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`📸 ${profile.title || 'Profile Picture'}`)
            .setDescription(`**Category:** ${profile.category}\n**Type:** ${profile.type}\n**Downloads:** ${profile.download_count || 0}`)
            .setImage(profile.image_url)
            .setColor('Purple')
            .setTimestamp(profile.created_at);

        if (profile.user_profiles) {
            embed.setFooter({
                text: `Uploaded by ${profile.user_profiles.username || profile.user_profiles.display_name || 'Unknown'}`,
                iconURL: profile.user_profiles.avatar_url || undefined
            });
        }

        if (profile.tags && profile.tags.length > 0) {
            embed.addFields({
                name: 'Tags',
                value: profile.tags.slice(0, 5).join(', ') || 'None',
                inline: true
            });
        }

        embed.addFields({
            name: '🔗 View on Web',
            value: `[View Profile](${WEB_URL}/gallery/profiles/${profileId})`,
            inline: true
        });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching profile:', error);
        await interaction.editReply({
            content: '⚠️ Failed to fetch profile. Please try again later.',
        });
    }
}


