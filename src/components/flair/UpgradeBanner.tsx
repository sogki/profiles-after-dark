import { Crown, Check } from 'lucide-react';

interface UpgradeBannerProps {
  onUpgrade: () => void;
}

export default function UpgradeBanner({ onUpgrade }: UpgradeBannerProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-1">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse opacity-75"></div>
      <div className="relative bg-slate-900 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Unlock Premium Features</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Unlock animated display names, premium themes, and unlimited emote uploads.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                Unlimited emote uploads
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                Animated names
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                Premium themes
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                Creator analytics
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                Advanced collections
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-4 h-4 text-green-400" />
                Spotlight placement
              </div>
            </div>
          </div>
          <button 
            onClick={onUpgrade}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25 whitespace-nowrap"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

