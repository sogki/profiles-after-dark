import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { FolderKanban, Globe, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CollectionUploadForm from '@/components/upload/CollectionUploadForm';
import { useAuth } from '@/context/authContext';
import { getUserCollectionContentOptions, type CollectionContentItem } from '@/lib/collectionContent';

interface EmoteSetsTabProps {
  collections: any[];
  loading: boolean;
  emotes: any[];
  onCreate: (set: any) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  isPremium: boolean;
}

const FREE_COLLECTION_LIMIT = 3;

export default function EmoteSetsTab({ 
  collections,
  loading, 
  emotes: _emotes, 
  onCreate, 
  onDelete, 
  isPremium 
}: EmoteSetsTabProps) {
  const { user } = useAuth();
  const [collectionForm, setCollectionForm] = useState({
    name: '',
    description: '',
    is_public: true,
    emote_ids: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [collectionOptions, setCollectionOptions] = useState<CollectionContentItem[]>([]);
  const [isLoadingCollectionOptions, setIsLoadingCollectionOptions] = useState(true);
  const freeCollectionsRemaining = Math.max(FREE_COLLECTION_LIMIT - collections.length, 0);
  const reachedFreeCollectionLimit = !isPremium && collections.length >= FREE_COLLECTION_LIMIT;

  const contentLookup = useMemo(() => {
    const map = new Map<string, any>();
    collectionOptions.forEach((item) => map.set(item.id, item));
    return map;
  }, [collectionOptions]);

  useEffect(() => {
    let isMounted = true;

    const fetchCollectionOptions = async () => {
      if (!user?.id) {
        if (isMounted) {
          setCollectionOptions([]);
          setIsLoadingCollectionOptions(false);
        }
        return;
      }

      try {
        setIsLoadingCollectionOptions(true);
        const options = await getUserCollectionContentOptions(user.id);
        if (isMounted) {
          setCollectionOptions(options);
        }
      } catch (error) {
        console.error('Failed to fetch collection content options:', error);
        if (isMounted) {
          setCollectionOptions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCollectionOptions(false);
        }
      }
    };

    fetchCollectionOptions();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleCreateCollection = async (e: FormEvent) => {
    e.preventDefault();

    if (reachedFreeCollectionLimit) {
      toast.error('Free plan limit reached. Upgrade to Premium for more collections.');
      return;
    }

    if (!collectionForm.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    if (collectionForm.emote_ids.length === 0) {
      toast.error('Select at least one emote');
      return;
    }

    try {
      setIsSaving(true);
      await onCreate({
        name: collectionForm.name.trim(),
        description: collectionForm.description.trim(),
        emote_ids: collectionForm.emote_ids,
        is_public: collectionForm.is_public,
      });
      setCollectionForm({
        name: '',
        description: '',
        is_public: true,
        emote_ids: [],
      });
      toast.success('Collection created');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create collection');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading emote sets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Advanced Emote Collections
        </h2>
        <p className="text-slate-400">Build reusable emote collections for fast profile styling.</p>
      </div>

      {!isPremium && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          <p>
            Free plan includes up to {FREE_COLLECTION_LIMIT} collections. You have{' '}
            {freeCollectionsRemaining} free slot{freeCollectionsRemaining === 1 ? '' : 's'} remaining.
          </p>
          <p className="mt-1 text-yellow-100/90">
            Need more than {FREE_COLLECTION_LIMIT}? Upgrade to Premium for additional collections.
          </p>
        </div>
      )}

      {!reachedFreeCollectionLimit && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-5 space-y-4">
          {isLoadingCollectionOptions && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs text-slate-400">
              Loading your uploaded content...
            </div>
          )}
          <CollectionUploadForm
            form={collectionForm}
            items={collectionOptions}
            onFormChange={(updates) => setCollectionForm((prev) => ({ ...prev, ...updates }))}
            onSubmit={handleCreateCollection}
            isSubmitting={isSaving}
          />
        </div>
      )}
      {reachedFreeCollectionLimit && (
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-600/15 to-pink-600/15 p-5">
          <h3 className="text-white font-semibold">Collection limit reached</h3>
          <p className="mt-2 text-sm text-slate-300">
            You have used all {FREE_COLLECTION_LIMIT} free collection slots. Upgrade to Premium to create more.
          </p>
          <a
            href="/flair"
            className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Upgrade to Premium
          </a>
        </div>
      )}

      <div className="space-y-3">
        <a
          href="/collections"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/70"
        >
          <Globe className="h-4 w-4" />
          Browse public collections
        </a>
        {collections.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No collections yet.</p>
          </div>
        ) : (
          collections.map((collection) => (
            <div key={collection.id} className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-white font-semibold">{collection.name}</h4>
                  {collection.description && <p className="text-sm text-slate-400 mt-1">{collection.description}</p>}
                  <p className="text-xs text-slate-500 mt-2">
                    {Array.isArray(collection.emote_ids) ? collection.emote_ids.length : 0} items
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {collection.is_public ? 'Public' : 'Private'} · {collection.download_count || 0} downloads
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${collection.name}"?`)) return;
                    try {
                      await onDelete(collection.id);
                      toast.success('Collection deleted');
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to delete collection');
                    }
                  }}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"
                  title="Delete collection"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(collection.emote_ids || []).slice(0, 8).map((emoteId: string) => {
                  const content = contentLookup.get(emoteId);
                  if (!content) return null;
                  return (
                    <div key={emoteId} className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
                      {content.name}
                    </div>
                  );
                })}
                {(collection.emote_ids || []).length > 8 && (
                  <span className="text-xs text-slate-500">+{collection.emote_ids.length - 8} more</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

