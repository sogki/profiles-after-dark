import { CheckCircle2, Settings, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import StripeSecurityNotice from '@/components/flair/StripeSecurityNotice';

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-3xl border border-green-500/30 bg-slate-900/70 p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">
            <CheckCircle2 className="h-4 w-4" />
            PAYMENT SUCCESSFUL
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Flair Premium</h1>
          <p className="text-slate-300 mb-7">
            Your payment was received. You can now customize your profile with premium features.
          </p>

          <StripeSecurityNotice className="mb-6" />

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/profile-settings?tab=customization"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition"
            >
              <Settings className="h-4 w-4" />
              Customize Profile
            </Link>
            <Link
              to="/profile-settings?tab=subscription"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/70 px-5 py-3 font-semibold text-slate-100 hover:bg-slate-700 transition"
            >
              <Sparkles className="h-4 w-4" />
              View Subscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
