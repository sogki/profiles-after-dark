import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import crypto from 'crypto';
import { setConfig, loadConfig } from '../../utils/config.js';
import { setModlogsChannel } from '../../utils/supabase.js';

const BLUEPRINT = {
  categories: [
    {
      key: 'server',
      name: 'PAD SERVER',
      channels: [
        {
          key: 'welcome',
          name: 'welcome',
          topic: 'Welcome messages and onboarding for Profiles After Dark members.',
        },
        {
          key: 'rules',
          name: 'rules',
          topic: 'Server rules and community guidelines.',
        },
        {
          key: 'reaction_roles',
          name: 'reaction-roles',
          topic: 'Self-assign roles for announcements, content pings, and interests.',
        },
      ],
    },
    {
      key: 'content',
      name: 'PAD CONTENT',
      channels: [
        {
          key: 'content_hub',
          name: 'content-hub',
          topic: 'High-level content activity for Profiles After Dark content.',
        },
        {
          key: 'content_pfp_banner',
          name: 'content-pfp-banner',
          topic: 'Profile picture and banner submissions from profilesafterdark.com.',
        },
        {
          key: 'content_profile_pairs',
          name: 'content-profile-pairs',
          topic: 'Profile pair submissions from profilesafterdark.com.',
        },
        {
          key: 'content_emotes',
          name: 'content-emotes',
          topic: 'Emote submissions from profilesafterdark.com.',
        },
        {
          key: 'content_wallpapers',
          name: 'content-wallpapers',
          topic: 'Wallpaper submissions from profilesafterdark.com.',
        },
        {
          key: 'content_emoji_combos',
          name: 'content-emoji-combos',
          topic: 'Emoji combo submissions from profilesafterdark.com.',
        },
        {
          key: 'content_collections',
          name: 'content-collections',
          topic: 'Collection creation activity from profilesafterdark.com.',
        },
      ],
    },
    {
      key: 'gallery',
      name: 'PAD GALLERY',
      channels: [
        {
          key: 'showcase_hub',
          name: 'showcase-hub',
          topic: 'Featured and approved content from the Profiles After Dark gallery.',
        },
        {
          key: 'showcase_pfp_banner',
          name: 'showcase-pfp-banner',
          topic: 'Approved profile pictures and banners.',
        },
        {
          key: 'showcase_profile_pairs',
          name: 'showcase-profile-pairs',
          topic: 'Approved profile pairs.',
        },
        {
          key: 'showcase_emotes',
          name: 'showcase-emotes',
          topic: 'Approved emotes.',
        },
        {
          key: 'showcase_wallpapers',
          name: 'showcase-wallpapers',
          topic: 'Approved wallpapers.',
        },
        {
          key: 'showcase_emoji_combos',
          name: 'showcase-emoji-combos',
          topic: 'Approved emoji combos.',
        },
        {
          key: 'showcase_collections',
          name: 'showcase-collections',
          topic: 'Approved or featured collections.',
        },
      ],
    },
    {
      key: 'moderation',
      name: 'PAD MODERATION',
      channels: [
        {
          key: 'content_review',
          name: 'content-review',
          topic: 'Staff review workflow for pending content decisions.',
        },
        {
          key: 'mod_logs',
          name: 'mod-logs',
          topic: 'Moderation action logs and deleted message snapshots.',
        },
        {
          key: 'admin_logs',
          name: 'admin-logs',
          topic: 'Bot/system admin events and diagnostics.',
        },
      ],
    },
  ],
};

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Bootstrap a Profiles After Dark Discord server channel structure.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addBooleanOption((option) =>
    option
      .setName('apply')
      .setDescription('Create missing categories/channels and persist IDs (default: false).')
      .setRequired(false)
  )
  .addBooleanOption((option) =>
    option
      .setName('post_embeds')
      .setDescription('Post starter welcome/rules/reaction-role embeds after setup (default: false).')
      .setRequired(false)
  );

export const category = 'Moderation';

function buildCategoryLookup(guild) {
  return new Map(
    guild.channels.cache
      .filter((channel) => channel.type === ChannelType.GuildCategory)
      .map((channel) => [channel.name.toLowerCase(), channel])
  );
}

function findTextChannel(guild, name, parentId) {
  return (
    guild.channels.cache.find(
      (channel) =>
        channel.type === ChannelType.GuildText &&
        channel.name.toLowerCase() === name.toLowerCase() &&
        channel.parentId === parentId
    ) || null
  );
}

