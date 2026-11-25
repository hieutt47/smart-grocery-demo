import {useState} from 'react';
import {ArrowRight, ChefHat, Clock3, Dices, Leaf, Share2, SlidersHorizontal, Sparkles, Users, UtensilsCrossed} from 'lucide-react';
import {Link} from 'react-router-dom';
import {money, trackEvent} from '../api';
import {LoadState, RecipeCard} from '../components';
import {useResource, useStore} from '../context';
import {getRecipeNutrition, OFFICE_LUNCH_OPTIONS, type OfficeLunchOption} from '../nutrition';
import {RecipePhotoCredit, RecipeVisual} from '../recipe-art';
import type {Recipe} from '../types';

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
  const [pickerMode, setPickerMode] = useState<'lunch' | 'cook'>('lunch');
  const [groupMode, setGroupMode] = useState(false);
  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null);
  const [randomLunch, setRandomLunch] = useState<OfficeLunchOption>(OFFICE_LUNCH_OPTIONS[0]);

  const featured = ['rau-muong-xao', 'thit-kho-trung', 'dau-hu-nhoi-thit-sot-ca'];
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
    <div className="home-page home-clarity">
      <section className="home-intro" aria-labelledby="hero-title">
        <div className="home-intro-copy">
          <h1 id="hero-title">Hôm nay ăn gì?</h1>
          <p>Chọn món, xem cách nấu và lên danh sách nguyên liệu cho bữa tới.</p>
          <div className="home-intro-actions">
            <Link className="button primary" to="/recipes">
              <span>Xem công thức</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="text-link" to="/assistant">
              <span>Nhờ gợi ý theo nhu cầu</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section home-featured" aria-labelledby="recipes-title">
        <div className="section-heading">
          <h2 id="recipes-title">Món quen dễ bắt đầu</h2>
          <Link className="text-link" to="/recipes">Xem tất cả <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <LoadState {...recipes} />
        <div className="recipe-grid">
          {featured
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
