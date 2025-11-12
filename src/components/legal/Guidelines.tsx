import React, { useState } from "react";
import Footer from "../Footer";
import { BookOpen, ChevronDown, Users, Shield, AlertTriangle, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const rules = [
  "Respect all members: avoid harassment, hate speech, and personal attacks.",
  "Do not share or post illegal, harmful, offensive, or discriminatory content.",
  "Protect your personal information and respect others' privacy at all times.",
  "Avoid spamming, self-promotion, or irrelevant advertising.",
  "Report any suspicious or inappropriate behavior promptly to moderators.",
  "Follow intellectual property rights and do not upload unauthorized content.",
  "Use appropriate language—no excessive profanity or vulgarity.",
  "Engage in discussions constructively and avoid inflammatory comments.",
  "Do not impersonate others or misrepresent your identity.",
  "Adhere to platform-specific terms of service alongside these guidelines.",
  "Repeated violations may result in content removal, account suspension, or bans.",
];

const guidelines = [
  {
    question: "What kind of content is allowed on the platform?",
    answer:
      "We allow content that is respectful, legal, and adheres to community standards. Content that promotes hate speech, violence, illegal activities, or explicit material is strictly prohibited.",
  },
  {
    question: "How should I interact with other users?",
    answer:
      "Please engage respectfully and thoughtfully. Harassment, bullying, and discriminatory remarks are not tolerated. Treat others as you would like to be treated.",
  },
  {
    question: "What happens if I violate the guidelines?",
    answer:
      "Violations may result in content removal, warnings, temporary suspensions, or permanent bans depending on severity and frequency.",
  },
  {
    question: "Can I report inappropriate content or behavior?",
    answer:
      "Yes! Use the report feature or contact support immediately to flag inappropriate content or behavior for review.",
  },
  {
    question: "Are there any rules about sharing personal information?",
    answer:
      "Protect your privacy and others'. Do not share sensitive personal information publicly or request it from others.",
  },
  {
    question: "How often are the guidelines updated?",
    answer:
      "Guidelines are reviewed regularly and updated as needed to maintain a safe and welcoming community. We encourage users to check back periodically.",
  },
];

export default function Guidelines() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggle = (index: number) => {
    if (openIndexes.includes(index)) {
      setOpenIndexes(openIndexes.filter((i) => i !== index));
    } else {
      setOpenIndexes([...openIndexes, index]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600/20 rounded-xl">
              <BookOpen className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Community Guidelines</h1>
              <p className="text-slate-400">Help create a safe, respectful, and enjoyable space for everyone</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Rules */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Community Rules</h2>
              </div>
              <ul className="space-y-3">
                {rules.map((rule, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="flex items-start gap-3 text-slate-300"
                  >
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="leading-relaxed">{rule}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Additional Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-2xl border border-green-500/20 p-6"
            >
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Enforcement</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Violations of these guidelines are taken seriously. Our moderation team reviews all reports and takes 
                    appropriate action, which may include warnings, content removal, temporary suspensions, or permanent bans.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.section>

          {/* Sidebar: FAQ Accordion */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl p-6 sticky top-8 h-fit"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {guidelines.map(({ question, answer }, idx) => {
                const isOpen = openIndexes.includes(idx);
                return (
                  <div key={idx} className="border-b border-slate-700 last:border-b-0 pb-4 last:pb-0">
                    <button
                      onClick={() => toggle(idx)}
                      className="w-full flex justify-between items-center text-left py-2 font-semibold text-white text-sm focus:outline-none group"
                      aria-expanded={isOpen}
                      aria-controls={`faq-content-${idx}`}
                    >
                      <span className="pr-2">{question}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`faq-content-${idx}`}
                          key="content"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2 text-slate-300 text-sm leading-relaxed pl-0">{answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
