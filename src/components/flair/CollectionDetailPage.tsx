import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FolderKanban, User } from 'lucide-react';
import JSZip from 'jszip';
import { getPublicCollectionById, incrementCollectionDownload } from '@/hooks/flair/usePublicCollections';
import Footer from '@/components/Footer';
import ReportContentButton from '@/components/shared/ReportContentButton';
import FlairNameText from '@/components/flair/FlairNameText';
import { useDiscoveryFlairNames } from '@/hooks/flair/useDiscoveryFlairNames';

type CollectionContentType = 'profile' | 'banner' | 'emote' | 'wallpaper' | 'profile_pair';

interface CollectionContentItem {
  id: string;
  name: string;
  image_url: string;
  content_type: CollectionContentType;
  pfp_url?: string | null;
  banner_url?: string | null;
}

interface CollectionDetails {
  name: string;
  description?: string | null;
  download_count?: number;
  creator_username?: string;
  user_id?: string;
  emote_ids?: string[];
  content_items?: CollectionContentItem[];
}

const TYPE_META: Record<CollectionContentType, { label: string }> = {
  emote: { label: 'Emotes' },
  wallpaper: { label: 'Wallpapers' },
  profile: { label: 'Profile Pictures' },
  banner: { label: 'Banners' },
  profile_pair: { label: 'Profile Pairs' },
};

