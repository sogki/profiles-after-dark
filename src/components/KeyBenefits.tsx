"use client";

import { motion } from "framer-motion";
import { Download, Sparkles, Users, RefreshCw } from "lucide-react";

const benefits = [
  {
    icon: Download,
    title: "Free Downloads",
    description: "All content is completely free to download and use",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    icon: Sparkles,
    title: "High Quality",
    description: "Curated collection of premium aesthetic content",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: RefreshCw,
    title: "Regular Updates",
    description: "New content added daily by our community",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Created by and for the aesthetic community",
    gradient: "from-pink-400 to-rose-500",
  },
];

export default function KeyBenefits() {
  return (
    <section className="w-full py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Profiles After Dark
            </span>
          </h2>
        </motion.div>

        {/* Flowing text-based design with inline icons */}
        <div className="space-y-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative"
            >
              <div className="flex items-center gap-6 p-6 rounded-2xl bg-slate-800/20 backdrop-blur-sm border border-slate-700/20 hover:border-slate-600/40 hover:bg-slate-800/30 transition-all duration-300">
                {/* Icon */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                
                {/* Text content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                {/* Decorative gradient line */}
                <div className={`hidden lg:block absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${benefit.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-2xl`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

