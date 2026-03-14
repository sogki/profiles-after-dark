import { useState } from 'react';
import { ArrowLeft, CreditCard, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useFlairSubscription } from '@/hooks/useFlair';
import { createFlairBillingPortalSession, createFlairCheckoutSession } from '@/lib/flairBilling';
import StripeSecurityNotice from '@/components/flair/StripeSecurityNotice';

export default function BillingPage() {
  const navigate = useNavigate();
  const { subscription, isPremium, loading } = useFlairSubscription();
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null);

  const startCheckout = async () => {
    try {
      setBusy('checkout');
      const url = await createFlairCheckoutSession();
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to open checkout.');
    } finally {
      setBusy(null);
    }
  };

  const openBillingPortal = async () => {
    try {
      setBusy('portal');
      const url = await createFlairBillingPortalSession();
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <button
          onClick={() => navigate('/flair')}
          className="mb-6 inline-flex items-center gap-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Flair
        </button>

        <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-purple-600/20 p-2">
              <CreditCard className="h-6 w-6 text-purple-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Billing</h1>
              <p className="text-slate-400">Manage your Flair Premium subscription and payment details.</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-slate-400">
              Loading subscription...
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400 mb-1">Plan</p>
                  <p className="text-white font-semibold capitalize">
                    {subscription?.subscription_tier || (isPremium ? 'premium' : 'free')}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400 mb-1">Status</p>
                  <p className="text-white font-semibold capitalize">{subscription?.status || 'active'}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-400 mb-1">Price</p>
                  <p className="text-white font-semibold">GBP 3.99 / month</p>
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-600/15 to-pink-600/15 p-5 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-lg font-semibold text-white">Flair Premium includes</h2>
                </div>
                <p className="text-slate-300 text-sm">
                  Animated display names, premium themes, and unlimited emote uploads.
                </p>
              </div>

              <StripeSecurityNotice className="mb-6" />

              {isPremium ? (
                <div className="space-y-2">
                  <button
                    onClick={openBillingPortal}
                    disabled={busy !== null}
                    className="w-full rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-900 hover:bg-white disabled:opacity-60"
                  >
                    {busy === 'portal' ? 'Opening billing portal...' : 'Manage payment methods & subscription'}
                  </button>
                  <p className="text-xs text-slate-400">
                    You can cancel anytime directly in the Stripe billing portal.
                  </p>
                </div>
              ) : (
                <button
                  onClick={startCheckout}
                  disabled={busy !== null}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-60"
                >
                  {busy === 'checkout' ? 'Opening checkout...' : 'Upgrade to Premium'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
