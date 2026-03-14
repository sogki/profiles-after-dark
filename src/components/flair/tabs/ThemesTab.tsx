import { Crown, Lock, Check, Paintbrush, LayoutPanelTop } from 'lucide-react';
import type { ProfileLayoutPresetInput } from '@/hooks/flair/useProfileLayoutBuilder';

interface ThemesTabProps {
  themes: any[];
  loading: boolean;
  profile: any;
  updateProfile: (updates: any) => Promise<void>;
  isPremium: boolean;
}

interface BuiltInThemePreset {
  id: string;
  name: string;
  description: string;
  style: 'color' | 'ui';
  premium: boolean;
  preset: ProfileLayoutPresetInput;
}

const BUILT_IN_THEME_PRESETS: BuiltInThemePreset[] = [
  {
    id: 'midnight-neon',
    name: 'Midnight Neon',
    description: 'Color-focused: neon purple accents with a deep midnight surface.',
    style: 'color',
    premium: false,
    preset: {
      theme: {
        mode: 'midnight-neon',
        accent: '#a855f7',
        surface: '#0b1120',
        tabs: {
          stripStart: '#7c3aed',
          stripEnd: '#a855f7',
          activeStart: '#c026d3',
          activeEnd: '#8b5cf6',
        },
      },
    },
  },
  {
    id: 'ocean-glass',
    name: 'Ocean Glass',
    description: 'Color-focused: cool blue palette with clean contrast.',
    style: 'color',
    premium: false,
    preset: {
      theme: {
        mode: 'ocean-glass',
        accent: '#0ea5e9',
        surface: '#0a1624',
        tabs: {
          stripStart: '#0ea5e9',
          stripEnd: '#0284c7',
          activeStart: '#22d3ee',
          activeEnd: '#3b82f6',
        },
      },
    },
  },
  {
    id: 'sunset-flair',
    name: 'Sunset Flair',
    description: 'Color-focused: warm gradients for a vibrant profile aesthetic.',
    style: 'color',
    premium: true,
    preset: {
      theme: {
        mode: 'sunset-flair',
        accent: '#f97316',
        surface: '#1b1020',
        tabs: {
          stripStart: '#f97316',
          stripEnd: '#ec4899',
          activeStart: '#fb7185',
          activeEnd: '#f59e0b',
        },
      },
    },
  },
  {
    id: 'the-professional',
    name: 'The Professional',
    description: 'UI-focused: compact stats, cleaner hierarchy, and productivity layout.',
    style: 'ui',
    premium: true,
    preset: {
      theme: {
        mode: 'the-professional',
        accent: '#64748b',
        surface: '#0b1220',
        tabs: {
          stripStart: '#475569',
          stripEnd: '#334155',
          activeStart: '#64748b',
          activeEnd: '#475569',
        },
      },
      header: {
        blockOrder: ['avatar', 'identity', 'stats', 'socials', 'actions'],
        avatar: { x: 0, y: 0, size: 0.92 },
        stats: { variant: 'compact', order: ['followers', 'following', 'joined', 'favorites'] },
      },
      tabs: {
        order: ['pairs', 'pfps', 'banners', 'collections', 'emotes', 'wallpapers', 'favorites', 'emojicombos'],
      },
      sections: [
        { id: 'hero', type: 'hero', enabled: true, order: 1 },
        { id: 'about', type: 'about', enabled: true, order: 2 },
        { id: 'highlights', type: 'highlights', enabled: true, order: 3 },
      ],
    },
  },
  {
    id: 'creator-spotlight',
    name: 'Creator Spotlight',
    description: 'UI-focused: larger identity presence and content-first tab order.',
    style: 'ui',
    premium: true,
    preset: {
      theme: {
        mode: 'creator-spotlight',
        accent: '#22c55e',
        surface: '#071a12',
        tabs: {
          stripStart: '#16a34a',
          stripEnd: '#22c55e',
          activeStart: '#4ade80',
          activeEnd: '#22c55e',
        },
      },
      header: {
        blockOrder: ['avatar', 'identity', 'socials', 'stats', 'actions'],
        avatar: { x: 0, y: 0, size: 1.08 },
        stats: { variant: 'normal', order: ['joined', 'followers', 'following', 'favorites'] },
      },
      tabs: {
        order: ['pairs', 'collections', 'pfps', 'banners', 'emotes', 'wallpapers', 'favorites', 'emojicombos'],
      },
    },
  },
];

export default function ThemesTab({ 
  themes, 
  loading, 
  profile: _profile, 
  updateProfile: _updateProfile, 
  isPremium 
}: ThemesTabProps) {
  const themesComingSoon = true;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading themes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Profile Themes
          </h2>
          <span className="inline-flex items-center rounded-full border border-yellow-500/40 bg-yellow-500/15 px-2 py-0.5 text-xs font-semibold text-yellow-300">
            Coming Soon
          </span>
        </div>
        <p className="text-slate-400">
          Apply full-page presets. Color themes adjust palette, while UI themes also reorganize layout structure.
        </p>
      </div>

      <div className="relative">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${themesComingSoon ? 'pointer-events-none select-none' : ''}`}>
          {BUILT_IN_THEME_PRESETS.map((preset) => {
            const isLocked = preset.premium && !isPremium;
          const styleLabel =
            preset.style === 'color'
              ? { icon: Paintbrush, text: 'Color Focused' }
              : { icon: LayoutPanelTop, text: 'UI Focused' };
          const StyleIcon = styleLabel.icon;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => undefined}
              disabled={themesComingSoon}
              className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${
                isLocked
                  ? 'border-slate-700 opacity-70'
                  : 'border-slate-700 hover:border-purple-500/50'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-60" />
              <div className="relative">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-white font-semibold text-lg">{preset.name}</div>
                  <span className="bg-slate-700/70 text-slate-300 text-xs px-2 py-1 rounded-full inline-flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Preview
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-3">{preset.description}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-300">
                    <StyleIcon className="h-3.5 w-3.5" />
                    {styleLabel.text}
                  </span>
                  {preset.premium ? (
                    <span className="flex items-center gap-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-semibold">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">Free</span>
                  )}
                </div>
                {isLocked && (
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-yellow-300">
                    <Lock className="h-3.5 w-3.5" />
                    Unlock with Premium
                  </div>
                )}
              </div>
            </button>
          );
        })}
        </div>
        {themesComingSoon && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-950/55 backdrop-blur-[2px]">
            <div className="rounded-xl border border-yellow-500/40 bg-slate-900/95 px-5 py-4 text-center shadow-lg">
              <p className="text-sm font-semibold text-yellow-300">Themes are coming soon</p>
              <p className="mt-1 text-xs text-slate-300">
                Presets are being refined before release.
              </p>
            </div>
          </div>
        )}
      </div>

      {themes.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-300">
            {themes.length} database theme{themes.length === 1 ? '' : 's'} detected. Built-in presets above are currently used for full
            layout control.
          </p>
        </div>
      )}
    </div>
  );
}

