"use client";

import { motion } from "framer-motion";
import { Search, Download, Upload, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Browse",
    description: "Discover thousands of aesthetic profile pictures, banners, wallpapers, and more",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    number: "01",
  },
  {
    icon: Download,
    title: "Download",
    description: "Get instant access to high-quality content for all your favorite platforms",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    number: "02",
  },
  {
    icon: Upload,
    title: "Share",
    description: "Upload your own creations and join our vibrant community of creators",
    gradient: "from-green-500 via-emerald-500 to-lime-500",
    number: "03",
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </motion.div>

        {/* Creative flow layout */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-green-500/50 transform -translate-y-1/2" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative group"
              >
                <div className="relative">
                  {/* Icon container - positioned relative for number alignment */}
                  <div className="mb-8 flex justify-center relative z-10">
                    {/* Large number background - positioned to the left, partially behind icon */}
                    <div className={`absolute left-1/2 transform -translate-x-[100%] top-1/5 -translate-y-1/2 text-[10rem] md:text-[12rem] font-black bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent opacity-20 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none z-0`}>
                      {step.number}
                    </div>

                    {/* Icon with animated gradient - overlaps number on the right */}
                    <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${step.gradient} shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 z-10`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
                      <step.icon className="relative h-10 w-10 text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 text-center group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300 relative z-10">
                    {step.title}
                  </h3>
                  
                  <p className="text-slate-400 text-center leading-relaxed relative z-10">
                    {step.description}
                  </p>

                  {/* Arrow connector (desktop only) - with gradient */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                      <div className="relative">
                        <ArrowRight className="h-6 w-6 text-transparent" style={{ 
                          background: index === 0 
                            ? 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))' 
                            : 'linear-gradient(to right, rgb(59, 130, 246), rgb(16, 185, 129))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

