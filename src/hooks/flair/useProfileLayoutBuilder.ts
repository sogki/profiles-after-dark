import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/authContext";
import {
  DEFAULT_HEADER_BLOCK_ORDER,
  PROFILE_DRAG_BLOCK_IDS,
  DEFAULT_TAB_ORDER,
  getAccentGradient,
  normalizeDragOffset,
  normalizeHeaderBlockOrder,
  normalizeStatsItemOrder,
  normalizeSocialOrder,
  normalizeTabOrder,
  type HeaderBlockId,
  type ProfileDragBlockId,
  type ProfileSocialId,
  type ProfileStatsItemId,
  type ProfileTabId,
} from "@/components/users/profile/layoutPrimitives";

export type LayoutSectionType = "hero" | "about" | "highlights";

export interface LayoutSection {
  id: string;
  type: LayoutSectionType;
  enabled: boolean;
  order: number;
}

export interface ProfileLayoutTheme {
  mode: string;
  accent: string;
  surface: string;
  tabs: {
    stripStart: string;
    stripEnd: string;
    activeStart: string;
    activeEnd: string;
  };
}

export interface ProfileLayoutPayload {
  schemaVersion: number;
  theme: ProfileLayoutTheme;
  sections: LayoutSection[];
  header: {
    blockOrder: HeaderBlockId[];
    avatar: {
      x: number;
      y: number;
      size: number;
    };
    stats: {
      variant: "compact" | "normal";
      order: ProfileStatsItemId[];
    };
    socials: {
      order: ProfileSocialId[];
    };
  };
  tabs: {
    order: ProfileTabId[];
  };
  drag: {
    grid: number;
    blocks: Record<ProfileDragBlockId, { x: number; y: number }>;
  };
}

export interface ProfileSocialLinks {
  discord: string;
  instagram: string;
  website: string;
}

export interface ProfileLayoutPresetInput {
  theme?: Partial<ProfileLayoutPayload["theme"]> & {
    tabs?: Partial<ProfileLayoutPayload["theme"]["tabs"]>;
  };
  sections?: LayoutSection[];
  header?: Partial<ProfileLayoutPayload["header"]> & {
    avatar?: Partial<ProfileLayoutPayload["header"]["avatar"]>;
    stats?: Partial<ProfileLayoutPayload["header"]["stats"]>;
    socials?: Partial<ProfileLayoutPayload["header"]["socials"]>;
  };
  tabs?: Partial<ProfileLayoutPayload["tabs"]>;
  drag?: Partial<ProfileLayoutPayload["drag"]> & {
    blocks?: Partial<ProfileLayoutPayload["drag"]["blocks"]>;
  };
}

const DEFAULT_LAYOUT: ProfileLayoutPayload = {
  schemaVersion: 1,
  theme: {
    mode: "default",
    accent: "#a855f7",
    surface: "#0f172a",
    tabs: {
      stripStart: "#a855f7",
      stripEnd: "#7c3aed",
      activeStart: "#a855f7",
      activeEnd: "#7c3aed",
    },
  },
  sections: [
    { id: "hero", type: "hero", enabled: true, order: 1 },
    { id: "about", type: "about", enabled: true, order: 2 },
    { id: "highlights", type: "highlights", enabled: true, order: 3 },
  ],
  header: {
    blockOrder: DEFAULT_HEADER_BLOCK_ORDER,
    avatar: {
      x: 0,
      y: 0,
      size: 1,
    },
    stats: {
      variant: "normal",
      order: ["joined", "followers", "following", "favorites"],
    },
    socials: {
      order: ["discord", "instagram", "website"],
    },
  },
  tabs: {
    order: DEFAULT_TAB_ORDER,
  },
  drag: {
    grid: 8,
    blocks: {
      avatar: { x: 0, y: 0 },
      identity: { x: 0, y: 0 },
      bio: { x: 0, y: 0 },
      stats: { x: 0, y: 0 },
      socials: { x: 0, y: 0 },
      achievements: { x: 0, y: 0 },
      tabs: { x: 0, y: 0 },
    },
  },
};

const SECTION_TYPES: LayoutSectionType[] = ["hero", "about", "highlights"];

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);

