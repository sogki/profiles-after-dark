import { initializeConfigFromEnv } from './utils/config.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Setup script to initialize configuration in database from environment variables
 * Run this once to migrate from .env to database storage
 */
(async () => {
  try {
    console.log('🚀 Starting configuration setup...\n');
    console.log('📋 Reading configuration from environment variables...\n');
    
    // Verify Supabase credentials are available
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
      console.error('💡 These are required to connect to the database and store configuration.');
      process.exit(1);
    }
    
    console.log('✅ Supabase credentials found\n');
    
    await initializeConfigFromEnv();
    
    console.log('\n✨ Configuration setup complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. The bot will automatically use database config when available');
    console.log('   2. Environment variables will be used as fallback');
    console.log('   3. You can keep .env for local development or remove it for production');
    console.log('   4. To update config, edit the bot_config table in Supabase or run this script again');
    console.log('\n🎉 Your bot is now configured to use the database for configuration!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Configuration setup failed:');
    console.error(error.message);
    
    if (error.message.includes('relation "bot_config" does not exist')) {
      console.error('\n💡 Solution: Run the database migration first!');
      console.error('   Migration file: supabase/migrations/20250115000004_bot_config_table.sql');
    } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      console.error('\n💡 Solution: Check your SUPABASE_SERVICE_ROLE_KEY is correct');
    } else if (error.message.includes('connection')) {
      console.error('\n💡 Solution: Check your SUPABASE_URL is correct and accessible');
    }
    
    process.exit(1);
  }
})();

