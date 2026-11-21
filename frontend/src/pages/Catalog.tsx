import {Fragment, useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Check, ShoppingBasket, Sparkles} from 'lucide-react';
import {DemoNote, Empty, LoadState, PageTitle, ProductCard, ProductVisual, Quantity, RecipeCard} from '../components';
import {useResource, useStore} from '../context';
import {getRecipeNutrition} from '../nutrition';
import {money} from '../api';
import type {Product, Recipe} from '../types';

const PAGE_SIZE = 12;
const INITIAL_VISIBLE_COUNT = PAGE_SIZE;
// Chèn banner sau 8 sản phẩm: chia hết cho 4 cột desktop và 2 cột mobile, nên không hàng nào bị lẻ
const HINT_AFTER_INDEX = 8;

const CATEGORIES = [
  {id: '', label: 'Tất cả'},
  {id: 'Rau củ', label: 'Rau củ'},
  {id: 'Thịt & cá', label: 'Thịt & cá'},
  {id: 'Trứng & đậu', label: 'Trứng & đậu'},
  {id: 'Gạo & gia vị', label: 'Gạo & gia vị'},
  {id: 'Trái cây', label: 'Trái cây'}
];

function AssistantHint() {
  return (
    <div className="catalog-assistant-hint" role="note">
      <div className="catalog-hint-text">
        <div className="catalog-hint-header">
          <Sparkles size={20} className="catalog-hint-icon" aria-hidden="true" />
          <strong>Cần gợi ý bữa cơm hôm nay?</strong>
        </div>
        <p>Nói số người và ngân sách, Bữa Nhà sẽ gợi ý mâm cơm và chuẩn bị nguyên liệu.</p>
      </div>
      <Link to="/assistant" className="catalog-hint-link">
        Gợi ý món <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}

function CatalogResults({products, q}: {products: Product[]; q: string}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const totalCount = products.length;
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;
  const nextBatch = Math.min(PAGE_SIZE, totalCount - visibleCount);

  return (
    <>
      <div className="list-meta">
        <span className="list-count" aria-live="polite">
          <strong>{Math.min(visibleCount, totalCount)}</strong> / {totalCount} sản phẩm{q ? ` cho “${q}”` : ''}
        </span>
        <span className="list-subtext">Kho tập kết An Nhiên</span>
      </div>

      {totalCount ? (
        <>
          <div className="product-grid catalog-grid">
            {visibleProducts.map((p, index) => (
              <Fragment key={p.id}>
                {index === HINT_AFTER_INDEX && <AssistantHint />}
                <ProductCard product={p} eager={index < 4} />
              </Fragment>
            ))}
          </div>

          {hasMore && (
            <div className="load-more-row">
              <button
                type="button"
                className="load-more-button"
                onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              >
                Xem thêm {nextBatch} sản phẩm
              </button>
            </div>
          )}
        </>
      ) : (
        <Empty
          title="Chưa tìm thấy sản phẩm phù hợp"
          text="Thử danh mục khác, hoặc dùng ô tìm kiếm ở đầu trang để tra theo tên món."
        />
      )}
    </>
  );
}

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const resource = useResource<Product[]>(`/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);

  return (
    <div className="catalog-page">
      <PageTitle
        eyebrow="Đi chợ tiện lợi"
        title="Thực phẩm hôm nay"
      />

      <div className="filter-row" role="group" aria-label="Lọc theo danh mục">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            className={`chip ${category === c.id ? 'active' : ''}`}
            onClick={() => {
              const next: Record<string, string> = {};
              if (q) next.q = q;
              if (c.id) next.category = c.id;
              setParams(next, {replace: true});
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <LoadState {...resource} />

      {resource.data && !resource.loading && (
        <CatalogResults key={`${q}|${category}`} products={resource.data} q={q} />
      )}
    </div>
  );
}

export function ProductDetail() {
  const {id} = useParams();
  const resource = useResource<Product>(`/products/${id}`);
  const [quantity, setQuantity] = useState(1);
  const {addProduct, busy, ready} = useStore();
  const p = resource.data;

  return (
    <>
      <Link className="back-link" to="/products">
        <ArrowLeft size={17} aria-hidden="true" />
        <span>Quay lại danh mục đi chợ</span>
      </Link>

      <LoadState {...resource} />

      {p && (
        <div className="detail-grid">
          <div className="product-art large-art">
            <ProductVisual id={p.id} name={p.name} category={p.category} />
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
              <Check size={16} className="text-emerald" aria-hidden="true" />
              <span>Nguồn gốc: {p.origin}</span>
            </div>

            <p className="detail-note muted">
              Sản phẩm, quy cách đóng gói và giá cả được chuẩn bị phục vụ trải nghiệm demo giải pháp đi chợ & robot giao hàng.
            </p>

            <div className="purchase-row">
              <Quantity value={quantity} onChange={setQuantity} />
              <button
                type="button"
                className="button primary"
                disabled={busy || !ready || !p.available}
                onClick={() => void addProduct(p.id, quantity)}
              >
                <ShoppingBasket size={18} aria-hidden="true" />
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

const RECIPE_CATEGORIES = [
  {id: 'all', label: 'Tất cả món'},
  {id: 'nhanh', label: 'Nhanh gọn (≤ 20 phút)'},
  {id: 'eat-clean', label: 'Eat clean · Ít dầu'},
  {id: 'man', label: 'Món mặn'},
  {id: 'canh', label: 'Món canh'},
  {id: 'rau', label: 'Món rau & xào'}
];

function foldVietnamese(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function Recipes() {
  const [params, setParams] = useSearchParams();
  const resource = useResource<Recipe[]>('/recipes');
  const filterParam = params.get('filter') || 'all';
  const queryParam = foldVietnamese((params.get('q') || '').trim());

  const allRecipes = resource.data || [];
  const filteredRecipes = allRecipes.filter(r => {
    const matchesQuery =
      !queryParam ||
      foldVietnamese(r.name).includes(queryParam) ||
      foldVietnamese(r.description).includes(queryParam) ||
      r.tags?.some(t => foldVietnamese(t).includes(queryParam));
    if (!matchesQuery) return false;
    if (filterParam === 'all') return true;
    if (filterParam === 'eat-clean') return !!getRecipeNutrition(r.id).eatClean;
    if (filterParam === 'man') return r.tags?.some(t => ['món mặn', 'gà', 'bò', 'thịt', 'cá'].includes(t));
    if (filterParam === 'canh') return r.tags?.includes('canh');
    if (filterParam === 'rau') return r.tags?.includes('rau') || r.name.toLowerCase().includes('rau') || r.name.toLowerCase().includes('salad');
    if (filterParam === 'nhanh') return r.minutes <= 20;
    return true;
  });

  function setFilter(next: string) {
    const nextParams = new URLSearchParams(params);
    if (next === 'all') nextParams.delete('filter');
    else nextParams.set('filter', next);
    setParams(nextParams);
  }

  return (
    <div className="recipes-page">
      <PageTitle
        eyebrow="Góc bếp văn phòng"
        title="Hôm nay nấu món gì?"
        description={queryParam ? `Kết quả tìm kiếm cho “${params.get('q')}”` : 'Chọn nhanh món phù hợp với thời gian và khẩu vị của bạn.'}
      />

      <div className="recipes-assistant-banner">
        <div className="recipes-assistant-text">
          <Sparkles size={18} className="text-emerald" aria-hidden="true" />
          <span>Bạn cần gợi ý theo ngân sách hoặc số người?</span>
        </div>
        <Link className="text-link" to="/assistant">
          <span>Hỏi trợ lý AI</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="filter-row" role="group" aria-label="Lọc theo loại món">
        {RECIPE_CATEGORIES.map(c => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filterParam === c.id}
            className={`chip ${filterParam === c.id ? 'active' : ''}`}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
        {queryParam && (
          <button
            type="button"
            className="chip"
            onClick={() => {
              const nextParams = new URLSearchParams(params);
              nextParams.delete('q');
              setParams(nextParams);
            }}
          >
            Xóa tìm kiếm “{params.get('q')}” ✕
          </button>
        )}
      </div>

      <LoadState {...resource} />

      {resource.data && !resource.loading && (
        <>
          <div className="list-meta">
            <span className="list-count" aria-live="polite">
              <strong>{filteredRecipes.length}</strong> / {allRecipes.length} công thức
            </span>
            <span className="list-subtext">Định lượng tự tính theo khẩu phần</span>
          </div>

          {filteredRecipes.length > 0 ? (
            <div className="recipe-grid">
              {filteredRecipes.map(r => (
                <RecipeCard recipe={r} key={r.id} />
              ))}
            </div>
          ) : (
            <Empty
              title="Chưa có công thức phù hợp"
              text="Hãy thử từ khóa khác hoặc nhờ trợ lý AI gợi ý món mới nhé."
              to="/assistant"
              label="Hỏi trợ lý AI"
            />
          )}
        </>
      )}
    </div>
  );
}

