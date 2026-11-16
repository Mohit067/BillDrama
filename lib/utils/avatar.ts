/** Two-letter initials from a name ("Mohit Sharma" → "MS", "priya" → "PR"). */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return Array.from(words[0]).slice(0, 2).join("").toUpperCase();
  return (Array.from(words[0])[0] + Array.from(words[words.length - 1])[0]).toUpperCase();
}

/**
 * Hand-picked, slightly muted colours (think coloured pencils, not neon).
 * The first 12 people get one each; beyond that we spread hues evenly so a
 * 30-person trip still has a distinct colour per person.
 */
const AVATAR_COLORS = [
  "#c8553d", // brick
  "#2f6690", // denim
  "#3a7d44", // leaf
  "#b0697a", // rose
  "#7a6a9a", // lavender
  "#c98a2a", // turmeric
  "#2a8c82", // teal
  "#8d5a97", // plum
  "#5c6b73", // slate
  "#9a5b3a", // cinnamon
  "#4d7c8a", // sea
  "#8a7a3c", // olive
];

export function getAvatarColor(colorIndex: number): string {
  if (colorIndex < AVATAR_COLORS.length) return AVATAR_COLORS[colorIndex];
  const hue = Math.round((colorIndex * 137.508) % 360);
  return `hsl(${hue} 38% 46%)`;
}

/** Lowest colour index not in use, so removed people free up their colour. */
export function nextColorIndex(used: readonly number[]): number {
  const taken = new Set(used);
  let index = 0;
  while (taken.has(index)) index++;
  return index;
}
