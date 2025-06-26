import React, { useState, useEffect, useMemo, Fragment } from "react";
import { Download, Heart, Eye, Calendar, Tag, X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../../context/authContext";
import { supabase } from "../../lib/supabase";

interface Banner {
  id: string;
  title: string;
  tags?: string[];
  color?: string;
  category: string;
  type: string;
  created_at?: string;
  download_count?: number;
  image_url: string;
}

export default function BannerGallery() {
  const { user } = useAuth();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | "all">("all");
  const [selectedColor, setSelectedColor] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchBanners() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("type", "banner")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching banners:", error);
          setLoading(false);
          return;
        }

        const bannerData: Banner[] = data.map((item) => ({
          id: item.id,
          title: item.title,
          image_url: item.image_url,
          tags: item.tags || [],
          color: item.color || undefined,
          created_at: item.created_at,
          category: item.category || "banner",
          type: item.type,
          download_count: item.download_count || 0,
        }));

        setBanners(bannerData);
      } catch (err) {
        console.error("Error loading banners:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, []);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    banners.forEach((b) => b.tags?.forEach((tag) => tagsSet.add(tag)));
    return Array.from(tagsSet);
  }, [banners]);

  const allColors = useMemo(() => {
    const colorsSet = new Set<string>();
    banners.forEach((b) => {
      if (b.color) colorsSet.add(b.color);
    });
    return Array.from(colorsSet);
  }, [banners]);

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const matchesSearch =
        searchQuery === "" ||
        banner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        banner.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTag =
        selectedTag === "all" || banner.tags?.includes(selectedTag);

      const matchesColor =
        selectedColor === "all" || banner.color === selectedColor;

      return matchesSearch && matchesTag && matchesColor;
    });
  }, [banners, searchQuery, selectedTag, selectedColor]);

  async function downloadImage(url: string, filename: string) {
    try {
      const response = await fetch(url);
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
    }
  }

  const handleDownload = async (banner: Banner) => {
    const extension =
      banner.image_url.split(".").pop()?.split(/[#?]/)[0] || "png";
    const sanitizedTitle = banner.title.replace(/\s+/g, "_").toLowerCase();
    const filename = `banners_${sanitizedTitle}.${extension}`;

    await downloadImage(banner.image_url, filename);
  };

  const handleFavorite = (bannerId: string) => {
    if (!user) return;

    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(bannerId)) {
        newFavorites.delete(bannerId);
      } else {
        newFavorites.add(bannerId);
      }
      return newFavorites;
    });
  };

  const openPreview = (banner: Banner) => {
    setPreviewBanner(banner);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewBanner(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-white text-3xl font-bold mb-6">Banners Gallery</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input
          type="text"
          placeholder="Search titles or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none"
        />

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-4 py-2 rounded-md bg-slate-700 text-white"
        >
          <option value="all">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        <select
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="px-4 py-2 rounded-md bg-slate-700 text-white"
        >
          <option value="all">All Colors</option>
          {allColors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>

        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as "grid" | "list")}
          className="px-4 py-2 rounded-md bg-slate-700 text-white"
        >
          <option value="grid">Grid View</option>
          <option value="list">List View</option>
        </select>
      </div>

      {/* Banners Display */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }
      >
        {filteredBanners.length === 0 && !loading && (
          <p className="text-white text-center col-span-full">
            No banners found.
          </p>
        )}

        {filteredBanners.map((banner) => (
          <div
            key={banner.id}
            className={`group bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105 ${
              viewMode === "list" ? "flex" : ""
            }`}
          >
            <div
              className={`relative overflow-hidden ${
                viewMode === "list" ? "w-48 flex-shrink-0" : "aspect-video"
              }`}
            >
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-60"></div>
            </div>

            <div className="p-4 flex flex-col justify-between flex-grow">
              <h3 className="text-white font-semibold mb-2">{banner.title}</h3>

              <div className="flex items-center gap-4 mt-auto">
                <button
                  onClick={() => openPreview(banner)}
                  title="Preview"
                  className="p-1 rounded text-white hover:text-purple-400"
                >
                  <Eye />
                </button>

                <button
                  onClick={() => handleDownload(banner)}
                  title="Download"
                  className="p-1 rounded text-white hover:text-purple-400"
                >
                  <Download />
                </button>

                <button
                  onClick={() => handleFavorite(banner.id)}
                  title="Favorite"
                  className={`p-1 rounded text-white ${
                    favorites.has(banner.id)
                      ? "text-pink-500"
                      : "hover:text-pink-500"
                  }`}
                >
                  <Heart />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewBanner && (
        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={closePreview}
          >
            <div className="min-h-screen px-4 text-center bg-black bg-opacity-70">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="inline-block w-full max-w-4xl p-6 my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-xl rounded-lg relative">
                  <button
                    onClick={closePreview}
                    className="absolute top-4 right-4 text-white hover:text-purple-400"
                    aria-label="Close preview modal"
                  >
                    <X className="h-6 w-6" />
                  </button>

                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-white mb-4"
                  >
                    {previewBanner.title}
                  </Dialog.Title>

                  <img
                    src={previewBanner.image_url}
                    alt={previewBanner.title}
                    className="w-full max-h-[70vh] object-contain rounded-md mb-4"
                  />

                  <p className="text-slate-400 mb-2">
                    {previewBanner.category} / {previewBanner.type}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(previewBanner.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-purple-700 text-purple-200 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      )}
    </div>
  );
}
