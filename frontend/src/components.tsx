import {ArrowRight, ChefHat, Clock3, Leaf, Minus, Plus, ShoppingBasket, Sprout, Users} from 'lucide-react';
import {Link} from 'react-router-dom';
import {money} from './api';
import {useStore} from './context';
import type {Product, Recipe} from './types';

const productPhotos: Record<string, string> = {
  tomato: new URL('./assets/tomatoes.jpg', import.meta.url).href,
  eggs: new URL('./assets/eggs.jpg', import.meta.url).href,
  chicken: new URL('./assets/chicken.jpg', import.meta.url).href,
  greens: new URL('./assets/greens.jpg', import.meta.url).href
};

export function ProductVisual({id, name}: {id: string; name: string}) {
  return productPhotos[id]
    ? <img className="product-photo" src={productPhotos[id]} alt={`${name} — ảnh minh họa`} loading="lazy" width="700" height="560" />
    : <span className="product-placeholder"><Sprout size={48} strokeWidth={1} /><span>{name}</span><small>Chưa có ảnh sản phẩm</small></span>;
}

export function Brand() {
  return <Link to="/" className="brand" aria-label="Bữa Nhà - Trang chủ"><span className="brand-mark"><Leaf size={24} strokeWidth={1.6} /></span><span className="brand-text"><span className="brand-title">Bữa Nhà<span>.</span></span><span className="brand-sub">CHĂM CHÚT TỪ ĐIỀU GIẢN DỊ</span></span></Link>;
}

export function Quantity({value, onChange, max = 99, disabled = false}: {value: number; onChange: (v: number) => void; max?: number; disabled?: boolean}) {
  return <div className="quantity" role="group" aria-label="Điều chỉnh số lượng"><button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= 1} aria-label="Giảm số lượng" className="qty-btn"><Minus size={15} /></button><span className="qty-value" aria-live="polite">{value}</span><button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Tăng số lượng" className="qty-btn"><Plus size={15} /></button></div>;
}

export function ProductCard({product: p}: {product: Product}) {
  const {addProduct, busy, ready} = useStore();
  return <article className="product-card" aria-label={p.name}>
    <Link to={`/products/${p.id}`} className="product-art" aria-label={`Xem chi tiết ${p.name}`}><ProductVisual id={p.id} name={p.name} /><span className="art-stamp">MINH HỌA</span></Link>
    <div className="product-body"><span className="product-category-tag">{p.category}</span><Link className="product-name" to={`/products/${p.id}`}>{p.name}</Link><p className="product-unit">Gói {p.pack_size} {p.unit}</p><p className="product-origin-text">{p.origin}</p><div className="product-bottom"><strong className="product-price">{money(p.price)}</strong><button type="button" className="add-button" aria-label={`Thêm ${p.name} vào giỏ hàng`} disabled={busy || !ready || !p.available} onClick={() => void addProduct(p.id)}><Plus size={19} /><span>Thêm</span></button></div>{!p.available && <span className="product-out-of-stock">Tạm hết hàng mẫu</span>}</div>
  </article>;
}

const recipePhotoIds: Record<string, string[]> = {
  'ga-rang-gung': ['chicken'],
  'trung-chien-hanh': ['eggs'],
  'canh-cai-dau-hu': ['greens'],
  'bo-xao-ca-chua': ['tomato'],
  'dau-hu-sot-ca': ['tomato'],
  'rau-muong-xao': ['greens'],
  'canh-ca-trung': ['tomato', 'eggs'],
  'salad-dua-leo': ['tomato', 'greens'],
  'mi-xao-rau': ['greens']
};

export function RecipeCard({recipe: r}: {recipe: Recipe}) {
  const photos = (recipePhotoIds[r.id] || []).map(id => productPhotos[id]);
  return <Link to={`/cook?ids=${r.id}`} className={`recipe-card recipe-${r.color}`} aria-label={`Xem công thức ${r.name}`}>
    <div className="recipe-art">{photos.length ? <><div className="recipe-photo" aria-hidden="true">{photos.map(src => <img key={src} src={src} alt="" loading="lazy" width="700" height="560" />)}</div><span className="recipe-photo-caption">Ảnh nguyên liệu minh họa</span></> : <><ChefHat size={42} strokeWidth={1} /><span className="recipe-art-title">{r.name}</span><span className="recipe-photo-caption">Công thức mẫu · Chưa có ảnh món</span></>}</div>
    <div className="recipe-body"><div className="recipe-meta"><span><Clock3 size={14} /> {r.minutes} phút</span><span><Users size={14} /> {r.servings} người</span></div><h3>{r.name}</h3><span className="recipe-action-link">Chọn nguyên liệu <ArrowRight size={17} /></span></div>
  </Link>;
}

export function Empty({title, text, to, label}: {title: string; text: string; to?: string; label?: string}) {
  return <div className="empty-state" role="status"><span className="empty-icon"><ShoppingBasket size={38} strokeWidth={1.4} /></span><h2>{title}</h2><p className="muted">{text}</p>{to && <Link className="button primary" to={to}>{label}<ArrowRight size={16} /></Link>}</div>;
}

export function LoadState({loading, error, retry}: {loading: boolean; error: string; retry: () => void}) {
  if (error) return <div className="inline-error" role="alert"><p>{error}</p><button className="button secondary small-button" onClick={retry}>Thử kết nối lại</button></div>;
  if (loading) return <div className="loading" role="status"><span className="spinner" />Đang tải dữ liệu…</div>;
  return null;
}

export function PageTitle({eyebrow, title, description}: {eyebrow?: string; title: string; description?: string}) {
  return <div className="page-title">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p className="page-desc">{description}</p>}</div>;
}

export function DemoNote() {
  return <p className="demo-note-box"><Leaf size={16} /><span>Dữ liệu và giao hàng mô phỏng. Không thu tiền thật.</span></p>;
}
