export const PROFILE_TAB_IDS = [
  "pairs",
  "pfps",
  "banners",
  "emotes",
  "wallpapers",
  "collections",
  "emojicombos",
  "favorites",
] as const;

export type ProfileTabId = (typeof PROFILE_TAB_IDS)[number];

export const HEADER_BLOCK_IDS = [
  "avatar",
  "identity",
  "stats",
  "socials",
  "actions",
] as const;

export type HeaderBlockId = (typeof HEADER_BLOCK_IDS)[number];
export const PROFILE_STATS_ITEM_IDS = ["joined", "followers", "following", "favorites"] as const;
export type ProfileStatsItemId = (typeof PROFILE_STATS_ITEM_IDS)[number];

export const DEFAULT_TAB_ORDER: ProfileTabId[] = [...PROFILE_TAB_IDS];
export const DEFAULT_HEADER_BLOCK_ORDER: HeaderBlockId[] = [...HEADER_BLOCK_IDS];
export const PROFILE_DRAG_BLOCK_IDS = [
  "avatar",
  "identity",
  "bio",
  "stats",
  "socials",
  "achievements",
  "tabs",
] as const;

export type ProfileDragBlockId = (typeof PROFILE_DRAG_BLOCK_IDS)[number];

export const PROFILE_SOCIAL_IDS = ["discord", "instagram", "website"] as const;
export type ProfileSocialId = (typeof PROFILE_SOCIAL_IDS)[number];

export function normalizeTabOrder(input: unknown): ProfileTabId[] {
  const requested = Array.isArray(input) ? input : [];
  const validRequested = requested
    .filter((value): value is ProfileTabId => typeof value === "string" && PROFILE_TAB_IDS.includes(value as ProfileTabId));
  const unique: ProfileTabId[] = [];
  for (const id of validRequested) {
    if (!unique.includes(id)) unique.push(id);
  }
  for (const fallback of DEFAULT_TAB_ORDER) {
    if (!unique.includes(fallback)) unique.push(fallback);
  }
  return unique;
}

export function normalizeHeaderBlockOrder(input: unknown): HeaderBlockId[] {
  const requested = Array.isArray(input) ? input : [];
  const validRequested = requested
    .filter((value): value is HeaderBlockId => typeof value === "string" && HEADER_BLOCK_IDS.includes(value as HeaderBlockId));
  const unique: HeaderBlockId[] = [];
  for (const id of validRequested) {
    if (!unique.includes(id)) unique.push(id);
  }
  for (const fallback of DEFAULT_HEADER_BLOCK_ORDER) {
    if (!unique.includes(fallback)) unique.push(fallback);
  }
  return unique;
}

export function normalizeStatsItemOrder(input: unknown): ProfileStatsItemId[] {
  const requested = Array.isArray(input) ? input : [];
  const validRequested = requested.filter(
    (value): value is ProfileStatsItemId =>
      typeof value === "string" && PROFILE_STATS_ITEM_IDS.includes(value as ProfileStatsItemId)
  );
  const unique: ProfileStatsItemId[] = [];
  for (const id of validRequested) {
    if (!unique.includes(id)) unique.push(id);
  }
  for (const fallback of PROFILE_STATS_ITEM_IDS) {
    if (!unique.includes(fallback)) unique.push(fallback);
  }
  return unique;
}

export function normalizeSocialOrder(input: unknown): ProfileSocialId[] {
  const requested = Array.isArray(input) ? input : [];
  const validRequested = requested.filter(
    (value): value is ProfileSocialId =>
      typeof value === "string" && PROFILE_SOCIAL_IDS.includes(value as ProfileSocialId)
  );
  const unique: ProfileSocialId[] = [];
  for (const id of validRequested) {
    if (!unique.includes(id)) unique.push(id);
  }
  for (const fallback of PROFILE_SOCIAL_IDS) {
    if (!unique.includes(fallback)) unique.push(fallback);
  }
  return unique;
}

export function normalizeWebsiteUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function normalizeDragOffset(
  value: unknown,
  fallback: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  if (!value || typeof value !== "object") return fallback;
  const asObj = value as Record<string, unknown>;
  const x = typeof asObj.x === "number" ? asObj.x : fallback.x;
  const y = typeof asObj.y === "number" ? asObj.y : fallback.y;
  return {
    x: Number.isFinite(x) ? x : fallback.x,
    y: Number.isFinite(y) ? y : fallback.y,
  };
}

type RgbColor = { r: number; g: number; b: number };

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHexToRgb(hex: string): RgbColor | null {
  if (!/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(hex)) return null;
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (value: number) => clampChannel(value).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHexToRgb(hex);
  if (!rgb) return `rgba(168,85,247,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function isHexLight(hex: string): boolean {
  const rgb = parseHexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.6;
}

export function shiftHexColor(hex: string, amount: number): string {
  const rgb = parseHexToRgb(hex);
  if (!rgb) return hex;
  const weight = Math.max(0, Math.min(1, Math.abs(amount)));
  const toward = amount >= 0 ? 255 : 0;
  return rgbToHex({
    r: rgb.r + (toward - rgb.r) * weight,
    g: rgb.g + (toward - rgb.g) * weight,
    b: rgb.b + (toward - rgb.b) * weight,
  });
}

export function getAccentGradient(accent: string): {
  start: string;
  end: string;
  css: string;
} {
  const start = accent;
  const end = shiftHexColor(accent, isHexLight(accent) ? -0.28 : 0.28);
  return {
    start,
    end,
    css: `linear-gradient(135deg, ${start}, ${end})`,
  };
}

export function getAdaptiveContainerColors(surface: string): {
  containerBg: string;
  containerBorder: string;
  chipBg: string;
  chipBorder: string;
  mutedText: string;
} {
  const lightSurface = isHexLight(surface);
  const base = lightSurface ? shiftHexColor(surface, -0.24) : shiftHexColor(surface, 0.2);
  const chip = lightSurface ? shiftHexColor(surface, -0.34) : shiftHexColor(surface, 0.3);
  return {
    containerBg: hexToRgba(base, lightSurface ? 0.5 : 0.58),
    containerBorder: hexToRgba(shiftHexColor(base, lightSurface ? -0.18 : 0.18), 0.52),
    chipBg: hexToRgba(chip, lightSurface ? 0.62 : 0.72),
    chipBorder: hexToRgba(shiftHexColor(chip, lightSurface ? -0.2 : 0.2), 0.62),
    mutedText: lightSurface ? "#334155" : "#94a3b8",
  };
}
