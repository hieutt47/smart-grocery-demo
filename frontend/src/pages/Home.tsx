import {useEffect, useState} from 'react';
import {
  ArrowRight,
  ChefHat,
  Clock3,
  Dices,
  Leaf,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Users,
  UtensilsCrossed
} from 'lucide-react';
import {Link} from 'react-router-dom';
import {money, trackEvent} from '../api';
import {LoadState, RecipeCard} from '../components';
import {useResource, useStore} from '../context';
import {getRecipeNutrition, OFFICE_LUNCH_OPTIONS, type OfficeLunchOption} from '../nutrition';
import {RecipePhotoCredit, RecipeVisual} from '../recipe-art';
import {RECIPE_PHOTOS} from '../recipe-photos';
import {
  getTasteProfile,
  openTasteOnboarding,
  PERSONA_DEFINITIONS,
  rankRecipesForYou,
  recordTasteSignal,
  subscribeTaste,
  type TasteProfile
} from '../taste';
import type {Recipe} from '../types';

interface HeroSpotlightDish {
  id: 'thit-kho-trung' | 'dau-hu-nhoi-thit-sot-ca' | 'rau-muong-xao';
  title: string;
  shortTitle: string;
  tag: string;
  description: string;
  price: number;
  minutes: number;
  kcal: number;
  pills: string[];
}

const HERO_SPOTLIGHT_DISHES: HeroSpotlightDish[] = [
  {
    id: 'thit-kho-trung',
    title: 'Thịt kho trứng nước dừa',
    shortTitle: 'Thịt kho trứng',
    tag: 'Món mặn đậm đà',
    description:
      'Thịt heo kho mềm quyện cùng trứng gà thấm vị nước dừa óng ả, chuẩn hương vị bữa cơm nhà ấm cúng.',
    price: 58000,
    minutes: 30,
    kcal: 540,
    pills: ['Thịt heo tươi', 'Trứng gà', 'Hành tím']
  },
  {
    id: 'dau-hu-nhoi-thit-sot-ca',
    title: 'Đậu hũ dồn thịt sốt cà chua',
    shortTitle: 'Đậu hũ sốt cà',
    tag: 'Mềm bùi · Dễ tiêu',
    description:
      'Đậu hũ non mềm mịn nhồi thịt băm rim trong sốt cà chua chín đỏ, vị thanh dịu hợp cả trẻ nhỏ lẫn người lớn tuổi.',
    price: 45000,
    minutes: 25,
    kcal: 340,
    pills: ['Đậu hũ non', 'Thịt băm', 'Sốt cà chua']
  },
  {
    id: 'rau-muong-xao',
    title: 'Rau muống xào tỏi phi',
    shortTitle: 'Rau muống xào',
    tag: 'Xanh giòn · 15 phút',
    description:
      'Rau muống non xào lửa lớn giữ trọn sắc xanh giòn ngọt, dậy mùi tỏi đập dập phi vàng thơm phức.',
    price: 25000,
    minutes: 15,
    kcal: 150,
    pills: ['Rau muống non', 'Tỏi phi vàng', 'Dầu hào']
  }
];

const QUICK_MOODS = [
  {icon: UtensilsCrossed, title: 'Ăn trưa ngoài', sub: 'Ý tưởng món và tầm giá', to: '/assistant?mode=lunch'},
  {icon: Clock3, title: 'Nấu trong 20 phút', sub: 'Xem công thức nấu nhanh', to: '/recipes?filter=nhanh'},
  {icon: Leaf, title: 'Món ít dầu', sub: 'Xem nhóm món tham khảo', to: '/recipes?filter=eat-clean'},
  {
    icon: SlidersHorizontal,
    title: 'Ngân sách dưới 60k',
    sub: 'Nhờ trợ lý chọn theo nhu cầu',
    to: `/assistant?q=${encodeURIComponent('Gợi ý món ngon tiết kiệm dưới 60k cho 1 người')}`
  }
];

