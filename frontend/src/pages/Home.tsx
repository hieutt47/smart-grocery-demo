import {ArrowRight, Clock3, Leaf, Search, ShieldCheck, Sparkles, Truck} from 'lucide-react';
import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {DemoNote, GroceryIllustration, LoadState, ProductCard, RecipeCard} from '../components';
import {useResource} from '../context';
import type {Product, Recipe} from '../types';

export function Home() {
  const products = useResource<Product[]>('/products');
  const recipes = useResource<Recipe[]>('/recipes');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const featured = ['ga-rang-gung', 'canh-cai-dau-hu', 'trung-chien-hanh'];
  return <>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow"><span className="tiny-dot"/>TỪ GIAN BẾP ĐẾN BỮA CƠM NHÀ</span><h1>Bữa nhà đủ đầy,<br/><em>đi chợ nhẹ tênh.</em></h1><p>Chọn thực phẩm, tìm món ngon.<br/>Phần còn lại, để Bữa Nhà cùng bạn lo.</p><div className="hero-actions"><Link className="button primary" to="/products">Đi chợ ngay <ArrowRight size={18}/></Link><Link className="button soft" to="/assistant"><Sparkles size={18}/>Hôm nay ăn gì?</Link></div><DemoNote/></div>
      <div className="hero-visual"><span className="floating-label top"><Leaf size={16}/>Nguyên liệu quen, bữa ăn ngon</span><GroceryIllustration/><span className="floating-label bottom"><span className="robot-small">▰</span><span>Giao đến cửa căn hộ<small>Trải nghiệm robot mô phỏng</small></span></span></div>
    </section>
    <section className="discovery-strip"><div><h2>Hôm nay bạn cần gì?</h2><p className="muted small">Tìm món đồ quen thuộc cho gian bếp.</p></div><form className="search-box" onSubmit={e => {e.preventDefault(); navigate(`/products?q=${encodeURIComponent(query)}`);}}><Search size={20}/><input aria-label="Tìm sản phẩm" placeholder="Thịt bò, rau cải, trứng…" value={query} onChange={e => setQuery(e.target.value)}/><button aria-label="Tìm kiếm"><ArrowRight size={20}/></button></form></section>
    <div className="category-grid">{[['🥬', 'Rau củ'], ['🥩', 'Thịt & cá'], ['🥚', 'Trứng & đậu'], ['🍚', 'Gạo & gia vị'], ['🍊', 'Trái cây']].map(([icon, name]) => <Link key={name} to={`/products?category=${encodeURIComponent(name)}`}><span>{icon}</span><strong>{name}</strong><ArrowRight size={15}/></Link>)}</div>
    <section className="section"><div className="section-heading"><div><span className="eyebrow">BỮA NGON KHÔNG CẦN CẦU KỲ</span><h2>Một chút cảm hứng cho hôm nay</h2></div><Link className="text-link" to="/recipes">Xem tất cả món <ArrowRight size={16}/></Link></div><LoadState {...recipes}/><div className="recipe-grid">{featured.map(id => recipes.data?.find(r => r.id === id)).filter((r): r is Recipe => !!r).map(r => <RecipeCard key={r.id} recipe={r}/>)}</div></section>
    <section className="assistant-banner"><span className="assistant-orb"><Sparkles size={29}/></span><div><h2>“Tối nay 2 người, khoảng 100k…”</h2><p>Chưa biết nấu gì? Nói điều bạn muốn, thử một gợi ý vừa vặn.</p><span className="small muted">Trợ lý demo theo kịch bản · Không phải mô hình AI thật</span></div><Link to="/assistant" className="button secondary">Thử gợi ý món <ArrowRight size={17}/></Link></section>
    <section className="section"><div className="section-heading"><div><span className="eyebrow">GÓC ĐI CHỢ</span><h2>Những món quen trong giỏ</h2></div><Link className="text-link" to="/products">Khám phá thực phẩm <ArrowRight size={16}/></Link></div><LoadState {...products}/><div className="product-grid">{['tomato', 'eggs', 'chicken', 'greens'].map(id => products.data?.find(p => p.id === id)).filter((p): p is Product => !!p).map(p => <ProductCard key={p.id} product={p}/>)}</div></section>
    <section className="benefits"><div><Clock3/><span><strong>Ít thao tác hơn</strong><small>Chọn đúng những gì bạn cần</small></span></div><div><ShieldCheck/><span><strong>Chi phí rõ ràng</strong><small>Giá mẫu được tính theo từng gói</small></span></div><div><Truck/><span><strong>Đến tận cửa nhà</strong><small>Khám phá hành trình robot mô phỏng</small></span></div></section>
  </>;
}
