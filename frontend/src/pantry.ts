export interface PantryItem {
  id: string;
  name: string;
  emoji: string;
}

export const STAPLE_DEFINITIONS: PantryItem[] = [
  {id: 'oil', name: 'Dầu ăn', emoji: '🫗'},
  {id: 'fish-sauce', name: 'Nước mắm', emoji: '🍶'},
  {id: 'soy-sauce', name: 'Nước tương', emoji: '🍶'},
  {id: 'salt', name: 'Muối', emoji: '🧂'},
  {id: 'sugar', name: 'Đường', emoji: '🥄'},
  {id: 'pepper', name: 'Tiêu', emoji: '🧂'},
];

export const STAPLE_ID_SET = new Set(STAPLE_DEFINITIONS.map(s => s.id));

export function isStaple(id: string): boolean {
  return STAPLE_ID_SET.has(id);
}

const STORAGE_KEY = 'bua_nha_pantry_staples';

export function getPantryStaples(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    void e;
  }
  // Default: most Vietnamese households already have essential seasonings
  return ['oil', 'fish-sauce', 'salt', 'sugar', 'soy-sauce', 'pepper'];
}

export function savePantryStaples(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event('pantry_updated'));
  } catch (e) {
    void e;
  }
}

export function subscribePantry(callback: (staples: string[]) => void): () => void {
  const handler = () => callback(getPantryStaples());
  window.addEventListener('pantry_updated', handler);
  return () => window.removeEventListener('pantry_updated', handler);
}
