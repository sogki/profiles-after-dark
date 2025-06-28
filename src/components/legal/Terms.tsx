import React from "react";
import Footer from "../Footer";
import { ShieldCheck } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-10 relative">
        <div className="bg-slate-600 rounded-2xl shadow-xl p-8 md:p-12 text-center relative z-10">
          <ShieldCheck className="mx-auto mb-4 text-sky-400 w-12 h-12 animate-bounce" />
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            By accessing and using our platform, you agree to comply with and be bound by these Terms of Service. Please read them carefully.
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 md:p-10 mt-[-40px] relative z-0 hover:shadow-2xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">1. Account Responsibilities</h2>
          <p className="text-slate-300 mb-4">You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.</p>

          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">2. Content Ownership</h2>
          <p className="text-slate-300 mb-4">You retain ownership of your uploads but grant us a non-exclusive license to display them on our platform.</p>

          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">3. Prohibited Conduct</h2>
          <p className="text-slate-300 mb-4">You agree not to use the platform to post or share content that violates laws or infringes on the rights of others.</p>

          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">4. Termination</h2>
          <p className="text-slate-300 mb-4">We reserve the right to terminate your access if you violate these terms or engage in harmful behavior.</p>

          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">5. Changes to Terms</h2>
          <p className="text-slate-300 mb-4">We may update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.</p>

          <h2 className="text-2xl font-semibold text-white mt-6 mb-2">6. Contact</h2>
          <p className="text-slate-300">If you have questions about these Terms, please contact us via the support channels provided on the platform.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}