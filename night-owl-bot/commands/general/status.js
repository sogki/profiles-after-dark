import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig } from '../../utils/config.js';

export const data = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Fetches the site status from your backend.');

export const category = 'General'; // Command category

export async function execute(interaction) {
    // Defer reply immediately to avoid timeout
    await interaction.deferReply({ ephemeral: true });
    
    try {
        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/v1/monitoring/health`);
        
        if (!res.ok) {
            return await interaction.editReply('⚠️ Failed to fetch site status. Please try again later.');
        }
        
        const data = await res.json();
        
        const embed = new EmbedBuilder()
            .setTitle('🦉 NightOwl Site Status')
            .setColor('DarkPurple')
            .addFields(
                { name: 'Status', value: data.status === 'ok' ? 'Online 🟢' : 'Degraded 🟡', inline: true },
                { name: 'Uptime', value: data.uptime ? `${Math.floor(data.uptime)}s` : 'N/A', inline: true },
                { name: 'Version', value: data.version || 'N/A', inline: true },
            )
            .setTimestamp();
            
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error fetching status:', error);
        await interaction.editReply('⚠️ Failed to fetch site status. Please try again later.');
    }
}