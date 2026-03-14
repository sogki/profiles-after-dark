import { Globe, Lock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface FlairEmoteOption {
  id: string;
  name: string;
  image_url: string;
  content_type?: string;
}

interface CollectionUploadFormState {
  name: string;
  description: string;
  is_public: boolean;
  emote_ids: string[];
}

interface CollectionUploadFormProps {
  form: CollectionUploadFormState;
  items: FlairEmoteOption[];
  onFormChange: (updates: Partial<CollectionUploadFormState>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export default function CollectionUploadForm({
  form,
  items,
  onFormChange,
  onSubmit,
  isSubmitting,
}: CollectionUploadFormProps) {
  const [activeTab, setActiveTab] = useState<'emote' | 'wallpaper' | 'profile' | 'banner' | 'profile_pair'>('emote');

  const toggleEmote = (emoteId: string) => {
    const selected = form.emote_ids.includes(emoteId)
      ? form.emote_ids.filter((id) => id !== emoteId)
      : [...form.emote_ids, emoteId];
    onFormChange({ emote_ids: selected });
  };

  const formatContentTypeLabel = (type?: string) => {
    if (!type) return '';
    if (type === 'profile_pair') return 'profile pair';
    if (type === 'profile') return 'profile picture';
    return type;
  };

  const groupedItems = useMemo(
    () => ({
      emote: items.filter((item) => item.content_type === 'emote'),
      wallpaper: items.filter((item) => item.content_type === 'wallpaper'),
      profile: items.filter((item) => item.content_type === 'profile'),
      banner: items.filter((item) => item.content_type === 'banner'),
      profile_pair: items.filter((item) => item.content_type === 'profile_pair'),
    }),
    [items]
  );

  const tabItems = useMemo(
    () => [
      { id: 'emote' as const, label: 'Emotes', count: groupedItems.emote.length },
      { id: 'wallpaper' as const, label: 'Wallpapers', count: groupedItems.wallpaper.length },
      { id: 'profile' as const, label: 'Profile Pictures', count: groupedItems.profile.length },
      { id: 'banner' as const, label: 'Banners', count: groupedItems.banner.length },
      { id: 'profile_pair' as const, label: 'Profile Pairs', count: groupedItems.profile_pair.length },
    ],
    [groupedItems]
  );

  const visibleItems = groupedItems[activeTab];

  useEffect(() => {
    if (visibleItems.length > 0) return;
    const nextTab = tabItems.find((tab) => tab.count > 0)?.id;
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [activeTab, tabItems, visibleItems.length]);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-white mb-1">Create Collection</h3>
        <p className="text-sm text-slate-400">Bundle your uploads into a single collection.</p>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1.5">Collection Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onFormChange({ name: e.target.value })}
          placeholder="My Best Set"
          className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          placeholder="Optional description..."
          className="w-full h-24 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={form.is_public}
          onChange={(e) => onFormChange({ is_public: e.target.checked })}
          className="h-4 w-4 rounded border-slate-600 bg-slate-800"
        />
        {form.is_public ? (
          <span className="inline-flex items-center gap-1">
            <Globe className="h-4 w-4 text-green-400" /> Public collection
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Lock className="h-4 w-4 text-slate-400" /> Private collection
          </span>
        )}
      </label>

      <div>
        <p className="text-sm text-slate-300 mb-2">Select Content</p>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
            You do not have uploaded content yet. Upload some content first.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {visibleItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-5 text-sm text-slate-400">
                No uploads in this section yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {visibleItems.map((item) => {
                  const selected = form.emote_ids.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleEmote(item.id)}
                      className={`rounded-lg border p-2 transition ${
                        selected
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <img src={item.image_url} alt={item.name} className="h-12 w-full object-contain mb-1" />
                      <p className="text-xs text-slate-200 truncate">{item.name}</p>
                      {item.content_type && (
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
                          {formatContentTypeLabel(item.content_type)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || items.length === 0}
        className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-white font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-60"
      >
        {isSubmitting ? 'Creating collection...' : 'Create Collection'}
      </button>
    </form>
  );
}
