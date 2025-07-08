"use client";

import { useState, useEffect, useMemo, Fragment, useCallback } from "react";
import { Copy, Heart, Eye, Search, Tag, Check, Clock, X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../../context/authContext";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../types/database";
import { useEmojiCombos } from "../../hooks/useEmojiCombos";
import Footer from "../Footer";
import SearchNew from "../search-new";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import PaginationOld from "../pagination-old";

type EmojiCombo = Database["public"]["Tables"]["emoji_combos"]["Row"];

const FAVORITES_STORAGE_KEY = "emoji_favorites";

// Skeleton Loading Component
const EmojiCardSkeleton = () => (
  <div className="relative group bg-slate-800 rounded-2xl overflow-hidden shadow-xl animate-pulse break-inside-avoid mb-6">
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-700 rounded w-3/4" />
      <div className="h-16 bg-gray-700 rounded" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-700 rounded w-12" />
        <div className="h-5 bg-gray-700 rounded w-16" />
      </div>
      <div className="flex justify-center gap-3 pt-2">
        <div className="h-8 w-16 bg-gray-700 rounded" />
        <div className="h-8 w-16 bg-gray-700 rounded" />
        <div className="h-8 w-8 bg-gray-700 rounded" />
      </div>
    </div>
  </div>
);

export default function EmojiCombosGallery() {
  const { user } = useAuth();
  const { emojiCombos: rawEmojiCombos, loading, error } = useEmojiCombos();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [previewCombo, setPreviewCombo] = useState<EmojiCombo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFavorite = async (comboId: string) => {
    if (!user) {
      alert("Please log in to save favorites");
      return;
    }

    const isCurrentlyFavorited = favorites.has(comboId);

    // Optimistically update UI
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(comboId)) {
        newFavorites.delete(comboId);
      } else {
        newFavorites.add(comboId);
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
          .eq("emoji_combo_id", comboId)
          .eq("content_type", "emoji_combo");

        if (error) {
          console.error("Error removing favorite:", error);
          throw new Error(`Failed to remove favorite: ${error.message}`);
        }
      } else {
        // Add to favorites
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          emoji_combo_id: comboId,
          content_type: "emoji_combo",
          profile_id: null, // Explicitly set to null for emoji combos
        });

        if (error) {
          console.error("Error adding favorite:", error);
          throw new Error(`Failed to add favorite: ${error.message}`);
        }
      }

      // Update localStorage backup
      const newFavorites = new Set(favorites);
      if (isCurrentlyFavorited) {
        newFavorites.delete(comboId);
      } else {
        newFavorites.add(comboId);
      }
      localStorage.setItem(
        `${FAVORITES_STORAGE_KEY}_${user.id}`,
        JSON.stringify(Array.from(newFavorites))
      );

      console.log(
        `Successfully ${
          isCurrentlyFavorited ? "removed" : "added"
        } favorite for emoji combo: ${comboId}`
      );
    } catch (error) {
      console.error("Failed to update favorites:", error);

      // Revert optimistic update on error
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (isCurrentlyFavorited) {
          newFavorites.add(comboId);
        } else {
          newFavorites.delete(comboId);
        }
        return newFavorites;
      });

      // Show detailed error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Detailed error:", error);
      alert(`Failed to update favorites: ${errorMessage}`);
    }
  };

  // Load favorites from database when user changes
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.id) {
        setFavorites(new Set());
        return;
      }

      try {
        console.log("Loading emoji combo favorites for user:", user.id);

        // Only load emoji combo favorites
        const { data, error } = await supabase
          .from("favorites")
          .select("emoji_combo_id")
          .eq("user_id", user.id)
          .eq("content_type", "emoji_combo")
          .not("emoji_combo_id", "is", null);

        if (error) {
          console.error("Error loading favorites:", error);

          // Fallback to localStorage if database fails
          const saved = localStorage.getItem(
            `${FAVORITES_STORAGE_KEY}_${user.id}`
          );
          if (saved) {
            try {
              const favArray: string[] = JSON.parse(saved);
              setFavorites(new Set(favArray));
              console.log(
                "Loaded favorites from localStorage:",
                favArray.length
              );
            } catch {
              setFavorites(new Set());
            }
          }
          return;
        }

        const favoriteIds = new Set(
          data?.map((fav) => fav.emoji_combo_id).filter(Boolean) || []
        );
        setFavorites(favoriteIds);
        console.log(
          "Loaded emoji combo favorites from database:",
          favoriteIds.size
        );

        // Also save to localStorage as backup
        localStorage.setItem(
          `${FAVORITES_STORAGE_KEY}_${user.id}`,
          JSON.stringify(Array.from(favoriteIds))
        );
      } catch (err) {
        console.error("Unexpected error loading favorites:", err);
        setFavorites(new Set());
      }
    };

    loadFavorites();
  }, [user]);

  const emojiCombos = useMemo(() => {
    return rawEmojiCombos.map((combo) => ({
      ...combo,
      name: combo.name || "Untitled Combo",
      combo_text: combo.combo_text || "",
      tags: Array.isArray(combo.tags) ? combo.tags : [],
    }));
  }, [rawEmojiCombos]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    emojiCombos.forEach((combo) =>
      combo.tags?.forEach((tag) => tagsSet.add(tag.toLowerCase().trim()))
    );
    return Array.from(tagsSet)
      .filter((tag) => tag.length > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [emojiCombos]);

  const filteredCombos = useMemo(() => {
    return emojiCombos.filter((combo) => {
      const matchesSearch =
        searchQuery === "" ||
        combo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        combo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        combo.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTags =
        selectedTags.size === 0 ||
        combo.tags?.some((tag) => selectedTags.has(tag.toLowerCase().trim()));

      return matchesSearch && matchesTags;
    });
  }, [emojiCombos, searchQuery, selectedTags]);

  const pagedCombos = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredCombos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCombos, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedTags]);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy emoji combo.");
    }
  }, []);

  const openPreview = (combo: EmojiCombo) => {
    setPreviewCombo(combo);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setPreviewCombo(null);
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

  // Helper function to determine if content is likely ASCII art
  const isLikelyAsciiArt = (text: string) => {
    // Check for newlines (multi-line content)
    if (text.includes("\n")) return true;

    // Check for ASCII art characters
    if (/[│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬▀▄█▌▐░▒▓■□▪▫◆◇○●◦‣⁃]/.test(text)) return true;

    // Check for repeated characters (common in ASCII art)
    if (/(.)\1{4,}/.test(text)) return true;

    // Check for long text that might be ASCII art
    if (
      text.length > 50 &&
      !/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(
        text
      )
    )
      return true;

    return false;
  };

  const getCardStyles = (combo: EmojiCombo) => {
    const isAscii = isLikelyAsciiArt(combo.combo_text);
    const contentLength = combo.combo_text.length;

    if (isAscii) {
      return {
        fontSize:
          contentLength > 2000
            ? "8px"
            : contentLength > 1000
            ? "10px"
            : contentLength > 500
            ? "12px"
            : contentLength > 200
            ? "14px"
            : "16px",
        lineHeight: "1.0",
        padding: "12px",
      };
    } else {
      return {
        minHeight: contentLength > 50 ? "80px" : "60px",
        fontSize:
          contentLength > 100 ? "2rem" : contentLength > 50 ? "2.5rem" : "3rem",
        lineHeight: "1.1",
        padding: "16px",
      };
    }
  };

  return (
    <>
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        data-gallery
      >
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <h2 className="text-white text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text">
            Emoji Combos Gallery
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Discover and copy amazing emoji combinations & ASCII art •{" "}
            {filteredCombos.length} combos available
          </p>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-8 mb-8 border shadow-2xl">
          {/* Search Bar */}

          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <SearchNew
                inputClassName="h-15 px-4 text-lg pe-5 pr-6 pl-12 mb-6"
                searchIconClassName="ps-3"
                leftIcon={{
                  className: "pe-3",
                  icon: <X size={25} />,
                  onLeftIconClick: () => setSearchQuery(""),
                  showLeftIcon: !!searchQuery,
                }}
                value={searchQuery}
                searchIconSize={25}
                onChange={(e) => setSearchQuery(e.target.value)}
                submitIconSize={25}
                searchPlaceholder={"Search names, descriptions, or tags..."}
              />
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary rounded-lg">
                    <Tag className="h-4 w-4 bg-primary/40" />
                  </div>
                  <span className="text-xl font-semibold text-white">
                    Filter by tags
                  </span>
                </div>
                {selectedTags.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">
                      {selectedTags.size} selected
                    </span>
                    <Button
                      variant={"outline"}
                      onClick={() => setSelectedTags(new Set())}
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {allTags.slice(0, 20).map((tag) => (
                  <Button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-xl",
                      selectedTags.has(tag)
                        ? "ring ring-primary bg-gradient-to-r from-primary/30 to-primary/90 hover:from-primary/20 hover:to-primary/50"
                        : ""
                    )}
                    variant={"tagGradient"}
                  >
                    #{tag}
                  </Button>
                ))}
                {allTags.length > 20 && (
                  <div className="px-6 py-3 text-sm text-slate-400 bg-slate-700/30 rounded-2xl border border-slate-600/30">
                    +{allTags.length - 20} more tags
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {(searchQuery || selectedTags.size > 0) && (
            <div className="mt-8 pt-6 border-t border-slate-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span>
                    Showing {filteredCombos.length} of {emojiCombos.length}{" "}
                    emoji combos
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTags(new Set());
                  }}
                  className="px-6 py-3 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pinterest-style Masonry Grid */}
        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <EmojiCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-900/20 border border-red-700 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-red-400 font-medium text-lg">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-slate-800/50 rounded-2xl p-12 max-w-md mx-auto backdrop-blur-sm">
              <Search className="h-20 w-20 mx-auto text-gray-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-4 text-white">
                No emoji combos found
              </h3>
              <p className="text-gray-400 mb-6 text-lg">
                Try adjusting your search or filter criteria
              </p>
              {(searchQuery || selectedTags.size > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTags(new Set());
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Proper Masonry Layout */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4 space-y-4">
              {pagedCombos.map((combo) => {
                const isAscii = isLikelyAsciiArt(combo.combo_text);
                const contentLength = combo.combo_text.length;
                // const lineCount = combo.combo_text.split("\n").length;

                // Calculate the maximum line length for width estimation
                const maxLineLength = Math.max(
                  ...combo.combo_text.split("\n").map((line) => line.length)
                );

                // More precise sizing based on content
                const cardStyles = getCardStyles(combo);

                // Determine if this needs to break out of columns for width
                const needsWideLayout =
                  isAscii && (maxLineLength > 60 || contentLength > 800);

                return (
                  <div
                    key={combo.id}
                    className={`relative group bg-card rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300  border hover:border-primary/50 transform hover:scale-[1.02] break-inside-avoid mb-4 ${
                      needsWideLayout ? "w-full" : ""
                    }`}
                    style={{
                      // For very wide content, we might need to break out
                      ...(needsWideLayout && maxLineLength > 80
                        ? {
                            width: "calc(200% + 1rem)",
                            maxWidth: "600px",
                          }
                        : {}),
                    }}
                  >
                    {/* Tight-fitting Preview Area */}
                    <div
                      className="relative cursor-pointer hover:bg-slate-800/30 transition-all duration-200"
                      onClick={() =>
                        copyToClipboard(combo.combo_text, combo.id)
                      }
                      title="Click to copy"
                      style={{
                        padding: cardStyles.padding,
                      }}
                    >
                      <div
                        className={`w-full flex ${
                          isAscii
                            ? "items-start justify-start"
                            : "items-center justify-center"
                        }`}
                        style={{
                          fontFamily: isAscii
                            ? "'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace"
                            : "inherit",
                          fontSize: cardStyles.fontSize,
                          whiteSpace: isAscii ? "pre" : "normal",
                          lineHeight: cardStyles.lineHeight,
                          color: "white",
                          letterSpacing: isAscii ? "-0.5px" : "0",
                          fontWeight: isAscii ? "400" : "500",
                          textAlign: isAscii ? "left" : "center",
                          wordBreak: "normal",
                          overflowWrap: "normal",
                          width: "100%",
                          minHeight: isAscii ? "auto" : cardStyles.minHeight,
                        }}
                      >
                        <div
                          className={`${isAscii ? "w-full" : ""}`}
                          style={{
                            maxWidth: "100%",
                            whiteSpace: isAscii ? "pre" : "normal",
                          }}
                        >
                          {combo.combo_text}
                        </div>
                      </div>

                      {/* Copy indicator overlay */}
                      {copiedId === combo.id && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-2xl">
                          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2">
                            <Check size={16} />
                            Copied!
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Compact Info Section */}
                    <div className="p-3 bg-popover/30 backdrop-blur-sm border-t">
                      <h3 className="text-white font-bold text-base mb-1 line-clamp-1 leading-tight">
                        {combo.name}
                      </h3>

                      {combo.description && (
                        <p className="text-slate-300 text-sm mb-2 line-clamp-2 leading-relaxed">
                          {combo.description}
                        </p>
                      )}

                      {combo.tags && combo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3 mt-3">
                          {combo.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="gradient">
                              #{tag}
                            </Badge>
                          ))}
                          {combo.tags.length > 2 && (
                            <span className="text-xs text-slate-400 px-2 py-1">
                              +{combo.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center gap-2">
                        <div className="flex gap-1">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPreview(combo);
                            }}
                            className="flex items-center gap-1  rounded-lg text-white text-xs font-medium transition-all duration-200 backdrop-blur-sm hover:scale-105"
                            aria-label={`Preview ${combo.name}`}
                            type="button"
                            variant="outline"
                            size="xs"
                          >
                            <Eye size={12} />
                            Preview
                          </Button>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(combo.combo_text, combo.id);
                            }}
                            className="flex items-center gap-1 rounded-lg text-white text-xs font-medium transition-all duration-200 backdrop-blur-sm hover:scale-105"
                            aria-label={`Copy ${combo.name}`}
                            type="button"
                            size="xs"
                          >
                            {copiedId === combo.id ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                            {copiedId === combo.id ? "Copied!" : "Copy"}
                          </Button>
                        </div>

                        {user && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavorite(combo.id);
                            }}
                            aria-pressed={favorites.has(combo.id)}
                            aria-label={
                              favorites.has(combo.id)
                                ? `Remove ${combo.name} from favorites`
                                : `Add ${combo.name} to favorites`
                            }
                            size="iconSm"
                            variant={
                              favorites.has(combo.id)
                                ? "destructive"
                                : "outline"
                            }
                            type="button"
                          >
                            <Heart
                              size={14}
                              fill={
                                favorites.has(combo.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <PaginationOld
              currentPage={page}
              totalPages={filteredCombos.length}
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
                <Dialog.Panel className="inline-block w-full max-w-6xl my-20 overflow-hidden text-left align-middle transition-all transform bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl rounded-3xl border border-slate-700/50">
                  <div className="relative p-8">
                    {/* Close Button */}
                    <button
                      onClick={closePreview}
                      className="absolute top-6 right-6 p-3 bg-black/50 hover:bg-black/70 rounded-2xl text-white transition-all duration-200 hover:scale-110"
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

                    <Dialog.Title
                      as="h3"
                      className="text-4xl font-bold leading-tight text-white mb-8 pr-16"
                    >
                      {previewCombo?.name}
                    </Dialog.Title>

                    <div
                      className="p-8 bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-slate-700/50 transition-all duration-200 mb-8 border border-slate-700/50 hover:border-purple-500/30"
                      onClick={() =>
                        previewCombo &&
                        copyToClipboard(
                          previewCombo.combo_text,
                          previewCombo.id
                        )
                      }
                      title="Click to copy"
                      style={{
                        fontFamily: isLikelyAsciiArt(
                          previewCombo?.combo_text || ""
                        )
                          ? "'Courier New', 'Monaco', 'Menlo', 'Consolas', monospace"
                          : "inherit",
                        fontSize: isLikelyAsciiArt(
                          previewCombo?.combo_text || ""
                        )
                          ? (previewCombo?.combo_text?.length || 0) > 2000
                            ? "12px"
                            : (previewCombo?.combo_text?.length || 0) > 1000
                            ? "14px"
                            : (previewCombo?.combo_text?.length || 0) > 500
                            ? "16px"
                            : "18px"
                          : (previewCombo?.combo_text?.length || 0) > 100
                          ? "2rem"
                          : "3rem",
                        whiteSpace: isLikelyAsciiArt(
                          previewCombo?.combo_text || ""
                        )
                          ? "pre"
                          : "normal",
                        lineHeight: isLikelyAsciiArt(
                          previewCombo?.combo_text || ""
                        )
                          ? "1"
                          : "1.3",
                        color: "white",
                        letterSpacing: "0",
                        fontWeight: "400",
                        textAlign: isLikelyAsciiArt(
                          previewCombo?.combo_text || ""
                        )
                          ? "left"
                          : "center",
                        display: isLikelyAsciiArt(
                          previewCombo?.combo_text || ""
                        )
                          ? "block"
                          : "flex",
                        alignItems: isLikelyAsciiArt(
                          previewCombo?.combo_text || ""
                        )
                          ? "flex-start"
                          : "center",
                        justifyContent: isLikelyAsciiArt(
                          previewCombo?.combo_text || ""
                        )
                          ? "flex-start"
                          : "center",
                        minHeight: isLikelyAsciiArt(
                          previewCombo?.combo_text || ""
                        )
                          ? "auto"
                          : "200px",
                      }}
                    >
                      {previewCombo?.combo_text}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-8">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        <span>
                          Updated{" "}
                          {new Date(
                            previewCombo?.updated_at || ""
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {previewCombo?.description && (
                      <div className="mb-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <h4 className="text-xl font-semibold text-white mb-3">
                          Description
                        </h4>
                        <p className="text-gray-300 text-lg leading-relaxed">
                          {previewCombo.description}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-3 mb-8 max-h-32 overflow-auto">
                      {(previewCombo?.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="bg-gradient-to-r from-purple-700/30 to-pink-700/30 text-purple-200 text-sm px-4 py-2 rounded-2xl select-none border border-purple-600/30 cursor-pointer hover:bg-purple-600/50 transition-all duration-200 hover:scale-105"
                          onClick={() => {
                            toggleTag(tag);
                            closePreview();
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-center gap-6">
                      <button
                        onClick={() =>
                          previewCombo &&
                          copyToClipboard(
                            previewCombo.combo_text,
                            previewCombo.id
                          )
                        }
                        className="inline-flex justify-center items-center gap-3 px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/25"
                        type="button"
                      >
                        {copiedId === previewCombo?.id ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <Copy className="h-6 w-6" />
                        )}
                        {copiedId === previewCombo?.id
                          ? "Copied!"
                          : "Copy Emoji Combo"}
                      </button>

                      <button
                        type="button"
                        className="inline-flex justify-center px-10 py-4 text-lg font-semibold text-purple-400 bg-transparent border-2 border-purple-600 rounded-2xl hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105"
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
