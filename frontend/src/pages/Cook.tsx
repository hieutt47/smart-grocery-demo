import {useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowLeft, ArrowRight, ChefHat, Clock3, Info, ShoppingBasket, Users, UtensilsCrossed, X} from 'lucide-react';
import {api, money} from '../api';
import {useStore} from '../context';
import {LoadState, Quantity} from '../components';
import {RecipeVisual} from '../recipe-art';
import type {Cart, Quote, Recipe, Selection} from '../types';

export function Cook() {
  const [params] = useSearchParams();
  const ids = Array.from(new Set((params.get('ids') || '').split(',').filter(Boolean))).slice(0, 3);
  const key = ids.join(',');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [servings, setServings] = useState(Math.max(1, Math.min(6, Number(params.get('servings')) || 2)));
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState('');
  const [quoteError, setQuoteError] = useState('');
  const [recipeRevision, setRecipeRevision] = useState(0);
  const [quoteRevision, setQuoteRevision] = useState(0);
  const {cart, setCart, act, busy} = useStore();
  const navigate = useNavigate();
  const lighter = params.get('lighter') === '1';

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setSelected(prev => {
      const currentKeySet = new Set(key.split(',').filter(Boolean));
      return Object.fromEntries(Object.entries(prev).filter(([rid]) => currentKeySet.has(rid)));
    });
    if (!key) {
      setError('Chưa có món được chọn. Hãy quay lại góc bếp để chọn món nhé.');
      setLoading(false);
      return;
    }
    Promise.all(key.split(',').map(id => api<Recipe>(`/recipes/${id}`, 'GET', undefined, controller.signal)))
      .then(rows => {
        setRecipes(rows);
        setVariants(lighter ? Object.fromEntries(rows.filter(r => r.variants?.length).map(r => [r.id, r.variants![0].id])) : {});
      })
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [key, lighter, recipeRevision]);

  const selections: Selection[] = recipes.map(r => ({
    recipe_id: r.id,
    servings,
    ingredient_ids: selected[r.id] || [],
    variant_id: variants[r.id] || null
  }));
  const serialized = JSON.stringify(selections);

  useEffect(() => {
    const controller = new AbortController();

    // Kiểm tra xem có bất kỳ nguyên liệu nào được chọn không
    const hasAnySelection = selections.some(r => r.ingredient_ids && r.ingredient_ids.length > 0);
    if (!hasAnySelection) {
      setQuote(null);
      setQuoteError('');
      setQuoteLoading(false);
      return;
    }

    // Mô hình Stale-While-Revalidate: Giữ quote cũ khi đang tính lại để UI không bị giật nhấp nháy
    setQuoteLoading(true);
    setQuoteError('');
    api<Quote>('/recipe-quotes', 'POST', {selections}, controller.signal)
      .then(setQuote)
      .catch(e => {
        if (e.name !== 'AbortError') setQuoteError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false);
      });
    return () => controller.abort();
  }, [serialized, quoteRevision]);

  function toggle(rid: string, iid: string) {
    setSelected(prev => ({
      ...prev,
      [rid]: prev[rid]?.includes(iid) ? prev[rid].filter(i => i !== iid) : [...(prev[rid] || []), iid]
    }));
  }

  async function add() {
    const result = await act(
      () => api<Cart>('/cart/ingredients', 'POST', {selections, expected_version: cart.version}),
      'Đã thêm nguyên liệu được chọn vào giỏ hàng'
    );
    if (result) {
      setCart(result);
      navigate('/cart');
    }
  }

  const isSingle = recipes.length === 1;

  return (
    <>
      <Link className="back-link" to="/recipes">
        <ArrowLeft size={17} aria-hidden="true" />
        <span>Khám phá thêm công thức</span>
      </Link>

      <LoadState loading={loading} error={error} retry={() => setRecipeRevision(v => v + 1)} />

      {!loading && !error && (
        <>
          {/* Header dành riêng cho 1 món: Không lặp H1 và H2, căn lề 24px chuẩn */}
          {isSingle ? (
            <div className="cook-single-hero">
              <div className="cook-single-art">
                <RecipeVisual recipe={recipes[0]} />
              </div>
              <div className="cook-single-info">
                <span className="eyebrow">Chi tiết công thức & nguyên liệu</span>
                <h1>{recipes[0].name}</h1>
                <div className="cook-cover-tags">
                  <span className="cook-time-tag">
                    <Clock3 size={14} aria-hidden="true" />
                    <span>~{recipes[0].minutes} phút</span>
                  </span>
                  <span className="cook-servings-tag">
                    <Users size={14} aria-hidden="true" />
                    <span>Gốc {recipes[0].servings} người</span>
                  </span>
                </div>
                <div className="servings-control" role="group" aria-label="Khẩu phần ăn">
                  <span className="servings-label">
                    <Users size={17} className="text-emerald" aria-hidden="true" />
                    <span>Nấu cho</span>
                  </span>
                  <Quantity value={servings} max={6} onChange={setServings} />
                  <span className="servings-unit">người</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="cook-title">
              <div className="cook-title-left">
                <span className="eyebrow">Mâm cơm gia đình</span>
                <h1>Mâm cơm bạn đã chọn</h1>
                <p className="muted">
                  Tích chọn những nguyên liệu cần mua. Những gia vị hoặc đồ đã có sẵn trong bếp, bạn chỉ cần bỏ qua.
                </p>
              </div>
              <div className="servings-control" role="group" aria-label="Khẩu phần ăn">
                <span className="servings-label">
                  <Users size={17} className="text-emerald" aria-hidden="true" />
                  <span>Khẩu phần</span>
                </span>
                <Quantity value={servings} max={6} onChange={setServings} />
                <span className="servings-unit">người</span>
              </div>
            </div>
          )}

          <div className="cook-layout">
            <div className="cook-main">
              {recipes.map(r => (
                <section className="cook-recipe" key={r.id}>
                  {/* Nếu nhiều món: Hiện cover riêng có nút xóa cho từng món */}
                  {!isSingle && (
                    <div className="cook-cover">
                      <div className="cook-cover-thumb">
                        <RecipeVisual recipe={r} className="cook-cover-art" />
                      </div>
                      <div className="cook-cover-meta">
                        <h2>{r.name}</h2>
                        <div className="cook-cover-tags">
                          <span className="cook-time-tag">
                            <Clock3 size={14} aria-hidden="true" />
                            <span>~{r.minutes} phút</span>
                          </span>
                          <span className="cook-servings-tag">
                            <Users size={14} aria-hidden="true" />
                            <span>Khẩu phần {servings} người</span>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="icon-button cook-remove-button"
                        aria-label={`Bỏ món ${r.name}`}
                        onClick={() => {
                          const nextIds = ids.filter(id => id !== r.id).join(',');
                          const lighterParam = lighter ? '&lighter=1' : '';
                          navigate(`/cook?ids=${nextIds}&servings=${servings}${lighterParam}`);
                        }}
                      >
                        <X size={20} aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  <div className="cook-content">
                    <div className="section-heading compact">
                      <div className="flex-row items-center gap-2">
                        <UtensilsCrossed size={18} className="text-emerald" aria-hidden="true" />
                        {isSingle ? (
                          <h2>Nguyên liệu cần cho {servings} người</h2>
                        ) : (
                          <h3>Nguyên liệu cần cho {servings} người</h3>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          setSelected(prev => {
                            const current = prev[r.id] || [];
                            const allIds = (r.ingredients || []).map(i => i.id);
                            const isAllSelected = allIds.length > 0 && current.length === allIds.length;
                            return {
                              ...prev,
                              [r.id]: isAllSelected ? [] : allIds
                            };
                          });
                        }}
                      >
                        {(selected[r.id]?.length === r.ingredients?.length && (r.ingredients?.length || 0) > 0)
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả nguyên liệu'}
                      </button>
                    </div>

                    {r.variants && r.variants.length > 0 && (
                      <label className="variant-label">
                        <span>Tùy chỉnh khẩu vị:</span>
                        <select
                          name="variant"
                          value={variants[r.id] || ''}
                          onChange={e => setVariants(v => ({...v, [r.id]: e.target.value}))}
                        >
                          <option value="">Công thức gốc chuẩn vị</option>
                          {r.variants.map(v => (
                            <option value={v.id} key={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </label>
                    )}

                    {variants[r.id] && (
                      <p className="variant-note small muted">
                        <Info size={13} className="text-emerald inline-icon" aria-hidden="true" />
                        <span>{r.variants?.find(v => v.id === variants[r.id])?.note}</span>
                      </p>
                    )}

                    <div className="ingredient-list" role="group" aria-label="Danh sách nguyên liệu">
                      {r.ingredients?.map(i => {
                        const factor = variants[r.id] && ['salt', 'fish-sauce', 'soy-sauce'].includes(i.id) ? 0.5 : 1;
                        const amount = (i.quantity * servings / r.servings) * factor;
                        const isChecked = selected[r.id]?.includes(i.id) || false;

                        return (
                          <label className={`ingredient-item ${isChecked ? 'selected' : ''}`} key={i.id}>
                            <input
                              type="checkbox"
                              name={`${r.id}-${i.id}`}
                              checked={isChecked}
                              onChange={() => toggle(r.id, i.id)}
                            />
                            <span className="ingredient-name">{i.name}</span>
                            <strong className="ingredient-amount">
                              {Number(amount.toFixed(2))} {i.unit}
                            </strong>
                          </label>
                        );
                      })}
                    </div>

                    {isSingle ? (
                      <h2 className="steps-title">
                        <ChefHat size={18} className="text-emerald" aria-hidden="true" />
                        <span>Hướng dẫn các bước nấu</span>
                      </h2>
                    ) : (
                      <h3 className="steps-title">
                        <ChefHat size={18} className="text-emerald" aria-hidden="true" />
                        <span>Hướng dẫn các bước nấu</span>
                      </h3>
                    )}

                    <ol className="cooking-steps">
                      {r.steps?.map((s, i) => (
                        <li key={`${r.id}-step-${i}`} className="step-item">
                          <span className="step-badge">{i + 1}</span>
                          <p className="step-text">{s}</p>
                        </li>
                      ))}
                    </ol>

                    <p className="content-source">
                      Nguồn: {r.source}. Định lượng được hệ thống tự tính theo số người; thời gian nấu có thể gia giảm tùy dụng cụ bếp.
                    </p>
                  </div>
                </section>
              ))}
            </div>

            {/* Sticky Calculation & Cart Summary */}
            <aside className="summary-card ingredient-summary" aria-label="Tóm tắt nguyên liệu cần mua">
              <span className="summary-icon">
                <ShoppingBasket size={24} aria-hidden="true" />
              </span>
              <h2>Mua đúng thứ bạn cần</h2>
              <p className="muted small">
                Hệ thống cộng gộp định lượng và tự động làm tròn sang quy cách đóng gói bán của siêu thị.
              </p>

              {quoteLoading && (
                <div className="quote-loading-state" role="status">
                  <span className="spinner" />
                  <span>Đang tính toán số gói & chi phí…</span>
                </div>
              )}

              {quoteError && (
                <div role="alert" className="inline-error">
                  <p>{quoteError}</p>
                  <button type="button" className="button secondary small-button" onClick={() => setQuoteRevision(v => v + 1)}>
                    Thử lại
                  </button>
                </div>
              )}

              <div className="quote-items-container">
                {quote?.items.map(i => (
                  <div className="quote-line" key={i.product_id}>
                    <div className="quote-line-info">
                      <strong>{i.name}</strong>
                      <small>Cần {Number(i.required.toFixed(2))} {i.unit} → Mua {i.quantity} gói ({i.pack_size} {i.unit})</small>
                    </div>
                    <span className="quote-line-price">{money(i.subtotal)}</span>
                  </div>
                ))}
              </div>

              {quote?.missing.map(m => (
                <p className="inline-error small" key={m.ingredient_id}>
                  {m.name}: {m.reason}. Vui lòng bỏ chọn mục này để tiếp tục.
                </p>
              ))}

              {!quote?.items.length && !quoteLoading && (
                <div className="selection-hint">
                  <Info size={18} className="text-emerald" aria-hidden="true" />
                  <span>Hãy tích chọn ít nhất một nguyên liệu bên trái để xem tính toán chi phí.</span>
                </div>
              )}

              <div className="summary-total">
                <span>Tạm tính ({quote?.items.length || 0} món)</span>
                <strong>{money(quote?.total || 0)}</strong>
              </div>

              <button
                type="button"
                className="button primary full"
                disabled={busy || quoteLoading || !!quoteError || !quote?.items.length || !!quote?.missing.length}
                onClick={() => void add()}
              >
                <span>Thêm {quote?.items.length || 0} mục vào giỏ</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>

              <p className="small muted center mt-2">
                Giá minh họa · Bạn có thể tùy chỉnh lại số lượng trong giỏ hàng
              </p>
            </aside>
          </div>

          {/* Mobile Bottom Quick Action Bar */}
          {quote && quote.items.length > 0 && (
            <div className="cook-mobile-bar" role="region" aria-label="Thanh chốt nguyên liệu">
              <div className="cook-mobile-bar-info">
                <span className="cook-mobile-bar-label">{quote.items.length} món cần mua</span>
                <strong className="cook-mobile-bar-price">{money(quote.total)}</strong>
              </div>
              <button
                type="button"
                className="button primary cook-mobile-bar-btn"
                disabled={busy || quoteLoading || !!quoteError || !quote.items.length || !!quote.missing.length}
                onClick={() => void add()}
              >
                <span>Thêm vào giỏ</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