export default function CollectionDetailPage() {
  const { collectionId } = useParams();
  const [collection, setCollection] = useState<CollectionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | CollectionContentType>('all');
  const [downloadingCollection, setDownloadingCollection] = useState(false);
  const flairNameMap = useDiscoveryFlairNames(collection?.user_id ? [collection.user_id] : []);

  useEffect(() => {
    const load = async () => {
      if (!collectionId) return;
      setLoading(true);
      const data = await getPublicCollectionById(collectionId);
      setCollection(data);
      if (data) {
        await incrementCollectionDownload(collectionId);
      }
      setLoading(false);
    };

    load();
  }, [collectionId]);

  const contentItems = useMemo(() => collection?.content_items || [], [collection?.content_items]);
  const countsByType = useMemo(() => {
    return contentItems.reduce(
      (acc, item) => {
        acc[item.content_type] += 1;
        return acc;
      },
      { emote: 0, wallpaper: 0, profile: 0, banner: 0, profile_pair: 0 } as Record<CollectionContentType, number>
    );
  }, [contentItems]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return contentItems;
    return contentItems.filter((item) => item.content_type === activeFilter);
  }, [activeFilter, contentItems]);

  const getTypeSingularLabel = (type: CollectionContentType) => {
    switch (type) {
      case 'emote':
        return 'emote';
      case 'wallpaper':
        return 'wallpaper';
      case 'profile':
        return 'profile picture';
      case 'banner':
        return 'banner';
      case 'profile_pair':
        return 'pair';
      default:
        return 'item';
    }
  };

  const getReportContentType = (type: CollectionContentType): 'profile' | 'profile_pair' | 'emote' | 'wallpaper' | 'single_upload' => {
    if (type === 'profile_pair') return 'profile_pair';
    if (type === 'emote') return 'emote';
    if (type === 'wallpaper') return 'wallpaper';
    return 'profile';
  };

  const sanitizeFilename = (value: string) => {
    const noReserved = value.replace(/[<>:"/\\|?*]/g, '');
    const noControl = noReserved
      .split('')
      .filter((char) => char.charCodeAt(0) >= 32)
      .join('');
    return noControl.trim().slice(0, 90) || 'item';
  };

  const getFileExtension = (url: string, fallback: string) => {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
      return match?.[1]?.toLowerCase() || fallback;
    } catch {
      const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      return match?.[1]?.toLowerCase() || fallback;
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  };

  const fetchBlob = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch asset (${response.status})`);
    }
    return response.blob();
  };

  const handleDownloadItem = async (item: CollectionContentItem) => {
    try {
      const baseName = sanitizeFilename(item.name || getTypeSingularLabel(item.content_type));

      if (item.content_type === 'profile_pair') {
        const zip = new JSZip();
        if (item.banner_url) {
          const bannerBlob = await fetchBlob(item.banner_url);
          zip.file(`${baseName}-banner.${getFileExtension(item.banner_url, 'png')}`, bannerBlob);
        }
        if (item.pfp_url) {
          const pfpBlob = await fetchBlob(item.pfp_url);
          zip.file(`${baseName}-pfp.${getFileExtension(item.pfp_url, 'png')}`, pfpBlob);
        }
        if (!item.banner_url && item.image_url) {
          const fallbackBlob = await fetchBlob(item.image_url);
          zip.file(`${baseName}.${getFileExtension(item.image_url, 'png')}`, fallbackBlob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `${baseName}-pair.zip`);
        return;
      }

      const blob = await fetchBlob(item.image_url);
      const extension = getFileExtension(item.image_url, item.content_type === 'emote' ? 'gif' : 'png');
      downloadBlob(blob, `${baseName}.${extension}`);
    } catch (error) {
      console.error('Failed to download item', error);
    }
  };

  const handleDownloadCollection = async () => {
    if (!collection || contentItems.length === 0) return;
    try {
      setDownloadingCollection(true);
      const zip = new JSZip();
      const collectionFolder = zip.folder(sanitizeFilename(collection.name || 'collection'));
      if (!collectionFolder) return;

      for (const item of contentItems) {
        const baseName = sanitizeFilename(item.name || getTypeSingularLabel(item.content_type));
        if (item.content_type === 'profile_pair') {
          if (item.banner_url) {
            const bannerBlob = await fetchBlob(item.banner_url);
            collectionFolder.file(
              `Profile Pairs/${baseName}-banner.${getFileExtension(item.banner_url, 'png')}`,
              bannerBlob
            );
          }
          if (item.pfp_url) {
            const pfpBlob = await fetchBlob(item.pfp_url);
            collectionFolder.file(
              `Profile Pairs/${baseName}-pfp.${getFileExtension(item.pfp_url, 'png')}`,
              pfpBlob
            );
          }
          continue;
        }

        const folderName = TYPE_META[item.content_type].label;
        const blob = await fetchBlob(item.image_url);
        const extension = getFileExtension(item.image_url, item.content_type === 'emote' ? 'gif' : 'png');
        collectionFolder.file(`${folderName}/${baseName}.${extension}`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${sanitizeFilename(collection.name)}-collection.zip`);
    } catch (error) {
      console.error('Failed to download collection zip', error);
    } finally {
      setDownloadingCollection(false);
    }
  };

  const unresolvedCount = Math.max(0, (collection?.emote_ids?.length || 0) - contentItems.length);
  const creatorFlair = collection?.user_id ? flairNameMap[collection.user_id] : null;
  const creatorName = creatorFlair?.isPremium
    ? `@${creatorFlair.customDisplayName || collection?.creator_username || 'unknown'}`
    : `@${collection?.creator_username || 'unknown'}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <div className="flex-1 px-4 py-10 text-slate-300">Loading collection...</div>
        <Footer />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <div className="flex-1 px-4 py-10">
          <p className="text-slate-300">Collection not found or not public.</p>
          <Link to="/collections" className="mt-4 inline-flex text-purple-300 hover:text-purple-200">
            Back to collections
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-7xl space-y-5">
          <Link to="/collections" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to collections
          </Link>

          <section className="surface-elevated p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{collection.name}</h1>
                {collection.description && <p className="mt-2 text-slate-300">{collection.description}</p>}
              </div>
              {collection.creator_username && (
                <Link
                  to={`/user/${collection.creator_username}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/70 hover:text-white transition-colors"
                >
                  <span className="text-slate-400">More by</span>
                  <User className="h-4 w-4" />
                  {creatorFlair?.isPremium ? (
                    <FlairNameText
                      name={creatorName}
                      animation={creatorFlair.animation}
                      gradientJson={creatorFlair.gradient}
                      className="text-sm font-semibold"
                    />
                  ) : (
                    <span>{creatorName}</span>
                  )}
                </Link>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Download className="h-4 w-4" />
                {collection.download_count || 0} downloads
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="h-4 w-4" />
                {creatorFlair?.isPremium ? (
                  <FlairNameText
                    name={creatorName}
                    animation={creatorFlair.animation}
                    gradientJson={creatorFlair.gradient}
                    className="text-sm"
                  />
                ) : (
                  <span>{creatorName}</span>
                )}
              </span>
              <span className="inline-flex items-center gap-1">
                <FolderKanban className="h-4 w-4" />
                {contentItems.length} items
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadCollection}
                disabled={downloadingCollection || contentItems.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-purple-700 hover:to-blue-700 disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloadingCollection ? 'Building zip...' : 'Download Collection'}
              </button>
            </div>
          </section>

          <section className="surface-elevated p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === 'all'
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                All ({contentItems.length})
              </button>
              {(Object.keys(TYPE_META) as CollectionContentType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveFilter(type)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    activeFilter === type
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {TYPE_META[type].label} ({countsByType[type]})
                </button>
              ))}
            </div>
            {unresolvedCount > 0 && (
              <p className="mt-3 text-xs text-amber-300/90">
                {unresolvedCount} item{unresolvedCount === 1 ? '' : 's'} from this collection cannot be displayed (removed or unavailable).
              </p>
            )}
          </section>

          {filteredItems.length === 0 ? (
            <section className="surface-elevated p-10 text-center">
              <p className="text-slate-300">No items found in this section.</p>
            </section>
          ) : (
            <section className="columns-2 gap-4 md:columns-3 lg:columns-4">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="group mb-4 break-inside-avoid bg-slate-800/75 rounded-xl overflow-hidden hover:bg-slate-800/90 transition-colors border border-slate-700/50 hover:border-slate-600 shadow-md"
                >
                  {item.content_type === 'profile_pair' ? (
                    <div className="relative h-40 overflow-hidden bg-slate-900">
                      <img
                        src={item.banner_url || item.image_url}
                        alt={`${item.name} banner`}
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      {item.pfp_url && (
                        <img
                          src={item.pfp_url}
                          alt={`${item.name} profile`}
                          className="absolute bottom-2 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full border-2 border-slate-900 object-cover shadow-lg"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDownloadItem(item);
                                }}
                                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download className="h-4 w-4 text-white" />
                              </button>
                              <ReportContentButton
                                contentId={item.id}
                                contentType={getReportContentType(item.content_type)}
                                contentUrl={item.banner_url || item.image_url}
                                reportedUserId={collection.user_id}
                                reportedUsername={collection.creator_username}
                                variant="icon"
                                showOnHover={false}
                                className="z-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`relative overflow-hidden bg-slate-900 ${item.content_type === 'banner' || item.content_type === 'wallpaper' ? 'aspect-video' : 'aspect-square'}`}>
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDownloadItem(item);
                                }}
                                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download className="h-4 w-4 text-white" />
                              </button>
                              <ReportContentButton
                                contentId={item.id}
                                contentType={getReportContentType(item.content_type)}
                                contentUrl={item.image_url}
                                reportedUserId={collection.user_id}
                                reportedUsername={collection.creator_username}
                                variant="icon"
                                showOnHover={false}
                                className="z-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-400">{TYPE_META[item.content_type].label}</p>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
