import {useEffect, useState} from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Clock3,
  Dices,
  Leaf,
  RotateCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Users,
  UtensilsCrossed,
  X
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

const photoChicken = new URL('../assets/chicken.jpg', import.meta.url).href;
const photoTomatoes = new URL('../assets/tomatoes.jpg', import.meta.url).href;
const photoEggs = new URL('../assets/eggs.jpg', import.meta.url).href;
const photoGreens = new URL('../assets/greens.jpg', import.meta.url).href;

interface TabletopShowcaseDish {
  id: string;
  title: string;
  shortNote: string;
  eyebrow: string;
  description: string;
  price: number;
  minutes: number;
  kcal: number;
  image: string;
  pills: string[];
  personas: string[];
}

const TABLETOP_SHOWCASE_DISHES: TabletopShowcaseDish[] = [
  {
    id: 'uc-ga-ap-chao-bong-cai',
    title: 'Ức gà áp chảo bông cải',
    shortNote: 'Thanh vị · Giàu đạm',
    eyebrow: 'MÓN CHÍNH · TINH TẾ & THANH VỊ',
    description:
      'Ức gà áp chảo vàng nhẹ, mềm mọng bên trong. Dùng kèm bông cải xanh giòn ngọt, tiêu đen và sốt dầu hào thanh nhẹ.',
    price: 52000,
    minutes: 15,
    kcal: 330,
    image: photoChicken,
    pills: ['Ức gà phi lê', 'Bông cải xanh', 'Tiêu đen'],
    personas: ['fit_eatclean', 'office_busy', 'health_recovery']
  },
  {
    id: 'thit-kho-trung',
    title: 'Thịt kho trứng nước dừa',
    shortNote: 'Đậm đà · Ấm áp',
    eyebrow: 'VỊ NHÀ · ĐẬM ĐÀ & ĐƯA CƠM',
    description:
      'Thịt heo kho mềm rục quyện cùng trứng gà thấm vị nước màu dừa óng ả, thơm dịu mùi hành tỏi phi truyền thống.',
    price: 58000,
    minutes: 30,
    kcal: 540,
    image: RECIPE_PHOTOS['thit-kho-trung'].large,
    pills: ['Thịt heo tươi', 'Trứng gà', 'Hành tím'],
    personas: ['kid_elder_family', 'family_care']
  },
  {
    id: 'bo-xao-ca-chua',
    title: 'Bò xào cà chua tiêu đen',
    shortNote: 'Mềm ngọt · Bổ dưỡng',
    eyebrow: 'MÓN CHÍNH · GIÀU SẮT & ĐẬM ĐÀ',
    description:
      'Thăn bò xào lửa lớn vừa chín tới giữ trọn vị ngọt tự nhiên, quyện sốt cà chua chín mọng và hành lá thơm nồng.',
    price: 65000,
    minutes: 15,
    kcal: 380,
    image: photoTomatoes,
    pills: ['Thịt bò tươi', 'Cà chua chín', 'Tiêu đen'],
    personas: ['maternity_care', 'office_busy']
  },
  {
    id: 'rau-muong-xao',
    title: 'Rau muống xào tỏi phi',
    shortNote: 'Xanh giòn · Thân quen',
    eyebrow: 'MÓN RAU · THANH MÁT & GIÒN NGỌT',
    description:
      'Rau muống non xào nhanh trên lửa lớn giữ sắc xanh mướt, dậy hương tỏi đập dập phi vàng thơm phức.',
    price: 25000,
    minutes: 15,
    kcal: 150,
    image: RECIPE_PHOTOS['rau-muong-xao'].large,
    pills: ['Rau muống non', 'Tỏi phi vàng', 'Dầu hào'],
    personas: ['student_saver', 'fit_eatclean', 'health_recovery']
  },
  {
    id: 'dau-hu-nhoi-thit-sot-ca',
    title: 'Đậu hũ dồn thịt sốt cà',
    shortNote: 'Mềm bùi · Tròn vị',
    eyebrow: 'VỊ VIỆT · MỀM NGON & DỄ TIÊU',
    description:
      'Đậu hũ non mềm mịn nhồi thịt băm rim trong sốt cà chua đỏ sánh, vị chua ngọt dịu dàng hợp cả trẻ nhỏ lẫn người lớn tuổi.',
    price: 45000,
    minutes: 25,
    kcal: 340,
    image: RECIPE_PHOTOS['dau-hu-nhoi-thit-sot-ca'].large,
    pills: ['Đậu hũ non', 'Thịt băm', 'Sốt cà chua'],
    personas: ['kid_elder_family', 'student_saver', 'maternity_care']
  },
  {
    id: 'ga-rang-gung',
    title: 'Gà rang gừng ấm bụng',
    shortNote: 'Thơm nồng · Đưa cơm',
    eyebrow: 'MÓN CHÍNH · ẤM NỒNG & TRÒN VỊ',
    description:
      'Thịt gà rang săn vàng óng quyện sợi gừng tươi thơm ấm, vị mặn ngọt hài hòa rất hợp cho bữa tối gia đình.',
    price: 55000,
    minutes: 25,
    kcal: 420,
    image: photoChicken,
    pills: ['Thịt gà ta', 'Gừng tươi thái sợi', 'Nước mắm'],
    personas: ['maternity_care', 'family_care']
  },
  {
    id: 'trung-cuon-rau-cu',
    title: 'Trứng cuộn rau củ tươi',
    shortNote: 'Nhanh gọn · Đủ chất',
    eyebrow: 'BỮA NHANH · MỀM MỊN & TIẾT KIỆM',
    description:
      'Trứng gà đánh bông cuộn khéo cùng cà rốt và hành lá thái nhỏ, chín mềm vàng ươm chỉ trong 10 phút.',
    price: 28000,
    minutes: 10,
    kcal: 230,
    image: photoEggs,
    pills: ['Trứng gà tươi', 'Cà rốt', 'Hành lá'],
    personas: ['student_saver', 'office_busy', 'kid_elder_family']
  },
  {
    id: 'salad-uc-ga-bo',
    title: 'Salad ức gà & rau vườn',
    shortNote: 'Tươi mát · Nhẹ bụng',
    eyebrow: 'EAT CLEAN · TƯƠI MÁT & GIỮ DÁNG',
    description:
      'Ức gà áp chảo thái lát kết hợp rau xanh tươi giòn, cà chua và sốt chanh thanh mát giúp nhẹ bụng cả ngày.',
    price: 49000,
    minutes: 15,
    kcal: 340,
    image: photoGreens,
    pills: ['Ức gà áp chảo', 'Rau vườn tươi', 'Sốt chanh'],
    personas: ['fit_eatclean', 'health_recovery']
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
  const [pickerMode, setPickerMode] = useState<'lunch' | 'cook'>('lunch');
  const [groupMode, setGroupMode] = useState(false);
  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null);
  const [randomLunch, setRandomLunch] = useState<OfficeLunchOption>(OFFICE_LUNCH_OPTIONS[0]);

  // "LA TABLE" Interactive Rotating Tabletop State
  const [selectedDishIdx, setSelectedDishIdx] = useState(0);
  const [dockPage, setDockPage] = useState<0 | 1>(0);
  const [plateAngle, setPlateAngle] = useState(0);
  const [plateModalOpen, setPlateModalOpen] = useState(false);

  useEffect(() => subscribeTaste(setTaste), []);

  // Sort showcase dishes so the user's persona favorite is first on the dining table
  const orderedShowcase = [...TABLETOP_SHOWCASE_DISHES].sort((a, b) => {
    if (!taste.persona) return 0;
    const aMatch = a.personas.includes(taste.persona) ? 1 : 0;
    const bMatch = b.personas.includes(taste.persona) ? 1 : 0;
    return bMatch - aMatch;
  });

  const activeShowcase = orderedShowcase[selectedDishIdx] || orderedShowcase[0];
  const dockSlice = orderedShowcase.slice(dockPage * 4, dockPage * 4 + 4);

  function selectTabletopDish(globalIdx: number) {
    if (globalIdx === selectedDishIdx) {
      setPlateModalOpen(true);
      return;
    }
    setSelectedDishIdx(globalIdx);
    setPlateAngle(prev => prev + 180);
  }

  function flipDockPage(dir: 'prev' | 'next') {
    const nextPage: 0 | 1 = dockPage === 0 ? 1 : 0;
    setDockPage(nextPage);
    const nextIdx = nextPage * 4;
    setSelectedDishIdx(nextIdx);
    setPlateAngle(prev => prev + (dir === 'next' ? 180 : -180));
  }

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
      {/* LA TABLE — Fine-Dining Rotating Tabletop Showcase Stage */}
      <section className="home-intro tabletop-stage" aria-labelledby="hero-title">
        <div className="tabletop-topbar">
          <div className="tabletop-brand-mini">
            <span className="tabletop-monogram" aria-hidden="true">BN</span>
            <div>
              <strong>LA TABLE</strong>
              <small>BỮA NHÀ SIGNATURE</small>
            </div>
          </div>

          <h1 id="hero-title" className="tabletop-center-slogan">
            <span>Hôm nay ăn gì?</span>
            <small>─── MỘT VÒNG VỊ NGON ───</small>
          </h1>

          <button
            type="button"
            className="tabletop-taste-trigger"
            onClick={openTasteOnboarding}
            title="Tùy chỉnh gu ăn uống cá nhân"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>{activePersona ? `${activePersona.emoji} ${activePersona.title}` : 'Chọn gu'}</span>
          </button>
        </div>

        {/* Upper-Center Wooden Dining Table Arc & Overhead Rotating Ceramic Plate */}
        <div className="tabletop-arena">
          <div className="tabletop-side-quote" aria-hidden="true">
            <span className="tabletop-gold-line" />
            <p className="tabletop-serif-quote">
              Ngon từ
              <br />
              <em>điều giản dị.</em>
            </p>
            <span className="tabletop-micro-note">
              NGUYÊN LIỆU TƯƠI
              <br />
              HƯƠNG VỊ TRỌN VẸN
            </span>
          </div>

          <div className="tabletop-wood-zone">
            <div className="tabletop-wood-arc" aria-hidden="true">
              <div className="tabletop-wood-grain" />
            </div>

            <button
              type="button"
              className="tabletop-plate-btn"
              onClick={() => setPlateModalOpen(true)}
              aria-label={`Khám phá chi tiết món ${activeShowcase.title}`}
            >
              <span
                className="tabletop-plate-rotor"
                style={{transform: `rotate(${plateAngle}deg)`}}
              >
                <span className="tabletop-plate-rim">
                  <img
                    src={activeShowcase.image}
                    alt={activeShowcase.title}
                    className="tabletop-plate-img"
                  />
                </span>
              </span>
            </button>
          </div>

          <button
            type="button"
            className="tabletop-side-hint"
            onClick={() => setPlateModalOpen(true)}
          >
            <span className="tabletop-hint-icon" aria-hidden="true">
              <RotateCw size={14} />
            </span>
            <span>
              <strong>Nhấn vào món</strong>
              <small>Khám phá món ăn</small>
            </span>
          </button>
        </div>

        {/* Center Dish Narrative Block */}
        <div className="tabletop-narrative" key={activeShowcase.id}>
          <span className="tabletop-eyebrow">
            {activePersona ? `✨ CHUẨN GU ${activePersona.title.toUpperCase()} · ` : ''}
            {activeShowcase.eyebrow}
          </span>
          <h2 className="tabletop-dish-title">{activeShowcase.title}</h2>
          <p className="tabletop-dish-desc">{activeShowcase.description}</p>

          <div className="tabletop-meta-row">
            <strong className="tabletop-price">{money(activeShowcase.price)}</strong>
            <span className="tabletop-meta-sep" aria-hidden="true">·</span>
            <span>⏱ {activeShowcase.minutes} phút</span>
            <span className="tabletop-meta-sep" aria-hidden="true">·</span>
            <span>~{activeShowcase.kcal} kcal</span>
            <span className="tabletop-meta-sep" aria-hidden="true">·</span>
            <span>2 phần</span>
          </div>

          <div className="tabletop-ing-pills" aria-label="Nguyên liệu chính">
            {activeShowcase.pills.map(pill => (
              <span key={pill} className="tabletop-ing-pill">{pill}</span>
            ))}
          </div>

          <div className="home-intro-actions tabletop-actions">
            <Link className="button primary" to="/recipes">
              <span>Xem công thức</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="tabletop-cook-now" to={`/cook?ids=${activeShowcase.id}`}>
              <ChefHat size={16} aria-hidden="true" />
              <span>Nấu món này ngay</span>
            </Link>
            <Link className="text-link" to="/assistant">
              <span>Nhờ gợi ý theo nhu cầu</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Bottom 4-Card Carousel Dock */}
        <div className="tabletop-dock">
          <div className="tabletop-dock-header">
            <p className="tabletop-dock-prompt">
              Hôm nay, bạn muốn <em>thưởng thức gì?</em>
            </p>
            <span className="tabletop-dock-page">TRANG 0{dockPage + 1} / 02</span>
          </div>

          <div className="tabletop-dock-row">
            <button
              type="button"
              className="tabletop-arrow-btn"
              onClick={() => flipDockPage('prev')}
              aria-label="Trang món trước"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>

            <div className="tabletop-dock-grid" role="tablist" aria-label="Chọn món trên bàn xoay">
              {dockSlice.map((dish, idx) => {
                const globalIdx = dockPage * 4 + idx;
                const isActive = globalIdx === selectedDishIdx;
                return (
                  <button
                    type="button"
                    role="tab"
                    key={dish.id}
                    aria-selected={isActive}
                    className={`tabletop-mini-card ${isActive ? 'active' : ''}`}
                    onClick={() => selectTabletopDish(globalIdx)}
                  >
                    <span className="tabletop-mini-plate">
                      <img src={dish.image} alt="" aria-hidden="true" />
                    </span>
                    <span className="tabletop-mini-copy">
                      <strong>{dish.title}</strong>
                      <small>{dish.shortNote}</small>
                      <b>{money(dish.price)}</b>
                    </span>
                    {isActive && <span className="tabletop-mini-dot" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="tabletop-arrow-btn"
              onClick={() => flipDockPage('next')}
              aria-label="Trang món tiếp theo"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="tabletop-dock-dots" aria-hidden="true">
            <span className={`tabletop-dot-pill ${dockPage === 0 ? 'active' : ''}`} />
            <span className={`tabletop-dot-pill ${dockPage === 1 ? 'active' : ''}`} />
          </div>
        </div>

        {/* Blurred-Backdrop Dish Detail Modal Overlay (Triggered when clicking the hero plate) */}
        {plateModalOpen && (
          <div
            className="tabletop-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Chi tiết món ${activeShowcase.title}`}
          >
            <div className="tabletop-detail-card">
              <button
                type="button"
                className="icon-button tabletop-detail-close"
                onClick={() => setPlateModalOpen(false)}
                aria-label="Đóng chi tiết món"
              >
                <X size={18} aria-hidden="true" />
              </button>
              <div className="tabletop-detail-plate">
                <img src={activeShowcase.image} alt={activeShowcase.title} />
              </div>
              <span className="tabletop-eyebrow">{activeShowcase.eyebrow}</span>
              <h3>{activeShowcase.title}</h3>
              <p>{activeShowcase.description}</p>
              <div className="tabletop-ing-pills">
                {activeShowcase.pills.map(pill => (
                  <span key={pill} className="tabletop-ing-pill">{pill}</span>
                ))}
              </div>
              <div className="tabletop-meta-row">
                <strong className="tabletop-price">{money(activeShowcase.price)}</strong>
                <span className="tabletop-meta-sep">·</span>
                <span>⏱ {activeShowcase.minutes} phút</span>
                <span className="tabletop-meta-sep">·</span>
                <span>~{activeShowcase.kcal} kcal</span>
              </div>
              <div className="tabletop-detail-actions">
                <Link
                  className="tabletop-cook-now"
                  to={`/cook?ids=${activeShowcase.id}`}
                  onClick={() => setPlateModalOpen(false)}
                >
                  <ChefHat size={16} aria-hidden="true" />
                  <span>Xem cách nấu & Checklist đi chợ</span>
                </Link>
              </div>
            </div>
          </div>
        )}
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