async function ensureCategory(guild, existingCategories, name) {
  const lookupName = name.toLowerCase();
  const existing = existingCategories.get(lookupName);
  if (existing) return { channel: existing, created: false };

  const created = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    reason: 'Profiles After Dark setup command created category.',
  });
  existingCategories.set(lookupName, created);
  return { channel: created, created: true };
}

async function ensureText(guild, parentId, channelConfig) {
  const existing = findTextChannel(guild, channelConfig.name, parentId);
  if (existing) {
    if (channelConfig.topic && existing.topic !== channelConfig.topic) {
      await existing.setTopic(channelConfig.topic).catch(() => undefined);
    }
    return { channel: existing, created: false };
  }

  const created = await guild.channels.create({
    name: channelConfig.name,
    type: ChannelType.GuildText,
    parent: parentId,
    topic: channelConfig.topic || null,
    reason: `Profiles After Dark setup command created ${channelConfig.name}.`,
  });
  return { channel: created, created: true };
}

function buildSummaryLines(planRows) {
  return planRows.map((row) => `${row.exists ? '✅' : '🆕'} ${row.label}`);
}

async function postStarterEmbeds(channelsByKey) {
  const tasks = [];

  const welcome = channelsByKey.welcome;
  if (welcome) {
    tasks.push(
      welcome.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Welcome to Profiles After Dark')
            .setDescription(
              'Share your style, discover content, and keep things respectful.\n\nUse this server to mirror what is happening on [profilesafterdark.com](https://profilesafterdark.com).'
            )
            .setColor(0x8b5cf6),
        ],
      })
    );
  }

  const rules = channelsByKey.rules;
  if (rules) {
    tasks.push(
      rules.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Server Rules')
            .setDescription(
              [
                '1. Be respectful and constructive.',
                '2. Keep submissions original or properly credited.',
                '3. No harassment, hate, or malicious content.',
                '4. Use the correct channels for each content type.',
                '5. Follow moderator guidance and Discord ToS.',
              ].join('\n')
            )
            .setColor(0x3b82f6),
        ],
      })
    );
  }

  const reactionRoles = channelsByKey.reaction_roles;
  if (reactionRoles) {
    tasks.push(
      reactionRoles.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Reaction Roles (Placeholder)')
            .setDescription(
              'This channel is ready for reaction-role setup.\n\nNext step: add `/reaction-role` tooling to bind buttons/select menus to role IDs.'
            )
            .setColor(0x10b981),
        ],
      })
    );
  }

  await Promise.allSettled(tasks);
}

async function persistSetupConfig(guildId, categoriesByKey, channelsByKey) {
  const categoryMap = {};
  for (const [key, channel] of Object.entries(categoriesByKey)) {
    categoryMap[key] = channel.id;
  }

  const channelMap = {};
  for (const [key, channel] of Object.entries(channelsByKey)) {
    channelMap[key] = channel.id;
  }

  await setConfig(
    'DISCORD_SETUP_CATEGORY_MAP',
    JSON.stringify(categoryMap),
    'Profiles After Dark setup category map (key -> Discord category ID)',
    'discord',
    false
  );
  await setConfig(
    'DISCORD_SETUP_CHANNEL_MAP',
    JSON.stringify(channelMap),
    'Profiles After Dark setup channel map (key -> Discord channel ID)',
    'discord',
    false
  );

  const individualKeys = [
    ['DISCORD_CHANNEL_WELCOME_ID', channelsByKey.welcome?.id || ''],
    ['DISCORD_CHANNEL_RULES_ID', channelsByKey.rules?.id || ''],
    ['DISCORD_CHANNEL_REACTION_ROLES_ID', channelsByKey.reaction_roles?.id || ''],
    ['DISCORD_CHANNEL_CONTENT_SUBMISSIONS_ID', channelsByKey.content_hub?.id || ''],
    ['DISCORD_CHANNEL_GALLERY_SHOWCASE_ID', channelsByKey.showcase_hub?.id || ''],
    ['DISCORD_CHANNEL_CONTENT_REVIEW_ID', channelsByKey.content_review?.id || ''],
    ['DISCORD_LOG_CHANNEL_SUBMISSIONS', channelsByKey.content_hub?.id || ''],
    ['DISCORD_LOG_CHANNEL_CONTENT_REVIEW', channelsByKey.content_review?.id || ''],
    ['DISCORD_LOG_CHANNEL_ADMIN', channelsByKey.admin_logs?.id || ''],
  ];

  for (const [key, value] of individualKeys) {
    await setConfig(
      key,
      value,
      `Profiles After Dark setup managed key for ${key}`,
      'discord',
      false
    );
  }

  if (channelsByKey.mod_logs?.id) {
    await setModlogsChannel(guildId, channelsByKey.mod_logs.id);
  }
}

