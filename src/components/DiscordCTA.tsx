'use client';

import { Megaphone, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DiscordCTA() {
  return (
    <div className="relative group overflow-hidden rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 h-full">
      {/* Subtle background animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-8 md:p-10 text-center h-full flex flex-col justify-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-500/20 rounded-lg">
            <Megaphone className="h-5 w-5 text-indigo-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Join Our Community
          </h2>
        </div>
        <p className="text-slate-300 mb-6 text-lg max-w-2xl mx-auto">
          Connect with creators and share your aesthetic passions
        </p>
        <div className="inline-flex items-center gap-2 bg-slate-700/30 border border-slate-600/30 px-5 py-2.5 rounded-lg text-sm text-slate-300">
          <Clock className="h-4 w-4" />
          <span>Discord Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
