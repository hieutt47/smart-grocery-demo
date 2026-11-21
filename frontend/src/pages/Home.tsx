import {useState} from 'react';
import {ArrowRight, Clock3, Dices, Leaf, Share2, SlidersHorizontal, Sparkles, Users, UtensilsCrossed} from 'lucide-react';
import {Link} from 'react-router-dom';
import {money, trackEvent} from '../api';
import {LoadState, RecipeCard} from '../components';
import {useResource, useStore} from '../context';
import {getRecipeNutrition, OFFICE_LUNCH_OPTIONS, type OfficeLunchOption} from '../nutrition';
import {RecipeVisual} from '../recipe-art';
import type {Recipe} from '../types';

const mealImage = new URL('../assets/meal.jpg', import.meta.url).href;

const QUICK_MOODS = [
  {
    emoji: '🥢',
    title: 'Trưa nay ăn ngoài?',
    sub: 'Gợi ý 45k–68k, không buồn ngủ',
    to: '/assistant?mode=lunch'
  },
  {
    emoji: '⚡',
    title: 'Tối nấu nhanh 15p',
    sub: 'Đi làm về muộn',
    to: '/recipes?filter=nhanh'
  },
  {
    emoji: '🥗',
    title: 'Eat clean · Ít dầu',
    sub: 'Nhẹ bụng, giữ dáng',
    to: '/recipes?filter=eat-clean'
  },
  {
    emoji: '💰',
    title: 'Tiết kiệm dưới 60k',
    sub: 'Ngon gọn cho 1–2 người',
    to: `/assistant?q=${encodeURIComponent('Gợi ý món ngon tiết kiệm dưới 60k cho 1 người')}`
  }
];

