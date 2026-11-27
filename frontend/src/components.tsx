import {
  Amphora,
  Apple,
  ArrowRight,
  Banana,
  Beef,
  Carrot,
  Check,
  Citrus,
  Clock3,
  Drumstick,
  Egg,
  Fish,
  Ham,
  Heart,
  Leaf,
  LeafyGreen,
  Minus,
  Plus,
  Salad,
  Shell,
  Sparkles,
  Sprout,
  Users,
  Wheat,
  X
} from 'lucide-react';
import {useState, useEffect, type ComponentType} from 'react';
import {Link} from 'react-router-dom';
import {money} from './api';
import {useStore} from './context';
import {getRecipeNutrition} from './nutrition';
import {getPantryStaples, savePantryStaples, STAPLE_DEFINITIONS} from './pantry';
import {
  getTasteProfile,
  PERSONA_DEFINITIONS,
  recordTasteSignal,
  saveTasteProfile,
  subscribeTaste,
  TASTE_DISLIKE_CHIPS,
  TASTE_LIKE_CHIPS,
  type PersonaId,
  type TasteProfile
} from './taste';
import {RecipePhotoCredit, RecipeVisual} from './recipe-art';
import {
  ChiliIcon,
  CornIcon,
  CucumberIcon,
  GarlicIcon,
  GingerIcon,
  MangoIcon,
  MushroomIcon,
  NoodleIcon,
  OilBottleIcon,
  OrangeIcon,
  PepperMillIcon,
  PotatoIcon,
  PumpkinIcon,
  RiceBowlIcon,
  SaltShakerIcon,
  SauceBottleIcon,
  ScallionIcon,
  ShallotIcon,
  SugarBowlIcon,
  TofuIcon,
  TomatoIcon,
  WatermelonIcon,
  YogurtIcon
} from './product-icons';
import type {Product, Recipe} from './types';

const TAG_LABELS: Record<string, string> = {
  'món mặn': 'Món mặn',
  'canh': 'Món canh',
  'rau': 'Món rau',
  'nhanh': 'Nhanh gọn',
  'gà': 'Món gà',
  'bò': 'Món bò',
  'heo': 'Món heo',
  'cá': 'Món cá',
  'tôm': 'Món tôm',
  'trứng': 'Món trứng',
  'đậu': 'Món đậu',
  'mì': 'Món mì'
};

const productPhotos: Record<string, string> = {
  tomato: new URL('./assets/tomatoes.jpg', import.meta.url).href,
  eggs: new URL('./assets/eggs.jpg', import.meta.url).href,
  chicken: new URL('./assets/chicken.jpg', import.meta.url).href,
  greens: new URL('./assets/greens.jpg', import.meta.url).href
};

type IconComponent = ComponentType<{size?: number; strokeWidth?: number; className?: string}>;

// Mỗi SKU một hình riêng để các ô chưa có ảnh vẫn phân biệt được với nhau
const PRODUCT_ICONS: Record<string, IconComponent> = {
  chicken: Drumstick,
  beef: Beef,
  pork: Ham,
  fish: Fish,
  shrimp: Shell,
  eggs: Egg,
  tofu: TofuIcon,
  tomato: TomatoIcon,
  greens: LeafyGreen,
  spinach: Leaf,
  ginger: GingerIcon,
  garlic: GarlicIcon,
  onion: ScallionIcon,
  carrot: Carrot,
  potato: PotatoIcon,
  pumpkin: PumpkinIcon,
  cucumber: CucumberIcon,
  lettuce: Salad,
  mushroom: MushroomIcon,
  lime: Citrus,
  rice: RiceBowlIcon,
  noodles: NoodleIcon,
  oil: OilBottleIcon,
  'fish-sauce': Amphora,
  'soy-sauce': SauceBottleIcon,
  salt: SaltShakerIcon,
  sugar: SugarBowlIcon,
  pepper: PepperMillIcon,
  banana: Banana,
  orange: OrangeIcon,
  chili: ChiliIcon,
  shallot: ShallotIcon,
  corn: CornIcon,
  watermelon: WatermelonIcon,
  mango: MangoIcon,
  yogurt: YogurtIcon
};

// Dự phòng cho SKU lạ: vẫn có hình theo nhóm hàng thay vì ô trống
const CATEGORY_ICONS: Record<string, IconComponent> = {
  'Rau củ': Carrot,
  'Thịt & cá': Beef,
  'Trứng & đậu': Egg,
  'Gạo & gia vị': Wheat,
  'Trái cây': Apple
};

