import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { getConfig } from '../../utils/config.js';

export const data = new SlashCommandBuilder()
    .setName('latest')
    .setDescription('Fetches the latest post or update from your site.');

export const category = 'General'; // Command category

export async function execute(interaction) {
    try {
        const config = await getConfig();
        const API_URL = config.API_URL || config.BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/v1/latest`);
        const data = await res.json();
        const embed = new EmbedBuilder()
            .setTitle('🦉 Latest Update')
            .setColor('Purple')
            .addFields(
                { name: 'Title', value: data.title },
                { name: 'Date', value: data.date },
                { name: 'Summary', value: data.summary.substring(0, 200) + '...' },
            )
            .setURL(data.url)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        await interaction.reply('⚠️ Failed to fetch the latest update.');
    }
}