function sanitizeLayout(input: unknown): ProfileLayoutPayload {
  const asObject = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const themeInput =
    asObject.theme && typeof asObject.theme === "object"
      ? (asObject.theme as Record<string, unknown>)
      : {};
  const rawSections = Array.isArray(asObject.sections) ? asObject.sections : [];

  const mapped = rawSections
    .map((section, index) => {
      if (!section || typeof section !== "object") return null;
      const s = section as Record<string, unknown>;
      const type = typeof s.type === "string" ? (s.type as LayoutSectionType) : null;
      if (!type || !SECTION_TYPES.includes(type)) return null;
      return {
        id: typeof s.id === "string" ? s.id : type,
        type,
        enabled: s.enabled !== false,
        order: typeof s.order === "number" ? s.order : index + 1,
      } satisfies LayoutSection;
    })
    .filter(Boolean) as LayoutSection[];

  const byType = new Map<LayoutSectionType, LayoutSection>();
  for (const section of mapped) {
    if (!byType.has(section.type)) byType.set(section.type, section);
  }

  for (const type of SECTION_TYPES) {
    if (!byType.has(type)) {
      const fallback = DEFAULT_LAYOUT.sections.find((s) => s.type === type);
      if (fallback) byType.set(type, { ...fallback });
    }
  }

  const sections = Array.from(byType.values())
    .sort((a, b) => a.order - b.order)
    .map((section, idx) => ({ ...section, order: idx + 1 }));

  const resolvedAccent = isHexColor(themeInput.accent) ? themeInput.accent : DEFAULT_LAYOUT.theme.accent;
  const accentFallback = getAccentGradient(resolvedAccent);
  const themeTabsInput =
    themeInput.tabs && typeof themeInput.tabs === "object"
      ? (themeInput.tabs as Record<string, unknown>)
      : {};

  return {
    schemaVersion: 1,
    theme: {
      mode: typeof themeInput.mode === "string" ? themeInput.mode : DEFAULT_LAYOUT.theme.mode,
      accent: resolvedAccent,
      surface: isHexColor(themeInput.surface) ? themeInput.surface : DEFAULT_LAYOUT.theme.surface,
      tabs: {
        stripStart: isHexColor(themeTabsInput.stripStart) ? themeTabsInput.stripStart : accentFallback.start,
        stripEnd: isHexColor(themeTabsInput.stripEnd) ? themeTabsInput.stripEnd : accentFallback.end,
        activeStart: isHexColor(themeTabsInput.activeStart) ? themeTabsInput.activeStart : accentFallback.start,
        activeEnd: isHexColor(themeTabsInput.activeEnd) ? themeTabsInput.activeEnd : accentFallback.end,
      },
    },
    sections,
    header: {
      blockOrder: normalizeHeaderBlockOrder(asObject.header && typeof asObject.header === "object" ? (asObject.header as Record<string, unknown>).blockOrder : null),
      avatar: {
        x:
          asObject.header &&
          typeof asObject.header === "object" &&
          (asObject.header as Record<string, unknown>).avatar &&
          typeof (asObject.header as Record<string, unknown>).avatar === "object" &&
          typeof ((asObject.header as Record<string, unknown>).avatar as Record<string, unknown>).x === "number"
            ? (((asObject.header as Record<string, unknown>).avatar as Record<string, unknown>).x as number)
            : DEFAULT_LAYOUT.header.avatar.x,
        y:
          asObject.header &&
          typeof asObject.header === "object" &&
          (asObject.header as Record<string, unknown>).avatar &&
          typeof (asObject.header as Record<string, unknown>).avatar === "object" &&
          typeof ((asObject.header as Record<string, unknown>).avatar as Record<string, unknown>).y === "number"
            ? (((asObject.header as Record<string, unknown>).avatar as Record<string, unknown>).y as number)
            : DEFAULT_LAYOUT.header.avatar.y,
        size:
          asObject.header &&
          typeof asObject.header === "object" &&
          (asObject.header as Record<string, unknown>).avatar &&
          typeof (asObject.header as Record<string, unknown>).avatar === "object" &&
          typeof ((asObject.header as Record<string, unknown>).avatar as Record<string, unknown>).size === "number"
            ? Math.min(
                1.35,
                Math.max(
                  0.75,
                  ((asObject.header as Record<string, unknown>).avatar as Record<string, unknown>).size as number
                )
              )
            : DEFAULT_LAYOUT.header.avatar.size,
      },
      stats: {
        variant:
          asObject.header &&
          typeof asObject.header === "object" &&
          (asObject.header as Record<string, unknown>).stats &&
          typeof (asObject.header as Record<string, unknown>).stats === "object" &&
          (((asObject.header as Record<string, unknown>).stats as Record<string, unknown>).variant === "normal" ||
            ((asObject.header as Record<string, unknown>).stats as Record<string, unknown>).variant === "compact")
            ? (((asObject.header as Record<string, unknown>).stats as Record<string, unknown>).variant as "compact" | "normal")
            : DEFAULT_LAYOUT.header.stats.variant,
        order: normalizeStatsItemOrder(
          asObject.header &&
            typeof asObject.header === "object" &&
            (asObject.header as Record<string, unknown>).stats &&
            typeof (asObject.header as Record<string, unknown>).stats === "object"
            ? ((asObject.header as Record<string, unknown>).stats as Record<string, unknown>).order
            : null
        ),
      },
      socials: {
        order: normalizeSocialOrder(
          asObject.header &&
            typeof asObject.header === "object" &&
            (asObject.header as Record<string, unknown>).socials &&
            typeof (asObject.header as Record<string, unknown>).socials === "object"
            ? ((asObject.header as Record<string, unknown>).socials as Record<string, unknown>).order
            : null
        ),
      },
    },
    tabs: {
      order: normalizeTabOrder(
        asObject.tabs && typeof asObject.tabs === "object" ? (asObject.tabs as Record<string, unknown>).order : null
      ),
    },
    drag: {
      grid:
        asObject.drag &&
        typeof asObject.drag === "object" &&
        typeof (asObject.drag as Record<string, unknown>).grid === "number"
          ? Math.max(4, Math.min(32, Math.round((asObject.drag as Record<string, unknown>).grid as number)))
          : DEFAULT_LAYOUT.drag.grid,
      blocks: PROFILE_DRAG_BLOCK_IDS.reduce(
        (acc, blockId) => {
          const blockInput =
            asObject.drag &&
            typeof asObject.drag === "object" &&
            (asObject.drag as Record<string, unknown>).blocks &&
            typeof (asObject.drag as Record<string, unknown>).blocks === "object"
              ? ((asObject.drag as Record<string, unknown>).blocks as Record<string, unknown>)[blockId]
              : null;
          acc[blockId] = normalizeDragOffset(blockInput, DEFAULT_LAYOUT.drag.blocks[blockId]);
          return acc;
        },
        {} as Record<ProfileDragBlockId, { x: number; y: number }>
      ),
    },
  };
}

