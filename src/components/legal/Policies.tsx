import React from "react";
import Footer from "../Footer";
import { FileText, Shield, Database, Cookie, Gavel, Lock } from "lucide-react";
import { motion } from "framer-motion";

const policies = [
  {
    icon: Shield,
    title: "Privacy Policy",
    description: "We are committed to protecting your privacy. We collect only the information necessary to provide our services, such as account details and usage data, and we never sell your personal data to third parties. We use industry-standard security measures to protect your information and allow you to control your data preferences.",
    color: "blue",
  },
  {
    icon: Gavel,
    title: "Acceptable Use Policy",
    description: "Users are expected to use the platform responsibly and respectfully. Activities such as harassment, hate speech, spamming, or posting illegal content are strictly prohibited. We reserve the right to remove any content or accounts that violate these guidelines to maintain a safe and positive community.",
    color: "red",
  },
  {
    icon: Database,
    title: "Data Retention Policy",
    description: "We retain your personal data only as long as necessary to fulfill the purposes for which it was collected, including providing services, complying with legal obligations, and resolving disputes. Upon account deletion or request, we will securely delete your information in accordance with applicable laws.",
    color: "purple",
  },
  {
    icon: Cookie,
    title: "Cookie Policy",
    description: "Our platform uses cookies and similar tracking technologies to enhance your experience, analyze site traffic, and personalize content. You can manage cookie preferences via your browser settings. We do not use cookies to collect personally identifiable information without your consent.",
    color: "yellow",
  },
  {
    icon: FileText,
    title: "Enforcement Policy",
    description: "We take policy violations seriously. Depending on the severity, we may issue warnings, suspend accounts temporarily, or permanently ban users who engage in harmful or illegal activities. Users are encouraged to report violations through our support channels.",
    color: "orange",
  },
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: "bg-blue-600/20", icon: "text-blue-400", border: "border-blue-500/20" },
    red: { bg: "bg-red-600/20", icon: "text-red-400", border: "border-red-500/20" },
    purple: { bg: "bg-purple-600/20", icon: "text-purple-400", border: "border-purple-500/20" },
    yellow: { bg: "bg-yellow-600/20", icon: "text-yellow-400", border: "border-yellow-500/20" },
    orange: { bg: "bg-orange-600/20", icon: "text-orange-400", border: "border-orange-500/20" },
  };
  return colors[color] || colors.blue;
};

export default function Policies() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-xl">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
              <p className="text-slate-400">Our platform policies ensure a safe, fair, and transparent environment</p>
            </div>
          </div>
        </div>

        {/* Policies Grid */}
        <div className="space-y-6">
          {policies.map((policy, index) => {
            const IconComponent = policy.icon;
            const colorClasses = getColorClasses(policy.color);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl p-6 hover:border-slate-600 transition-all duration-300`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${colorClasses.bg} rounded-xl flex-shrink-0`}>
                    <IconComponent className={`w-6 h-6 ${colorClasses.icon}`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-3">
                      {policy.title}
                    </h2>
                    <p className="text-slate-300 leading-relaxed">
                      {policy.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl border border-purple-500/20 p-6"
        >
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Your Privacy Matters</h3>
              <p className="text-slate-300 leading-relaxed">
                We are committed to transparency and protecting your rights. If you have any questions about our policies 
                or how we handle your data, please contact our support team. We regularly review and update our policies 
                to ensure they remain current and compliant with applicable laws.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
