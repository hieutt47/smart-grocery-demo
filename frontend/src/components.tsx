import {ArrowRight, Clock3, Leaf, Minus, Plus, ShoppingBasket, Sparkles} from 'lucide-react';
import {Link} from 'react-router-dom';
import {money} from './api';
import {useStore} from './context';
import type {Product, Recipe} from './types';

export function Brand() {return <Link to="/" className="brand" aria-label="Bữa Nhà - Trang chủ"><span className="brand-mark"><Leaf size={24}/></span><span>Bữa Nhà<span className="brand-sub">SMART GROCERY</span></span></Link>;}
export function Quantity({value, onChange, max = 99}: {value: number; onChange: (v: number) => void; max?: number}) {
  return <div className="quantity"><button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Giảm số lượng"><Minus size={15}/></button><span>{value}</span><button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Tăng số lượng"><Plus size={15}/></button></div>;
}
export function ProductCard({product: p}: {product: Product}) {
  const {addProduct, busy, ready} = useStore();
  return <article className="product-card"><Link to={`/products/${p.id}`} className={`product-art cat-${p.category === 'Rau củ' ? 'green' : p.category === 'Trái cây' ? 'yellow' : 'cream'}`} aria-label={`Xem ${p.name}`}><span aria-hidden="true">{p.emoji}</span><span className="art-stamp">HÀNG MẪU</span></Link><div className="product-body"><span className="eyebrow subtle">{p.category}</span><Link className="product-name" to={`/products/${p.id}`}>{p.name}</Link><p className="muted small">Gói {p.pack_size} {p.unit}</p><div className="product-bottom"><strong>{money(p.price)}</strong><button className="add-button" aria-label={`Thêm ${p.name}`} disabled={busy || !ready || !p.available} onClick={() => void addProduct(p.id)}><Plus size={19}/></button></div>{!p.available && <span className="small">Tạm hết hàng mẫu</span>}</div></article>;
}
export function RecipeCard({recipe: r}: {recipe: Recipe}) {
  return <Link to={`/cook?ids=${r.id}`} className="recipe-card"><div className={`recipe-art ${r.color}`}><span className="dish-plate"><span>{r.emoji}</span></span><span className="time-pill"><Clock3 size={13}/>{r.minutes} phút</span></div><div className="recipe-body"><span className="eyebrow subtle">MÓN NHÀ DỄ NẤU</span><h3>{r.name}</h3><span className="text-link">Xem công thức <ArrowRight size={16}/></span></div></Link>;
}
export function Empty({title, text, to, label}: {title: string; text: string; to?: string; label?: string}) {
  return <div className="empty-state"><span className="empty-icon"><ShoppingBasket size={35}/></span><h2>{title}</h2><p className="muted">{text}</p>{to && <Link className="button primary" to={to}>{label}<ArrowRight size={17}/></Link>}</div>;
}
export function LoadState({loading, error, retry}: {loading: boolean; error: string; retry: () => void}) {
  if (error) return <div className="inline-error" role="alert"><p>{error}</p><button className="button secondary" onClick={retry}>Thử lại</button></div>;
  if (loading) return <div className="loading" role="status"><span className="spinner"/>Đang chuẩn bị một chút…</div>;
  return null;
}
export function PageTitle({eyebrow, title, description}: {eyebrow?: string; title: string; description?: string}) {
  return <div className="page-title">{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>;
}
export function DemoNote() {return <p className="demo-note"><Sparkles size={15}/>Dữ liệu & giá mẫu · Đặt hàng và giao robot mô phỏng</p>;}

export function GroceryIllustration() {
  return <svg className="grocery-illustration" viewBox="0 0 500 390" role="img" aria-label="Túi đi chợ với rau xanh, cà rốt và cà chua, bên cạnh robot giao hàng nhỏ">
    <ellipse cx="270" cy="345" rx="190" ry="22" fill="#deded0"/>
    <circle cx="279" cy="177" r="146" fill="#e2e9d7"/>
    <path d="M99 281c-15-67-63-80-65-130 55 4 87 58 65 130" fill="#9db68d"/>
    <path d="M94 273c-8-57 20-80 42-89 11 47-9 72-42 89" fill="#72966f"/>
    <g transform="rotate(-18 240 160)"><path d="M225 138l18 145 29-145z" fill="#e59154"/><path d="M247 145c-37-24-25-62-15-70 17 11 22 42 15 70M248 144c2-44 26-70 42-62 0 26-18 47-42 62" fill="#4b8050"/></g>
    <path d="M303 187c-30-43-17-84 0-85 12 1 19 26 18 39 0-47 31-61 43-42 10 18-14 45-21 58 35-29 55-12 43 13-11 24-48 32-83 17" fill="#477a50"/>
    <path d="M305 191l38-65" stroke="#b0c38f" strokeWidth="4" fill="none"/>
    <ellipse cx="208" cy="188" rx="42" ry="39" fill="#ce644a"/><path d="m207 149-14 9 18-1 13 7-5-13" fill="#548259"/>
    <path d="M160 187h201l-17 153H177z" fill="#d2b994"/>
    <path d="M177 187h17l5 153h-22z" fill="#c3a67e"/>
    <path d="M216 210v-36c0-52 79-52 79 0v36" fill="none" stroke="#9c825f" strokeWidth="10" strokeLinecap="round"/>
    <circle cx="268" cy="273" r="36" fill="#f4eddf"/>
    <path d="M250 287c-5-25 12-38 34-39 2 23-9 40-30 38m1-2 20-26" stroke="#447351" strokeWidth="3" fill="#92ad78"/>
    <g transform="translate(345 253)"><ellipse cx="49" cy="83" rx="52" ry="10" fill="#c5c9ba"/><rect x="5" y="14" width="86" height="59" rx="23" fill="#f9faf5" stroke="#b9c7b8" strokeWidth="2"/><rect x="20" y="26" width="54" height="24" rx="10" fill="#315344"/><circle cx="36" cy="37" r="3" fill="#def2a5"/><circle cx="58" cy="37" r="3" fill="#def2a5"/><path d="M40 44q7 5 14 0" fill="none" stroke="#def2a5" strokeWidth="2"/><circle cx="24" cy="73" r="10" fill="#42594a"/><circle cx="75" cy="73" r="10" fill="#42594a"/><path d="M48 14V3" stroke="#638060" strokeWidth="3"/><circle cx="48" cy="2" r="5" fill="#b4c68b"/></g>
    <g fill="#f7faf0"><circle cx="147" cy="105" r="6"/><circle cx="395" cy="198" r="5"/></g>
    <path d="m130 81 4-11 4 11 11 4-11 4-4 11-4-11-11-4z" fill="#b2bf83"/>
  </svg>;
}