export function useProfileLayoutBuilder() {
  const { user } = useAuth();
  const [layout, setLayout] = useState<ProfileLayoutPayload>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<ProfileSocialLinks>({
    discord: "",
    instagram: "",
    website: "",
  });
  const [savedSnapshot, setSavedSnapshot] = useState<string>(
    JSON.stringify({
      layout: DEFAULT_LAYOUT,
      socialLinks: { discord: "", instagram: "", website: "" },
    })
  );

  const fetchLayout = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("flair_profile_layouts")
        .select("layout_json, is_published")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const { data: socialData, error: socialError } = await supabase
        .from("user_profiles")
        .select("discord, instagram, website")
        .eq("user_id", user.id)
        .maybeSingle();
      if (socialError) throw socialError;
      const normalizedSocials: ProfileSocialLinks = {
        discord: socialData?.discord || "",
        instagram: socialData?.instagram || "",
        website: socialData?.website || "",
      };
      setSocialLinks(normalizedSocials);

      if (!data) {
        setLayout(DEFAULT_LAYOUT);
        setSavedSnapshot(
          JSON.stringify({ layout: DEFAULT_LAYOUT, socialLinks: normalizedSocials })
        );
      } else {
        const sanitized = sanitizeLayout(data.layout_json);
        setLayout(sanitized);
        setSavedSnapshot(
          JSON.stringify({ layout: sanitized, socialLinks: normalizedSocials })
        );
      }
    } catch (err) {
      console.error("Error loading profile layout:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile layout");
      setLayout(DEFAULT_LAYOUT);
      setSocialLinks({ discord: "", instagram: "", website: "" });
      setSavedSnapshot(
        JSON.stringify({
          layout: DEFAULT_LAYOUT,
          socialLinks: { discord: "", instagram: "", website: "" },
        })
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  const normalizedSections = useMemo(
    () => [...layout.sections].sort((a, b) => a.order - b.order).map((section, i) => ({ ...section, order: i + 1 })),
    [layout.sections]
  );

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        layout: { ...layout, sections: normalizedSections },
        socialLinks,
      }),
    [layout, normalizedSections, socialLinks]
  );
  const hasUnsavedChanges = currentSnapshot !== savedSnapshot;

  const updateSections = useCallback((next: LayoutSection[]) => {
    const fixed = next.map((section, idx) => ({ ...section, order: idx + 1 }));
    setLayout((prev) => ({ ...prev, sections: fixed }));
  }, []);

  const toggleSection = useCallback(
    (type: LayoutSectionType) => {
      updateSections(
        normalizedSections.map((section) =>
          section.type === type ? { ...section, enabled: !section.enabled } : section
        )
      );
    },
    [normalizedSections, updateSections]
  );

  const moveSection = useCallback(
    (type: LayoutSectionType, direction: "up" | "down") => {
      const idx = normalizedSections.findIndex((section) => section.type === type);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= normalizedSections.length) return;
      const next = [...normalizedSections];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      updateSections(next);
    },
    [normalizedSections, updateSections]
  );

  const reorderSections = useCallback(
    (fromType: LayoutSectionType, toType: LayoutSectionType) => {
      if (fromType === toType) return;
      const fromIndex = normalizedSections.findIndex((section) => section.type === fromType);
      const toIndex = normalizedSections.findIndex((section) => section.type === toType);
      if (fromIndex < 0 || toIndex < 0) return;
      const next = [...normalizedSections];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      updateSections(next);
    },
    [normalizedSections, updateSections]
  );

  const setThemeAccent = useCallback((accent: string) => {
    if (!isHexColor(accent)) return;
    setLayout((prev) => ({ ...prev, theme: { ...prev.theme, accent } }));
  }, []);

  const setThemeSurface = useCallback((surface: string) => {
    if (!isHexColor(surface)) return;
    setLayout((prev) => ({ ...prev, theme: { ...prev.theme, surface } }));
  }, []);

  const setThemeTabColor = useCallback(
    (key: keyof ProfileLayoutTheme["tabs"], value: string) => {
      if (!isHexColor(value)) return;
      setLayout((prev) => ({
        ...prev,
        theme: {
          ...prev.theme,
          tabs: {
            ...prev.theme.tabs,
            [key]: value,
          },
        },
      }));
    },
    []
  );

  const setAvatarOffsetX = useCallback((x: number) => {
    setLayout((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        avatar: {
          ...prev.header.avatar,
          x,
        },
      },
    }));
  }, []);

  const setAvatarOffsetY = useCallback((y: number) => {
    setLayout((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        avatar: {
          ...prev.header.avatar,
          y,
        },
      },
    }));
  }, []);

  const setAvatarSize = useCallback((size: number) => {
    const normalized = Math.min(1.35, Math.max(0.75, size));
    setLayout((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        avatar: {
          ...prev.header.avatar,
          size: normalized,
        },
      },
    }));
  }, []);

  const setStatsVariant = useCallback((variant: "compact" | "normal") => {
    setLayout((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        stats: {
          ...prev.header.stats,
          variant,
        },
      },
    }));
  }, []);

  const reorderStatsItems = useCallback((fromItemId: ProfileStatsItemId, toItemId: ProfileStatsItemId) => {
    if (fromItemId === toItemId) return;
    setLayout((prev) => {
      const fromIndex = prev.header.stats.order.findIndex((id) => id === fromItemId);
      const toIndex = prev.header.stats.order.findIndex((id) => id === toItemId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev.header.stats.order];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return {
        ...prev,
        header: {
          ...prev.header,
          stats: {
            ...prev.header.stats,
            order: next,
          },
        },
      };
    });
  }, []);

  const reorderSocialOrder = useCallback((fromSocialId: ProfileSocialId, toSocialId: ProfileSocialId) => {
    if (fromSocialId === toSocialId) return;
    setLayout((prev) => {
      const fromIndex = prev.header.socials.order.findIndex((id) => id === fromSocialId);
      const toIndex = prev.header.socials.order.findIndex((id) => id === toSocialId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev.header.socials.order];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return {
        ...prev,
        header: {
          ...prev.header,
          socials: {
            ...prev.header.socials,
            order: next,
          },
        },
      };
    });
  }, []);

  const moveTab = useCallback((tabId: ProfileTabId, direction: "up" | "down") => {
    setLayout((prev) => {
      const idx = prev.tabs.order.findIndex((id) => id === tabId);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.tabs.order.length) return prev;
      const next = [...prev.tabs.order];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return {
        ...prev,
        tabs: {
          ...prev.tabs,
          order: next,
        },
      };
    });
  }, []);

  const reorderTabs = useCallback((fromTabId: ProfileTabId, toTabId: ProfileTabId) => {
    if (fromTabId === toTabId) return;
    setLayout((prev) => {
      const fromIndex = prev.tabs.order.findIndex((id) => id === fromTabId);
      const toIndex = prev.tabs.order.findIndex((id) => id === toTabId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev.tabs.order];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return {
        ...prev,
        tabs: {
          ...prev.tabs,
          order: next,
        },
      };
    });
  }, []);

  const moveHeaderBlock = useCallback((blockId: HeaderBlockId, direction: "up" | "down") => {
    setLayout((prev) => {
      const idx = prev.header.blockOrder.findIndex((id) => id === blockId);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.header.blockOrder.length) return prev;
      const next = [...prev.header.blockOrder];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return {
        ...prev,
        header: {
          ...prev.header,
          blockOrder: next,
        },
      };
    });
  }, []);

  const reorderHeaderBlocks = useCallback((fromBlockId: HeaderBlockId, toBlockId: HeaderBlockId) => {
    if (fromBlockId === toBlockId) return;
    setLayout((prev) => {
      const fromIndex = prev.header.blockOrder.findIndex((id) => id === fromBlockId);
      const toIndex = prev.header.blockOrder.findIndex((id) => id === toBlockId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const next = [...prev.header.blockOrder];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return {
        ...prev,
        header: {
          ...prev.header,
          blockOrder: next,
        },
      };
    });
  }, []);

  const setSocialLink = useCallback((field: keyof ProfileSocialLinks, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setDragBlockOffset = useCallback((blockId: ProfileDragBlockId, x: number, y: number) => {
    setLayout((prev) => ({
      ...prev,
      drag: {
        ...prev.drag,
        blocks: {
          ...prev.drag.blocks,
          [blockId]: { x, y },
        },
      },
    }));
  }, []);

  const resetToDefault = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    setSocialLinks({ discord: "", instagram: "", website: "" });
  }, []);

  const applyLayoutPreset = useCallback((preset: ProfileLayoutPresetInput) => {
    setLayout((prev) =>
      sanitizeLayout({
        ...prev,
        ...(preset.sections ? { sections: preset.sections } : {}),
        theme: {
          ...prev.theme,
          ...(preset.theme || {}),
          tabs: {
            ...prev.theme.tabs,
            ...(preset.theme?.tabs || {}),
          },
        },
        header: {
          ...prev.header,
          ...(preset.header || {}),
          avatar: {
            ...prev.header.avatar,
            ...(preset.header?.avatar || {}),
          },
          stats: {
            ...prev.header.stats,
            ...(preset.header?.stats || {}),
            ...(preset.header?.stats?.order ? { order: preset.header.stats.order } : {}),
          },
          socials: {
            ...prev.header.socials,
            ...(preset.header?.socials || {}),
            ...(preset.header?.socials?.order ? { order: preset.header.socials.order } : {}),
          },
        },
        tabs: {
          ...prev.tabs,
          ...(preset.tabs || {}),
          ...(preset.tabs?.order ? { order: preset.tabs.order } : {}),
        },
        drag: {
          ...prev.drag,
          ...(preset.drag || {}),
          blocks: {
            ...prev.drag.blocks,
            ...(preset.drag?.blocks || {}),
          },
        },
      })
    );
  }, []);

  const saveLayout = useCallback(async () => {
    if (!user?.id) throw new Error("Authentication required");
    setSaving(true);
    setError(null);
    try {
      const payload: ProfileLayoutPayload = {
        schemaVersion: 1,
        theme: {
          mode: layout.theme.mode || "default",
          accent: isHexColor(layout.theme.accent) ? layout.theme.accent : DEFAULT_LAYOUT.theme.accent,
          surface: isHexColor(layout.theme.surface) ? layout.theme.surface : DEFAULT_LAYOUT.theme.surface,
          tabs: {
            stripStart: isHexColor(layout.theme.tabs.stripStart)
              ? layout.theme.tabs.stripStart
              : DEFAULT_LAYOUT.theme.tabs.stripStart,
            stripEnd: isHexColor(layout.theme.tabs.stripEnd)
              ? layout.theme.tabs.stripEnd
              : DEFAULT_LAYOUT.theme.tabs.stripEnd,
            activeStart: isHexColor(layout.theme.tabs.activeStart)
              ? layout.theme.tabs.activeStart
              : DEFAULT_LAYOUT.theme.tabs.activeStart,
            activeEnd: isHexColor(layout.theme.tabs.activeEnd)
              ? layout.theme.tabs.activeEnd
              : DEFAULT_LAYOUT.theme.tabs.activeEnd,
          },
        },
        sections: normalizedSections.map((section, idx) => ({
          ...section,
          order: idx + 1,
          enabled: section.enabled !== false,
        })),
        header: {
          blockOrder: [...layout.header.blockOrder],
          avatar: {
            x: layout.header.avatar.x,
            y: layout.header.avatar.y,
            size: layout.header.avatar.size,
          },
          stats: {
            variant: layout.header.stats.variant,
            order: normalizeStatsItemOrder(layout.header.stats.order),
          },
          socials: {
            order: normalizeSocialOrder(layout.header.socials.order),
          },
        },
        tabs: {
          order: [...layout.tabs.order],
        },
        drag: {
          grid: layout.drag.grid,
          blocks: PROFILE_DRAG_BLOCK_IDS.reduce(
            (acc, blockId) => {
              acc[blockId] = normalizeDragOffset(layout.drag.blocks[blockId], { x: 0, y: 0 });
              return acc;
            },
            {} as Record<ProfileDragBlockId, { x: number; y: number }>
          ),
        },
      };

      const { error: rpcError } = await supabase.rpc("upsert_my_flair_profile_layout", {
        p_layout_json: payload,
        p_is_published: true,
      });

      if (rpcError) throw rpcError;

      const { error: profileUpdateError } = await supabase
        .from("user_profiles")
        .update({
          discord: socialLinks.discord.trim() || null,
          instagram: socialLinks.instagram.trim() || null,
          website: socialLinks.website.trim() || null,
        })
        .eq("user_id", user.id);
      if (profileUpdateError) throw profileUpdateError;

      setSavedSnapshot(JSON.stringify({ layout: payload, socialLinks }));
    } catch (err) {
      console.error("Error saving profile layout:", err);
      const message = err instanceof Error ? err.message : "Failed to save profile layout";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [
    layout.header.avatar.size,
    layout.header.avatar.x,
    layout.header.avatar.y,
    layout.header.blockOrder,
    layout.header.stats.variant,
    layout.header.stats.order,
    layout.header.socials.order,
    layout.tabs.order,
    layout.drag.grid,
    layout.drag.blocks.avatar,
    layout.drag.blocks.achievements,
    layout.drag.blocks.bio,
    layout.drag.blocks.identity,
    layout.drag.blocks.socials,
    layout.drag.blocks.stats,
    layout.drag.blocks.tabs,
    layout.theme.accent,
    layout.theme.mode,
    layout.theme.surface,
    layout.theme.tabs.activeEnd,
    layout.theme.tabs.activeStart,
    layout.theme.tabs.stripEnd,
    layout.theme.tabs.stripStart,
    normalizedSections,
    socialLinks,
    user?.id,
  ]);

  return {
    layout: {
      ...layout,
      sections: normalizedSections,
    },
    loading,
    saving,
    error,
    hasUnsavedChanges,
    socialLinks,
    refetch: fetchLayout,
    toggleSection,
    moveSection,
    reorderSections,
    moveTab,
    reorderTabs,
    moveHeaderBlock,
    reorderHeaderBlocks,
    setThemeAccent,
    setThemeSurface,
    setThemeTabColor,
    setAvatarOffsetX,
    setAvatarOffsetY,
    setAvatarSize,
    setStatsVariant,
    reorderStatsItems,
    reorderSocialOrder,
    setDragBlockOffset,
    setSocialLink,
    applyLayoutPreset,
    resetToDefault,
    saveLayout,
  };
}
