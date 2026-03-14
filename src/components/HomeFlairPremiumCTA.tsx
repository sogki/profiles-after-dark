import { Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function HomeFlairPremiumCTA() {
  return (
    <section className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-600/15 via-fuchsia-600/10 to-blue-600/15 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-yellow-300">
                <Crown className="h-3.5 w-3.5" />
                Flair Premium
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                Want next-level profile customisation?
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Explore visual layout tools, premium themes, and advanced identity effects.
              </p>
            </div>
            <Link
              to="/flair"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="h-4 w-4" />
              See Flair Premium Features
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
