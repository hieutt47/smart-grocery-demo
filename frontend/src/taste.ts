import {getRecipeNutrition} from './nutrition';
import type {Recipe} from './types';

export type PersonaId = 'office_busy' | 'fit_eatclean' | 'student_saver' | 'family_care';

export interface TasteProfile {
  persona: PersonaId | null;
  liked_tags: string[];
  disliked_ingredients: string[];
  tag_scores: Record<string, number>;
  recent_viewed: string[];
  onboarded: boolean;
}

const TASTE_KEY = 'bua_nha_taste_profile_v2';

export const PERSONA_DEFINITIONS: {
  id: PersonaId;
  emoji: string;
  title: string;
  sub: string;
  boostTags: string[];
}[] = [
  {
    id: 'office_busy',
    emoji: '💼',
    title: 'Dân văn phòng bận rộn',
    sub: 'Nấu nhanh ≤ 15p · Cơm hộp gọn nhẹ',
    boostTags: ['nhanh', 'món mặn', 'mì']
  },
  {
    id: 'fit_eatclean',
    emoji: '🥗',
    title: 'Eat Clean & Giữ dáng',
    sub: 'Giàu đạm · Ít dầu mỡ · ≤ 380 kcal',
    boostTags: ['eat-clean', 'rau', 'gà']
  },
  {
    id: 'student_saver',
    emoji: '💰',
    title: 'Ăn ngon tiết kiệm',
    sub: 'Chi phí mềm · Nguyên liệu tối giản',
    boostTags: ['trứng', 'đậu', 'nhanh']
  },
  {
    id: 'family_care',
    emoji: '❤️',
    title: 'Chăm sóc Gia đình & Sức khỏe',
    sub: 'Cân bằng dinh dưỡng · Thanh đạm ấm bụng',
    boostTags: ['canh', 'rau', 'cá']
  }
];

export const TASTE_LIKE_CHIPS: {id: string; label: string}[] = [
  {id: 'gà', label: '🍗 Mê thịt gà'},
  {id: 'bò', label: '🥩 Thích thịt bò'},
  {id: 'tôm', label: '🦐 Tôm & Hải sản'},
  {id: 'trứng', label: '🥚 Trứng & Đậu hũ'},
  {id: 'rau', label: '🥬 Nhiều rau xanh'},
  {id: 'mì', label: '🍜 Mì / Bún / Miến'},
  {id: 'canh', label: '🍲 Canh thanh mát'},
  {id: 'món mặn', label: '🥘 Món đậm đà đưa cơm'}
];

export const TASTE_DISLIKE_CHIPS: {id: string; label: string; tagMatch: string}[] = [
  {id: 'fish', label: '🚫 Không thích cá', tagMatch: 'cá'},
  {id: 'pork', label: '🚫 Hạn chế thịt heo', tagMatch: 'heo'},
  {id: 'shrimp', label: '🚫 Tránh tôm', tagMatch: 'tôm'}
];

export function defaultTasteProfile(): TasteProfile {
  return {
    persona: null,
    liked_tags: [],
    disliked_ingredients: [],
    tag_scores: {},
    recent_viewed: [],
    onboarded: false
  };
}

export function getTasteProfile(): TasteProfile {
  try {
    const raw = localStorage.getItem(TASTE_KEY);
    if (!raw) return defaultTasteProfile();
    const parsed = JSON.parse(raw);
    return {
      ...defaultTasteProfile(),
      ...parsed,
      liked_tags: Array.isArray(parsed.liked_tags) ? parsed.liked_tags : [],
      disliked_ingredients: Array.isArray(parsed.disliked_ingredients) ? parsed.disliked_ingredients : [],
      tag_scores: parsed.tag_scores && typeof parsed.tag_scores === 'object' ? parsed.tag_scores : {},
      recent_viewed: Array.isArray(parsed.recent_viewed) ? parsed.recent_viewed : []
    };
  } catch {
    return defaultTasteProfile();
  }
}

export function saveTasteProfile(profile: TasteProfile): void {
  try {
    localStorage.setItem(TASTE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event('taste-updated'));
  } catch {
    // ignore storage errors
  }
}

export function subscribeTaste(callback: (profile: TasteProfile) => void): () => void {
  const handler = () => callback(getTasteProfile());
  window.addEventListener('taste-updated', handler);
  return () => window.removeEventListener('taste-updated', handler);
}

export function openTasteOnboarding(): void {
  window.dispatchEvent(new Event('open-taste-onboarding'));
}

