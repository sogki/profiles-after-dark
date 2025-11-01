import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';

export const data = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for profiles, emotes, or wallpapers.')
    .addStringOption(option =>
        option.setName('query')
            .setDescription('Search query')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Content type to search')
            .setRequired(false)
            .addChoices(
                { name: 'All', value: 'all' },
                { name: 'Profiles', value: 'profiles' },
                { name: 'Emotes', value: 'emotes' },
                { name: 'Wallpapers', value: 'wallpapers' }
            )
    )
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('Number of results (1-5)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(5)
    );

export const category = 'Gallery'; // Command category

export async function execute(interaction) {
    try {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const type = interaction.options.getString('type') || 'all';
        const limit = interaction.options.getInteger('limit') || 3;

        const params = new URLSearchParams();
        params.append('q', query);
        params.append('type', type);
        params.append('limit', limit.toString());

        const response = await fetch(`${API_URL}/api/search?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const { data: results, success } = await response.json();

        if (!success || !results) {
            return await interaction.editReply({
                content: '⚠️ Failed to perform search.',
            });
        }

        const totalResults = (results.profiles?.length || 0) + 
                           (results.emotes?.length || 0) + 
                           (results.wallpapers?.length || 0);

        if (totalResults === 0) {
            return await interaction.editReply({
                content: `🔍 No results found for "${query}".`,
            });
        }

        const embeds = [];

        if (results.profiles && results.profiles.length > 0) {
            const profileEmbed = new EmbedBuilder()
                .setTitle(`📸 Profiles (${results.profiles.length})`)
                .setDescription(results.profiles.map((p, i) => 
                    `${i + 1}. ${p.title} - ${p.download_count || 0} downloads`
                ).join('\n'))
                .setColor('Blue')
                .setThumbnail(results.profiles[0]?.image_url);

            embeds.push(profileEmbed);
        }

        if (results.emotes && results.emotes.length > 0) {
            const emoteEmbed = new EmbedBuilder()
                .setTitle(`😀 Emotes (${results.emotes.length})`)
                .setDescription(results.emotes.map((e, i) => 
                    `${i + 1}. ${e.title} - ${e.download_count || 0} downloads`
                ).join('\n'))
                .setColor('Green')
                .setThumbnail(results.emotes[0]?.image_url);

            embeds.push(emoteEmbed);
        }

        if (results.wallpapers && results.wallpapers.length > 0) {
            const wallpaperEmbed = new EmbedBuilder()
                .setTitle(`🖼️ Wallpapers (${results.wallpapers.length})`)
                .setDescription(results.wallpapers.map((w, i) => 
                    `${i + 1}. ${w.title} - ${w.download_count || 0} downloads`
                ).join('\n'))
                .setColor('Orange')
                .setThumbnail(results.wallpapers[0]?.image_url);

            embeds.push(wallpaperEmbed);
        }

        embeds[0]?.setFooter({ text: `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"` });

        await interaction.editReply({ embeds });
    } catch (error) {
        console.error('Error searching:', error);
        await interaction.editReply({
            content: '⚠️ Failed to perform search. Please try again later.',
        });
    }
}


