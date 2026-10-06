import type { ThemeValues } from './types';

// Fade toward white: c + (255 - c) * p / 100 (spec section 7).
export function fadeChannel(channel: number, percent: number): number {
  return Math.round(channel + ((255 - channel) * percent) / 100);
}

export function toRgba(red: number, green: number, blue: number, alpha: number): string {
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function buildThemeColors(values: ThemeValues) {
  const { red, green, blue, alpha, fadeLight, fadeMedium } = values;
  const fade = (percent: number) =>
    toRgba(fadeChannel(red, percent), fadeChannel(green, percent), fadeChannel(blue, percent), alpha);
  return {
    main: toRgba(red, green, blue, alpha),
    light: fade(fadeLight),
    medium: fade(fadeMedium),
  };
}

// Current value -> default value -> config fallback. Non-numeric text falls through.
export function resolveNumber(current: string | undefined, defaultValue: string | undefined, fallback: number): number {
  for (const candidate of [current, defaultValue]) {
    if (candidate === undefined || candidate.trim() === '') continue;
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}
