import { Crown, Settings, Sparkles } from 'lucide-react';

import { useAuth } from '@/context/authContext';
import { useFlairSubscription } from '@/hooks/useFlair';

import FlairHero from '@/components/flair/FlairHero';
import SubscriptionTab from '@/components/flair/tabs/SubscriptionTab';
import Footer from '@/components/Footer';

export default function FlairDashboard() {
  const { user } = useAuth();
  const fallbackCount = 0;
  const { subscription, isPremium, loading: subLoading } = useFlairSubscription();

  if (!user) {
    return (
      <div className="relative min-h-screen bg-slate-900 flex flex-col">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
        <div className="relative flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <Sparkles className="w-16 h-16 text-purple-400 relative z-10" />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Welcome to Flair Premium
            </h2>
            <p className="text-slate-300 text-lg mb-6">
              Sign in to manage your profile flair, emotes, and premium subscription.
            </p>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
        <div className="relative">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
      <div className="relative">
      <FlairHero isPremium={isPremium} emotesCount={fallbackCount} premiumThemesCount={fallbackCount} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isPremium && (
          <div className="mb-8 max-w-3xl mx-auto rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-600/10 to-pink-600/10 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-purple-500/20 p-3">
                <Crown className="h-6 w-6 text-yellow-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  You have a Flair Premium subscription
                </h2>
                <p className="text-slate-300 mb-5">
                  Open your profile customisation workspace to use the visual layout editor, drag-and-drop sections,
                  tab gradients, social placement controls, animated names, and premium themes.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/profile-settings?tab=customization"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition"
                  >
                    <Settings className="h-4 w-4" />
                    Open Profile Customisation
                  </a>
                  <a
                    href="/profile-settings?tab=subscription"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/60 px-5 py-2.5 font-semibold text-slate-200 hover:bg-slate-700/70 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    Manage Subscription
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <SubscriptionTab
          subscription={subscription}
          loading={subLoading}
          isPremium={isPremium}
        />
      </div>
      <Footer />
      </div>
    </div>
  );
}

