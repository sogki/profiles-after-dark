import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig } from '../../utils/config.js';

export const data = new SlashCommandBuilder()
    .setName('latest')
    .setDescription('Fetches the latest post or update from your site.');

export const category = 'General'; // Command category

export async function execute(interaction) {
    // Defer reply immediately to avoid timeout
    await interaction.deferReply();
    
    try {
        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/v1/latest`);
        
        if (!res.ok) {
            return await interaction.editReply('⚠️ Failed to fetch the latest update.');
        }
        
        const data = await res.json();
        
        if (!data || !data.title) {
            return await interaction.editReply('⚠️ No latest update found.');
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🦉 Latest Update')
            .setColor('Purple')
            .addFields(
                { name: 'Title', value: data.title || 'N/A' },
                { name: 'Date', value: data.date || 'N/A' },
                { name: 'Summary', value: (data.summary || 'No summary available').substring(0, 200) + (data.summary && data.summary.length > 200 ? '...' : '') },
            )
            .setTimestamp();
            
        if (data.url) {
            embed.setURL(data.url);
        }
        
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching latest:', error);
        await interaction.editReply('⚠️ Failed to fetch the latest update.');
    }
}