function getSetupSecret(config) {
  return (
    config.DISCORD_SETUP_LINK_SECRET ||
    config.EXPORT_LINK_SECRET ||
    config.JWT_SECRET ||
    config.SESSION_SECRET ||
    config.DISCORD_TOKEN ||
    'pad-discord-setup-link-secret'
  );
}

function createSetupToken(userId, guildId, expiresAtMs, secret) {
  const payload = `${userId}:${guildId}:${expiresAtMs}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `${expiresAtMs}.${signature}`;
}

async function resolveDiscordDashboardUrl(interaction) {
  const config = await loadConfig().catch(() => ({}));
  const webUrl = String(config.DEV_WEB_URL || 'https://dev.profilesafterdark.com').trim().replace(/\/+$/, '');
  const expiresAtMs = Date.now() + 30 * 60 * 1000;
  const token = createSetupToken(interaction.user.id, interaction.guild.id, expiresAtMs, getSetupSecret(config));
  const expiresAt = new Date(expiresAtMs).toISOString();
  return `${webUrl}/dashboards/discord-bot?discord_setup=1&guild_id=${encodeURIComponent(interaction.guild.id)}&setup_token=${encodeURIComponent(token)}&expires_at=${encodeURIComponent(expiresAt)}`;
}

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    return interaction.editReply('⚠️ This command can only be used in a Discord server.');
  }

  const apply = interaction.options.getBoolean('apply') ?? false;
  const postEmbeds = interaction.options.getBoolean('post_embeds') ?? false;

  try {
    await guild.channels.fetch();

    const existingCategories = buildCategoryLookup(guild);
    const planRows = [];
    const categoriesByKey = {};
    const channelsByKey = {};
    const createdCategories = [];
    const createdChannels = [];

    for (const categoryConfig of BLUEPRINT.categories) {
      const categoryName = categoryConfig.name;
      const categoryLookupName = categoryName.toLowerCase();
      const existingCategory = existingCategories.get(categoryLookupName);

      planRows.push({
        label: `Category: ${categoryName}`,
        exists: !!existingCategory,
      });

      if (apply) {
        const { channel: categoryChannel, created } = await ensureCategory(
          guild,
          existingCategories,
          categoryName
        );
        categoriesByKey[categoryConfig.key] = categoryChannel;
        if (created) createdCategories.push(categoryName);

        for (const channelConfig of categoryConfig.channels) {
          const existingText = findTextChannel(guild, channelConfig.name, categoryChannel.id);
          planRows.push({
            label: `#${channelConfig.name} in ${categoryName}`,
            exists: !!existingText,
          });

          const { channel: textChannel, created: textCreated } = await ensureText(
            guild,
            categoryChannel.id,
            channelConfig
          );
          channelsByKey[channelConfig.key] = textChannel;
          if (textCreated) createdChannels.push(channelConfig.name);
        }
      } else {
        for (const channelConfig of categoryConfig.channels) {
          const existingText = existingCategory
            ? findTextChannel(guild, channelConfig.name, existingCategory.id)
            : null;
          planRows.push({
            label: `#${channelConfig.name} in ${categoryName}`,
            exists: !!existingText,
          });
        }
      }
    }

    const dashboardUrl = await resolveDiscordDashboardUrl(interaction);

    if (!apply) {
      return interaction.editReply({
        content: [
          'Profiles After Dark setup preview:',
          ...buildSummaryLines(planRows),
          '',
          `Dashboard: ${dashboardUrl}`,
          'Use the dashboard to customize rules embeds, role setup, and channel layout presets.',
          '',
          'Run `/setup apply:true` to create only missing resources and persist IDs.',
        ].join('\n'),
      });
    }

    await persistSetupConfig(guild.id, categoriesByKey, channelsByKey);
    if (postEmbeds) {
      await postStarterEmbeds(channelsByKey);
    }

    return interaction.editReply({
      content: [
        '✅ Profiles After Dark setup completed.',
        `Created categories: ${createdCategories.length ? createdCategories.join(', ') : 'none'}`,
        `Created channels: ${createdChannels.length ? createdChannels.join(', ') : 'none'}`,
        '',
        'Saved setup maps to bot_config and updated log/review channel keys.',
        `Dashboard: ${dashboardUrl}`,
        'Use the dashboard for rules embeds, role setup, and preset layout customization.',
      ].join('\n'),
    });
  } catch (error) {
    console.error('Error running /setup command:', error);
    return interaction.editReply(
      `⚠️ Setup failed: ${error?.message || 'Unknown error'}`
    );
  }
}
