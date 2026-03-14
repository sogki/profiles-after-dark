import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type MouseEvent as ReactMouseEvent } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Globe,
  GripVertical,
  Loader2,
  MessageCircle,
  Heart,
  Save,
  RotateCcw,
  Instagram,
  Lock,
  UserPlus,
  Users,
  X,
  User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/authContext";
import { supabase } from "@/lib/supabase";
import FlairNameText from "@/components/flair/FlairNameText";
import { buildFlairGradientString, parseFlairGradient } from "@/lib/flairName";
import {
  useProfileLayoutBuilder,
} from "@/hooks/flair/useProfileLayoutBuilder";
import {
  getAccentGradient,
  getAdaptiveContainerColors,
  hexToRgba,
  normalizeSocialOrder,
  normalizeWebsiteUrl,
  type ProfileDragBlockId,
  type ProfileSocialId,
  type ProfileStatsItemId,
  type ProfileTabId,
} from "@/components/users/profile/layoutPrimitives";

interface LayoutBuilderTabProps {
  isPremium: boolean;
  onNavigateToSubscription: () => void;
  flairProfile?: {
    custom_display_name?: string | null;
    display_name_animation?: string | null;
    display_name_gradient?: string | null;
  } | null;
  onUpdateFlairProfile?: (updates: {
    custom_display_name?: string | null;
    display_name_animation?: string | null;
    display_name_gradient?: string | null;
  }) => Promise<void>;
}

const TAB_LABELS: Record<ProfileTabId, string> = {
  pairs: "Profile Pairs",
  pfps: "PFPs",
  banners: "Banners",
  emotes: "Emotes",
  wallpapers: "Wallpapers",
  collections: "Collections",
  emojicombos: "Emoji Combos",
  favorites: "Favorites",
};

const DRAG_BLOCK_LABELS: Record<ProfileDragBlockId, string> = {
  avatar: "Avatar",
  identity: "Username",
  bio: "Bio",
  stats: "Stats",
  socials: "Socials",
  achievements: "Achievements",
  tabs: "Tabs",
};

type PreviewDraggableBlockId = ProfileDragBlockId;
type EditableBlockId = PreviewDraggableBlockId | "tabs" | "background";
const STATS_ITEM_LABELS: Record<ProfileStatsItemId, string> = {
  joined: "Joined Date",
  followers: "Followers",
  following: "Following",
  favorites: "Favorites",
};
const TAB_COLOR_SWATCHES = [
  "#a855f7",
  "#7c3aed",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#64748b",
  "#e2e8f0",
] as const;

