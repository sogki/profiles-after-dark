import { useEffect, useMemo, useState } from 'react';
import { Settings, Sparkles, Palette, Lock, Crown, Eye, User } from 'lucide-react';
import toast from 'react-hot-toast';
import FlairNameText from '@/components/flair/FlairNameText';
import { buildFlairGradientString, parseFlairGradient } from '@/lib/flairName';
import { useAuth } from '@/context/authContext';
import { supabase } from '@/lib/supabase';

interface ProfileTabProps {
  profile: any;
  loading: boolean;
  updateProfile: (updates: any) => Promise<void>;
  isPremium: boolean;
  onNavigateToSubscription: () => void;
  spotlightEnabled: boolean;
  onToggleSpotlight: (enabled: boolean) => Promise<boolean | void>;
}

export default function ProfileTab({ 
  profile, 
  loading, 
  updateProfile, 
  isPremium, 
  onNavigateToSubscription,
  spotlightEnabled,
  onToggleSpotlight
}: ProfileTabProps) {
  const { user } = useAuth();
  const [customName, setCustomName] = useState(profile?.custom_display_name || '');
  const [animation, setAnimation] = useState(profile?.display_name_animation || 'none');
  const [gradientColors, setGradientColors] = useState<string[]>(['#a855f7', '#ec4899']);
  const [colorCount, setColorCount] = useState<2 | 3>(2);
  const [rainbowMode, setRainbowMode] = useState<'standard' | 'custom'>('standard');
  const [userPreview, setUserPreview] = useState<{
    username: string;
    avatar_url: string | null;
    banner_url: string | null;
  } | null>(null);

  useEffect(() => {
    const parsed = parseFlairGradient(profile?.display_name_gradient);
    const nextColors = parsed.colors.length >= 3 ? parsed.colors.slice(0, 3) : parsed.colors.slice(0, 2);
    setGradientColors(nextColors);
    setColorCount(nextColors.length >= 3 ? 3 : 2);
    setRainbowMode(parsed.rainbowMode || 'standard');
    setCustomName(profile?.custom_display_name || '');
    setAnimation(profile?.display_name_animation || 'none');
  }, [profile?.custom_display_name, profile?.display_name_animation, profile?.display_name_gradient]);

  useEffect(() => {
    const fetchUserPreview = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('username, avatar_url, banner_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setUserPreview({
          username: data.username || 'you',
          avatar_url: data.avatar_url || null,
          banner_url: data.banner_url || null,
        });
      }
    };
    fetchUserPreview();
  }, [user?.id]);

  const gradientJson = useMemo(
    () => buildFlairGradientString(gradientColors.slice(0, colorCount), rainbowMode),
    [gradientColors, colorCount, rainbowMode]
  );

  const handleSave = async () => {
    try {
      await updateProfile({
        custom_display_name: customName,
        display_name_animation: animation,
        display_name_gradient: gradientJson,
      });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const animationOptions = [
    { id: 'none', label: 'Static' },
    { id: 'glow', label: 'Glow' },
    { id: 'pulse', label: 'Pulse' },
    { id: 'scroll', label: 'Scroll' },
    { id: 'gradient', label: 'Gradient Shift' },
    { id: 'rainbow', label: 'Rainbow' },
  ] as const;

  const previewName = customName.trim() || userPreview?.username || 'Display Name';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Profile Customisation
        </h2>
        <p className="text-slate-400">Personalize your profile with custom names and premium effects</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 mb-3 text-slate-300">
            <Eye className="h-4 w-4 text-purple-300" />
            Profile Preview (1:1 style)
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
            <div className="relative">
              <div className="h-32 rounded-lg overflow-hidden bg-slate-700">
                {userPreview?.banner_url ? (
                  <img src={userPreview.banner_url} alt="Banner preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-slate-700 via-purple-900/30 to-slate-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              </div>

              <div className="absolute -bottom-10 left-4 h-20 w-20 rounded-full border-4 border-slate-900 bg-slate-700 overflow-hidden shadow-lg">
                {userPreview?.avatar_url ? (
                  <img src={userPreview.avatar_url} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-300" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-12 px-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <FlairNameText
                    name={`@${previewName}`}
                    animation={animation}
                    gradientJson={gradientJson}
                    className="text-xl font-bold"
                  />
                  <p className="text-xs text-slate-400 mt-1">@{userPreview?.username || 'username'}</p>
                </div>
                {isPremium && spotlightEnabled && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-semibold text-yellow-300">
                    <Crown className="h-3 w-3" />
                    Spotlight
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-3 font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Custom Display Name
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            placeholder="Enter your custom display name"
          />
        </div>

        {isPremium ? (
          <>
            <div>
              <label className="block text-slate-300 mb-3 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Display Name Animation
                <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">Premium</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {animationOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAnimation(option.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      animation === option.id
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">{option.label}</div>
                    <FlairNameText
                      name="@Sample"
                      animation={option.id}
                      gradientJson={gradientJson}
                      className="text-sm"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-3 font-medium flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" />
                Gradient Colors
                <span className="ml-auto text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full">Premium</span>
              </label>
              <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setColorCount(2)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      colorCount === 2 ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    2 colors
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorCount(3)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      colorCount === 3 ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    3 colors
                  </button>
                </div>
                <div className={`grid gap-2 ${colorCount === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                  {Array.from({ length: colorCount }).map((_, idx) => (
                    <label
                      key={idx}
                      className="rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-2 flex items-center gap-2.5"
                    >
                      <input
                        type="color"
                        value={gradientColors[idx] || '#a855f7'}
                        onChange={(e) =>
                          setGradientColors((prev) => {
                            const next = [...prev];
                            next[idx] = e.target.value;
                            return next;
                          })
                        }
                        className="h-8 w-10 rounded border border-slate-600 bg-slate-800 p-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-300 leading-tight">
                          {idx === 0 ? 'Main' : idx === 1 ? 'Accent' : 'Secondary'}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-tight truncate uppercase tracking-wide">
                          {gradientColors[idx]}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {animation === 'rainbow' && (
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Rainbow style</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRainbowMode('standard')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          rainbowMode === 'standard' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        Standard RGB
                      </button>
                      <button
                        type="button"
                        onClick={() => setRainbowMode('custom')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          rainbowMode === 'custom' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        Use selected colors
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">Profile Spotlight Placement</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Prioritize your profile in community discovery.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await onToggleSpotlight(!spotlightEnabled);
                      toast.success(!spotlightEnabled ? 'Spotlight enabled' : 'Spotlight disabled');
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to update spotlight');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    spotlightEnabled
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {spotlightEnabled ? 'Enabled' : 'Enable'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  Premium Features Locked
                  <Crown className="w-4 h-4 text-yellow-400" />
                </h3>
                <p className="text-slate-300 text-sm mb-4">
                  Upgrade to Premium to unlock animated names, gradient effects, and exclusive customisation options!
                </p>
                <button
                  onClick={onNavigateToSubscription}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 text-sm"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-lg shadow-purple-500/25"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

