import { Sparkles, Crown, Infinity, Palette } from 'lucide-react';

interface FlairHeroProps {
  isPremium: boolean;
  emotesCount: number;
  premiumThemesCount: number;
}

export default function FlairHero({ isPremium, emotesCount, premiumThemesCount }: FlairHeroProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="rounded-3xl border border-purple-500/30 bg-slate-900/60 p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                <Crown className="h-3.5 w-3.5" />
                FLAIR PREMIUM
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Make your profile impossible to ignore.
              </h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Build your profile visually with drag-and-drop sections, tab gradients, social link placement,
                and premium identity customisation.
              </p>
            </div>
            {isPremium && (
              <span className="inline-flex h-fit items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300">
                <Crown className="w-3 h-3" />
                PREMIUM ACTIVE
              </span>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-purple-300">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-semibold">Visual Layout Builder</span>
              </div>
              <p className="text-sm text-slate-300">Drag profile blocks and click content to edit contextual properties.</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-pink-300">
                <Palette className="w-5 h-5" />
                <span className="text-sm font-semibold">Theme + Tabs Styling</span>
              </div>
              <p className="text-sm text-slate-300">
                Gradient tab strip controls, active pill styling, and {premiumThemesCount} premium theme options.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-blue-300">
                <Infinity className="w-5 h-5" />
                <span className="text-sm font-semibold">Identity + Upload Scale</span>
              </div>
              <p className="text-sm text-slate-300">
                {isPremium
                  ? `${emotesCount} uploaded so far with premium upload capacity.`
                  : 'Unlock expanded upload limits and advanced identity customisation.'}
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}

