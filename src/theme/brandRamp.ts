// Main color -> Fluent BrandVariants ramp, plus contrast helpers (spec section 7).
import { createDarkTheme, createLightTheme, type BrandVariants, type Theme } from '@fluentui/react-components';
import type { ThemeValues } from '../data/types';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const BRAND_KEYS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160] as const;
export type BrandKey = (typeof BRAND_KEYS)[number];

const MAIN_KEY = 80;
const STEP = 10;
// Fraction mixed toward black (darker shades) or white (lighter shades) per step away from 80.
const DARKEN_PER_STEP = 0.11;
const LIGHTEN_PER_STEP = 0.11;
const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };
export const WCAG_AA_TEXT = 4.5;

const clampChannel = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

/** Composite Main (with its alpha) onto white to get an opaque color. */
export function flattenOnWhite(values: Pick<ThemeValues, 'red' | 'green' | 'blue' | 'alpha'>): Rgb {
  const alpha = Math.min(1, Math.max(0, values.alpha));
  const blend = (channel: number) => clampChannel(channel * alpha + 255 * (1 - alpha));
  return { r: blend(values.red), g: blend(values.green), b: blend(values.blue) };
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: clampChannel(from.r + (to.r - from.r) * amount),
    g: clampChannel(from.g + (to.g - from.g) * amount),
    b: clampChannel(from.b + (to.b - from.b) * amount),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function fromHex(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/** 16 shades, keys 10-160: 80 = flattened Main, darker toward 10, lighter toward 160. */
export function buildBrandRamp(main: Rgb): BrandVariants {
  const ramp = {} as Record<BrandKey, string>;
  for (const key of BRAND_KEYS) {
    const steps = Math.abs(key - MAIN_KEY) / STEP;
    if (key < MAIN_KEY) ramp[key] = toHex(mix(main, BLACK, steps * DARKEN_PER_STEP));
    else if (key > MAIN_KEY) ramp[key] = toHex(mix(main, WHITE, steps * LIGHTEN_PER_STEP));
    else ramp[key] = toHex(main);
  }
  return ramp as BrandVariants;
}

export function buildThemes(brand: BrandVariants): { light: Theme; dark: Theme } {
  const dark = createDarkTheme(brand);
  return {
    light: createLightTheme(brand),
    dark: { ...dark, colorBrandForeground1: brand[110], colorBrandForeground2: brand[120] },
  };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Shades that carry white text on Fluent brand buttons (light: 80/70/40, dark: 70/80/40).
const WHITE_TEXT_SHADES: readonly BrandKey[] = [40, 70, 80];

/** Brand shades used under white text that fail WCAG AA, with their ratio. */
export function whiteTextFailures(brand: BrandVariants): { shade: BrandKey; ratio: number }[] {
  return WHITE_TEXT_SHADES.map((shade) => ({ shade, ratio: contrastRatio(fromHex(brand[shade]), WHITE) })).filter(
    ({ ratio }) => ratio < WCAG_AA_TEXT
  );
}
