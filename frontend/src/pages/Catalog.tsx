import {useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ArrowLeft, Check, Search, ShoppingBasket} from 'lucide-react';
import {DemoNote, Empty, LoadState, PageTitle, ProductCard, Quantity, RecipeCard} from '../components';
import {useResource, useStore} from '../context';
import {money} from '../api';
import type {Product, Recipe} from '../types';

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '', category = params.get('category') || '';
  const [input, setInput] = useState(q);
  const resource = useResource<Product[]>(`/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);
  return <><PageTitle eyebrow="ĐI CHỢ NGAY" title="Một giỏ đầy điều tươi mới" description="Bạn chọn sản phẩm, không cần chọn từng cửa hàng."/><form className="search-box catalog-search" onSubmit={e => {e.preventDefault(); setParams({q: input, category});}}><Search size={20}/><input value={input} onChange={e => setInput(e.target.value)} placeholder="Tìm thịt, rau, trứng…" aria-label="Tìm sản phẩm"/><button className="search-submit">Tìm</button></form><div className="filter-row">{['', 'Rau củ', 'Thịt & cá', 'Trứng & đậu', 'Gạo & gia vị', 'Trái cây'].map(c => <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setParams({q, category: c})}>{c || 'Tất cả'}</button>)}</div><LoadState {...resource}/>{resource.data && !resource.loading && <><div className="list-meta"><span>{resource.data.length} sản phẩm {q && `cho “${q}”`}</span><span>Danh mục & giá minh họa</span></div>{resource.data.length ? <div className="product-grid catalog-grid">{resource.data.map(p => <ProductCard product={p} key={p.id}/>)}</div> : <Empty title="Chưa tìm thấy sản phẩm" text="Thử một tên ngắn hơn như thịt bò, trứng hoặc rau cải."/>}</>}</>;
}

export function ProductDetail() {
  const {id} = useParams();
  const resource = useResource<Product>(`/products/${id}`);
  const [quantity, setQuantity] = useState(1);
  const {addProduct, busy} = useStore();
  const p = resource.data;
  return <><Link className="back-link" to="/products"><ArrowLeft size={17}/>Quay lại đi chợ</Link><LoadState {...resource}/>{p && <div className="detail-grid"><div className="product-art large-art"><span>{p.emoji}</span><span className="art-stamp">MINH HỌA SẢN PHẨM</span></div><div className="detail-copy"><span className="eyebrow">{p.category}</span><h1>{p.name}</h1><p className="muted">Quy cách bán: gói {p.pack_size} {p.unit}</p><p className="large-price">{money(p.price)}<small>/ gói</small></p><p className="origin"><Check size={16}/>{p.origin}</p><p className="muted">Sản phẩm, giá và tình trạng hàng được chuẩn bị riêng cho bản demo.</p><div className="purchase-row"><Quantity value={quantity} onChange={setQuantity}/><button className="button primary" disabled={busy || !p.available} onClick={() => void addProduct(p.id, quantity)}><ShoppingBasket size={18}/>Thêm vào giỏ</button></div><DemoNote/></div></div>}</>;
}

export function Recipes() {
  const resource = useResource<Recipe[]>('/recipes');
  return <><PageTitle eyebrow="GÓC BẾP NHÀ" title="Hôm nay mình nấu gì?" description="Một món đơn giản hay cả bữa cơm — bạn chọn điều vừa vặn với mình."/><div className="soft-callout">Bạn có ngân sách hoặc thời gian cụ thể? <Link className="text-link" to="/assistant">Thử trợ lý gợi ý →</Link></div><LoadState {...resource}/><div className="recipe-grid">{resource.data?.map(r => <RecipeCard recipe={r} key={r.id}/>)}</div></>;
}
