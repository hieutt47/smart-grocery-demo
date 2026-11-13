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
  Leaf,
  LeafyGreen,
  Minus,
  Plus,
  Salad,
  Shell,
  ShoppingBasket,
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
import {getPantryStaples, savePantryStaples, STAPLE_DEFINITIONS} from './pantry';
import {RecipeVisual} from './recipe-art';
import {
  CucumberIcon,
  GarlicIcon,
  GingerIcon,
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
  SugarBowlIcon,
  TofuIcon,
  TomatoIcon
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
  orange: OrangeIcon
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

export function RecipeCard({recipe: r}: {recipe: Recipe}) {
  const primaryTag = r.tags?.find(t => ['món mặn', 'canh', 'món xào'].includes(t))
    || r.tags?.find(t => ['gà', 'bò', 'heo', 'cá', 'tôm', 'trứng', 'đậu', 'rau', 'mì', 'nhanh'].includes(t))
    || r.tags?.[0]
    || 'Món ngon';
  const tag = TAG_LABELS[primaryTag] || (primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1));
  return (
    <Link
      to={`/cook?ids=${r.id}`}
      className="recipe-card"
    >
      <div className="recipe-art">
        <RecipeVisual recipe={r} className="recipe-photo-cover" decorative={true} />
        <span className="recipe-tag-badge">{tag}</span>
      </div>
      <div className="recipe-body">
        <div className="recipe-meta">
          <span><Clock3 size={13} aria-hidden="true" /> {r.minutes} phút</span>
          <span><Users size={13} aria-hidden="true" /> {r.servings} người</span>
        </div>
        <h3 className="recipe-title">{r.name}</h3>
        <span className="recipe-action-link">
          Chọn nguyên liệu <ArrowRight size={15} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export function Empty({title, text, to, label}: {title: string; text: string; to?: string; label?: string}) {
  return <div className="empty-state" role="status"><span className="empty-icon"><ShoppingBasket size={38} strokeWidth={1.4} aria-hidden="true" /></span><h2>{title}</h2><p className="muted">{text}</p>{to && <Link className="button primary" to={to}>{label}<ArrowRight size={16} aria-hidden="true" /></Link>}</div>;
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
  return <p className="demo-note-box"><Leaf size={16} aria-hidden="true" /><span>Dữ liệu và giao hàng mô phỏng. Không thu tiền thật.</span></p>;
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

