export const PREDEFINED_TAGS = [
  'anxiety',
  'grief',
  'joy',
  'anger',
  'hope',
  'overwhelm',
  'loneliness',
  'peace',
  'work',
  'family',
  'relationships',
  'health',
  'identity',
  'creativity',
  'finances',
  'home',
  'boundaries',
  'rest',
  'self-compassion',
  'healing',
  'growth',
  'community',
  'justice',
  'belonging',
  'safety',
  'independence',
  'change',
  'gratitude',
  'resilience',
  'letting-go',
] as const;

export type PredefinedTag = (typeof PREDEFINED_TAGS)[number];

type TagCategory = 'emotion' | 'life' | 'care' | 'social' | 'process';

const TAG_CATEGORIES: Record<string, TagCategory> = {
  anxiety: 'emotion',
  grief: 'emotion',
  joy: 'emotion',
  anger: 'emotion',
  hope: 'emotion',
  overwhelm: 'emotion',
  loneliness: 'emotion',
  peace: 'emotion',
  work: 'life',
  family: 'life',
  relationships: 'life',
  health: 'life',
  identity: 'life',
  creativity: 'life',
  finances: 'life',
  home: 'life',
  boundaries: 'care',
  rest: 'care',
  'self-compassion': 'care',
  healing: 'care',
  growth: 'care',
  community: 'social',
  justice: 'social',
  belonging: 'social',
  safety: 'social',
  independence: 'social',
  change: 'process',
  gratitude: 'process',
  resilience: 'process',
  'letting-go': 'process',
};

/**
 * Returns inline style for a tag based on its category.
 * Uses CSS custom properties defined in globals.css so it
 * adapts to light/dark mode automatically.
 */
export function getTagStyle(tag: string): React.CSSProperties {
  const category = TAG_CATEGORIES[tag] ?? 'process';
  return {
    backgroundColor: `var(--tag-${category})`,
    color: `var(--tag-${category}-fg)`,
  };
}
