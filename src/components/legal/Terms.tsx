import React from "react";
import Footer from "../Footer";
import { ShieldCheck, FileText, AlertCircle, Ban, RefreshCw, Mail, CreditCard, Database } from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  {
    icon: ShieldCheck,
    title: "1. Account Responsibilities",
    content: "You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.",
  },
  {
    icon: FileText,
    title: "2. Content Ownership and License",
    content: "You retain ownership of your uploads, but you grant us a non-exclusive, worldwide, revocable license to host, display, and distribute your content as needed to operate and improve the platform.",
  },
  {
    icon: AlertCircle,
    title: "3. Prohibited Conduct",
    content: "You agree not to use the platform to post or share content that violates laws or infringes on the rights of others.",
  },
  {
    icon: CreditCard,
    title: "4. Payments and Billing (Stripe)",
    content: "Premium subscriptions are processed by Stripe. By purchasing, you authorize recurring charges until cancellation. We do not store full card numbers or sensitive payment credentials on our servers.",
  },
  {
    icon: Database,
    title: "5. Data and Privacy",
    content: "Use of the platform is also governed by our Privacy Policy, including how we collect account, usage, and transaction metadata, how long we retain it, and how users can request access or deletion where legally required.",
  },
  {
    icon: Ban,
    title: "6. Suspension and Termination",
    content: "We may suspend or terminate access for policy violations, abuse, fraud, non-payment, legal obligations, or actions that risk platform safety or reliability.",
  },
  {
    icon: RefreshCw,
    title: "7. Changes to Terms",
    content: "We may update these terms from time to time. Material updates take effect when posted. Continued use of the platform after updates constitutes acceptance.",
  },
  {
    icon: Mail,
    title: "8. Contact",
    content: "If you have questions about these Terms, billing, or data handling, please contact us through the support channels available on the platform.",
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professional Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
              <p className="text-slate-400">Legal agreement governing your use of our platform</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-800/50 rounded-2xl border border-slate-700 shadow-xl p-6 hover:border-slate-600 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600/20 rounded-xl flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-2">
                      {section.title}
                    </h2>
                    <p className="text-slate-300 leading-relaxed">
                      {section.content}
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
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl border border-blue-500/20 p-6"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Important Notice</h3>
              <p className="text-slate-300 leading-relaxed">
                By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
                If you do not agree with any part of these terms, please do not use our services.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
