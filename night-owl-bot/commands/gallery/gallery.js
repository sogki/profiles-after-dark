import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig } from '../../utils/config.js';

export const data = new SlashCommandBuilder()
    .setName('gallery')
    .setDescription('Browse the gallery.')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Content type to browse')
            .setRequired(false)
            .addChoices(
                { name: 'Profiles', value: 'profiles' },
                { name: 'Emotes', value: 'emotes' },
                { name: 'Wallpapers', value: 'wallpapers' }
            )
    )
    .addStringOption(option =>
        option.setName('category')
            .setDescription('Category filter')
            .setRequired(false)
    )
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('Number of items to show (1-10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
    );

export const category = 'Gallery'; // Command category

export async function execute(interaction) {
    try {
        await interaction.deferReply();

        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || 'http://localhost:3000';
        const WEB_URL = config.WEB_URL || 'https://profilesafterdark.com';

        const type = interaction.options.getString('type') || 'profiles';
        const category = interaction.options.getString('category');
        const limit = interaction.options.getInteger('limit') || 5;

        const endpoint = type === 'profiles' 
            ? `${API_URL}/api/v1/profiles`
            : type === 'emotes'
            ? `${API_URL}/api/v1/emotes`
            : `${API_URL}/api/v1/wallpapers`;

        const params = new URLSearchParams();
        if (category) params.append('category', category);
        params.append('limit', limit.toString());
        params.append('offset', '0');

        const response = await fetch(`${endpoint}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const { data: items, success } = await response.json();

        if (!success || !items || items.length === 0) {
            return await interaction.editReply({
                content: `⚠️ No ${type} found${category ? ` in category "${category}"` : ''}.`,
            });
        }

        const embeds = items.slice(0, limit).map((item, index) => {
            const embed = new EmbedBuilder()
                .setTitle(`${index + 1}. ${item.title || 'Untitled'}`)
                .setDescription(`**Category:** ${item.category}\n**Downloads:** ${item.download_count || 0}`)
                .setImage(item.image_url)
                .setColor('Purple')
                .setTimestamp(item.created_at)
                .setFooter({ text: `${type.charAt(0).toUpperCase() + type.slice(1)} • ${items.length} items` });

            if (item.user_profiles) {
                embed.addFields({
                    name: 'Uploader',
                    value: item.user_profiles.username || item.user_profiles.display_name || 'Unknown',
                    inline: true
                });
            }

            return embed;
        });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('View on Web')
                    .setURL(`${WEB_URL}/gallery/${type}`)
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setLabel('More Info')
                    .setCustomId(`gallery_more_${type}`)
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.editReply({
            embeds: embeds.slice(0, 10), // Discord limit is 10 embeds
            components: [buttons]
        });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        await interaction.editReply({
            content: '⚠️ Failed to fetch gallery items. Please try again later.',
        });
    }
}


