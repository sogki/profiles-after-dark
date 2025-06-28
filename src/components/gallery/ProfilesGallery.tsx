import React, {
  useState,
  useEffect,
  useMemo,
  Fragment,
  useCallback,
} from "react";
import { Download, Heart, Eye } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../../context/authContext";
import { supabase } from "../../lib/supabase";

interface ProfilePair {
  id: string;
  title: string;
  // category removed
  tags?: string[];
  pfp_url: string;
  banner_url: string;
  updated_at?: string;
}

const FAVORITES_STORAGE_KEY = "profile_favorites";

export default function ProfilesGallery() {
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<ProfilePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  // selectedCategory state removed

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [previewProfile, setPreviewProfile] = useState<ProfilePair | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`${FAVORITES_STORAGE_KEY}_${user.id}`);
      if (saved) {
        try {
          const favArray: string[] = JSON.parse(saved);
          setFavorites(new Set(favArray));
        } catch {
          setFavorites(new Set());
        }
      }
    } else {
      setFavorites(new Set());
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(
        `${FAVORITES_STORAGE_KEY}_${user.id}`,
        JSON.stringify(Array.from(favorites))
      );
    }
  }, [favorites, user]);

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("profile_pairs")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) {
          setError("Failed to fetch profiles");
          setLoading(false);
          return;
        }

        const profilesData: ProfilePair[] = data.map((item) => {
          let tags: string[] = [];
          try {
            if (Array.isArray(item.tags)) {
              tags = item.tags;
            } else if (item.tags) {
              if (item.tags.includes("[")) {
                tags = JSON.parse(item.tags);
              } else {
                tags = item.tags.split(",").map((t: string) => t.trim());
              }
            }
          } catch (e) {
            console.error("Error parsing tags for item", item.id, e);
          }
          return {
            id: item.id,
            title: item.title,
            // category removed
            tags,
            pfp_url: item.pfp_url,
            banner_url: item.banner_url,
            updated_at: item.updated_at,
          };
        });

        setProfiles(profilesData);
      } catch (err) {
        setError("Unexpected error loading profiles");
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    profiles.forEach((p) => p.tags?.forEach((tag) => tagsSet.add(tag)));
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [profiles]);

  // allCategories useMemo removed

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        searchQuery === "" ||
        profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTags =
        selectedTags.size === 0 ||
        profile.tags?.some((tag) => selectedTags.has(tag));

      // matchesCategory removed, always true now
      return matchesSearch && matchesTags;
    });
  }, [profiles, searchQuery, selectedTags]);

  const pagedProfiles = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProfiles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProfiles, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedTags]);

  async function downloadImage(url: string, filename: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("Failed to download image.");
    }
  }

  const handleDownloadBoth = useCallback(async (profile: ProfilePair) => {
    if (profile.pfp_url) {
      const extPfp =
        profile.pfp_url.split(".").pop()?.split(/[#?]/)[0] || "png";
      const sanitizedTitle = profile.title.replace(/\s+/g, "_").toLowerCase();
      const pfpFilename = `pfp_${sanitizedTitle}.${extPfp}`;
      await downloadImage(profile.pfp_url, pfpFilename);
    }
    if (profile.banner_url) {
      const extBanner =
        profile.banner_url.split(".").pop()?.split(/[#?]/)[0] || "png";
      const sanitizedTitle = profile.title.replace(/\s+/g, "_").toLowerCase();
      const bannerFilename = `banner_${sanitizedTitle}.${extBanner}`;
      await downloadImage(profile.banner_url, bannerFilename);
    }
  }, []);

  const handleFavorite = (profileId: string) => {
    if (!user) return;

    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(profileId)) {
        newFavorites.delete(profileId);
      } else {
        newFavorites.add(profileId);
      }
      return newFavorites;
    });
  };

  const openPreview = (profile: ProfilePair) => {
    setPreviewProfile(profile);
    setIsModalOpen(true);
  };
  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewProfile(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-white text-3xl font-bold mb-6">
        Profiles Gallery
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 items-center">
        <input
          type="text"
          placeholder="Search titles or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-grow min-w-[200px]"
          aria-label="Search profiles"
        />

        {/* Category filter removed */}
      </div>

      {/* Profiles grid using gallery.tsx card style */}
      {loading ? (
        <p className="text-center text-white mt-10">Loading profiles...</p>
      ) : error ? (
        <p className="text-center text-red-500 mt-10">{error}</p>
      ) : filteredProfiles.length === 0 ? (
        <p className="text-white text-center">No profiles found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pagedProfiles.map((profile) => (
              <div
                key={profile.id}
                className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
                style={{ minHeight: "280px" }}
              >
                {profile.banner_url ? (
                  <img
                    src={profile.banner_url}
                    alt={`${profile.title} banner`}
                    className="w-full h-40 object-cover brightness-75 group-hover:brightness-90 transition"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-700 flex items-center justify-center text-gray-400">
                    No Banner
                  </div>
                )}

                {profile.pfp_url && (
                  <img
                    src={profile.pfp_url}
                    alt={`${profile.title} profile`}
                    className="w-24 h-24 rounded-full border-4 border-purple-500 absolute top-28 left-1/2 transform -translate-x-1/2 border-solid bg-slate-900"
                    loading="lazy"
                  />
                )}

                <div className="pt-36 pb-6 px-6 text-center">
                  <h3 className="text-white font-semibold text-xl truncate">
                    {profile.title}
                  </h3>
                  {/* Category display removed */}
                  <div className="flex flex-wrap justify-center gap-1 mb-4 max-h-16 overflow-auto px-2">
                    {(profile.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="bg-purple-700 text-purple-100 text-xs px-2 py-0.5 rounded-full select-none whitespace-nowrap"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-center gap-5">
                    <button
                      onClick={() => openPreview(profile)}
                      className="text-white hover:text-purple-400 transition focus:outline-none focus:ring-2 focus:ring-purple-400 rounded p-1"
                      aria-label={`Preview ${profile.title}`}
                      type="button"
                    >
                      <Eye size={20} />
                    </button>

                    <button
                      onClick={() => handleDownloadBoth(profile)}
                      className="text-white hover:text-purple-400 transition focus:outline-none focus:ring-2 focus:ring-purple-400 rounded p-1"
                      aria-label={`Download both images of ${profile.title}`}
                      type="button"
                    >
                      <Download size={20} />
                    </button>

                    {user && (
                      <button
                        onClick={() => handleFavorite(profile.id)}
                        className={`text-white hover:text-pink-500 transition focus:outline-none focus:ring-2 focus:ring-pink-500 rounded p-1`}
                        aria-pressed={favorites.has(profile.id)}
                        aria-label={
                          favorites.has(profile.id)
                            ? `Remove ${profile.title} from favorites`
                            : `Add ${profile.title} to favorites`
                        }
                        type="button"
                      >
                        <Heart
                          size={20}
                          fill={
                            favorites.has(profile.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredProfiles.length > ITEMS_PER_PAGE && (
            <div className="flex justify-center mt-8 gap-4">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-md bg-slate-700 text-white disabled:opacity-50"
                aria-label="Previous page"
                type="button"
              >
                Previous
              </button>
              <span className="text-white flex items-center">
                Page {page} of{" "}
                {Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)}
              </span>
              <button
                onClick={() =>
                  setPage((p) =>
                    Math.min(
                      p + 1,
                      Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)
                    )
                  )
                }
                disabled={
                  page === Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)
                }
                className="px-4 py-2 rounded-md bg-slate-700 text-white disabled:opacity-50"
                aria-label="Next page"
                type="button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal (gallery.tsx style) */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={closePreview}
        >
          <div className="min-h-screen px-4 text-center bg-black bg-opacity-80">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="inline-block w-full max-w-3xl my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-xl rounded-2xl">
                <div className="relative">
                  {previewProfile?.banner_url && (
                    <img
                      src={previewProfile.banner_url}
                      alt={`${previewProfile.title} banner`}
                      className="w-full h-48 object-cover brightness-75"
                      loading="lazy"
                    />
                  )}

                  {previewProfile?.pfp_url && (
                    <img
                      src={previewProfile.pfp_url}
                      alt={`${previewProfile.title} profile`}
                      className="w-32 h-32 rounded-full border-4 border-purple-500 absolute top-28 left-1/2 transform -translate-x-1/2 bg-slate-900"
                      loading="lazy"
                    />
                  )}
                </div>

                <div className="pt-20 pb-8 px-6 text-center">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-white mb-4 truncate"
                  >
                    {previewProfile?.title}
                  </Dialog.Title>

                  <div className="flex flex-wrap justify-center gap-2 mb-6 max-h-20 overflow-auto px-2">
                    {(previewProfile?.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="bg-purple-700 text-purple-100 text-xs px-3 py-1 rounded-full select-none whitespace-nowrap"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-center gap-6">
                    <button
                      onClick={() =>
                        previewProfile && handleDownloadBoth(previewProfile)
                      }
                      className="inline-flex justify-center px-6 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      type="button"
                    >
                      Download Both
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-6 py-2 text-sm font-semibold text-purple-600 bg-transparent border border-purple-600 rounded-md hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onClick={closePreview}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