export default function LayoutBuilderTab({
  isPremium,
  onNavigateToSubscription,
  flairProfile,
  onUpdateFlairProfile,
}: LayoutBuilderTabProps) {
  const { user } = useAuth();
  const {
    layout,
    loading,
    saving,
    hasUnsavedChanges,
    reorderTabs,
    setThemeAccent,
    setThemeSurface,
    setThemeTabColor,
    setStatsVariant,
    reorderStatsItems,
    setDragBlockOffset,
    socialLinks,
    resetToDefault,
    saveLayout,
  } = useProfileLayoutBuilder();
  const [draggingTab, setDraggingTab] = useState<ProfileTabId | null>(null);
  const [dragOverTab, setDragOverTab] = useState<ProfileTabId | null>(null);
  const [draggingStatsItem, setDraggingStatsItem] = useState<ProfileStatsItemId | null>(null);
  const [dragOverStatsItem, setDragOverStatsItem] = useState<ProfileStatsItemId | null>(null);
  const [selectedEditableBlock, setSelectedEditableBlock] = useState<EditableBlockId | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const propertiesPanelRef = useRef<HTMLDivElement | null>(null);
  const [customName, setCustomName] = useState(flairProfile?.custom_display_name || "");
  const [nameAnimation, setNameAnimation] = useState(flairProfile?.display_name_animation || "none");
  const [gradientColors, setGradientColors] = useState<string[]>(["#a855f7", "#ec4899"]);
  const [colorCount, setColorCount] = useState<2 | 3>(2);
  const [rainbowMode, setRainbowMode] = useState<"standard" | "custom">("standard");
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [previewProfile, setPreviewProfile] = useState<{
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    banner_url: string | null;
  } | null>(null);
  const [previewBadges, setPreviewBadges] = useState<Array<{ id: string; code?: string | null; name?: string | null }>>([]);
  const [activeDragBlock, setActiveDragBlock] = useState<{
    blockId: PreviewDraggableBlockId;
    pointerStartX: number;
    pointerStartY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [dragHoverTargetBlock, setDragHoverTargetBlock] = useState<PreviewDraggableBlockId | null>(null);
  const previewBlockRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sectionEnabled = useMemo(
    () => ({
      hero: layout.sections.find((section) => section.type === "hero")?.enabled !== false,
      about: layout.sections.find((section) => section.type === "about")?.enabled !== false,
      highlights: layout.sections.find((section) => section.type === "highlights")?.enabled !== false,
    }),
    [layout.sections]
  );
  const dragGrid = layout.drag.grid || 8;
  const accentGradient = getAccentGradient(layout.theme.accent);
  const tabTheme = layout.theme.tabs || {
    stripStart: accentGradient.start,
    stripEnd: accentGradient.end,
    activeStart: accentGradient.start,
    activeEnd: accentGradient.end,
  };
  const adaptiveColors = getAdaptiveContainerColors(layout.theme.surface);
  const tabStripStyle = {
    background: `linear-gradient(145deg, ${hexToRgba(tabTheme.stripStart, 0.2)}, ${hexToRgba(
      tabTheme.stripEnd,
      0.14
    )})`,
    borderColor: adaptiveColors.containerBorder,
  } as const;
  const activeTabGradientCss = `linear-gradient(135deg, ${tabTheme.activeStart}, ${tabTheme.activeEnd})`;
  const nameGradientJson = useMemo(
    () => buildFlairGradientString(gradientColors.slice(0, colorCount), rainbowMode),
    [gradientColors, colorCount, rainbowMode]
  );
  const clampPanelPosition = useCallback((x: number, y: number, panelWidth: number, panelHeight: number) => {
    const margin = 12;
    const maxX = Math.max(margin, window.innerWidth - panelWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - panelHeight - margin);
    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    };
  }, []);
  const selectEditableBlock = (event: ReactMouseEvent<HTMLElement>, blockId: EditableBlockId) => {
    event.stopPropagation();
    const estimatedSize =
      blockId === "tabs"
        ? { width: 360, height: 420 }
        : blockId === "background"
          ? { width: 340, height: 220 }
        : blockId === "stats"
          ? { width: 330, height: 360 }
          : { width: 300, height: 140 };
    const next = clampPanelPosition(
      event.clientX + 14,
      event.clientY + 14,
      estimatedSize.width,
      estimatedSize.height
    );
    setContextMenuPosition(next);
    setSelectedEditableBlock(blockId);
  };
  const socialItems = useMemo(() => {
    const discord = socialLinks.discord.trim();
    const instagram = socialLinks.instagram.trim();
    const website = normalizeWebsiteUrl(socialLinks.website || null);
    const itemsById: Record<ProfileSocialId, { id: ProfileSocialId; label: string; icon: JSX.Element } | null> = {
      discord: null,
      instagram: null,
      website: null,
    };

    if (discord) {
      itemsById.discord = {
        id: "discord",
        label: discord,
        icon: <MessageCircle className="h-3.5 w-3.5" />,
      };
    }
    if (instagram) {
      itemsById.instagram = {
        id: "instagram",
        label: instagram,
        icon: <Instagram className="h-3.5 w-3.5" />,
      };
    }
    if (website) {
      itemsById.website = {
        id: "website",
        label: website.replace(/^https?:\/\//i, ""),
        icon: <Globe className="h-3.5 w-3.5" />,
      };
    }

    return normalizeSocialOrder(layout.header.socials.order)
      .map((id) => itemsById[id])
      .filter(Boolean) as Array<{ id: ProfileSocialId; label: string; icon: JSX.Element }>;
  }, [layout.header.socials.order, socialLinks.discord, socialLinks.instagram, socialLinks.website]);
  useEffect(() => {
    const parsed = parseFlairGradient(flairProfile?.display_name_gradient || null);
    const nextColors =
      parsed.colors.length >= 3
        ? parsed.colors.slice(0, 3)
        : parsed.colors.length >= 2
          ? parsed.colors.slice(0, 2)
          : ["#a855f7", "#ec4899"];
    setGradientColors(nextColors);
    setColorCount(nextColors.length >= 3 ? 3 : 2);
    setRainbowMode(parsed.rainbowMode || "standard");
    setCustomName(flairProfile?.custom_display_name || "");
    setNameAnimation(flairProfile?.display_name_animation || "none");
  }, [flairProfile?.custom_display_name, flairProfile?.display_name_animation, flairProfile?.display_name_gradient]);
  const statsOrder = layout.header.stats.order || ["joined", "followers", "following", "favorites"];
  const selectedContentLabel =
    selectedEditableBlock === "tabs"
      ? "Tabs"
      : selectedEditableBlock === "background"
        ? "Background"
      : selectedEditableBlock
        ? DRAG_BLOCK_LABELS[selectedEditableBlock]
        : "None";
  const getDragOffset = (blockId: PreviewDraggableBlockId) =>
    layout.drag.blocks[blockId] || { x: 0, y: 0 };
  const getDragStyle = (blockId: PreviewDraggableBlockId) => {
    const offset = getDragOffset(blockId);
    if (offset.x === 0 && offset.y === 0) return undefined;
    return { transform: `translate(${offset.x}px, ${offset.y}px)` };
  };
  const avatarDragOffset = getDragOffset("avatar");
  const previewAvatarX = layout.header.avatar.x + avatarDragOffset.x;
  const previewAvatarY = layout.header.avatar.y + avatarDragOffset.y;
  const shouldLiftPreviewActions = previewAvatarX > 220 && previewAvatarY < 140;

  const handleSave = async () => {
    try {
      await saveLayout();
      toast.success("Profile layout saved.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save layout.");
    }
  };

  const handleReset = () => {
    resetToDefault();
    toast.success("Layout reset to default.");
  };
  const handleIdentitySave = async () => {
    if (!onUpdateFlairProfile) {
      toast.error("Profile update is currently unavailable.");
      return;
    }
    try {
      setIsSavingIdentity(true);
      await onUpdateFlairProfile({
        custom_display_name: customName.trim() || null,
        display_name_animation: nameAnimation,
        display_name_gradient: nameGradientJson,
      });
      toast.success("Username style updated.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update username style.");
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleTabDragStart = (event: ReactDragEvent<HTMLDivElement>, tabId: ProfileTabId) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", tabId);
    setDraggingTab(tabId);
  };

  const handleTabDrop = (targetTabId: ProfileTabId) => {
    if (!draggingTab) return;
    reorderTabs(draggingTab, targetTabId);
    setDraggingTab(null);
    setDragOverTab(null);
  };

  const handleTabDragEnd = () => {
    setDraggingTab(null);
    setDragOverTab(null);
  };
  const moveTabByDirection = (tabId: ProfileTabId, direction: "up" | "down") => {
    const currentIndex = layout.tabs.order.findIndex((item) => item === tabId);
    if (currentIndex < 0) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= layout.tabs.order.length) return;
    const targetTabId = layout.tabs.order[targetIndex];
    reorderTabs(tabId, targetTabId);
  };
  const handleStatsDragStart = (event: ReactDragEvent<HTMLDivElement>, itemId: ProfileStatsItemId) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
    setDraggingStatsItem(itemId);
  };
  const moveStatsByDirection = (itemId: ProfileStatsItemId, direction: "up" | "down") => {
    const currentIndex = statsOrder.findIndex((item) => item === itemId);
    if (currentIndex < 0) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= statsOrder.length) return;
    const targetItemId = statsOrder[targetIndex];
    reorderStatsItems(itemId, targetItemId);
  };

  const handleBlockDragStart = (
    event: ReactMouseEvent<HTMLDivElement>,
    blockId: PreviewDraggableBlockId
  ) => {
    event.preventDefault();
    const current = getDragOffset(blockId);
    setActiveDragBlock({
      blockId,
      pointerStartX: event.clientX,
      pointerStartY: event.clientY,
      originX: current.x,
      originY: current.y,
    });
    setDragHoverTargetBlock(null);
  };

  const setPreviewBlockOffset = (blockId: PreviewDraggableBlockId, x: number, y: number) => {
    setDragBlockOffset(blockId, x, y);
  };

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!activeDragBlock) return;

    const handlePointerMove = (event: MouseEvent) => {
      const deltaX = event.clientX - activeDragBlock.pointerStartX;
      const deltaY = event.clientY - activeDragBlock.pointerStartY;
      const snappedX = Math.round((activeDragBlock.originX + deltaX) / dragGrid) * dragGrid;
      const snappedY = Math.round((activeDragBlock.originY + deltaY) / dragGrid) * dragGrid;
      setDragBlockOffset(activeDragBlock.blockId, snappedX, snappedY);
    };

    const stopDragging = () => {
      if (activeDragBlock && dragHoverTargetBlock && dragHoverTargetBlock !== activeDragBlock.blockId) {
        const draggedId = activeDragBlock.blockId;
        const targetId = dragHoverTargetBlock;
        const draggedOffset = getDragOffset(draggedId);
        const targetOffset = getDragOffset(targetId);
        const draggedEl = previewBlockRefs.current[draggedId];
        const targetEl = previewBlockRefs.current[targetId];

        if (draggedEl && targetEl) {
          const draggedRect = draggedEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();
          const deltaX = targetRect.left - draggedRect.left;
          const deltaY = targetRect.top - draggedRect.top;
          setPreviewBlockOffset(draggedId, draggedOffset.x + deltaX, draggedOffset.y + deltaY);
          setPreviewBlockOffset(targetId, targetOffset.x - deltaX, targetOffset.y - deltaY);
        } else {
          setPreviewBlockOffset(draggedId, targetOffset.x, targetOffset.y);
          setPreviewBlockOffset(targetId, draggedOffset.x, draggedOffset.y);
        }
      }
      setActiveDragBlock(null);
      setDragHoverTargetBlock(null);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [activeDragBlock, dragGrid, dragHoverTargetBlock, setDragBlockOffset, layout.drag.blocks]);

  useEffect(() => {
    if (!selectedEditableBlock) return;
    const adjustPanelPosition = () => {
      const panel = propertiesPanelRef.current;
      if (!panel) return;
      setContextMenuPosition((prev) => {
        const next = clampPanelPosition(prev.x, prev.y, panel.offsetWidth, panel.offsetHeight);
        return next.x === prev.x && next.y === prev.y ? prev : next;
      });
    };
    const rafId = window.requestAnimationFrame(adjustPanelPosition);
    window.addEventListener("resize", adjustPanelPosition);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", adjustPanelPosition);
    };
  }, [clampPanelPosition, selectedEditableBlock, layout.tabs.order.length, layout.header.stats.order.length]);

  useEffect(() => {
    const loadPreviewProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("username, display_name, bio, avatar_url, banner_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPreviewProfile({
          username: data.username || "username",
          display_name: data.display_name || null,
          bio: data.bio || null,
          avatar_url: data.avatar_url || null,
          banner_url: data.banner_url || null,
        });
      }
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("badges(id, code, name)")
        .eq("user_id", user.id);
      if (Array.isArray(badgesData)) {
        const normalizedBadges = badgesData as Array<{
          badges: { id: string; code?: string | null; name?: string | null } | null;
        }>;
        setPreviewBadges(
          normalizedBadges
            .map((entry) => entry.badges)
            .filter(Boolean)
            .slice(0, 8)
        );
      } else {
        setPreviewBadges([]);
      }
    };
    loadPreviewProfile();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Profile Layout Builder</h3>
        <p className="text-slate-300 text-sm mb-4">
          Build your own profile layout with section controls and ordering.
          This is part of Flair Premium.
        </p>
        <button
          onClick={onNavigateToSubscription}
          className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Upgrade to Premium
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white">Profile Layout Builder</h3>
          <p className="text-sm text-slate-400 mt-1">
            Visual 1:1 editor for your public profile.
          </p>
          {hasUnsavedChanges && (
            <p className="mt-2 text-xs text-amber-300">You have unsaved layout changes.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Layout"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div>

        <div className="relative group rounded-xl border border-slate-700 bg-slate-900/60 overflow-visible">
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-slate-950/20 transition-opacity duration-250 group-hover:opacity-0">
            <div className="px-6 text-center">
              <p className="text-lg sm:text-2xl font-semibold tracking-tight text-white drop-shadow-md">
                Drag blocks to reposition
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-200/90">
                Hover to begin editing your layout. Click content to view properties.
              </p>
            </div>
          </div>
          {selectedEditableBlock && (
            <div
              ref={propertiesPanelRef}
              className="fixed z-[80] w-[min(24rem,calc(100vw-24px))] max-h-[calc(100vh-24px)] overflow-y-auto overscroll-contain rounded-xl border border-slate-600 bg-slate-900 p-3 shadow-2xl"
              style={{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Content Properties</p>
                  <p className="text-sm font-semibold text-white">{selectedContentLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEditableBlock(null)}
                  className="rounded-md border border-slate-600 bg-slate-800/70 p-1 text-slate-300 hover:text-white"
                  aria-label="Close properties"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {selectedEditableBlock === "tabs" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400">
                    Drag rows or use arrows to reorder tabs. Color swatches offer quick picks.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="col-span-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2">
                      <span className="text-[10px] text-slate-400">Page Background</span>
                      <input
                        type="color"
                        value={layout.theme.surface}
                        onChange={(e) => setThemeSurface(e.target.value)}
                        className="mt-1 h-7 w-full rounded border border-slate-600 bg-slate-800 p-0"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {TAB_COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={`surface-${swatch}`}
                            type="button"
                            title={swatch}
                            onClick={() => setThemeSurface(swatch)}
                            className="h-4 w-4 rounded border border-slate-500"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </label>
                    <label className="rounded-lg border border-slate-700 bg-slate-800/60 p-2">
                      <span className="text-[10px] text-slate-400">Strip Start</span>
                      <input
                        type="color"
                        value={tabTheme.stripStart}
                        onChange={(e) => setThemeTabColor("stripStart", e.target.value)}
                        className="mt-1 h-7 w-full rounded border border-slate-600 bg-slate-800 p-0"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {TAB_COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={`strip-start-${swatch}`}
                            type="button"
                            title={swatch}
                            onClick={() => setThemeTabColor("stripStart", swatch)}
                            className="h-4 w-4 rounded border border-slate-500"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </label>
                    <label className="rounded-lg border border-slate-700 bg-slate-800/60 p-2">
                      <span className="text-[10px] text-slate-400">Strip End</span>
                      <input
                        type="color"
                        value={tabTheme.stripEnd}
                        onChange={(e) => setThemeTabColor("stripEnd", e.target.value)}
                        className="mt-1 h-7 w-full rounded border border-slate-600 bg-slate-800 p-0"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {TAB_COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={`strip-end-${swatch}`}
                            type="button"
                            title={swatch}
                            onClick={() => setThemeTabColor("stripEnd", swatch)}
                            className="h-4 w-4 rounded border border-slate-500"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </label>
                    <label className="rounded-lg border border-slate-700 bg-slate-800/60 p-2">
                      <span className="text-[10px] text-slate-400">Active Start</span>
                      <input
                        type="color"
                        value={tabTheme.activeStart}
                        onChange={(e) => setThemeTabColor("activeStart", e.target.value)}
                        className="mt-1 h-7 w-full rounded border border-slate-600 bg-slate-800 p-0"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {TAB_COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={`active-start-${swatch}`}
                            type="button"
                            title={swatch}
                            onClick={() => setThemeTabColor("activeStart", swatch)}
                            className="h-4 w-4 rounded border border-slate-500"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </label>
                    <label className="rounded-lg border border-slate-700 bg-slate-800/60 p-2">
                      <span className="text-[10px] text-slate-400">Active End</span>
                      <input
                        type="color"
                        value={tabTheme.activeEnd}
                        onChange={(e) => setThemeTabColor("activeEnd", e.target.value)}
                        className="mt-1 h-7 w-full rounded border border-slate-600 bg-slate-800 p-0"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {TAB_COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={`active-end-${swatch}`}
                            type="button"
                            title={swatch}
                            onClick={() => setThemeTabColor("activeEnd", swatch)}
                            className="h-4 w-4 rounded border border-slate-500"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </label>
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Tab Order</p>
                    {layout.tabs.order.map((tabId, idx) => (
                      <div
                        key={tabId}
                        draggable
                        onDragStart={(event) => handleTabDragStart(event, tabId)}
                        onDragEnd={handleTabDragEnd}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDragEnter={() => setDragOverTab(tabId)}
                        onDrop={() => handleTabDrop(tabId)}
                        className={`flex cursor-grab active:cursor-grabbing items-center gap-2 rounded-lg border px-2 py-1.5 ${
                          draggingTab === tabId
                            ? "border-purple-500 bg-purple-600/20"
                            : dragOverTab === tabId
                              ? "border-blue-400/70 bg-blue-500/10"
                              : "border-slate-700 bg-slate-800/60"
                        }`}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-slate-500" />
                        <span className="min-w-0 flex-1 truncate text-xs text-slate-100">{TAB_LABELS[tabId]}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              moveTabByDirection(tabId, "up");
                            }}
                            disabled={idx === 0}
                            className="rounded border border-slate-600 bg-slate-800/80 p-0.5 text-slate-300 hover:text-white disabled:opacity-40"
                            aria-label={`Move ${TAB_LABELS[tabId]} up`}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              moveTabByDirection(tabId, "down");
                            }}
                            disabled={idx === layout.tabs.order.length - 1}
                            className="rounded border border-slate-600 bg-slate-800/80 p-0.5 text-slate-300 hover:text-white disabled:opacity-40"
                            aria-label={`Move ${TAB_LABELS[tabId]} down`}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEditableBlock === "background" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400">
                    Set the background and accent colors for your profile page canvas and icon accents.
                  </p>
                  <label className="rounded-lg border border-slate-700 bg-slate-800/60 p-2 block">
                    <span className="text-[10px] text-slate-400">Accent Color</span>
                    <input
                      type="color"
                      value={layout.theme.accent}
                      onChange={(e) => setThemeAccent(e.target.value)}
                      className="mt-1 h-8 w-full rounded border border-slate-600 bg-slate-800 p-0"
                    />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {TAB_COLOR_SWATCHES.map((swatch) => (
                        <button
                          key={`accent-panel-${swatch}`}
                          type="button"
                          title={swatch}
                          onClick={() => setThemeAccent(swatch)}
                          className="h-5 w-5 rounded border border-slate-500"
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>
                  </label>
                  <label className="rounded-lg border border-slate-700 bg-slate-800/60 p-2 block">
                    <span className="text-[10px] text-slate-400">Page Background</span>
                    <input
                      type="color"
                      value={layout.theme.surface}
                      onChange={(e) => setThemeSurface(e.target.value)}
                      className="mt-1 h-8 w-full rounded border border-slate-600 bg-slate-800 p-0"
                    />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {TAB_COLOR_SWATCHES.map((swatch) => (
                        <button
                          key={`bg-panel-${swatch}`}
                          type="button"
                          title={swatch}
                          onClick={() => setThemeSurface(swatch)}
                          className="h-5 w-5 rounded border border-slate-500"
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>
                  </label>
                </div>
              )}

              {selectedEditableBlock === "stats" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(["normal", "compact"] as const).map((variant) => (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setStatsVariant(variant)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                          layout.header.stats.variant === variant
                            ? "bg-purple-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {variant === "normal" ? "Normal" : "Compact"}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-slate-700 pt-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Stats Order</p>
                    {statsOrder.map((itemId, idx) => (
                      <div
                        key={itemId}
                        draggable
                        onDragStart={(event) => handleStatsDragStart(event, itemId)}
                        onDragEnd={() => {
                          setDraggingStatsItem(null);
                          setDragOverStatsItem(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDragEnter={() => setDragOverStatsItem(itemId)}
                        onDrop={() => {
                          if (!draggingStatsItem) return;
                          reorderStatsItems(draggingStatsItem, itemId);
                          setDraggingStatsItem(null);
                          setDragOverStatsItem(null);
                        }}
                        className={`flex cursor-grab active:cursor-grabbing items-center gap-2 rounded-lg border px-2 py-1.5 ${
                          draggingStatsItem === itemId
                            ? "border-purple-500 bg-purple-600/20"
                            : dragOverStatsItem === itemId
                              ? "border-blue-400/70 bg-blue-500/10"
                              : "border-slate-700 bg-slate-800/60"
                        }`}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-slate-500" />
                        <span className="flex-1 text-xs text-slate-100">{STATS_ITEM_LABELS[itemId]}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              moveStatsByDirection(itemId, "up");
                            }}
                            disabled={idx === 0}
                            className="rounded border border-slate-600 bg-slate-800/80 p-0.5 text-slate-300 hover:text-white disabled:opacity-40"
                            aria-label={`Move ${STATS_ITEM_LABELS[itemId]} up`}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              moveStatsByDirection(itemId, "down");
                            }}
                            disabled={idx === statsOrder.length - 1}
                            className="rounded border border-slate-600 bg-slate-800/80 p-0.5 text-slate-300 hover:text-white disabled:opacity-40"
                            aria-label={`Move ${STATS_ITEM_LABELS[itemId]} down`}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEditableBlock === "identity" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
                      Custom Display Name
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(event) => setCustomName(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter your custom display name"
                    />
                  </div>
                  <div>
                    <p className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">
                      Display Name Animation
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "none", label: "Static" },
                        { id: "glow", label: "Glow" },
                        { id: "pulse", label: "Pulse" },
                        { id: "scroll", label: "Scroll" },
                        { id: "gradient", label: "Gradient Shift" },
                        { id: "rainbow", label: "Rainbow" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setNameAnimation(option.id)}
                          className={`rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                            nameAnimation === option.id
                              ? "border-purple-500 bg-purple-500/20 text-white"
                              : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          <div className="font-semibold">{option.label}</div>
                          <FlairNameText
                            name="@Sample"
                            animation={option.id}
                            gradientJson={nameGradientJson}
                            className="text-[11px]"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-2.5">
                    <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">Gradient Colors</p>
                    <div className="mb-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setColorCount(2)}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                          colorCount === 2 ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        2 colors
                      </button>
                      <button
                        type="button"
                        onClick={() => setColorCount(3)}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                          colorCount === 3 ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        3 colors
                      </button>
                    </div>
                    <div className={`grid gap-2 ${colorCount === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {Array.from({ length: colorCount }).map((_, idx) => (
                        <label key={idx} className="rounded-md border border-slate-700 bg-slate-800/70 p-1.5">
                          <span className="text-[10px] text-slate-400">
                            {idx === 0 ? "Main" : idx === 1 ? "Accent" : "Secondary"}
                          </span>
                          <input
                            type="color"
                            value={gradientColors[idx] || "#a855f7"}
                            onChange={(event) =>
                              setGradientColors((prev) => {
                                const next = [...prev];
                                next[idx] = event.target.value;
                                return next;
                              })
                            }
                            className="mt-1 h-7 w-full rounded border border-slate-600 bg-slate-800 p-0"
                          />
                        </label>
                      ))}
                    </div>
                    {nameAnimation === "rainbow" && (
                      <div className="mt-2 border-t border-slate-700 pt-2">
                        <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">Rainbow style</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRainbowMode("standard")}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                              rainbowMode === "standard" ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            Standard RGB
                          </button>
                          <button
                            type="button"
                            onClick={() => setRainbowMode("custom")}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                              rainbowMode === "custom" ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            Selected colors
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleIdentitySave}
                    disabled={isSavingIdentity}
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isSavingIdentity ? "Saving..." : "Save Username Style"}
                  </button>
                </div>
              )}

              {selectedEditableBlock !== "tabs" && selectedEditableBlock !== "stats" && selectedEditableBlock !== "identity" && selectedEditableBlock !== "background" && (
                <p className="text-xs text-slate-400">
                  Drag this block directly on the canvas. More properties for this content are coming next.
                </p>
              )}
            </div>
          )}
          <div
            role="button"
            tabIndex={0}
            onClick={(event) => selectEditableBlock(event, "background")}
            className="rounded-none overflow-visible bg-slate-900/50 cursor-pointer"
            style={{ backgroundColor: layout.theme.surface }}
          >
            <div className="p-0 pb-4">
              {sectionEnabled.hero && (
                <div
                  className="relative h-48 sm:h-64 md:h-80 rounded-xl overflow-visible bg-slate-800"
                >
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    {previewProfile?.banner_url ? (
                      <img src={previewProfile.banner_url} alt="Banner preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>

                  {layout.header.blockOrder.includes("actions") && (
                    <div
                      className={`absolute right-4 sm:right-6 z-20 transition-[top] duration-300 ease-out ${
                        shouldLiftPreviewActions ? "top-4 sm:top-5 md:top-6" : "top-36 sm:top-48 md:top-60"
                      }`}
                    >
                      <div className="pointer-events-none select-none rounded-xl border border-slate-500/60 bg-slate-900/85 px-2 py-1 shadow-lg backdrop-blur-sm">
                        <div className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow">
                          <Lock className="h-3 w-3" />
                          Edit Profile
                        </div>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-300/80 text-center">
                          Fixed Action
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className="absolute left-24 sm:left-32 md:left-40 bottom-[-3rem] sm:bottom-[-4rem] md:bottom-[-5rem]"
                    style={{
                      transform: `translate(calc(-50% + ${previewAvatarX}px), ${previewAvatarY}px)`,
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onMouseDown={(event) => handleBlockDragStart(event, "avatar")}
                      onClick={(event) => selectEditableBlock(event, "avatar")}
                      onMouseEnter={() => setDragHoverTargetBlock((prev) => (activeDragBlock ? "avatar" : prev))}
                      onMouseLeave={() => setDragHoverTargetBlock((prev) => (prev === "avatar" ? null : prev))}
                      ref={(node) => {
                        previewBlockRefs.current.avatar = node;
                      }}
                      className={`relative group/block w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 bg-slate-800 overflow-hidden shadow-xl cursor-grab active:cursor-grabbing transition ${
                        activeDragBlock?.blockId === "avatar"
                          ? "border-purple-400 ring-2 ring-purple-400/60"
                          : dragHoverTargetBlock === "avatar"
                            ? "border-blue-400 ring-2 ring-blue-400/60"
                            : "hover:ring-2 hover:ring-purple-400/45"
                      }`}
                      style={{
                        transform: `scale(${layout.header.avatar.size})`,
                        transformOrigin: "center bottom",
                        borderColor:
                          activeDragBlock?.blockId === "avatar"
                            ? undefined
                            : dragHoverTargetBlock === "avatar"
                              ? undefined
                              : layout.theme.surface,
                      }}
                    >
                      <span className="pointer-events-none absolute -right-2 -top-2 rounded-full border border-slate-600 bg-slate-800/85 p-1 opacity-0 transition group-hover/block:opacity-100">
                        <GripVertical className="h-3 w-3 text-slate-300" />
                      </span>
                      {previewProfile?.avatar_url ? (
                        <img src={previewProfile.avatar_url} alt="Avatar preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {sectionEnabled.about && (
                <div className={sectionEnabled.hero ? "pt-16 sm:pt-20 md:pt-24 px-4" : "pt-1 px-4"}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div
                        role="button"
                        tabIndex={0}
                        onMouseDown={(event) => handleBlockDragStart(event, "identity")}
                        onClick={(event) => selectEditableBlock(event, "identity")}
                        onMouseEnter={() => setDragHoverTargetBlock((prev) => (activeDragBlock ? "identity" : prev))}
                        onMouseLeave={() => setDragHoverTargetBlock((prev) => (prev === "identity" ? null : prev))}
                        title={`Drag ${DRAG_BLOCK_LABELS.identity}`}
                        ref={(node) => {
                          previewBlockRefs.current.identity = node;
                        }}
                        className={`relative group/block block w-fit cursor-grab active:cursor-grabbing rounded-md transition ${
                          activeDragBlock?.blockId === "identity"
                            ? "ring-2 ring-purple-400/60"
                            : dragHoverTargetBlock === "identity"
                              ? "ring-2 ring-blue-400/60"
                              : "hover:ring-2 hover:ring-purple-400/45"
                        }`}
                        style={getDragStyle("identity")}
                      >
                        <span className="pointer-events-none absolute -right-2 -top-2 rounded-full border border-slate-600 bg-slate-800/85 p-1 opacity-0 transition group-hover/block:opacity-100">
                          <GripVertical className="h-3 w-3 text-slate-300" />
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <FlairNameText
                            name={`@${customName.trim() || flairProfile?.custom_display_name || previewProfile?.display_name || previewProfile?.username || "username"}`}
                            animation={nameAnimation}
                            gradientJson={nameGradientJson}
                            className="text-2xl font-bold text-white"
                          />
                        </div>
                      </div>

                      {previewProfile?.bio && (
                        <div
                          role="button"
                          tabIndex={0}
                          onMouseDown={(event) => handleBlockDragStart(event, "bio")}
                          onClick={(event) => selectEditableBlock(event, "bio")}
                          onMouseEnter={() => setDragHoverTargetBlock((prev) => (activeDragBlock ? "bio" : prev))}
                          onMouseLeave={() => setDragHoverTargetBlock((prev) => (prev === "bio" ? null : prev))}
                          title={`Drag ${DRAG_BLOCK_LABELS.bio}`}
                          ref={(node) => {
                            previewBlockRefs.current.bio = node;
                          }}
                          className={`relative group/block block w-fit cursor-grab active:cursor-grabbing rounded-md transition ${
                            activeDragBlock?.blockId === "bio"
                              ? "ring-2 ring-purple-400/60"
                              : dragHoverTargetBlock === "bio"
                                ? "ring-2 ring-blue-400/60"
                                : "hover:ring-2 hover:ring-purple-400/45"
                          }`}
                          style={getDragStyle("bio")}
                        >
                          <span className="pointer-events-none absolute -right-2 -top-2 rounded-full border border-slate-600 bg-slate-800/85 p-1 opacity-0 transition group-hover/block:opacity-100">
                            <GripVertical className="h-3 w-3 text-slate-300" />
                          </span>
                          <p className="text-sm text-slate-300 mb-2">{previewProfile.bio}</p>
                        </div>
                      )}

                      {layout.header.blockOrder.includes("stats") && (
                        <div
                          role="button"
                          tabIndex={0}
                          onMouseDown={(event) => handleBlockDragStart(event, "stats")}
                          onClick={(event) => selectEditableBlock(event, "stats")}
                          onMouseEnter={() => setDragHoverTargetBlock((prev) => (activeDragBlock ? "stats" : prev))}
                          onMouseLeave={() => setDragHoverTargetBlock((prev) => (prev === "stats" ? null : prev))}
                          title={`Drag ${DRAG_BLOCK_LABELS.stats}`}
                          ref={(node) => {
                            previewBlockRefs.current.stats = node;
                          }}
                          className={`relative group/block inline-block align-middle w-fit cursor-grab active:cursor-grabbing rounded-md transition ${
                            activeDragBlock?.blockId === "stats"
                              ? "ring-2 ring-purple-400/60"
                              : dragHoverTargetBlock === "stats"
                                ? "ring-2 ring-blue-400/60"
                                : "hover:ring-2 hover:ring-purple-400/45"
                          }`}
                          style={getDragStyle("stats")}
                        >
                          <span className="pointer-events-none absolute -right-2 -top-2 rounded-full border border-slate-600 bg-slate-800/85 p-1 opacity-0 transition group-hover/block:opacity-100">
                            <GripVertical className="h-3 w-3 text-slate-300" />
                          </span>
                          <div
                            className={
                              layout.header.stats.variant === "compact"
                                ? "inline-flex flex-wrap items-center gap-2 rounded-full border border-slate-700/70 bg-slate-800/35 px-2.5 py-1 text-[11px] text-slate-400"
                                : "mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-300"
                            }
                          >
                            {layout.header.stats.variant === "compact" ? (
                              statsOrder.map((itemId, idx) => (
                                <span key={itemId} className="inline-flex items-center gap-2">
                                  {idx > 0 && <span className="text-slate-600">•</span>}
                                  {itemId === "joined" && <span>Joined Mar 2026</span>}
                                  {itemId === "followers" && <span>128 followers</span>}
                                  {itemId === "following" && <span>54 following</span>}
                                  {itemId === "favorites" && <span>Favorites</span>}
                                </span>
                              ))
                            ) : (
                              statsOrder.map((itemId, idx) => (
                                <span key={itemId} className="inline-flex items-center gap-4">
                                  {idx > 0 && <span className="text-slate-600">•</span>}
                                  {itemId === "joined" && (
                                    <span className="inline-flex items-center gap-1 text-slate-400">
                                      <Calendar className="h-3.5 w-3.5" />
                                      Joined Mar 2026
                                    </span>
                                  )}
                                  {itemId === "followers" && (
                                    <span className="inline-flex items-center gap-1 text-slate-300">
                                      <Users className="h-3.5 w-3.5" />
                                      <span className="font-medium text-slate-100">128</span>
                                      followers
                                    </span>
                                  )}
                                  {itemId === "following" && (
                                    <span className="inline-flex items-center gap-1 text-slate-300">
                                      <UserPlus className="h-3.5 w-3.5" />
                                      <span className="font-medium text-slate-100">54</span>
                                      following
                                    </span>
                                  )}
                                  {itemId === "favorites" && (
                                    <span
                                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-slate-200"
                                      style={{
                                        backgroundColor: adaptiveColors.chipBg,
                                        border: `1px solid ${adaptiveColors.chipBorder}`,
                                      }}
                                    >
                                      <Heart className="h-3 w-3" />
                                      Favorites
                                    </span>
                                  )}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {layout.header.blockOrder.includes("socials") && (
                        <div
                          role="button"
                          tabIndex={0}
                          onMouseDown={(event) => handleBlockDragStart(event, "socials")}
                          onClick={(event) => selectEditableBlock(event, "socials")}
                          onMouseEnter={() => setDragHoverTargetBlock((prev) => (activeDragBlock ? "socials" : prev))}
                          onMouseLeave={() => setDragHoverTargetBlock((prev) => (prev === "socials" ? null : prev))}
                          title={`Drag ${DRAG_BLOCK_LABELS.socials}`}
                          ref={(node) => {
                            previewBlockRefs.current.socials = node;
                          }}
                          className={`relative group/block inline-block align-middle w-fit cursor-grab active:cursor-grabbing rounded-md transition ${
                            activeDragBlock?.blockId === "socials"
                              ? "ring-2 ring-purple-400/60"
                              : dragHoverTargetBlock === "socials"
                                ? "ring-2 ring-blue-400/60"
                                : "hover:ring-2 hover:ring-purple-400/45"
                          }`}
                          style={getDragStyle("socials")}
                        >
                          <span className="pointer-events-none absolute -right-2 -top-2 rounded-full border border-slate-600 bg-slate-800/85 p-1 opacity-0 transition group-hover/block:opacity-100">
                            <GripVertical className="h-3 w-3 text-slate-300" />
                          </span>
                          <div
                            className={`${layout.header.blockOrder.includes("stats") ? "mt-2 inline-flex flex-wrap items-center gap-2" : "mt-3 inline-flex flex-wrap items-center gap-2"}`}
                          >
                            {layout.header.blockOrder.includes("stats") && <span className="text-slate-600">•</span>}
                            {socialItems.map((item) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-600/70 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300"
                              >
                                {item.icon}
                                {item.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      role="button"
                      tabIndex={0}
                      onMouseDown={(event) => handleBlockDragStart(event, "achievements")}
                      onClick={(event) => selectEditableBlock(event, "achievements")}
                      onMouseEnter={() => setDragHoverTargetBlock((prev) => (activeDragBlock ? "achievements" : prev))}
                      onMouseLeave={() => setDragHoverTargetBlock((prev) => (prev === "achievements" ? null : prev))}
                      title={`Drag ${DRAG_BLOCK_LABELS.achievements}`}
                      ref={(node) => {
                        previewBlockRefs.current.achievements = node;
                      }}
                      className={`relative group/block md:w-52 flex-shrink-0 cursor-grab active:cursor-grabbing rounded-md transition ${
                        activeDragBlock?.blockId === "achievements"
                          ? "ring-2 ring-purple-400/60"
                          : dragHoverTargetBlock === "achievements"
                            ? "ring-2 ring-blue-400/60"
                            : "hover:ring-2 hover:ring-purple-400/45"
                      }`}
                      style={getDragStyle("achievements")}
                    >
                      <span className="pointer-events-none absolute -right-2 -top-2 rounded-full border border-slate-600 bg-slate-800/85 p-1 opacity-0 transition group-hover/block:opacity-100">
                        <GripVertical className="h-3 w-3 text-slate-300" />
                      </span>
                      <div
                        className="rounded-lg p-2.5"
                        style={{
                          backgroundColor: adaptiveColors.containerBg,
                          border: `1px solid ${adaptiveColors.containerBorder}`,
                        }}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">Achievements</p>
                        {previewBadges.length > 0 ? (
                          <div className="grid grid-cols-4 gap-1.5">
                            {previewBadges.map((badge) => (
                              <div
                                key={badge.id}
                                title={badge.name || "Badge"}
                                className="h-8 w-8 rounded-md border border-slate-600 bg-slate-700/70 flex items-center justify-center text-[10px] text-slate-200"
                              >
                                {(badge.code || "★").toString().slice(0, 2).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No badges yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sectionEnabled.highlights && (
                <div className="mt-5 px-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(event) => selectEditableBlock(event, "tabs")}
                  className={`w-full cursor-pointer rounded-lg transition ${
                    selectedEditableBlock === "tabs"
                      ? "ring-2 ring-purple-400/60"
                      : "hover:ring-2 hover:ring-purple-400/45"
                  }`}
                >
                  <div className="mx-auto flex w-full max-w-5xl flex-wrap justify-center gap-1 rounded-xl p-1.5 border" style={tabStripStyle}>
                    {layout.tabs.order.map((tabId, idx) => (
                      <span
                        key={`preview-tab-${tabId}`}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                          idx === 0 ? "text-white" : "text-slate-300"
                        }`}
                        style={
                          idx === 0
                            ? {
                                backgroundImage: activeTabGradientCss,
                                boxShadow: `0 6px 14px ${hexToRgba(tabTheme.activeStart, 0.35)}`,
                              }
                            : undefined
                        }
                      >
                        {TAB_LABELS[tabId]}
                      </span>
                    ))}
                  </div>
                  <div className="mx-auto mt-3 w-full max-w-5xl rounded-lg bg-slate-800/40 p-3 text-sm text-slate-400">
                    Active tab preview content area
                  </div>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