export function Home() {
  const recipes = useResource<Recipe[]>('/recipes');
  const {shareItem} = useStore();
  const [taste, setTaste] = useState<TasteProfile>(getTasteProfile);
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [pickerMode, setPickerMode] = useState<'lunch' | 'cook'>('lunch');
  const [groupMode, setGroupMode] = useState(false);
  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null);
  const [randomLunch, setRandomLunch] = useState<OfficeLunchOption>(OFFICE_LUNCH_OPTIONS[0]);

  useEffect(() => subscribeTaste(setTaste), []);

  const activeSpotlight = HERO_SPOTLIGHT_DISHES[spotlightIdx] || HERO_SPOTLIGHT_DISHES[0];
  const spotlightPhoto = RECIPE_PHOTOS[activeSpotlight.id];

  const featured = ['rau-muong-xao', 'thit-kho-trung', 'dau-hu-nhoi-thit-sot-ca'];
  const allRecipes = recipes.data || [];
  const hasPersonalization =
    Boolean(taste.persona) ||
    (taste.health_notes && taste.health_notes.length > 0) ||
    taste.liked_tags.length > 0 ||
    taste.disliked_ingredients.length > 0;
  const rankedForYou = rankRecipesForYou(allRecipes, taste);
  const personalizedTop = rankedForYou.slice(0, 6);
  const activePersona = PERSONA_DEFINITIONS.find(p => p.id === taste.persona);
  const displayedRecipe = randomRecipe || (hasPersonalization ? personalizedTop[0]?.recipe : allRecipes[0]) || null;

  function pickRandom() {
    trackEvent(groupMode ? 'group_pick' : 'random_pick', pickerMode);
    if (pickerMode === 'lunch') {
      const pool = OFFICE_LUNCH_OPTIONS.filter(x => x.id !== randomLunch.id);
      setRandomLunch(pool[Math.floor(Math.random() * pool.length)]);
      return;
    }
    const candidateRecipes = hasPersonalization ? rankedForYou.map(x => x.recipe) : allRecipes;
    if (!candidateRecipes.length) return;
    if (displayedRecipe) {
      recordTasteSignal(displayedRecipe.tags || [], 'skip', displayedRecipe.id);
    }
    if (candidateRecipes.length === 1) {
      setRandomRecipe(candidateRecipes[0]);
      return;
    }
    const pool = displayedRecipe ? candidateRecipes.filter(r => r.id !== displayedRecipe.id) : candidateRecipes;
    setRandomRecipe(pool[Math.floor(Math.random() * pool.length)]);
  }

  return (
    <div className="home-page home-clarity">
      <section className="home-intro bua-nha-hero" aria-labelledby="hero-title">
        <div className="home-intro-copy bua-nha-hero-copy">
          <button
            type="button"
            className="bua-nha-taste-pill"
            onClick={openTasteOnboarding}
            title="Tùy chỉnh hồ sơ khẩu vị & sức khỏe"
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>
              {activePersona
                ? `Đang cá nhân hóa: ${activePersona.emoji} ${activePersona.title} · Đổi gu`
                : 'Cá nhân hóa thực đơn theo đối tượng & sức khỏe · Chọn gu'}
            </span>
          </button>

          <h1 id="hero-title">
            Hôm nay ăn gì?
            <span className="bua-nha-hero-accent">Ngon từ điều giản dị.</span>
          </h1>

          <p>
            Chọn món hợp khẩu vị và thể trạng, xem công thức từng bước và tự động lên checklist nguyên liệu kèm chi phí đi chợ dự kiến.
          </p>

          <div className="bua-nha-value-strip" aria-label="Điểm nổi bật">
            <span>🍲 60+ món chuẩn vị nhà</span>
            <span>🧠 AI nhớ thể trạng & dị ứng</span>
            <span>📝 Checklist đi chợ 1 chạm</span>
          </div>

          <div className="home-intro-actions">
            <Link className="button primary" to="/recipes">
              <span>Xem công thức</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="text-link bua-nha-ai-cta" to="/assistant">
              <Sparkles size={16} aria-hidden="true" />
              <span>Nhờ gợi ý theo nhu cầu</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="bua-nha-spotlight">
          <article className="bua-nha-spotlight-card" key={activeSpotlight.id}>
            <div className="bua-nha-spotlight-photo">
              <img
                src={spotlightPhoto.small}
                alt={activeSpotlight.title}
                loading="lazy"
                decoding="async"
                style={{objectPosition: spotlightPhoto.position || 'center'}}
              />
              <span className="bua-nha-spotlight-badge">{activeSpotlight.tag}</span>
              <span className="bua-nha-spotlight-meta-pill">
                ⏱ {activeSpotlight.minutes} phút · ~{activeSpotlight.kcal} kcal
              </span>
            </div>

            <div className="bua-nha-spotlight-body">
              <div className="bua-nha-spotlight-title-row">
                <h2>{activeSpotlight.title}</h2>
                <strong>≈ {money(activeSpotlight.price)}</strong>
              </div>
              <p>{activeSpotlight.description}</p>
              <div className="bua-nha-spotlight-footer">
                <div className="bua-nha-spotlight-pills">
                  {activeSpotlight.pills.map(pill => (
                    <span key={pill}>{pill}</span>
                  ))}
                </div>
                <Link className="bua-nha-spotlight-link" to={`/cook?ids=${activeSpotlight.id}`}>
                  <span>Vào bếp nấu</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>

          <div className="bua-nha-spotlight-tabs" role="tablist" aria-label="Đổi món tiêu điểm">
            {HERO_SPOTLIGHT_DISHES.map((dish, idx) => {
              const active = idx === spotlightIdx;
              return (
                <button
                  type="button"
                  role="tab"
                  key={dish.id}
                  aria-selected={active}
                  className={`bua-nha-spotlight-tab ${active ? 'active' : ''}`}
                  onClick={() => setSpotlightIdx(idx)}
                >
                  <div>
                    <strong>{dish.shortTitle}</strong>
                    <small>{dish.minutes}p · ≈{money(dish.price)}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section home-featured" aria-labelledby="recipes-title">
        <div className="section-heading">
          <h2 id="recipes-title">
            {hasPersonalization
              ? activePersona
                ? `Đề xuất chuẩn gu ${activePersona.title}`
                : 'Đề xuất chuẩn gu của bạn'
              : 'Món quen dễ bắt đầu'}
          </h2>
          <Link className="text-link" to={hasPersonalization ? '/recipes?filter=for-you' : '/recipes'}>
            Xem tất cả <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <LoadState {...recipes} />
        <div className="recipe-grid">
          {hasPersonalization
            ? personalizedTop.map(({recipe, matchReason}) => (
                <RecipeCard key={recipe.id} recipe={recipe} matchReason={matchReason} />
              ))
            : featured
                .map(id => allRecipes.find(r => r.id === id))
                .filter((r): r is Recipe => !!r)
                .map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      </section>

      <section className="quick-moods-section" aria-labelledby="moods-title">
        <div className="section-heading"><h2 id="moods-title">Chọn theo bữa của bạn</h2></div>
        <div className="quick-moods-grid">
          {QUICK_MOODS.map(({icon: Icon, title, sub, to}) => (
            <Link key={title} to={to} className="mood-card">
              <span className="mood-icon" aria-hidden="true"><Icon size={22} /></span>
              <div className="mood-copy"><strong>{title}</strong><small>{sub}</small></div>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <details className="home-picker-disclosure">
        <summary><Dices size={20} aria-hidden="true" /><span>Chọn ngẫu nhiên hoặc rủ đồng nghiệp</span></summary>
        <section className="random-picker-card" aria-labelledby="random-title">
          <div className="random-picker-copy">
            <h2 id="random-title">Thử một lựa chọn khác</h2>
            <p className="muted small">Chọn ngẫu nhiên từ danh sách tham khảo, rồi gửi món bạn thích cho nhóm.</p>
            <div className="picker-toggles">
              <div className="segmented-control" role="group" aria-label="Chế độ chọn món">
                <button type="button" aria-pressed={pickerMode === 'lunch'} className={pickerMode === 'lunch' ? 'active' : ''} onClick={() => setPickerMode('lunch')}>Trưa ăn ngoài</button>
                <button type="button" aria-pressed={pickerMode === 'cook'} className={pickerMode === 'cook' ? 'active' : ''} onClick={() => setPickerMode('cook')}>Tự nấu</button>
              </div>
              <button type="button" className={`icon-chip-btn ${groupMode ? 'active-group' : ''}`} aria-pressed={groupMode} onClick={() => setGroupMode(v => !v)}>
                <Users size={16} aria-hidden="true" /><span>{groupMode ? 'Đang chọn cho nhóm' : 'Chọn cho nhóm'}</span>
              </button>
            </div>
            <button type="button" className="button secondary picker-random-button" disabled={pickerMode === 'cook' && !allRecipes.length} onClick={pickRandom}>
              <Dices size={17} aria-hidden="true" /><span>{groupMode ? 'Chọn ngẫu nhiên cho nhóm' : 'Chọn ngẫu nhiên'}</span>
            </button>
          </div>

          {pickerMode === 'lunch' ? (
            <div className="random-picker-result">
              <div className="random-picker-thumb" aria-hidden="true"><UtensilsCrossed size={30} /></div>
              <div className="random-picker-info">
                <strong>{randomLunch.name}</strong>
                <p className="small muted">Khoảng {money(randomLunch.price)} · ~{randomLunch.kcal} kcal</p>
                <p className="small muted">Ý tưởng ăn trưa ngoài; giá và năng lượng chỉ tham khảo, không phải danh sách quán.</p>
                <div className="random-picker-actions">
                  <button type="button" className="button secondary small-button" onClick={() => void shareItem(
                    groupMode ? `Trưa nay nhóm mình thử ${randomLunch.name} nhé!` : `Trưa nay thử ${randomLunch.name} nhé!`,
                    `Giá tham khảo ~${money(randomLunch.price)} · ~${randomLunch.kcal} kcal.`,
                    '/assistant?mode=lunch'
                  )}>
                    <Share2 size={16} aria-hidden="true" /><span>{groupMode ? 'Gửi gợi ý cho nhóm' : 'Rủ đồng nghiệp'}</span>
                  </button>
                  <Link className="text-link" to="/assistant?mode=lunch">Xem gợi ý ăn trưa <ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              </div>
            </div>
          ) : displayedRecipe ? (
            <div className="random-picker-result">
              <div className="random-picker-thumb"><RecipeVisual recipe={displayedRecipe} className="recipe-photo-cover" decorative={true} /></div>
              <div className="random-picker-info">
                <strong>{displayedRecipe.name}</strong>
                <RecipePhotoCredit recipeId={displayedRecipe.id} />
                <p className="small muted">{displayedRecipe.minutes} phút · ~{getRecipeNutrition(displayedRecipe.id).kcal} kcal tham khảo</p>
                <div className="random-picker-actions">
                  <Link className="button secondary small-button" to={`/cook?ids=${displayedRecipe.id}`}><ChefHat size={16} aria-hidden="true" /><span>Xem cách nấu</span></Link>
                  <button type="button" className="icon-chip-btn" aria-label={`Chia sẻ món ${displayedRecipe.name}`} onClick={() => void shareItem(
                    groupMode ? `Nhóm mình thử ${displayedRecipe.name} nhé!` : `Hôm nay thử ${displayedRecipe.name} nhé!`,
                    `Công thức khoảng ${displayedRecipe.minutes} phút cho bữa tới.`,
                    `/cook?ids=${displayedRecipe.id}`
                  )}><Share2 size={16} aria-hidden="true" /><span>{groupMode ? 'Gửi gợi ý cho nhóm' : 'Chia sẻ'}</span></button>
                </div>
              </div>
            </div>
          ) : <p className="small muted">Chưa có công thức để chọn. Hãy thử tải lại danh sách ở phía trên.</p>}
        </section>
      </details>
      <p className="home-reference-note"><Sparkles size={16} aria-hidden="true" /> Gợi ý và chi phí tham khảo. Bạn tự chọn món và nguyên liệu phù hợp.</p>
    </div>
  );
}
