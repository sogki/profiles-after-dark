import { Infinity, Sparkles, Palette, Crown, Check, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { createFlairCheckoutSession } from '@/lib/flairBilling';
import { useNavigate } from 'react-router-dom';
import StripeSecurityNotice from '@/components/flair/StripeSecurityNotice';

interface SubscriptionTabProps {
  subscription: any;
  loading: boolean;
  isPremium: boolean;
}

export default function SubscriptionTab({ subscription, loading, isPremium }: SubscriptionTabProps) {
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    try {
      setIsCreatingCheckout(true);
      const checkoutUrl = await createFlairCheckoutSession();
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading subscription...</p>
        </div>
      </div>
    );
  }

  const premiumFeatures = [
    { icon: Sparkles, text: 'Visual 1:1 profile layout builder' },
    { icon: Sparkles, text: 'Drag-and-drop profile blocks with grid snapping' },
    { icon: Palette, text: 'Tab strip + active tab gradient controls' },
    { icon: Palette, text: 'Social link placement and ordering controls' },
    { icon: Sparkles, text: 'Animated display names and premium identity effects' },
    { icon: Infinity, text: 'Expanded upload capacity for creators' },
    { icon: Crown, text: 'Premium profile themes and spotlight perks' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Flair Premium Plans
          </h2>
          <span className="inline-flex items-center rounded-full border border-yellow-500/40 bg-yellow-500/15 px-2 py-0.5 text-xs font-semibold text-yellow-300">
            Coming Soon
          </span>
        </div>
        <p className="text-slate-400">Compare plans, explore features, and upgrade instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6">
          <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
          <p className="text-slate-400 mb-6">Included with every account.</p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-slate-300">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Core profile editing (avatar, banner, bio, links)</span>
            </li>
            <li className="flex items-center gap-3 text-slate-300">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Standard content uploads and gallery tabs</span>
            </li>
            <li className="flex items-center gap-3 text-slate-500">
              <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
              <span>Visual drag-and-drop layout builder</span>
            </li>
            <li className="flex items-center gap-3 text-slate-500">
              <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
              <span>Contextual content property editing</span>
            </li>
            <li className="flex items-center gap-3 text-slate-500">
              <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
              <span>Advanced tabs appearance and ordering controls</span>
            </li>
            <li className="flex items-center gap-3 text-slate-500">
              <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
              <span>Animated display names and premium effects</span>
            </li>
            <li className="flex items-center gap-3 text-slate-500">
              <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
              <span>Premium themes and spotlight perks</span>
            </li>
            <li className="flex items-center gap-3 text-slate-500">
              <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
              <span>Expanded creator upload capacity</span>
            </li>
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/60 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h3 className="text-2xl font-bold text-white">Flair Premium</h3>
          </div>
          <div className="text-4xl font-bold text-white mb-1">£3.99</div>
          <p className="text-slate-300 text-sm mb-6">per month</p>

          <ul className="space-y-3 mb-8">
            {premiumFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <li key={idx} className="flex items-center gap-3 text-white">
                  <Icon className="w-5 h-5 text-purple-300 flex-shrink-0" />
                  <span>{feature.text}</span>
                </li>
              );
            })}
          </ul>

          {isPremium ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                Premium active ({subscription?.status || 'active'})
              </div>
              <button
                onClick={() => navigate('/billing')}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/70 px-6 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Manage billing
              </button>
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={isCreatingCheckout}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25"
            >
              {isCreatingCheckout ? 'Opening checkout...' : 'Upgrade to Premium'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <StripeSecurityNotice />
        <p className="text-xs text-slate-400">
          Paid plans can be canceled anytime from your billing portal after upgrading.
        </p>
      </div>
    </div>
  );
}