const ACTION_WEIGHTS: Record<'view' | 'save' | 'copy' | 'share' | 'skip', number> = {
  view: 2,
  save: 5,
  copy: 6,
  share: 6,
  skip: -3
};

export function recordTasteSignal(
  tags: string[],
  action: 'view' | 'save' | 'copy' | 'share' | 'skip',
  recipeId?: string
): void {
  const profile = getTasteProfile();
  const delta = ACTION_WEIGHTS[action];
  const nextScores = {...profile.tag_scores};
  for (const rawTag of tags) {
    const tag = rawTag.trim().toLowerCase();
    if (!tag) continue;
    nextScores[tag] = Math.max(-20, Math.min(40, (nextScores[tag] || 0) + delta));
  }
  const nextViewed =
    recipeId && action === 'view'
      ? [recipeId, ...profile.recent_viewed.filter(id => id !== recipeId)].slice(0, 12)
      : profile.recent_viewed;
  saveTasteProfile({
    ...profile,
    tag_scores: nextScores,
    recent_viewed: nextViewed
  });
}

export interface RankedRecipe {
  recipe: Recipe;
  score: number;
  matchReason: string;
}

export function rankRecipesForYou(
  recipes: Recipe[],
  profile: TasteProfile,
  nowHour = new Date().getHours()
): RankedRecipe[] {
  const dislikedTags = new Set(
    TASTE_DISLIKE_CHIPS.filter(c => profile.disliked_ingredients.includes(c.id)).map(c => c.tagMatch)
  );
  const likedSet = new Set(profile.liked_tags.map(t => t.toLowerCase()));
  const personaDef = PERSONA_DEFINITIONS.find(p => p.id === profile.persona);

  const ranked: RankedRecipe[] = [];
  for (const r of recipes) {
    const rTags = (r.tags || []).map(t => t.toLowerCase());
    if (rTags.some(t => dislikedTags.has(t))) {
      continue;
    }

    const nutrition = getRecipeNutrition(r.id);
    let score = 0;
    let reason = '';

    // 1. Persona match
    if (profile.persona === 'office_busy' && r.minutes <= 15) {
      score += 38;
      reason = `Nấu nhanh ${r.minutes}p · Chuẩn văn phòng`;
    } else if (profile.persona === 'fit_eatclean' && (nutrition.eatClean || nutrition.kcal <= 350)) {
      score += 42;
      reason = `Hợp gu Eat Clean · ~${nutrition.kcal} kcal`;
    } else if (profile.persona === 'student_saver' && (rTags.includes('trứng') || rTags.includes('đậu') || r.minutes <= 15)) {
      score += 38;
      reason = 'Nguyên liệu gọn · Tiết kiệm';
    } else if (profile.persona === 'family_care' && (rTags.includes('canh') || rTags.includes('rau') || nutrition.eatClean)) {
      score += 38;
      reason = 'Thanh đạm · Tốt cho sức khỏe';
    }

    if (personaDef) {
      for (const bt of personaDef.boostTags) {
        if (rTags.includes(bt)) score += 12;
      }
    }

    // 2. Explicit liked tags
    for (const t of rTags) {
      if (likedSet.has(t)) {
        score += 26;
        if (!reason) reason = `Đúng sở thích món ${t} của bạn`;
      }
    }

    // 3. Implicit behavioral tag_scores
    let behaviorBoost = 0;
    let topBehaviorTag = '';
    let topBehaviorVal = 0;
    for (const t of rTags) {
      const val = profile.tag_scores[t] || 0;
      behaviorBoost += val * 2;
      if (val > topBehaviorVal) {
        topBehaviorVal = val;
        topBehaviorTag = t;
      }
    }
    score += behaviorBoost;
    if (!reason && topBehaviorVal >= 4) {
      reason = `Đề xuất từ món ${topBehaviorTag} bạn hay xem`;
    }

    // 4. Time-of-day contextual boost
    if (nowHour >= 17 && nowHour <= 21 && r.minutes <= 20) {
      score += 10;
      if (!reason) reason = `Bữa tối nhanh gọn ${r.minutes} phút`;
    }

    // Slight variety penalty if viewed just now so fresh dishes surface too
    if (profile.recent_viewed[0] === r.id) {
      score -= 6;
    }

    if (!reason) {
      reason = nutrition.eatClean ? `Thanh nhẹ · ~${nutrition.kcal} kcal` : `Dễ nấu · ${r.minutes} phút`;
    }

    ranked.push({recipe: r, score, matchReason: reason});
  }

  ranked.sort((a, b) => b.score - a.score || a.recipe.minutes - b.recipe.minutes);
  return ranked;
}
