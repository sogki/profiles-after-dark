import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Download, FolderKanban, Search, Sparkles, User } from 'lucide-react';
import { usePublicCollections } from '@/hooks/flair/usePublicCollections';
import { useDiscoveryFlairNames } from '@/hooks/flair/useDiscoveryFlairNames';
import FlairNameText from '@/components/flair/FlairNameText';
import Footer from '@/components/Footer';

type CollectionFilterType = 'all' | 'emote' | 'wallpaper' | 'profile' | 'banner' | 'profile_pair';

const FILTER_LABELS: Record<CollectionFilterType, string> = {
  all: 'All',
  emote: 'Emotes',
  wallpaper: 'Wallpapers',
  profile: 'Profile Pictures',
  banner: 'Banners',
  profile_pair: 'Profile Pairs',
};

export default function CollectionsPage() {
  const { collections, loading } = usePublicCollections();
  const flairNameMap = useDiscoveryFlairNames(collections.map((collection) => collection.user_id));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CollectionFilterType>('all');
  const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'items'>('trending');

  const getPreviewImage = (item: { content_type: string; banner_url?: string | null; image_url: string }) => {
    if (item.content_type === 'profile_pair') {
      return item.banner_url || item.image_url;
    }
    return item.image_url;
  };

  const filterCounts = useMemo(() => {
    return collections.reduce(
      (acc, collection) => {
        acc.all += 1;
        if ((collection.content_type_counts.emote || 0) > 0) acc.emote += 1;
        if ((collection.content_type_counts.wallpaper || 0) > 0) acc.wallpaper += 1;
        if ((collection.content_type_counts.profile || 0) > 0) acc.profile += 1;
        if ((collection.content_type_counts.banner || 0) > 0) acc.banner += 1;
        if ((collection.content_type_counts.profile_pair || 0) > 0) acc.profile_pair += 1;
        return acc;
      },
      { all: 0, emote: 0, wallpaper: 0, profile: 0, banner: 0, profile_pair: 0 } as Record<CollectionFilterType, number>
    );
  }, [collections]);

  const filteredCollections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = collections.filter((collection) => {
      const matchesType =
        selectedType === 'all' ? true : (collection.content_type_counts[selectedType] || 0) > 0;

      const matchesSearch =
        query.length === 0
          ? true
          : collection.name.toLowerCase().includes(query) ||
            (collection.description || '').toLowerCase().includes(query) ||
            (collection.creator_username || '').toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });

    if (sortBy === 'newest') {
      return [...filtered].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    if (sortBy === 'items') {
      return [...filtered].sort((a, b) => (b.total_items || 0) - (a.total_items || 0));
    }
    return [...filtered].sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
  }, [collections, searchQuery, selectedType, sortBy]);

  const renderCreatorName = (collection: (typeof collections)[number]) => {
    const flairData = flairNameMap[collection.user_id];
    const fallback = collection.creator_username || 'unknown';
    if (flairData?.isPremium) {
      return (
        <FlairNameText
          name={flairData.customDisplayName || fallback}
          animation={flairData.animation}
          gradientJson={flairData.gradient}
          className="text-xs font-semibold"
        />
      );
    }
    return <span>{fallback}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <section className="surface-elevated p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-200">
                  <Compass className="h-3.5 w-3.5" />
                  Discovery
                </p>
                <h1 className="mt-3 text-3xl font-bold text-white">Collections</h1>
                <p className="mt-1 text-sm text-slate-300">
                  Browse curated community collections and open a pack to preview included content.
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-300" />
                  {collections.length} public {collections.length === 1 ? 'collection' : 'collections'}
                </span>
              </div>
            </div>
          </section>

          <section className="surface-elevated p-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search collection names, creators, descriptions..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-700/60 text-white placeholder-slate-400 border border-slate-600/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors duration-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <p className="mb-2 text-sm font-medium text-slate-300">Content Type</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FILTER_LABELS) as CollectionFilterType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        selectedType === type
                          ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white'
                      }`}
                    >
                      {FILTER_LABELS[type]} ({filterCounts[type]})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-300">Sort</p>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as 'trending' | 'newest' | 'items')}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                >
                  <option value="trending">Trending (downloads)</option>
                  <option value="newest">Recently updated</option>
                  <option value="items">Most items</option>
                </select>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="surface-elevated p-6 text-slate-300">Loading collections...</div>
          ) : filteredCollections.length === 0 ? (
            <div className="surface-elevated border-dashed p-10 text-center">
              <FolderKanban className="mx-auto mb-3 h-10 w-10 text-slate-500" />
              <p className="text-slate-300">
                {collections.length === 0 ? 'No public collections yet.' : 'No collections match your current filters.'}
              </p>
            </div>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCollections.map((collection) => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.id}`}
                  className="group rounded-2xl overflow-hidden bg-slate-800/75 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/90 transition-all duration-200 shadow-md"
                >
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-white truncate">{collection.name}</h2>
                    {collection.description && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{collection.description}</p>}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>{collection.total_items || 0} items</span>
                      <span className="inline-flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        {collection.download_count || 0}
                      </span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-300">
                      {collection.creator_avatar_url ? (
                        <img src={collection.creator_avatar_url} alt={collection.creator_username} className="h-5 w-5 rounded-full" />
                      ) : (
                        <User className="h-4 w-4 text-slate-500" />
                      )}
                      <span>{renderCreatorName(collection)}</span>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-5 gap-1.5">
                      {collection.preview_items.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="relative h-14 overflow-hidden rounded-md border border-slate-700/70 bg-slate-900"
                        >
                          <img
                            src={getPreviewImage(item)}
                            alt={item.name}
                            className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                          {item.content_type === 'profile_pair' && item.pfp_url && (
                            <img
                              src={item.pfp_url}
                              alt={`${item.name} avatar`}
                              className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border border-slate-900 object-cover"
                            />
                          )}
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 5 - collection.preview_items.length) }).map((_, i) => (
                        <div
                          key={`empty-${collection.id}-${i}`}
                          className="h-14 rounded-md border border-dashed border-slate-700 bg-slate-900/60"
                        />
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
