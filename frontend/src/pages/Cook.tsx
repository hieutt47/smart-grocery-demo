import {useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Check, ChefHat, Clock3, Info, ShoppingBasket, Users, UtensilsCrossed, X} from 'lucide-react';
import {api, money} from '../api';
import {useStore} from '../context';
import {LoadState, Quantity} from '../components';
import type {Cart, Quote, Recipe, Selection} from '../types';

export function Cook() {
  const [params] = useSearchParams();
  const ids = (params.get('ids') || '').split(',').filter(Boolean).slice(0, 3);
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
  const [revision, setRevision] = useState(0);
  const {cart, setCart, act, busy} = useStore();
  const navigate = useNavigate();
  const lighter = params.get('lighter') === '1';

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setSelected({});
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
  }, [key, lighter, revision]);

  const selections: Selection[] = recipes.map(r => ({
    recipe_id: r.id,
    servings,
    ingredient_ids: selected[r.id] || [],
    variant_id: variants[r.id] || null
  }));
  const serialized = JSON.stringify(selections);

  useEffect(() => {
    const controller = new AbortController();
    const rows: Selection[] = JSON.parse(serialized);
    setQuote(null);
    setQuoteError('');
    if (!rows.length) return;
    setQuoteLoading(true);
    api<Quote>('/recipe-quotes', 'POST', {selections: rows}, controller.signal)
      .then(setQuote)
      .catch(e => {
        if (e.name !== 'AbortError') setQuoteError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false);
      });
    return () => controller.abort();
  }, [serialized, revision]);

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

  return (
    <>
      <Link className="back-link" to="/recipes">
        <ArrowLeft size={17} />
        <span>Khám phá thêm công thức</span>
      </Link>

      <LoadState loading={loading} error={error} retry={() => setRevision(v => v + 1)} />

      {!loading && !error && (
        <>
          <div className="cook-title">
            <div className="cook-title-left">
              <span className="eyebrow">CHỌN NGUYÊN LIỆU THÔNG MINH</span>
              <h1>{recipes.length === 1 ? recipes[0].name : 'Mâm cơm bạn đã chọn'}</h1>
              <p className="muted">
                Tích chọn những nguyên liệu cần mua. Những gia vị hoặc đồ đã có sẵn trong bếp, bạn chỉ cần bỏ qua.
              </p>
            </div>
            <div className="servings-control" role="group" aria-label="Khẩu phần ăn">
              <span className="servings-label">
                <Users size={17} className="text-emerald" />
                <span>Khẩu phần</span>
              </span>
              <Quantity value={servings} max={6} onChange={setServings} />
            </div>
          </div>

          <div className="cook-layout">
            <div className="cook-main">
              {recipes.map(r => (
                <section className="cook-recipe" key={r.id}>
                  <div className={`cook-cover ${r.color}`}>
                    <span className="dish-plate">
                      <ChefHat size={34} strokeWidth={1.3} />
                    </span>
                    <div className="cook-cover-meta">
                      <h2>{r.name}</h2>
                      <span className="cook-time-tag">
                        <Clock3 size={15} />
                        <span>Thời gian chuẩn bị ~{r.minutes} phút</span>
                      </span>
                    </div>
                    {recipes.length > 1 && (
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Bỏ món ${r.name}`}
                        onClick={() => navigate(`/cook?ids=${ids.filter(id => id !== r.id).join(',')}&servings=${servings}`)}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  <div className="cook-content">
                    <div className="section-heading compact">
                      <div className="flex-row items-center gap-2">
                        <UtensilsCrossed size={18} className="text-emerald" />
                        <h3>Nguyên liệu cần cho {servings} người</h3>
                      </div>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setSelected(prev => ({
                            ...prev,
                            [r.id]: selected[r.id]?.length === r.ingredients?.length ? [] : r.ingredients!.map(i => i.id)
                          }))
                        }
                      >
                        {selected[r.id]?.length === r.ingredients?.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả nguyên liệu'}
                      </button>
                    </div>

                    {r.variants && r.variants.length > 0 && (
                      <label className="variant-label">
                        <span>Tùy chỉnh khẩu vị:</span>
                        <select
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
                        <Info size={13} className="text-emerald inline-icon" />
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

                    <h3 className="steps-title">
                      <ChefHat size={20} className="text-emerald" />
                      <span>Hướng dẫn các bước nấu</span>
                    </h3>

                    <ol className="cooking-steps">
                      {r.steps?.map((s, i) => (
                        <li key={s} className="step-item">
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
                <ShoppingBasket size={24} />
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
                  <button type="button" className="button secondary small-button" onClick={() => setRevision(v => v + 1)}>
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
                  <Check size={20} className="text-emerald" />
                  <span>Hãy tích chọn ít nhất một nguyên liệu bên trái để xem tính toán chi phí.</span>
                </div>
              )}

              <div className="summary-total">
                <span>Tạm tính ({quote?.items.length || 0} món)</span>
                <strong>{money(quote?.total || 0)}</strong>
              </div>

              <button
                className="button primary full"
                disabled={busy || quoteLoading || !!quoteError || !quote?.items.length || !!quote?.missing.length}
                onClick={() => void add()}
              >
                <span>Thêm {quote?.items.length || 0} mục vào giỏ</span>
                <ArrowRight size={17} />
              </button>

              <p className="small muted center mt-2">
                Giá minh họa · Bạn có thể tùy chỉnh lại số lượng trong giỏ hàng
              </p>
            </aside>
          </div>
        </>
      )}
    </>
  );
}

