import express from 'express';
import profilesRouter from './profiles.js';
import emotesRouter from './emotes.js';
import wallpapersRouter from './wallpapers.js';
import emojiCombosRouter from './emoji_combos.js';
import discordRouter from './discord.js';
import moderationRouter from './moderation.js';
import statsRouter from './stats.js';
import searchRouter from './search.js';
import monitoringRouter from './monitoring.js';
import configRouter from './config.js';
import usersRouter from './users.js';
import accountLinkingRouter from './account-linking.js';
import flairSubscriptionsRouter from './flair-subscriptions.js';
import discordBotRouter from './discord-bot.js';

const router = express.Router();

// Mount all v1 routes
router.use('/profiles', profilesRouter);
router.use('/emotes', emotesRouter);
router.use('/wallpapers', wallpapersRouter);
router.use('/emoji_combos', emojiCombosRouter);
router.use('/discord', discordRouter);
router.use('/moderation', moderationRouter);
router.use('/stats', statsRouter);
router.use('/search', searchRouter);
router.use('/monitoring', monitoringRouter);
router.use('/config', configRouter);
router.use('/users', usersRouter);
router.use('/account-linking', accountLinkingRouter);
router.use('/flair-subscriptions', flairSubscriptionsRouter);
router.use('/discord-bot', discordBotRouter);

/**
 * @route   GET /api/v1
 * @desc    API v1 information
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    message: 'Profiles After Dark API v1',
    endpoints: {
      profiles: '/api/v1/profiles',
      emotes: '/api/v1/emotes',
      wallpapers: '/api/v1/wallpapers',
      emoji_combos: '/api/v1/emoji_combos',
      discord: '/api/v1/discord',
      moderation: '/api/v1/moderation',
      stats: '/api/v1/stats',
      search: '/api/v1/search',
      monitoring: '/api/v1/monitoring',
      users: '/api/v1/users',
      flair_subscriptions: '/api/v1/flair-subscriptions',
      discord_bot: '/api/v1/discord-bot'
    },
    documentation: 'https://dev.profilesafterdark.com/api/v1'
  });
});

export default router;

