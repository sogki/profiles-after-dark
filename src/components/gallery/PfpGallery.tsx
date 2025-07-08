import { Dialog, Transition } from "@headlessui/react";
import { Clock, Download, Search } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/authContext";
import { supabase } from "../../lib/supabase";
import Footer from "../Footer";
import SearchFilter from "../search-filter";
import GalleryItemView from "./grid-list-individual-view";
import { Profile } from "@/types";
import PaginationOld from "../pagination-old";

const FAVORITES_STORAGE_KEY = "pfp_favorites";

// Skeleton Loading Component
const PfpCardSkeleton = () => (
  <div className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse">
    <div className="aspect-square bg-gray-700" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-700 rounded w-3/4" />
      <div className="flex justify-center gap-2">
        <div className="h-4 bg-gray-700 rounded w-12" />
        <div className="h-4 bg-gray-700 rounded w-16" />
      </div>
      <div className="flex justify-center gap-3 pt-2">
        <div className="h-8 w-8 bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-700 rounded" />
      </div>
    </div>
  </div>
);

export default function PfpGallery() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedColor, setSelectedColor] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [previewProfile, setPreviewProfile] = useState<Profile | null>(null);
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
          .from("profiles")
          .select("*")
          .eq("type", "profile")
          .order("updated_at", { ascending: false });

        if (error) {
          setError("Failed to fetch profile pictures");
          setLoading(false);
          return;
        }

        const profilesData: Profile[] = (data || []).map((item) => ({
          id: item.id,
          user_id: item.user_id,
          title: item.title || "Untitled PFP",
          category: item.category || "General",
          type: item.type || "profile",
          image_url: item.image_url || "",
          download_count: item.download_count || 0,
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item?.created_at ?? "",
          updated_at: item?.updated_at ?? "",
          // TODO: implement colors
          // color: item.color || undefined,
        }));

        setProfiles(profilesData);
      } catch {
        setError("Unexpected error loading profile pictures");
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, []);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    profiles.forEach((p) =>
      p.tags?.forEach((tag) => tagsSet.add(tag.toLowerCase().trim()))
    );
    return Array.from(tagsSet)
      .filter((tag) => tag.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [profiles]);

  const allColors = useMemo(() => {
    const colorsSet = new Set<string>();
    profiles.forEach((p) => {
      if (p.color) colorsSet.add(p.color);
    });
    return Array.from(colorsSet).sort();
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        searchQuery === "" ||
        profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTags =
        selectedTags.size === 0 ||
        profile.tags?.some((tag) => selectedTags.has(tag.toLowerCase().trim()));

      const matchesColor =
        selectedColor === "all" || profile.color === selectedColor;

      return matchesSearch && matchesTags && matchesColor;
    });
  }, [profiles, searchQuery, selectedTags, selectedColor]);

  const pagedProfiles = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredProfiles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProfiles, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedTags, selectedColor]);

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

  const handleDownload = useCallback(async (profile: Profile) => {
    if (profile.image_url) {
      const ext = profile.image_url.split(".").pop()?.split(/[#?]/)[0] || "png";
      const sanitizedTitle = profile.title.replace(/\s+/g, "_").toLowerCase();
      const filename = `pfp_${sanitizedTitle}.${ext}`;
      await downloadImage(profile.image_url, filename);

      // Update download count in database
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ download_count: profile.download_count + 1 })
          .eq("id", profile.id);

        if (!error) {
          // Update local state
          setProfiles((prev) =>
            prev.map((p) =>
              p.id === profile.id
                ? { ...p, download_count: p.download_count + 1 }
                : p
            )
          );
        }
      } catch (error) {
        console.error("Failed to update download count:", error);
      }
    }
  }, []);

  const handleFavorite = async (profileId: string) => {
    if (!user) return;

    const isCurrentlyFavorited = favorites.has(profileId);

    // Update local state immediately for better UX
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(profileId)) {
        newFavorites.delete(profileId);
      } else {
        newFavorites.add(profileId);
      }
      return newFavorites;
    });

    try {
      if (isCurrentlyFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("profile_id", profileId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert([
          {
            user_id: user.id,
            profile_id: profileId,
          },
        ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Failed to update favorites:", error);
      // Revert local state on error
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (isCurrentlyFavorited) {
          newFavorites.add(profileId);
        } else {
          newFavorites.delete(profileId);
        }
        return newFavorites;
      });
    }
  };

  const openPreview = (profile: Profile) => {
    setPreviewProfile(profile);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewProfile(null);
  };

  const toggleTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    setSelectedTags((prev) => {
      const newTags = new Set(prev);
      if (newTags.has(normalizedTag)) {
        newTags.delete(normalizedTag);
      } else {
        newTags.add(normalizedTag);
      }
      return newTags;
    });
  };

  return (
    <>
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        data-gallery
      >
        {/* Enhanced Header */}
        <div className="mb-8">
          <h2 className="text-white text-4xl font-bold mb-2">
            Profile Pictures Gallery
          </h2>
          <p className="text-gray-400 text-lg">
            Discover and download amazing profile pictures •{" "}
            {filteredProfiles.length} items available
          </p>
        </div>

        <SearchFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          viewMode={viewMode}
          placeholder="Search Profile Pictures..."
          toggleTag={toggleTag}
          totalAmount={profiles?.length ?? 0}
          setViewMode={setViewMode}
          allTags={allTags}
          allColors={allColors}
          filteredAmount={filteredProfiles?.length ?? 0}
        />

        {/* Profiles grid/list */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <PfpCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-400 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-800 rounded-lg p-8 max-w-md mx-auto">
              <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">
                No profile pictures found
              </h3>
              <p className="text-gray-400 mb-4">
                Try adjusting your search or filter criteria
              </p>
              {(searchQuery ||
                selectedTags.size > 0 ||
                selectedColor !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTags(new Set());
                    setSelectedColor("all");
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {pagedProfiles.map((profile) => (
                <GalleryItemView
                  key={profile.id}
                  item={{
                    id: profile.id,
                    title: profile.title,
                    image_url: profile.image_url,
                    download_count: profile.download_count || 0,
                    category: profile?.category,
                    tags: profile.tags || [],
                    created_at: profile.created_at,
                    updated_at: profile.updated_at,
                    type: "pfp",
                    banner_url: profile?.image_url,
                    favorites,
                    user,
                  }}
                  rawData={profile}
                  handleFavorite={handleFavorite}
                  openPreview={openPreview}
                  handleDownloadBoth={handleDownload}
                  viewMode={viewMode}
                />
              ))}
            </div>

            <PaginationOld
              currentPage={page}
              totalPages={filteredProfiles.length}
              itemsPerPage={ITEMS_PER_PAGE}
              setPage={setPage}
            />
          </>
        )}

        {/* Enhanced Preview Modal */}
        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={closePreview}
          >
            <div className="min-h-screen px-4 text-center bg-black bg-opacity-80 backdrop-blur-sm">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="inline-block w-full max-w-4xl my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl border border-slate-700">
                  <div className="relative">
                    {previewProfile && (
                      <img
                        src={previewProfile.image_url || "/placeholder.svg"}
                        alt={previewProfile.title}
                        className="w-full h-96 object-contain bg-slate-800"
                        loading="lazy"
                      />
                    )}

                    {/* Close Button */}
                    <button
                      onClick={closePreview}
                      className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="p-8">
                    <Dialog.Title
                      as="h3"
                      className="text-3xl font-bold leading-12 text-white mb-5"
                    >
                      {previewProfile?.title}
                    </Dialog.Title>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                      <div className="flex items-center gap-1">
                        <span className="text-purple-300 font-medium">
                          {previewProfile?.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{previewProfile?.download_count} downloads</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          Updated{" "}
                          {new Date(
                            previewProfile?.updated_at || ""
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-6 max-h-20 overflow-auto px-2">
                      {(previewProfile?.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="bg-purple-700/30 text-purple-200 text-sm px-3 py-1 rounded-full select-none whitespace-nowrap border border-purple-600/30"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-center gap-6">
                      <button
                        onClick={() =>
                          previewProfile && handleDownload(previewProfile)
                        }
                        className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        type="button"
                      >
                        <Download className="h-5 w-5" />
                        Download Profile Picture
                      </button>

                      <button
                        type="button"
                        className="inline-flex justify-center px-8 py-3 text-sm font-semibold text-purple-400 bg-transparent border border-purple-600 rounded-lg hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
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
      <Footer />
    </>
  );
}
