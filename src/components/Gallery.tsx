import React, { useState, Fragment, useMemo, useEffect } from "react";
import {
  Download,
  Heart,
  Eye,
  Calendar,
  Tag,
  X,
  ChevronDown,
} from "lucide-react";
import { useProfiles } from "../hooks/useProfiles";
import { useAuth } from "../context/authContext";
import { Database } from "../types/database";
import { Dialog, Transition } from "@headlessui/react";
import { supabase } from "../lib/supabase";

// Profile Type
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface GalleryProps {
  searchQuery: string;
  selectedCategory: string;
  selectedType: string;
  viewMode: "grid" | "list";
}

type SortOption = "recent" | "oldest" | "most_downloads" | "least_downloads";

// Helper to format counts like 1200 -> "1.2k"
const formatCount = (num: number) => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1) + "k";
  }
  return num.toString();
};

export default function Gallery({
  searchQuery,
  selectedCategory,
  selectedType,
  viewMode,
}: GalleryProps) {
  const { profiles, loading, downloadProfile, toggleFavorite } = useProfiles();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [previewProfile, setPreviewProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [uploaderNames, setUploaderNames] = useState<Record<string, string>>({});

  // Initialize favorites from profiles or your logic for the user's favorites
useEffect(() => {
  if (!user) {
    setFavorites(new Set());
    return;
  }

  async function fetchFavorites() {
    const { data, error } = await supabase
      .from("favorites")
      .select("profile_id")
      .eq("user_id", user?.id);

    if (error) {
      console.error("Error fetching favorites:", error);
      return;
    }

    const userFavorites = new Set(data.map((fav) => fav.profile_id));
    setFavorites(userFavorites);
  }

  fetchFavorites();
}, [user]);

  // Filter profiles based on search, category and type
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        searchQuery === "" ||
        profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (profile.tags || []).some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || profile.category === selectedCategory;
      const matchesType =
        selectedType === "all" || profile.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [profiles, searchQuery, selectedCategory, selectedType]);

  // Sort the filtered profiles based on selected sort option
  const sortedProfiles = useMemo(() => {
    const sorted = [...filteredProfiles];
    switch (sortBy) {
      case "recent":
        sorted.sort((a, b) =>
          (b.created_at || "").localeCompare(a.created_at || "")
        );
        break;
      case "oldest":
        sorted.sort((a, b) =>
          (a.created_at || "").localeCompare(b.created_at || "")
        );
        break;
      case "most_downloads":
        sorted.sort(
          (a, b) => (b.download_count || 0) - (a.download_count || 0)
        );
        break;
      case "least_downloads":
        sorted.sort(
          (a, b) => (a.download_count || 0) - (b.download_count || 0)
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [filteredProfiles, sortBy]);

  // Fetch uploader display names for all profiles shown
  useEffect(() => {
    async function fetchUploaderNames() {
      const uploaderIds = Array.from(
        new Set(
          sortedProfiles
            .map((profile) => profile.user_id)
            .filter(Boolean)
        )
      );

      if (uploaderIds.length === 0) {
        setUploaderNames({});
        return;
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, display_name")
        .in("id", uploaderIds);

      if (error) {
        console.error("Error fetching uploader names:", error);
        setUploaderNames({});
      } else {
        const namesMap: Record<string, string> = {};
        data.forEach(({ id, display_name }: { id: string; display_name: string }) => {
          namesMap[id] = display_name || "Unknown";
        });
        setUploaderNames(namesMap);
      }
    }

    fetchUploaderNames();
  }, [sortedProfiles]);

  const getFileExtension = (url: string) => {
    return url.split(".").pop()?.split(/[#?]/)[0] || "png";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      discord: "text-indigo-400",
      twitter: "text-blue-400",
      instagram: "text-pink-400",
      general: "text-purple-400",
    };
    return colors[category as keyof typeof colors] || "text-gray-400";
  };

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

  const handleDownload = async (profile: Profile) => {
    await downloadProfile(profile.id, user?.id);

    const extension = getFileExtension(profile.image_url);
    const sanitizedTitle = profile.title.replace(/\s+/g, "_").toLowerCase();
    const filename = `profilesafterdark_${sanitizedTitle}.${extension}`;

    await downloadImage(profile.image_url, filename);
  };

  const handleFavorite = async (profileId: string) => {
    if (!user) return;

    const result = await toggleFavorite(profileId, user.id);
    if (result !== null) {
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (result) {
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

  // Sorting options for UI
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "recent", label: "Recently uploaded" },
    { value: "oldest", label: "Oldest uploaded" },
    { value: "most_downloads", label: "Most downloads" },
    { value: "least_downloads", label: "Least downloads" },
  ];

  const PreviewModal = () => (
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
            <Dialog.Panel className="inline-block w-full max-w-3xl p-6 my-20 overflow-hidden text-left align-middle transition-all transform bg-slate-900 shadow-xl rounded-lg relative">
              <button
                onClick={closePreview}
                className="absolute top-4 right-4 text-white hover:text-purple-400"
                aria-label="Close preview modal"
              >
                <X className="h-6 w-6" />
              </button>

              {previewProfile && (
                <>
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-white mb-4"
                  >
                    {previewProfile.title}
                  </Dialog.Title>

                  <img
                    src={previewProfile.image_url}
                    alt={previewProfile.title}
                    className="w-full max-h-[70vh] object-contain rounded-md mb-4"
                  />

                  <p className="text-slate-400 mb-2">
                    {previewProfile.category} / {previewProfile.type}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(previewProfile.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-purple-700 text-purple-200 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleDownload(previewProfile)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
                  >
                    Download
                  </button>
                </>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );

  if (loading) {
    return (
      <div className="text-center text-slate-500 mt-20">
        Loading profiles...
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center text-slate-500 mt-20">
        No profiles available yet.
      </div>
    );
  }

  if (filteredProfiles.length === 0) {
    return (
      <div className="text-center text-slate-500 mt-20">
        No profiles match your search or filters.
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="relative inline-block text-left">
          <button
            onClick={() => setIsSortDropdownOpen((prev) => !prev)}
            className="inline-flex justify-center w-full rounded-md border border-gray-700 shadow-sm px-4 m-5 py-2 bg-slate-900 text-sm font-medium text-gray-200 hover:bg-gray-800 focus:outline-none"
            aria-haspopup="true"
            aria-expanded={isSortDropdownOpen}
          >
            Sort by:{" "}
            {
              sortOptions.find((option) => option.value === sortBy)?.label ||
              "Select"
            }
            <ChevronDown className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
          </button>

          {isSortDropdownOpen && (
            <div className="origin-top-right absolute mt-2 w-56 rounded-md shadow-lg bg-slate-900 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1">
                {sortOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setSortBy(value);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-700 hover:text-white ${
                      sortBy === value ? "bg-purple-700" : ""
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ml-5 mr-5"
            : "flex flex-col space-y-4"
        }
      >
        {sortedProfiles.map((profile) => (
          <div
            key={profile.id}
            className={`cursor-pointer ${
              viewMode === "grid"
                ? "bg-slate-800 rounded-md overflow-hidden shadow"
                : "flex bg-slate-800 rounded-md overflow-hidden shadow"
            }`}
            onClick={() => openPreview(profile)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") openPreview(profile);
            }}
          >
            <img
              src={profile.image_url}
              alt={profile.title}
              className={
                viewMode === "grid"
                  ? "w-full h-48 object-cover"
                  : "w-48 h-48 object-cover flex-shrink-0"
              }
              loading="lazy"
            />

            <div className="p-4 flex flex-col justify-between flex-grow">
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">
                  {profile.title}
                </h3>
                <p className={`text-sm font-medium mb-2 ${getCategoryColor(profile.category)}`}>
                  {profile.category}
                </p>
                <p className="text-xs text-slate-400 mb-2 truncate max-w-full">
                  {(profile.tags || []).map((tag) => `#${tag} `)}
                </p>
                <p className="text-xs text-slate-400">
                  Curated by{" "}
                  <span className="text-purple-400 font-medium">
                    {uploaderNames[profile.user_id] || "Loading..."}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite(profile.id);
                  }}
                  aria-label={`${favorites.has(profile.id) ? "Unfavorite" : "Favorite"} ${profile.title}`}
                  className="flex flex-col items-center text-pink-400 hover:text-pink-500 focus:outline-none"
                >
                  <Heart className="w-6 h-6" />
                  <span className="text-xs">{formatCount(profile.favorites_count || 0)}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(profile);
                  }}
                  aria-label={`Download ${profile.title}`}
                  className="flex flex-col items-center text-green-400 hover:text-green-500 focus:outline-none"
                >
                  <Download className="w-6 h-6" />
                  <span className="text-xs">{formatCount(profile.download_count || 0)}</span>
                </button>

                <div className="flex flex-col items-center text-slate-400">
                  <Calendar className="w-5 h-5 mb-1" />
                  <span className="text-xs">
                    {profile.created_at ? formatDate(profile.created_at) : "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PreviewModal />
    </>
  );
}
