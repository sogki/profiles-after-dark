import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig } from '../../utils/config.js';

export const data = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Fetches the site status from your backend.');

export const category = 'General'; // Command category

export async function execute(interaction) {
    try {
        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/v1/monitoring/health`);
        const data = await res.json();
        const embed = new EmbedBuilder()
            .setTitle('🦉 NightOwl Site Status')
            .setColor('DarkPurple')
            .addFields(
                { name: 'Status', value: 'Online 🟢', inline: true },
                { name: 'Uptime', value: `${data.uptime}`, inline: true },
                { name: 'Active Users', value: `${data.activeUsers}`, inline: true },
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error(error);
        await interaction.reply('⚠️ Failed to fetch site status. Please try again later.');
    }
}