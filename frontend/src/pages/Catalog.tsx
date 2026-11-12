import {useEffect, useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Check, Search, ShoppingBasket, Sparkles} from 'lucide-react';
import {DemoNote, Empty, LoadState, PageTitle, ProductCard, ProductVisual, Quantity, RecipeCard} from '../components';
import {useResource, useStore} from '../context';
import {money} from '../api';
import type {Product, Recipe} from '../types';

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);
  const resource = useResource<Product[]>(`/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);

  return (
    <>
      <PageTitle
        eyebrow="ĐI CHỢ TIỆN LỢI"
        title="Thực phẩm tươi sạch hôm nay"
        description="Chọn thực phẩm bạn cần cho bữa cơm gia đình. Không cần chọn nhiều cửa hàng riêng lẻ."
      />

      <form
        className="search-box catalog-search"
        role="search"
        onSubmit={e => {
          e.preventDefault();
          setParams({q: input, category});
        }}
      >
        <Search size={20} className="search-icon" />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Tìm thịt heo, thịt bò, rau cải, trứng…"
          aria-label="Tìm kiếm sản phẩm trong danh mục"
        />
        <button type="submit" className="search-submit">
          <span>Tìm</span>
        </button>
      </form>

      <div className="filter-row" role="group" aria-label="Lọc theo danh mục">
        {[
          {id: '', label: 'Tất cả'},
          {id: 'Rau củ', label: 'Rau củ'},
          {id: 'Thịt & cá', label: 'Thịt & cá'},
          {id: 'Trứng & đậu', label: 'Trứng & đậu'},
          {id: 'Gạo & gia vị', label: 'Gạo & gia vị'},
          {id: 'Trái cây', label: 'Trái cây'}
        ].map(c => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            className={`chip ${category === c.id ? 'active' : ''}`}
            onClick={() => setParams({q, category: c.id})}
          >
            {c.label}
          </button>
        ))}
      </div>

      <LoadState {...resource} />

      {resource.data && !resource.loading && (
        <>
          <div className="list-meta">
            <span className="list-count">
              Tìm thấy <strong>{resource.data.length}</strong> sản phẩm {q && `cho từ khóa “${q}”`}
            </span>
            <span className="list-subtext">Danh mục & giá minh họa</span>
          </div>

          {resource.data.length ? (
            <div className="product-grid catalog-grid">
              {resource.data.map(p => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          ) : (
            <Empty
              title="Chưa tìm thấy sản phẩm phù hợp"
              text="Hãy thử tìm bằng từ khóa phổ biến như: thịt bò, trứng gà, rau cải hoặc trái cây."
            />
          )}
        </>
      )}
    </>
  );
}

export function ProductDetail() {
  const {id} = useParams();
  const resource = useResource<Product>(`/products/${id}`);
  const [quantity, setQuantity] = useState(1);
  const {addProduct, busy} = useStore();
  const p = resource.data;

  return (
    <>
      <Link className="back-link" to="/products">
        <ArrowLeft size={17} />
        <span>Quay lại danh mục đi chợ</span>
      </Link>

      <LoadState {...resource} />

      {p && (
        <div className="detail-grid">
          <div className={`product-art large-art cat-${p.category === 'Rau củ' ? 'green' : p.category === 'Trái cây' ? 'yellow' : 'cream'}`}>
            <ProductVisual id={p.id} name={p.name} />
            <span className="art-stamp">HÀNG MẪU MINH HỌA</span>
          </div>

          <div className="detail-copy">
            <span className="eyebrow">{p.category}</span>
            <h1>{p.name}</h1>
            <p className="detail-pack-info">Quy cách bán: gói {p.pack_size} {p.unit}</p>

            <div className="large-price-wrapper">
              <span className="large-price">{money(p.price)}</span>
              <span className="large-price-unit">/ gói ({p.pack_size} {p.unit})</span>
            </div>

            <div className="detail-origin-badge">
              <Check size={16} className="text-emerald" />
              <span>Nguồn gốc: {p.origin}</span>
            </div>

            <p className="detail-note muted">
              Sản phẩm, quy cách đóng gói và giá cả được chuẩn bị phục vụ trải nghiệm demo giải pháp đi chợ & robot giao hàng.
            </p>

            <div className="purchase-row">
              <Quantity value={quantity} onChange={setQuantity} />
              <button
                className="button primary"
                disabled={busy || !p.available}
                onClick={() => void addProduct(p.id, quantity)}
              >
                <ShoppingBasket size={18} />
                <span>Thêm vào giỏ</span>
              </button>
            </div>

            <DemoNote />
          </div>
        </div>
      )}
    </>
  );
}

export function Recipes() {
  const resource = useResource<Recipe[]>('/recipes');

  return (
    <>
      <PageTitle
        eyebrow="GÓC BẾP GIA ĐÌNH"
        title="Hôm nay mình nấu món gì?"
        description="Một món canh thanh mát hay mâm cơm sum họp — bạn chọn điều phù hợp nhất với khẩu vị gia đình."
      />

      <div className="soft-callout">
        <Sparkles size={18} className="text-emerald" />
        <div>
          <span>Bạn có ngân sách hoặc thời gian nấu cụ thể? </span>
          <Link className="text-link" to="/assistant">
            <span>Trò chuyện với trợ lý gợi ý món</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <LoadState {...resource} />

      <div className="recipe-grid">
        {resource.data?.map(r => (
          <RecipeCard recipe={r} key={r.id} />
        ))}
      </div>
    </>
  );
}

