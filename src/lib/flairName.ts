export type FlairAnimation = 'none' | 'glow' | 'pulse' | 'scroll' | 'gradient' | 'rainbow';
export type FlairRainbowMode = 'standard' | 'custom';

export interface FlairGradientConfig {
  colors: string[];
  rainbowMode?: FlairRainbowMode;
}

const DEFAULT_COLORS = ['#a855f7', '#ec4899', '#3b82f6'];

export function parseFlairGradient(input: string | null | undefined): FlairGradientConfig {
  if (!input) return { colors: DEFAULT_COLORS };

  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      const colors = parsed.filter((value) => typeof value === 'string');
      return { colors: colors.length >= 2 ? colors.slice(0, 3) : DEFAULT_COLORS };
    }
    if (parsed && Array.isArray(parsed.colors)) {
      const colors = parsed.colors.filter((value: unknown) => typeof value === 'string');
      const rainbowMode = parsed.rainbowMode === 'custom' ? 'custom' : 'standard';
      return { colors: colors.length >= 2 ? colors.slice(0, 3) : DEFAULT_COLORS, rainbowMode };
    }
  } catch {
    // Keep resilient fallback for older malformed values.
  }

  return { colors: DEFAULT_COLORS };
}

export function buildFlairGradientString(colors: string[], rainbowMode: FlairRainbowMode = 'standard'): string {
  const valid = colors.filter(Boolean).slice(0, 3);
  const safe = valid.length >= 2 ? valid : DEFAULT_COLORS;
  return JSON.stringify({ colors: safe, rainbowMode });
}

export function getFlairAnimationClass(animation: string | null | undefined): string {
  switch (animation) {
    case 'glow':
      return 'flair-name-glow';
    case 'pulse':
      return 'flair-name-pulse';
    case 'scroll':
      return 'flair-name-scroll';
    case 'gradient':
      return 'flair-name-gradient-shift';
    case 'rainbow':
      return 'flair-name-rainbow';
    default:
      return '';
  }
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  const full = normalized.length === 3 ? normalized.split('').map((c) => `${c}${c}`).join('') : normalized;
  const safe = /^[0-9a-fA-F]{6}$/.test(full) ? full : 'a855f7';
  return {
    r: parseInt(safe.slice(0, 2), 16),
    g: parseInt(safe.slice(2, 4), 16),
    b: parseInt(safe.slice(4, 6), 16),
  };
}

export function hexToRgbCss(hex: string) {
  const rgb = hexToRgb(hex);
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function blendHex(a: string, b: string, weight: number) {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * weight,
    c1.g + (c2.g - c1.g) * weight,
    c1.b + (c2.b - c1.b) * weight
  );
}

export function buildSmoothGradient(colors: string[]) {
  const safe = colors.length >= 2 ? colors.slice(0, 3) : DEFAULT_COLORS;
  const [main, accent, secondary = accent] = safe;
  const m1 = blendHex(main, accent, 0.4);
  const m2 = blendHex(accent, secondary, 0.4);
  const m3 = blendHex(secondary, accent, 0.4);
  const m4 = blendHex(accent, main, 0.4);
  // Mirrored gradient avoids harsh loop reset when background-position restarts.
  return `linear-gradient(110deg, ${main} 0%, ${m1} 14%, ${accent} 30%, ${m2} 48%, ${secondary} 64%, ${m3} 80%, ${accent} 90%, ${m4} 96%, ${main} 100%)`;
}