export function Home() {
  const recipes = useResource<Recipe[]>('/recipes');
  const {shareItem} = useStore();
  const [pickerMode, setPickerMode] = useState<'lunch' | 'cook'>('lunch');
  const [groupMode, setGroupMode] = useState(false);
  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null);
  const [randomLunch, setRandomLunch] = useState<OfficeLunchOption>(OFFICE_LUNCH_OPTIONS[0]);

  const featured = ['ga-rang-gung', 'bo-xao-ca-chua', 'trung-chien-hanh'];
  const allRecipes = recipes.data || [];
  const displayedRecipe = randomRecipe || allRecipes[0] || null;

  function pickRandom() {
    trackEvent(groupMode ? 'group_pick' : 'random_pick', pickerMode);
    if (pickerMode === 'lunch') {
      const pool = OFFICE_LUNCH_OPTIONS.filter(x => x.id !== randomLunch.id);
      setRandomLunch(pool[Math.floor(Math.random() * pool.length)]);
      return;
    }
    if (!allRecipes.length) return;
    if (allRecipes.length === 1) {
      setRandomRecipe(allRecipes[0]);
      return;
    }
    const pool = displayedRecipe ? allRecipes.filter(r => r.id !== displayedRecipe.id) : allRecipes;
    setRandomRecipe(pool[Math.floor(Math.random() * pool.length)]);
  }

  return (
    <div className="home-page">
      <section className="fresh-hero" aria-labelledby="hero-title">
        <img
          className="fresh-hero-image"
          src={mealImage}
          width="900"
          height="600"
          alt="Bữa ăn văn phòng tươi ngon đầy đủ dinh dưỡng"
          fetchPriority="high"
        />
        <div className="fresh-hero-copy">
          <span className="fresh-kicker">
            <Leaf size={17} /> Trợ lý ăn uống cho dân văn phòng
          </span>
          <h1 id="hero-title">
            Hôm nay ăn gì?
            <br />
            Chốt món trong 5 giây.
          </h1>
          <p>
            Trưa ăn ngoài cùng đồng nghiệp hay tối về tự nấu nhanh 15 phút — Bữa Nhà gợi ý đúng gu, rõ calo và chi phí tham khảo.
          </p>
          <div className="fresh-actions">
            <Link className="button lime-button" to="/assistant">
              <Sparkles size={18} />
              <span>Hỏi trợ lý AI</span>
              <ArrowRight size={19} />
            </Link>
            <Link className="fresh-recipe-link" to="/recipes">
              Xem góc bếp <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="fresh-hero-number" aria-hidden="true">
          <strong>5 giây chốt món</strong>
          <span>Trưa & Tối</span>
        </div>
      </section>

      <div className="fresh-promise">
        <span><Sparkles size={18} /> Trưa ăn ngoài & Tối tự nấu</span>
        <span><SlidersHorizontal size={18} /> Ước tính Calo & Chi phí</span>
        <span><UtensilsCrossed size={18} /> Chốt kèo nhóm 1 chạm</span>
      </div>

      {/* Quick Moods for Office Workers */}
      <section className="quick-moods-section" aria-labelledby="moods-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Chọn nhanh 1 chạm</span>
            <h2 id="moods-title">Hôm nay bạn muốn ăn kiểu gì?</h2>
          </div>
          <Link className="text-link" to="/assistant">
            Hỏi tự do <ArrowRight size={17} />
          </Link>
        </div>
        <div className="quick-moods-grid">
          {QUICK_MOODS.map(m => (
            <Link key={m.title} to={m.to} className="mood-card">
              <span className="mood-emoji" aria-hidden="true">{m.emoji}</span>
              <div className="mood-copy">
                <strong>{m.title}</strong>
                <small>{m.sub}</small>
              </div>
              <ArrowRight size={15} className="muted" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      {/* Random / Group Picker */}
      <section className="random-picker-card" aria-labelledby="random-title">
        <div className="random-picker-copy">
          <span className="eyebrow">Quá bận để suy nghĩ?</span>
          <h2 id="random-title">Quay chọn món & Chốt kèo nhóm</h2>
          <p className="muted small">
            Chọn chế độ ăn trưa ngoài quán hoặc tự nấu tại nhà, bấm quay để chốt nhanh hoặc gửi vào nhóm đồng nghiệp.
          </p>

          <div className="picker-toggles">
            <div className="segmented-control" role="group" aria-label="Chế độ chọn món">
              <button
                type="button"
                className={pickerMode === 'lunch' ? 'active' : ''}
                onClick={() => setPickerMode('lunch')}
              >
                🥢 Trưa ăn ngoài
              </button>
              <button
                type="button"
                className={pickerMode === 'cook' ? 'active' : ''}
                onClick={() => setPickerMode('cook')}
              >
                🍳 Tối tự nấu
              </button>
            </div>

            <button
              type="button"
              className={`icon-chip-btn ${groupMode ? 'active-group' : ''}`}
              aria-pressed={groupMode}
              onClick={() => setGroupMode(v => !v)}
            >
              <Users size={14} aria-hidden="true" />
              <span>{groupMode ? 'Đang bật: Kèo nhóm' : 'Chốt kèo nhóm'}</span>
            </button>
          </div>

          <div className="hero-actions" style={{marginTop: '14px'}}>
            <button type="button" className="button primary small-button" onClick={pickRandom}>
              <Dices size={16} aria-hidden="true" />
              <span>{groupMode ? 'Quay chọn kèo nhóm' : 'Chọn ngẫu nhiên'}</span>
            </button>
          </div>
        </div>

        {pickerMode === 'lunch' ? (
          <div className="random-picker-result">
            <div className="random-picker-thumb lunch-emoji-thumb" aria-hidden="true">
              <span>{randomLunch.emoji}</span>
            </div>
            <div className="random-picker-info">
              <strong>{randomLunch.name}</strong>
              <span className="small muted" style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px'}}>
                <span>~{money(randomLunch.price)}</span>
                <span>· ~{randomLunch.kcal} kcal</span>
              </span>
              <p className="small muted" style={{lineHeight: 1.45}}>{randomLunch.note}</p>
              <div className="random-picker-actions">
                <button
                  type="button"
                  className="button primary small-button"
                  onClick={() =>
                    void shareItem(
                      groupMode ? `🎯 Kèo trưa nay đã chốt: ${randomLunch.name}!` : `Trưa nay thử ${randomLunch.name} nhé!`,
                      `~${money(randomLunch.price)} · ~${randomLunch.kcal} kcal · ${randomLunch.tag}. Anh em chốt đơn luôn không?`,
                      '/assistant?mode=lunch'
                    )
                  }
                >
                  <Share2 size={14} aria-hidden="true" />
                  <span>{groupMode ? 'Gửi kèo cho nhóm' : 'Rủ đồng nghiệp'}</span>
                </button>
                <Link className="icon-chip-btn" to="/assistant?mode=lunch">
                  <span>Xem thêm quán</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          displayedRecipe && (
            <div className="random-picker-result">
              <div className="random-picker-thumb">
                <RecipeVisual recipe={displayedRecipe} className="recipe-photo-cover" decorative={true} />
              </div>
              <div className="random-picker-info">
                <strong>{displayedRecipe.name}</strong>
                <span className="small muted" style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}>
                  <Clock3 size={13} aria-hidden="true" />
                  {displayedRecipe.minutes} phút · ~{getRecipeNutrition(displayedRecipe.id).kcal} kcal
                </span>
                <div className="random-picker-actions">
                  <Link className="button primary small-button" to={`/cook?ids=${displayedRecipe.id}`}>
                    <span>Xem cách nấu</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    className="icon-chip-btn"
                    aria-label={`Chia sẻ món ${displayedRecipe.name}`}
                    onClick={() =>
                      void shareItem(
                        groupMode
                          ? `🎯 Kèo nấu ăn đã chốt: ${displayedRecipe.name}!`
                          : `Hôm nay thử món ${displayedRecipe.name} nhé!`,
                        `Chỉ mất khoảng ${displayedRecipe.minutes} phút nấu (~${getRecipeNutrition(displayedRecipe.id).kcal} kcal). Xem công thức trên Bữa Nhà:`,
                        `/cook?ids=${displayedRecipe.id}`
                      )
                    }
                  >
                    <Share2 size={14} aria-hidden="true" />
                    <span>{groupMode ? 'Gửi kèo nhóm' : 'Chia sẻ'}</span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </section>

      <section className="fresh-inspiration" aria-labelledby="inspiration-title">
        <div className="fresh-inspiration-icon">
          <Sparkles size={35} strokeWidth={1.4} />
        </div>
        <div className="fresh-inspiration-content">
          <span className="eyebrow">Trợ lý AI thông minh</span>
          <h2 id="inspiration-title">Bớt nghĩ “ăn gì”. Thêm năng lượng làm việc.</h2>
          <p>
            Nói số người, ngân sách và thời gian bạn có. Trợ lý AI sẽ gợi ý món phù hợp, tránh các nguyên liệu bạn không thích.
          </p>
        </div>
        <Link className="button primary" to="/assistant">
          Chat với AI ngay <ArrowRight size={18} />
        </Link>
      </section>

      <section className="section" aria-labelledby="recipes-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Gợi ý phổ biến</span>
            <h2 id="recipes-title">Món quen, nấu nhanh gọn.</h2>
          </div>
          <Link className="text-link" to="/recipes">
            Xem tất cả công thức <ArrowRight size={17} />
          </Link>
        </div>
        <LoadState {...recipes} />
        <div className="recipe-grid">
          {featured
            .map(id => allRecipes.find(r => r.id === id))
            .filter((r): r is Recipe => !!r)
            .map(r => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
        </div>
      </section>

      <div className="fresh-closing">
        <Leaf size={20} />
        <p>Ăn ngon hơn. Nghĩ ít hơn.</p>
      </div>
    </div>
  );
}