export function ProductVisual({id, name, category, loading = 'lazy'}: {id: string; name: string; category?: string; loading?: 'lazy' | 'eager'}) {
  if (productPhotos[id]) {
    return <img className="product-photo" src={productPhotos[id]} alt={name} loading={loading} width="700" height="560" />;
  }
  const Icon = PRODUCT_ICONS[id] ?? (category ? CATEGORY_ICONS[category] : undefined) ?? Sprout;
  return (
    <span className="product-placeholder" role="img" aria-label={name}>
      <Icon size={44} strokeWidth={1.5} />
    </span>
  );
}

export function CategoryIcon({category, size = 44}: {category?: string; size?: number}) {
  const Icon = (category ? CATEGORY_ICONS[category] : undefined) ?? Sprout;
  return <Icon size={size} strokeWidth={1.5} />;
}

export function Brand() {
  return <Link to="/" className="brand" aria-label="Bữa Nhà - Trang chủ"><span className="brand-mark"><Leaf size={24} strokeWidth={1.6} aria-hidden="true" /></span><span className="brand-text"><span className="brand-title">Bữa Nhà<span>.</span></span><span className="brand-sub">Chăm chút từ điều giản dị</span></span></Link>;
}

export function Quantity({value, onChange, max = 99, disabled = false}: {value: number; onChange: (v: number) => void; max?: number; disabled?: boolean}) {
  return <div className="quantity" role="group" aria-label="Điều chỉnh số lượng"><button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Giảm số lượng" className="qty-btn"><Minus size={15} aria-hidden="true" /></button><span className="qty-value" aria-live="polite">{value}</span><button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Tăng số lượng" className="qty-btn"><Plus size={15} aria-hidden="true" /></button></div>;
}

export function ProductCard({product: p, eager = false}: {product: Product; eager?: boolean}) {
  const {addProduct, busy, ready} = useStore();
  return <article className="product-card" aria-label={p.name}>
    <Link to={`/products/${p.id}`} className="product-art" tabIndex={-1} aria-hidden="true"><ProductVisual id={p.id} name={p.name} category={p.category} loading={eager ? 'eager' : 'lazy'} /></Link>
    <div className="product-body"><span className="product-category-tag">{p.category}</span><h3 className="product-heading"><Link className="product-name" to={`/products/${p.id}`}>{p.name}</Link></h3><p className="product-unit">Gói {p.pack_size} {p.unit}</p><div className="product-bottom"><strong className="product-price">{money(p.price)}</strong><button type="button" className="add-button" aria-label={`Thêm ${p.name} vào giỏ hàng`} disabled={busy || !ready || !p.available} onClick={() => void addProduct(p.id)}><Plus size={22} strokeWidth={2.4} aria-hidden="true" /><span>Thêm</span></button></div>{!p.available && <span className="product-out-of-stock">Tạm hết hàng</span>}</div>
  </article>;
}

export function RecipeCard({recipe: r, matchReason}: {recipe: Recipe; matchReason?: string}) {
  const {isSaved, toggleSave} = useStore();
  const saved = isSaved(r.id);
  const nutrition = getRecipeNutrition(r.id);
  const primaryTag =
    r.tags?.find(t => ['món mặn', 'canh', 'món xào'].includes(t)) ||
    r.tags?.find(t => ['gà', 'bò', 'heo', 'cá', 'tôm', 'trứng', 'đậu', 'rau', 'mì', 'nhanh'].includes(t)) ||
    r.tags?.[0] ||
    'Món ngon';
  const tag = nutrition.eatClean ? 'Eat clean' : TAG_LABELS[primaryTag] || primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1);
  return (
    <article className="recipe-card">
      <Link to={`/cook?ids=${r.id}`} className="recipe-card-link" aria-label={`Xem công thức ${r.name}`}>
        <div className="recipe-art">
          <RecipeVisual recipe={r} className="recipe-photo-cover" decorative={true} />
          <span className="recipe-tag-badge">{tag}</span>
        </div>
        <div className="recipe-body">
          {matchReason && <span className="recipe-match-pill">✨ {matchReason}</span>}
          <div className="recipe-meta">
            <span><Clock3 size={13} aria-hidden="true" /> {r.minutes} phút</span>
            <span><Users size={13} aria-hidden="true" /> {r.servings} người</span>
            <span className="kcal-pill">~{nutrition.kcal} kcal</span>
          </div>
          <h3 className="recipe-title">{r.name}</h3>
          <span className="recipe-action-link">Xem công thức <ArrowRight size={15} aria-hidden="true" /></span>
        </div>
      </Link>
      <RecipePhotoCredit recipeId={r.id} />
      <button
        type="button"
        className={`recipe-save-btn ${saved ? 'saved' : ''}`}
        aria-label={saved ? `Bỏ lưu ${r.name}` : `Lưu món ${r.name}`}
        aria-pressed={saved}
        onClick={() => {
          if (!saved) {
            recordTasteSignal(r.tags || [], 'save', r.id);
          }
          toggleSave(r.id);
        }}
      >
        <Heart size={18} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
    </article>
  );
}

