import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export const data = new SlashCommandBuilder()
    .setName('latest')
    .setDescription('Fetches the latest post or update from your site.');

export const category = 'General'; // Command category

export async function execute(interaction) {
    try {
        const res = await fetch(`${process.env.BACKEND_URL}/api/latest`);
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