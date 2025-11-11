"use client";

import { motion } from "framer-motion";
import { Upload, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../context/authContext";

export default function CreatorCTA() {
  const { user } = useAuth();

  // Only show if user is logged in
  if (!user) {
    return null;
  }

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 h-full">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-8 md:p-10 h-full flex flex-col justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Share Your Creations
            </h2>
          </div>
          <p className="text-slate-300 mb-6 text-lg">
            Join our community of creators and share your aesthetic content with thousands of users
          </p>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openUploadModal'));
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/30"
          >
            <Sparkles className="h-4 w-4" />
            Upload Content
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

