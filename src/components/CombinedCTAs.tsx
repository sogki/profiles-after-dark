"use client";

import { motion } from "framer-motion";
import CreatorCTA from "./CreatorCTA";
import DiscordCTA from "./DiscordCTA";
import { useAuth } from "../context/authContext";

export default function CombinedCTAs() {
  const { user } = useAuth();

  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Creator CTA - only show if user is logged in */}
          {user && (
            <>
              <div className="flex-1">
                <CreatorCTA />
              </div>
              {/* Separator line - barely visible */}
              <div className="hidden lg:block w-px bg-slate-700/20" />
            </>
          )}
          
          {/* Discord CTA - always show */}
          <div className={user ? "flex-1" : "w-full"}>
            <DiscordCTA />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

