import { Dialog, Transition } from "@headlessui/react";
import { Clock, Download, Layout } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/authContext";
import { supabase } from "../../lib/supabase";

import { ProfilePair } from "@/types";
import Footer from "../Footer";
import SearchFilter from "../search-filter";
import { Button } from "../ui/button";
import GalleryItemView from "./grid-list-individual-view";

const FAVORITES_STORAGE_KEY = "profile_favorites";

// Skeleton Loading Component
const ProfileCardSkeleton = () => (
  <div className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse">
    <div className="w-full h-40 bg-gray-700" />
    <div className="w-24 h-24 bg-gray-700 rounded-full border-4 border-gray-800 absolute top-28 left-1/2 transform -translate-x-1/2" />
    <div className="pt-20 pb-6 px-6 text-center space-y-3">
      <div className="h-6 bg-gray-700 rounded mx-auto w-3/4" />
      <div className="flex justify-center gap-2">
        <div className="h-5 bg-gray-700 rounded w-12" />
        <div className="h-5 bg-gray-700 rounded w-16" />
      </div>
      <div className="flex justify-center gap-5 pt-2">
        <div className="h-8 w-8 bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-700 rounded" />
      </div>
    </div>
  </div>
);

export default function ProfilesGallery() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ProfilePair[]>([]);
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
          .not("pfp_url", "is", null)
          .not("banner_url", "is", null)
          .neq("pfp_url", "")
          .neq("banner_url", "")
          .order("updated_at", { ascending: false });

        if (error) {
          setError("Failed to fetch profile combos");
          setLoading(false);
          return;
        }

        const profilesData: ProfilePair[] = data?.map((item) => {
          let tags: string[] = [];
          try {
            if (Array.isArray(item.tags)) {
              tags = item.tags;
            } else if (item.tags) {
              if ((item.tags as string).includes("[")) {
                tags = JSON.parse(item.tags as string);
              } else {
                tags = (item.tags as string)
                  .split(",")
                  .map((t: string) => t.trim());
              }
            }
          } catch (e) {
            console.error("Error parsing tags for item", item.id, e);
          }

          return {
            id: item.id,
            user_id: item.user_id,
            title: item.title || "Untitled Profile Combo",
            category: item.category || "General",
            tags,
            pfp_url: item.pfp_url ?? "", // Ensure string, never null
            banner_url: item.banner_url ?? "", // Ensure string, never null
            // TODO: implement download count
            download_count: 0,
            created_at: item?.created_at ?? "",
            updated_at: item?.updated_at ?? "",
            //TODO: implement colours
            // color: item?.color || undefined,
          };
        });

        setProfiles(profilesData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Unexpected error loading profile combos");
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
        (profile.category &&
          profile.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
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

    // Update download count in database
    try {
      // TODO: implement download count
      // const { error } = await supabase
      //   .from("profile_pairs")
      //   .update({ download_count: (profile.download_count || 0) + 1 })
      //   .eq("id", profile.id);
      // if (!error) {
      //   // Update local state
      //   setProfiles((prev) =>
      //     prev.map((p) =>
      //       p.id === profile.id
      //         ? { ...p, download_count: (p.download_count || 0) + 1 }
      //         : p
      //     )
      //   );
      // }
    } catch (error) {
      console.error("Failed to update download count:", error);
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

  const openPreview = (profile: ProfilePair) => {
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
            Profile Combos Gallery
          </h2>
          <p className="text-gray-400 text-lg">
            Discover and download complete profile sets with matching PFPs and
            banners • {filteredProfiles.length} combos available
          </p>
        </div>

        {/* Enhanced Filters */}
        <SearchFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          placeholder="Search Profile Combos..."
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          viewMode={viewMode}
          setViewMode={setViewMode}
          allTags={allTags}
          allColors={allColors}
          filteredAmount={filteredProfiles?.length ?? 0}
          totalAmount={profiles?.length ?? 0}
          toggleTag={toggleTag}
        />

        {/* Profile combos grid/list */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
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
            <div className=" rounded-lg p-8 max-w-md mx-auto">
              <Layout className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">
                No profile combos found
              </h3>
              <p className="text-gray-400 mb-4">
                Try adjusting your search or filter criteria
              </p>
              {(searchQuery ||
                selectedTags.size > 0 ||
                selectedColor !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTags(new Set());
                    setSelectedColor("all");
                  }}
                >
                  Clear Filters
                </Button>
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
                    image_url: profile.banner_url,
                    download_count: profile.download_count || 0,
                    category: profile?.category,
                    tags: profile.tags || [],
                    created_at: profile.created_at,
                    updated_at: profile.updated_at,
                    type: "pair",
                    favorites,
                    pfp_url: profile.pfp_url,
                    banner_url: profile.banner_url,
                    user,
                  }}
                  rawData={profile}
                  handleFavorite={handleFavorite}
                  openPreview={openPreview}
                  handleDownloadBoth={handleDownloadBoth}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Enhanced Pagination */}
            {filteredProfiles.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                  aria-label="Previous page"
                  type="button"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({
                    length: Math.min(
                      5,
                      Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)
                    ),
                  }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                          page === pageNum
                            ? "bg-purple-600 text-white"
                            : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE) > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <button
                        onClick={() =>
                          setPage(
                            Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)
                          )
                        }
                        className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                          page ===
                          Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)
                            ? "bg-purple-600 text-white"
                            : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        }`}
                      >
                        {Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE)}
                      </button>
                    </>
                  )}
                </div>

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
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                  aria-label="Next page"
                  type="button"
                >
                  Next
                </button>
              </div>
            )}
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
                <Dialog.Panel className="inline-block w-full max-w-6xl my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-2xl rounded-2xl border border-slate-700">
                  <div className="relative">
                    {previewProfile?.banner_url && (
                      <img
                        src={previewProfile.banner_url || "/placeholder.svg"}
                        alt={`${previewProfile.title} banner`}
                        className="w-full h-64 object-cover"
                        loading="lazy"
                      />
                    )}

                    {previewProfile?.pfp_url && (
                      <img
                        src={previewProfile.pfp_url || "/placeholder.svg"}
                        alt={`${previewProfile.title} profile`}
                        className="w-32 h-32 rounded-full border-4 border-purple-500 absolute top-48 left-1/2 transform -translate-x-1/2 bg-slate-900 shadow-xl"
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

                  <div className="pt-20 pb-8 px-8">
                    <Dialog.Title
                      as="h3"
                      className="text-3xl font-bold leading-12 text-white mb-5"
                    >
                      {previewProfile?.title}
                    </Dialog.Title>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                      {previewProfile?.category && (
                        <div className="flex items-center gap-1">
                          <span className="text-purple-300 font-medium">
                            {previewProfile.category}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>
                          {previewProfile?.download_count || 0} downloads
                        </span>
                      </div>
                      {previewProfile?.updated_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            Updated{" "}
                            {new Date(
                              previewProfile.updated_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
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
                          previewProfile && handleDownloadBoth(previewProfile)
                        }
                        className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        type="button"
                      >
                        <Download className="h-5 w-5" />
                        Download Combo
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
