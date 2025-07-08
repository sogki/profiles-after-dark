import { Dialog, Transition } from "@headlessui/react";
import { Clock, Download, Layout } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/authContext";
import { supabase } from "../../lib/supabase";

import Footer from "../Footer";

import { Banner } from "@/types";
import SearchFilter from "../search-filter";
import GalleryView from "./grid-list-individual-view/view";

const FAVORITES_STORAGE_KEY = "banner_favorites";

// Skeleton Loading Component
const BannerCardSkeleton = () => (
  <div className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse">
    <div className="aspect-video bg-gray-700" />
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

export default function BannerGallery() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
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
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
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
    async function fetchBanners() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("type", "banner")
          .order("updated_at", { ascending: false });

        if (error) {
          setError("Failed to fetch banners");
          setLoading(false);
          return;
        }

        const bannerData: Banner[] = (data || []).map((item) => ({
          id: item.id,
          user_id: item.user_id,
          title: item.title || "Untitled Banner",
          category: item.category || "General",
          type: item.type || "banner",
          image_url: item.image_url || "",
          download_count: item.download_count || 0,
          tags: Array.isArray(item.tags) ? item.tags : [],
          created_at: item?.created_at ?? "",
          updated_at: item?.updated_at ?? "",
          // TODO: implement colors
          // color: item.color || undefined,
        }));

        setBanners(bannerData);
      } catch {
        setError("Unexpected error loading banners");
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, []);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    banners.forEach((b) =>
      b.tags?.forEach((tag) => tagsSet.add(tag.toLowerCase().trim()))
    );
    return Array.from(tagsSet)
      .filter((tag) => tag.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [banners]);

  const allColors = useMemo(() => {
    const colorsSet = new Set<string>();
    banners.forEach((b) => {
      if (b.color) colorsSet.add(b.color);
    });
    return Array.from(colorsSet).sort();
  }, [banners]);

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const matchesSearch =
        searchQuery === "" ||
        banner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        banner.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        banner.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTags =
        selectedTags.size === 0 ||
        banner.tags?.some((tag) => selectedTags.has(tag.toLowerCase().trim()));

      const matchesColor =
        selectedColor === "all" || banner.color === selectedColor;

      return matchesSearch && matchesTags && matchesColor;
    });
  }, [banners, searchQuery, selectedTags, selectedColor]);

  const pagedBanners = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredBanners.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBanners, page]);

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

  const handleDownload = useCallback(async (banner: Banner) => {
    if (banner.image_url) {
      const ext = banner.image_url.split(".").pop()?.split(/[#?]/)[0] || "png";
      const sanitizedTitle = banner.title.replace(/\s+/g, "_").toLowerCase();
      const filename = `banner_${sanitizedTitle}.${ext}`;
      await downloadImage(banner.image_url, filename);

      // Update download count in database
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ download_count: banner.download_count + 1 })
          .eq("id", banner.id);

        if (!error) {
          // Update local state
          setBanners((prev) =>
            prev.map((b) =>
              b.id === banner.id
                ? { ...b, download_count: b.download_count + 1 }
                : b
            )
          );
        }
      } catch (error) {
        console.error("Failed to update download count:", error);
      }
    }
  }, []);

  const handleFavorite = async (bannerId: string) => {
    if (!user) return;

    const isCurrentlyFavorited = favorites.has(bannerId);

    // Update local state immediately for better UX
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(bannerId)) {
        newFavorites.delete(bannerId);
      } else {
        newFavorites.add(bannerId);
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
          .eq("profile_id", bannerId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert([
          {
            user_id: user.id,
            profile_id: bannerId,
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
          newFavorites.add(bannerId);
        } else {
          newFavorites.delete(bannerId);
        }
        return newFavorites;
      });
    }
  };

  const openPreview = (banner: Banner) => {
    setPreviewBanner(banner);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewBanner(null);
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
            Banners Gallery
          </h2>
          <p className="text-gray-400 text-lg">
            Discover and download stunning banners for your profiles •{" "}
            {filteredBanners.length} items available
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
          setViewMode={setViewMode}
          allTags={allTags}
          allColors={allColors}
          filteredAmount={filteredBanners?.length ?? 0}
          totalAmount={banners?.length ?? 0}
          placeholder="Search Banners..."
          toggleTag={toggleTag}
        />

        {/* Banners grid/list */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <BannerCardSkeleton key={i} />
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
        ) : filteredBanners.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-slate-800 rounded-lg p-8 max-w-md mx-auto">
              <Layout className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">
                No banners found
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
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {pagedBanners.map((banner) => (
                <GalleryView
                  key={banner.id}
                  item={{
                    id: banner.id,
                    title: banner.title,
                    image_url: banner.image_url,
                    download_count: banner.download_count || 0,
                    category: banner?.category,
                    tags: banner.tags || [],
                    created_at: banner.created_at,
                    updated_at: banner.updated_at,
                    type: "banner",
                    banner_url: banner?.image_url,
                    favorites,
                    user,
                  }}
                  rawData={banner}
                  handleFavorite={handleFavorite}
                  openPreview={openPreview}
                  handleDownloadBoth={handleDownload}
                />
              ))}
            </div>

            {/* Enhanced Pagination */}
            {filteredBanners.length > ITEMS_PER_PAGE && (
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
                      Math.ceil(filteredBanners.length / ITEMS_PER_PAGE)
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
                  {Math.ceil(filteredBanners.length / ITEMS_PER_PAGE) > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <button
                        onClick={() =>
                          setPage(
                            Math.ceil(filteredBanners.length / ITEMS_PER_PAGE)
                          )
                        }
                        className={`w-12 h-12 rounded-lg font-medium transition-colors ${
                          page ===
                          Math.ceil(filteredBanners.length / ITEMS_PER_PAGE)
                            ? "bg-purple-600 text-white"
                            : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        }`}
                      >
                        {Math.ceil(filteredBanners.length / ITEMS_PER_PAGE)}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        p + 1,
                        Math.ceil(filteredBanners.length / ITEMS_PER_PAGE)
                      )
                    )
                  }
                  disabled={
                    page === Math.ceil(filteredBanners.length / ITEMS_PER_PAGE)
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
                    {previewBanner && (
                      <img
                        src={previewBanner.image_url || "/placeholder.svg"}
                        alt={previewBanner.title}
                        className="w-full h-80 object-contain bg-slate-800"
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
                      {previewBanner?.title}
                    </Dialog.Title>

                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                      <div className="flex items-center gap-1">
                        <span className="text-purple-300 font-medium">
                          {previewBanner?.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{previewBanner?.download_count} downloads</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          Updated{" "}
                          {new Date(
                            previewBanner?.updated_at || ""
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-6 max-h-20 overflow-auto px-2">
                      {(previewBanner?.tags || []).map((tag) => (
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
                          previewBanner && handleDownload(previewBanner)
                        }
                        className="inline-flex justify-center items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        type="button"
                      >
                        <Download className="h-5 w-5" />
                        Download Banner
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
