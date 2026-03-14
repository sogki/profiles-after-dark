import { useState } from 'react';
import { Image, Upload, Trash2, Lock, Infinity, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmotesTabProps {
  emotes: any[];
  loading: boolean;
  onUpload: (file: File, name: string, isPublic: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: any) => Promise<void>;
  isPremium: boolean;
  isUploading: boolean;
  onNavigateToSubscription: () => void;
}

export default function EmotesTab({
  emotes,
  loading,
  onUpload,
  onDelete,
  onUpdate,
  isPremium,
  isUploading,
  onNavigateToSubscription,
}: EmotesTabProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [emoteName, setEmoteName] = useState('');
  const [emoteFile, setEmoteFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const handleUpload = async () => {
    if (!emoteFile || !emoteName) {
      toast.error('Please provide a name and file');
      return;
    }

    await onUpload(emoteFile, emoteName, isPublic);
    setShowUpload(false);
    setEmoteName('');
    setEmoteFile(null);
    setIsPublic(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading emotes...</p>
        </div>
      </div>
    );
  }

  const currentCount = emotes.length;
  const canUpload = true;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            My Emotes
          </h2>
          <p className="text-slate-400">Upload and manage your custom emotes</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2">
          <div className="flex items-center gap-2">
            {isPremium ? (
              <Infinity className="w-5 h-5 text-purple-400" />
            ) : (
              <Lock className="w-5 h-5 text-slate-500" />
            )}
            <span className="text-white font-semibold">{currentCount}</span>
            <span className="text-slate-400">/</span>
            <span className={isPremium ? "text-purple-400 font-semibold" : "text-slate-400"}>
              {isPremium ? '∞' : 'Plan quota'}
            </span>
          </div>
        </div>
      </div>

      {!isPremium && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Lock className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">Upgrade for Unlimited Emotes</h3>
              <p className="text-slate-300 text-sm mb-4">
                Premium removes upload caps for emotes and unlocks advanced creator tools.
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
        onClick={() => setShowUpload(!showUpload)}
        disabled={!canUpload}
        className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all ${
          canUpload
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transform hover:scale-[1.02] shadow-lg shadow-purple-500/25'
            : 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        <Upload className="w-5 h-5" />
        {showUpload ? 'Cancel Upload' : 'Upload New Emote'}
      </button>

      {showUpload && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-slate-300 mb-2 font-medium">Emote Name</label>
            <input
              type="text"
              value={emoteName}
              onChange={(e) => setEmoteName(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Enter emote name"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-2 font-medium">Emote File</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEmoteFile(e.target.files?.[0] || null)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />
          </div>
          <label className="flex items-center gap-3 text-slate-300 cursor-pointer group">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500 focus:ring-2"
            />
            <span className="group-hover:text-white transition">Make public (visible in gallery)</span>
            <Globe className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
          </label>
          <button
            onClick={handleUpload}
            disabled={isUploading || !emoteFile || !emoteName}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] disabled:transform-none shadow-lg shadow-green-500/25 disabled:shadow-none"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </span>
            ) : (
              'Upload Emote'
            )}
          </button>
        </div>
      )}

      {emotes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
          <Image className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No Emotes Yet</h3>
          <p className="text-slate-500 mb-6">Upload your first emote to get started!</p>
          {!canUpload && (
            <button
              onClick={onNavigateToSubscription}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
            >
              Upgrade to Upload
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {emotes.map((emote: any) => (
            <div key={emote.id} className="group relative bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
              <div className="aspect-square bg-slate-900/50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                <img src={emote.image_url} alt={emote.name} className="w-full h-full object-contain" />
              </div>
              <div className="text-white font-semibold text-sm mb-2 truncate">{emote.name}</div>
              <div className="flex items-center justify-between">
                {emote.is_public && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Public
                  </span>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Delete ${emote.name}?`)) {
                      onDelete(emote.id);
                    }
                  }}
                  className="ml-auto text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition"
                  title="Delete emote"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

