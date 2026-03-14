import { useMemo, useState } from 'react';
import { Crown, LayoutPanelTop, Palette, Settings, Sparkles } from 'lucide-react';
import {
  useFlairEmotes,
  useFlairProfile,
  useFlairSubscription,
  useFlairThemes,
} from '@/hooks/useFlair';
import { useCreatorAnalytics } from '@/hooks/flair/useCreatorAnalytics';
import { useEmoteCollections } from '@/hooks/flair/useEmoteCollections';
import { useProfileSpotlight } from '@/hooks/flair/useProfileSpotlight';
import ProfileTab from '@/components/flair/tabs/ProfileTab';
import EmoteSetsTab from '@/components/flair/tabs/EmoteSetsTab';
import ThemesTab from '@/components/flair/tabs/ThemesTab';
import CreatorAnalyticsTab from '@/components/flair/tabs/CreatorAnalyticsTab';
import LayoutBuilderTab from '@/components/flair/tabs/LayoutBuilderTab';

type CustomizationTab = 'profile' | 'layout' | 'collections' | 'analytics' | 'themes';
const PREMIUM_ONLY_TABS: CustomizationTab[] = ['profile', 'layout', 'analytics', 'themes'];

export default function FlairCustomizationSettings() {
  const { profile, loading: profileLoading, updateProfile } = useFlairProfile();
  const { emotes } = useFlairEmotes();
  const {
    collections,
    loading: collectionsLoading,
    createCollection,
    deleteCollection,
  } = useEmoteCollections();
  const { summary: creatorAnalytics, loading: analyticsLoading } = useCreatorAnalytics();
  const { spotlightEnabled, updateSpotlight } = useProfileSpotlight();
  const { themes, loading: themesLoading } = useFlairThemes();
  const { isPremium, loading: subscriptionLoading } = useFlairSubscription();

  const [activeTab, setActiveTab] = useState<CustomizationTab>('collections');

  const tabItems = useMemo(
    () => [
      { id: 'profile' as const, label: 'Profile', icon: Settings },
      { id: 'layout' as const, label: 'Layout', icon: LayoutPanelTop },
      { id: 'collections' as const, label: 'Collections', icon: Palette },
      { id: 'analytics' as const, label: 'Analytics', icon: Sparkles },
      { id: 'themes' as const, label: 'Themes', icon: Crown },
    ],
    []
  );

  if (subscriptionLoading) {
    return <div className="text-sm text-slate-400">Loading customisation settings...</div>;
  }

  const tabIsPremiumOnly = PREMIUM_ONLY_TABS.includes(activeTab);
  const showPremiumUpgradePanel = tabIsPremiumOnly && !isPremium;
  const useFullEditorWidth = activeTab === 'layout';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isPremiumOnly = PREMIUM_ONLY_TABS.includes(tab.id);
          const isLocked = isPremiumOnly && !isPremium;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                isActive
                  ? 'border-purple-500 bg-purple-500/20 text-white'
                  : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isLocked && <Crown className="h-3.5 w-3.5 text-yellow-300" />}
            </button>
          );
        })}
      </div>

      <div
        className={
          useFullEditorWidth
            ? 'w-full'
            : 'rounded-xl border border-slate-700 bg-slate-900/40 p-4'
        }
      >
        {showPremiumUpgradePanel && (
          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Premium Customisation</h3>
            <p className="text-slate-300 mb-4">
              This section is part of Flair Premium. Emotes and collections stay available on free accounts.
            </p>
            <a
              href="/flair"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Crown className="h-4 w-4" />
              View Premium Plans
            </a>
          </div>
        )}

        {activeTab === 'profile' && !showPremiumUpgradePanel && (
          <ProfileTab
            profile={profile}
            loading={profileLoading}
            updateProfile={updateProfile}
            isPremium={isPremium}
            onNavigateToSubscription={() => window.location.assign('/flair')}
            spotlightEnabled={spotlightEnabled}
            onToggleSpotlight={updateSpotlight}
          />
        )}
        {activeTab === 'collections' && (
          <EmoteSetsTab
            collections={collections}
            loading={collectionsLoading}
            emotes={emotes}
            onCreate={createCollection}
            onDelete={deleteCollection}
            isPremium={isPremium}
          />
        )}
        {activeTab === 'layout' && !showPremiumUpgradePanel && (
          <LayoutBuilderTab
            isPremium={isPremium}
            onNavigateToSubscription={() => window.location.assign('/flair')}
            flairProfile={profile}
            onUpdateFlairProfile={updateProfile}
          />
        )}
        {activeTab === 'analytics' && !showPremiumUpgradePanel && (
          <CreatorAnalyticsTab summary={creatorAnalytics} loading={analyticsLoading} />
        )}
        {activeTab === 'themes' && !showPremiumUpgradePanel && (
          <ThemesTab
            themes={themes}
            loading={themesLoading}
            profile={profile}
            updateProfile={updateProfile}
            isPremium={isPremium}
          />
        )}
      </div>
    </div>
  );
}
