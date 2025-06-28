// src/pages/Policies.tsx
import React from "react";
import Footer from "../Footer";
import { FileText } from "lucide-react";

export default function Policies() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-10 relative">
        <div className="bg-slate-600 rounded-2xl shadow-xl p-8 md:p-12 text-center relative z-10">
          <FileText className="mx-auto mb-4 text-sky-400 w-12 h-12 animate-bounce" />
          <h1 className="text-4xl font-bold text-white mb-4">Policies</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Our platform policies ensure a safe, fair, and transparent environment for everyone. Please review them carefully.
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 md:p-10 mt-[-40px] relative z-0 hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">Privacy Policy</h2>
          <p className="text-slate-300 mb-4">
            We are committed to protecting your privacy. We collect only the information necessary to provide our services, such as account details and usage data, and we never sell your personal data to third parties. We use industry-standard security measures to protect your information and allow you to control your data preferences.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">Acceptable Use Policy</h2>
          <p className="text-slate-300 mb-4">
            Users are expected to use the platform responsibly and respectfully. Activities such as harassment, hate speech, spamming, or posting illegal content are strictly prohibited. We reserve the right to remove any content or accounts that violate these guidelines to maintain a safe and positive community.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">Data Retention Policy</h2>
          <p className="text-slate-300 mb-4">
            We retain your personal data only as long as necessary to fulfill the purposes for which it was collected, including providing services, complying with legal obligations, and resolving disputes. Upon account deletion or request, we will securely delete your information in accordance with applicable laws.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">Cookie Policy</h2>
          <p className="text-slate-300 mb-4">
            Our platform uses cookies and similar tracking technologies to enhance your experience, analyze site traffic, and personalize content. You can manage cookie preferences via your browser settings. We do not use cookies to collect personally identifiable information without your consent.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">Enforcement Policy</h2>
          <p className="text-slate-300">
            We take policy violations seriously. Depending on the severity, we may issue warnings, suspend accounts temporarily, or permanently ban users who engage in harmful or illegal activities. Users are encouraged to report violations through our support channels.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
