import {ArrowRight, Bot, ChefHat, Cherry, Clock3, Leaf, ShoppingBasket, SlidersHorizontal, Sparkles, Wheat} from 'lucide-react';
import {Link} from 'react-router-dom';
import {LoadState, ProductCard, RecipeCard} from '../components';
import {useResource} from '../context';
import type {Product, Recipe} from '../types';

const mealImage = new URL('../assets/meal.jpg', import.meta.url).href;
const greensImage = new URL('../assets/greens.jpg', import.meta.url).href;
const chickenImage = new URL('../assets/chicken.jpg', import.meta.url).href;
const eggsImage = new URL('../assets/eggs.jpg', import.meta.url).href;
const categories = [
  {name: 'Rau củ', image: greensImage, icon: Leaf},
  {name: 'Thịt & cá', image: chickenImage, icon: ShoppingBasket},
  {name: 'Trứng & đậu', image: eggsImage, icon: ChefHat},
  {name: 'Gạo & gia vị', image: null, icon: Wheat},
  {name: 'Trái cây', image: null, icon: Cherry}
];

export function Home() {
  const products = useResource<Product[]>('/products');
  const recipes = useResource<Recipe[]>('/recipes');
  const featured = ['ga-rang-gung', 'canh-cai-dau-hu', 'trung-chien-hanh'];

  return (
    <div className="home-page">
      <section className="fresh-hero" aria-labelledby="hero-title">
        <img className="fresh-hero-image" src={mealImage} width="900" height="600" alt="Tô thức ăn nhiều màu sắc — ảnh cảm hứng, không phải món trong công thức" fetchPriority="high" />
        <div className="fresh-hero-copy">
          <span className="fresh-kicker"><Leaf size={17} /> Chăm chút bữa cơm, nhẹ nhàng mỗi ngày.</span>
          <h1 id="hero-title">Bữa ngon bắt đầu<br />từ một giỏ tươi.</h1>
          <p>Đi chợ theo cách của bạn. Chọn nguyên liệu quen, tìm thêm cảm hứng mới cho bữa nhà.</p>
          <div className="fresh-actions"><Link className="button lime-button" to="/products">Khám phá gian chợ <ArrowRight size={19} /></Link><Link className="fresh-recipe-link" to="/recipes">Hôm nay nấu gì? <ArrowRight size={17} /></Link></div>
        </div>
        <span className="fresh-image-note">Ảnh cảm hứng · Không phải món trong công thức</span>
        <div className="fresh-hero-number" aria-hidden="true">Ăn ngon.<br />Sống nhẹ.</div>
      </section>

      <div className="fresh-promise"><span><ShoppingBasket size={18} /> Tự chọn từng nguyên liệu</span><span><SlidersHorizontal size={18} /> Mua đúng phần bạn cần</span><span><Bot size={18} /> Khám phá giao hàng mô phỏng</span></div>

      <section className="fresh-market" aria-labelledby="category-title">
        <div className="section-heading"><div><span className="eyebrow">Gian chợ mỗi ngày</span><h2 id="category-title">Bếp nhà đang cần gì?</h2></div><Link className="text-link" to="/products">Tất cả sản phẩm <ArrowRight size={17} /></Link></div>
        <nav className="fresh-categories" aria-label="Danh mục thực phẩm">
          {categories.map(({name, image, icon: Icon}) => <Link className="fresh-category" to={`/products?category=${encodeURIComponent(name)}`} key={name}><span className={`fresh-category-image${image ? '' : ' illustrated-category'}`}>{image ? <img src={image} alt="" width="160" height="160" loading="lazy" /> : <Icon size={39} strokeWidth={1.5} />}</span><strong>{name}</strong><ArrowRight size={15} /></Link>)}
        </nav>
      </section>

      <section className="section fresh-products" aria-labelledby="products-title">
        <div className="section-heading"><div><span className="eyebrow">Chọn một chút, nấu một bữa</span><h2 id="products-title">Những nguyên liệu thân quen.</h2></div><span className="fresh-data-label">Giá & sản phẩm demo</span></div>
        <LoadState {...products} />
        <div className="product-grid">{['tomato', 'eggs', 'chicken', 'greens'].map(id => products.data?.find(p => p.id === id)).filter((p): p is Product => !!p).map(p => <ProductCard key={p.id} product={p} />)}</div>
        <p className="catalog-disclaimer">Hình ảnh minh họa. Giá và khả dụng lấy từ dữ liệu demo, không phải thông tin bán hàng thật.</p>
      </section>

      <section className="fresh-inspiration" aria-labelledby="inspiration-title"><div className="fresh-inspiration-icon"><Sparkles size={35} strokeWidth={1.4} /></div><div><span className="eyebrow">Một chút gợi ý cho hôm nay</span><h2 id="inspiration-title">Bớt nghĩ “ăn gì”. Thêm một bữa vui.</h2><p>Nói số người, ngân sách và thời gian. Nhận gợi ý, rồi tự chọn nguyên liệu muốn mua.</p><small>Trợ lý theo quy tắc · Không gọi mô hình AI bên ngoài</small></div><Link className="button primary" to="/assistant">Gợi ý bữa nhà <ArrowRight size={18} /></Link></section>

      <section className="section" aria-labelledby="recipes-title"><div className="section-heading"><div><span className="eyebrow">Từ nguyên liệu đến mâm cơm</span><h2 id="recipes-title">Món quen, cảm hứng mới.</h2></div><Link className="text-link" to="/recipes">Khám phá công thức <ArrowRight size={17} /></Link></div><LoadState {...recipes} /><div className="recipe-grid">{featured.map(id => recipes.data?.find(r => r.id === id)).filter((r): r is Recipe => !!r).map(r => <RecipeCard key={r.id} recipe={r} />)}</div></section>

      <section className="fresh-delivery" aria-labelledby="delivery-title"><div className="fresh-delivery-copy"><span className="fresh-kicker"><Bot size={18} /> Trải nghiệm tương lai · Bản mô phỏng</span><h2 id="delivery-title">Từ giỏ hàng<br />đến trước cửa nhà.</h2><p>Khám phá hành trình giao hàng robot trong bản demo. Tự chọn nguyên liệu, tạo đơn mẫu và theo dõi từng chặng.</p><Link className="button lime-button" to="/about">Tìm hiểu trải nghiệm <ArrowRight size={18} /></Link></div><ol className="fresh-delivery-steps"><li><span>01</span><div><ShoppingBasket size={24} /><h3>Chọn giỏ của bạn</h3><p>Đi chợ trực tiếp hoặc chọn từ công thức.</p></div></li><li><span>02</span><div><Clock3 size={24} /><h3>Đặt một đơn mẫu</h3><p>Chọn giao ngay hay hẹn giờ trong mô phỏng.</p></div></li><li><span>03</span><div><Bot size={24} /><h3>Theo dõi hành trình</h3><p>Trạng thái giả lập, không kết nối robot thật.</p></div></li></ol></section>
      <div className="fresh-closing"><Leaf size={19} /><p>Một giỏ nhỏ. Một bữa nhà.<span>Bản demo không thu tiền và không giao hàng thật.</span></p></div>
    </div>
  );
}