export function Empty({title, text, to, label}: {title: string; text: string; to?: string; label?: string}) {
  return <div className="empty-state" role="status"><span className="empty-icon"><Sparkles size={38} strokeWidth={1.4} aria-hidden="true" /></span><h2>{title}</h2><p className="muted">{text}</p>{to && <Link className="button primary" to={to}>{label}<ArrowRight size={16} aria-hidden="true" /></Link>}</div>;
}

export function LoadState({loading, error, retry}: {loading: boolean; error: string; retry: () => void}) {
  if (error) return <div className="inline-error" role="alert"><p>{error}</p><button type="button" className="button secondary small-button" onClick={retry}>Thử kết nối lại</button></div>;
  if (loading) return <div className="loading" role="status"><span className="spinner" />Đang tải dữ liệu…</div>;
  return null;
}

export function PageTitle({eyebrow, title, description}: {eyebrow?: string; title: string; description?: string}) {
  return <div className="page-title">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p className="page-desc">{description}</p>}</div>;
}

export function DemoNote() {
  return <p className="demo-note-box"><Leaf size={16} aria-hidden="true" /><span>Gợi ý món ăn & chi phí tham khảo cho dân văn phòng · Hoàn toàn miễn phí.</span></p>;
}

export function PantryModal({open, onClose}: {open: boolean; onClose: () => void}) {
  const [staples, setStaples] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setStaples(getPantryStaples());
    }
  }, [open]);

  if (!open) return null;

  function toggle(id: string) {
    const next = staples.includes(id) ? staples.filter(x => x !== id) : [...staples, id];
    setStaples(next);
    savePantryStaples(next);
  }

  function toggleAll() {
    const next = staples.length === STAPLE_DEFINITIONS.length ? [] : STAPLE_DEFINITIONS.map(s => s.id);
    setStaples(next);
    savePantryStaples(next);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Tủ gia vị nhà mình">
      <div className="pantry-modal">
        <div className="pantry-modal-header">
          <div className="flex-row items-center gap-2">
            <span className="pantry-modal-badge" aria-hidden="true"><Sparkles size={18} /></span>
            <div>
              <h2>Tủ gia vị nhà mình</h2>
              <span className="small muted">Ghi nhớ gia vị bạn luôn có sẵn</span>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <p className="pantry-modal-desc small muted">
          Đánh dấu những món bếp nhà bạn <strong>luôn có sẵn</strong>. Trợ lý AI và công thức sẽ tự động bỏ qua để bạn không phải mua thừa!
        </p>

        <div className="pantry-staples-grid">
          {STAPLE_DEFINITIONS.map(s => {
            const hasIt = staples.includes(s.id);
            return (
              <button
                type="button"
                key={s.id}
                className={`pantry-staple-btn ${hasIt ? 'active' : ''}`}
                onClick={() => toggle(s.id)}
                aria-pressed={hasIt}
              >
                <span className="pantry-staple-emoji" aria-hidden="true">{s.emoji}</span>
                <span className="pantry-staple-name">{s.name}</span>
                <span className={`pantry-staple-check ${hasIt ? 'checked' : ''}`}>
                  {hasIt ? <Check size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pantry-modal-footer">
          <button type="button" className="text-button" onClick={toggleAll}>
            {staples.length === STAPLE_DEFINITIONS.length ? 'Bỏ chọn hết' : 'Có đủ các món này'}
          </button>
          <button type="button" className="button primary small-button" onClick={onClose}>
            <span>Đã ghi nhớ ({staples.length} món)</span>
            <Check size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TasteOnboardingModal() {
  const {notify} = useStore();
  const [taste, setTaste] = useState<TasteProfile>(getTasteProfile);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => subscribeTaste(setTaste), []);

  useEffect(() => {
    const handler = () => {
      setTaste(getTasteProfile());
      setManualOpen(true);
    };
    window.addEventListener('open-taste-onboarding', handler);
    return () => window.removeEventListener('open-taste-onboarding', handler);
  }, []);

  const isOpen = !taste.onboarded || manualOpen;
  if (!isOpen) return null;

  function selectPersona(id: PersonaId) {
    setTaste(prev => ({
      ...prev,
      persona: prev.persona === id ? null : id
    }));
  }

  function toggleLikeTag(tag: string) {
    setTaste(prev => {
      const exists = prev.liked_tags.includes(tag);
      return {
        ...prev,
        liked_tags: exists ? prev.liked_tags.filter(t => t !== tag) : [...prev.liked_tags, tag]
      };
    });
  }

  function toggleDislike(ingId: string) {
    setTaste(prev => {
      const exists = prev.disliked_ingredients.includes(ingId);
      return {
        ...prev,
        disliked_ingredients: exists
          ? prev.disliked_ingredients.filter(i => i !== ingId)
          : [...prev.disliked_ingredients, ingId]
      };
    });
  }

  function skipOnboarding() {
    const next: TasteProfile = {...taste, onboarded: true};
    setTaste(next);
    saveTasteProfile(next);
    setManualOpen(false);
  }

  function completeOnboarding() {
    const next: TasteProfile = {...taste, onboarded: true};
    setTaste(next);
    saveTasteProfile(next);
    setManualOpen(false);
    notify('Đã cá nhân hóa thực đơn theo gu của bạn!');
  }

  return (
    <div
      className="modal-backdrop taste-onboarding-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="taste-onboarding-title"
    >
      <div className="taste-onboarding-modal">
        <div className="taste-onboarding-top">
          <span className="eyebrow">✨ Cá nhân hóa thực đơn · Chỉ hỏi 1 lần duy nhất</span>
          <h2 id="taste-onboarding-title">Bạn thích ăn uống theo gu nào?</h2>
          <p className="small muted">
            Vote nhanh 3 câu dưới đây để Bữa Nhà và Trợ lý AI lọc đúng những món hợp nhất với bạn.
          </p>
        </div>

        <div className="taste-onboarding-body">
          <div className="taste-q-block">
            <h3 className="taste-q-title">Câu 1: Bạn thuộc nhóm đối tượng nào?</h3>
            <div className="persona-grid" role="group" aria-label="Câu 1: Bạn thuộc nhóm đối tượng nào?">
              {PERSONA_DEFINITIONS.map(p => (
                <button
                  type="button"
                  key={p.id}
                  className={`persona-btn ${taste.persona === p.id ? 'active' : ''}`}
                  aria-pressed={taste.persona === p.id}
                  onClick={() => selectPersona(p.id)}
                >
                  <span className="persona-btn-emoji" aria-hidden="true">{p.emoji}</span>
                  <strong>{p.title}</strong>
                  <small>{p.sub}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="taste-q-block">
            <h3 className="taste-q-title">Câu 2: Vote các món / nguyên liệu bạn thích ăn (Chọn nhiều):</h3>
            <div className="taste-chips-group" role="group" aria-label="Câu 2: Món khoái khẩu">
              {TASTE_LIKE_CHIPS.map(c => (
                <button
                  type="button"
                  key={c.id}
                  className={`taste-chip-btn ${taste.liked_tags.includes(c.id) ? 'liked' : ''}`}
                  aria-pressed={taste.liked_tags.includes(c.id)}
                  onClick={() => toggleLikeTag(c.id)}
                >
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="taste-q-block">
            <h3 className="taste-q-title">Câu 3: Có món nào bạn KHÔNG ăn hoặc muốn tránh không?</h3>
            <div className="taste-chips-group" role="group" aria-label="Câu 3: Nguyên liệu muốn tránh">
              {TASTE_DISLIKE_CHIPS.map(c => (
                <button
                  type="button"
                  key={c.id}
                  className={`taste-chip-btn ${taste.disliked_ingredients.includes(c.id) ? 'disliked' : ''}`}
                  aria-pressed={taste.disliked_ingredients.includes(c.id)}
                  onClick={() => toggleDislike(c.id)}
                >
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="taste-onboarding-footer">
          <button type="button" className="button secondary small-button" onClick={skipOnboarding}>
            <span>Bỏ qua</span>
          </button>
          <button type="button" className="button primary small-button" onClick={completeOnboarding}>
            <Check size={15} aria-hidden="true" />
            <span>Hoàn tất & Xem món hợp gu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

