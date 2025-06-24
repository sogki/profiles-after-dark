'use client';

import { Megaphone, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscordCTA() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl px-6 py-8 shadow-lg text-center max-w-2xl mx-auto mt-12 mb-12">
      {/* Sparkle particles */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >
        <div className="absolute w-full h-full bg-[radial-gradient(white/20_1px,transparent_1px)] bg-[length:24px_24px] animate-slow-pulse" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-3">
          <Megaphone className="h-6 w-6 text-indigo-400" />
          <h2 className="text-xl font-semibold text-white">Join Our Discord Community</h2>
        </div>
        <p className="text-slate-400 max-w-md">
          Connect and share your aesthetic passions with others in our community!
        </p>

        <div className="flex items-center space-x-2 bg-slate-700/30 border border-slate-600 px-4 py-2 rounded-lg text-sm text-slate-300">
          <Clock className="h-4 w-4" />
          <span>Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
