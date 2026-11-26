import {useEffect, useState} from 'react';
import {Link, useLocation, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowLeft, ChefHat, Clock3, Copy, Heart, Info, Share2, Sparkles, Users, UtensilsCrossed, X} from 'lucide-react';
import {api, money, trackEvent} from '../api';
import {useStore} from '../context';
import {LoadState, PantryModal, Quantity} from '../components';
import {getRecipeNutrition} from '../nutrition';
import {getPantryStaples, isStaple, subscribePantry} from '../pantry';
import {RecipePhotoCredit, RecipeVisual} from '../recipe-art';
import {recordTasteSignal} from '../taste';
import type {Quote, Recipe, Selection} from '../types';

function loadCustomRecipe(id: string, stateRecipes?: Recipe[]): Recipe | null {
  const fromState = stateRecipes?.find(r => r.id === id);
  if (fromState) return fromState;
  try {
    const raw = sessionStorage.getItem('bua_nha_custom_recipes');
    if (!raw) return null;
    const map: Record<string, Recipe> = JSON.parse(raw);
    return map[id] || null;
  } catch {
    return null;
  }
}

export function Cook() {
  const [params] = useSearchParams();
  const location = useLocation();
  const stateData = location.state as {customRecipes?: Recipe[]} | null;
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
  const [showPantry, setShowPantry] = useState(false);
  const [pantryIds, setPantryIds] = useState<string[]>(getPantryStaples());
  const {notify, isSaved, toggleSave, shareItem} = useStore();
  const navigate = useNavigate();
  const lighter = params.get('lighter') === '1';

  useEffect(() => subscribePantry(setPantryIds), []);

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
    Promise.all(
      key.split(',').map(async id => {
        try {
          return await api<Recipe>(`/recipes/${id}`, 'GET', undefined, controller.signal);
        } catch (err) {
          if (id.startsWith('custom-')) {
            const custom = loadCustomRecipe(id, stateData?.customRecipes);
            if (custom) return custom;
          }
          throw err;
        }
      })
    )
      .then(rows => {
        setRecipes(rows);
        for (const r of rows) {
          recordTasteSignal(r.tags || [], 'view', r.id);
        }
        setVariants(
          lighter
            ? Object.fromEntries(rows.filter(r => r.variants?.length).map(r => [r.id, r.variants![0].id]))
            : {}
        );
      })
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [key, lighter, recipeRevision, stateData]);

  const selections: Selection[] = recipes.map(r => ({
    recipe_id: r.id,
    servings,
    ingredient_ids: selected[r.id] || [],
    variant_id: variants[r.id] || null
  }));
  const serialized = JSON.stringify(selections);

  useEffect(() => {
    const controller = new AbortController();

    const hasAnySelection = selections.some(r => r.ingredient_ids && r.ingredient_ids.length > 0);
    if (!hasAnySelection) {
      setQuote(null);
      setQuoteError('');
      setQuoteLoading(false);
      return;
    }

    setQuoteLoading(true);
    setQuoteError('');
    const customRecipe = recipes.find(r => r.is_custom || r.id.startsWith('custom-'));
    const quotePromise = customRecipe
      ? api<Quote>(
          '/custom-recipe-quote',
          'POST',
          {
            servings,
            base_servings: customRecipe.servings || 2,
            ingredients: (customRecipe.ingredients || [])
              .filter(ing => (selected[customRecipe.id] || []).includes(ing.id))
              .map(ing => ({ingredient_id: ing.id, quantity: ing.quantity}))
          },
          controller.signal
        )
      : api<Quote>('/recipe-quotes', 'POST', {selections: JSON.parse(serialized)}, controller.signal);

    quotePromise
      .then(setQuote)
      .catch(e => {
        if (e.name !== 'AbortError') setQuoteError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false);
      });
    return () => controller.abort();
  }, [serialized, quoteRevision, recipes, servings, selected]);

  function toggle(rid: string, iid: string) {
    setSelected(prev => ({
      ...prev,
      [rid]: prev[rid]?.includes(iid) ? prev[rid].filter(i => i !== iid) : [...(prev[rid] || []), iid]
    }));
  }

  async function copyShoppingList() {
    if (!quote?.items.length) return;
    const dishTitle = recipes.map(r => r.name).join(' + ');
    const lines = quote.items.map(
      i => `- ${i.name}: ${Number(i.required.toFixed(2))} ${i.unit} (${i.quantity} gói ${i.pack_size} ${i.unit} · ~${money(i.subtotal)})`
    );
    const text = `📝 Danh sách đi chợ (${dishTitle} · ${servings} người)\n${lines.join('\n')}\nƯớc tính tổng: ~${money(quote.total)}`;
    try {
      await navigator.clipboard.writeText(text);
      trackEvent('copy_checklist', recipes[0]?.id);
      for (const r of recipes) {
        recordTasteSignal(r.tags || [], 'copy', r.id);
      }
      notify('Đã sao chép danh sách đi chợ!');
    } catch {
      notify('Không thể tự sao chép; hãy chọn và copy thủ công nhé.');
    }
  }

  // Calculate staples present in recipe but NOT selected (saved money)
  const unselectedStaples = recipes.flatMap(r =>
    (r.ingredients || []).filter(
      i => isStaple(i.id) && pantryIds.includes(i.id) && !(selected[r.id] || []).includes(i.id)
    )
  );
  const savedStapleCount = new Set(unselectedStaples.map(i => i.id)).size;
  const savedEstimate = savedStapleCount * 12000;

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
                <RecipeVisual recipe={recipes[0]} eager />
                <RecipePhotoCredit recipeId={recipes[0].id} />
              </div>
              <div className="cook-single-info">
                <span className="eyebrow">
                  {recipes[0].is_custom ? '✨ AI thiết kế riêng · Chi tiết công thức' : 'Chi tiết công thức & nguyên liệu'}
                </span>
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
                        <RecipePhotoCredit recipeId={r.id} />
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
                      <div className="ingredient-actions-row">
                        <button
                          type="button"
                          className="chip pantry-pill-btn"
                          onClick={() => setShowPantry(true)}
                          aria-label="Tủ gia vị nhà mình"
                          title="Tùy chỉnh các gia vị đã có sẵn trong bếp"
                        >
                          <Sparkles size={13} className="text-emerald" aria-hidden="true" />
                          <span>Tủ gia vị ({pantryIds.length})</span>
                        </button>
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
                        const isStapleItem = isStaple(i.id) && pantryIds.includes(i.id);

                        return (
                          <label className={`ingredient-item ${isChecked ? 'selected' : ''} ${isStapleItem ? 'is-staple' : ''}`} key={i.id}>
                            <input
                              type="checkbox"
                              name={`${r.id}-${i.id}`}
                              checked={isChecked}
                              onChange={() => toggle(r.id, i.id)}
                            />
                            <span className="ingredient-name">
                              <span>{i.name}</span>
                              {isStapleItem && (
                                <span className="staple-badge">Đã có ở nhà</span>
                              )}
                            </span>
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

            {/* Sticky Checklist & Reference Cost Summary */}
            <aside className="summary-card ingredient-summary" aria-label="Checklist nguyên liệu cần mua">
              <span className="summary-icon">
                <UtensilsCrossed size={24} aria-hidden="true" />
              </span>
              <h2>Checklist đi chợ</h2>
              <p className="muted small">
                Tích chọn nguyên liệu còn thiếu để hệ thống tính định lượng chuẩn và chi phí tham khảo.
              </p>

              {quoteLoading && (
                <div className="quote-loading-state" role="status">
                  <span className="spinner" />
                  <span>Đang tính định lượng & chi phí…</span>
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
                      <small>Cần {Number(i.required.toFixed(2))} {i.unit} · {i.quantity} gói ({i.pack_size} {i.unit})</small>
                    </div>
                    <span className="quote-line-price">~{money(i.subtotal)}</span>
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
                  <span>Hãy tích chọn ít nhất một nguyên liệu bên trái để tạo danh sách đi chợ.</span>
                </div>
              )}

              <div className="summary-total">
                <span>Ước tính ({quote?.items.length || 0} món)</span>
                <strong>{money(quote?.total || 0)}</strong>
              </div>
              {recipes.length > 0 && (
                <p className="small muted" style={{margin: '-8px 0 14px'}}>
                  Năng lượng ước tính: ~{recipes.reduce((sum, r) => sum + (r.estimated_kcal ?? getRecipeNutrition(r.id).kcal), 0)} kcal / người
                </p>
              )}

              <button
                type="button"
                className="button primary full"
                disabled={quoteLoading || !!quoteError || !quote?.items.length || !!quote?.missing.length}
                onClick={() => void copyShoppingList()}
              >
                <Copy size={17} aria-hidden="true" />
                <span>Sao chép danh sách đi chợ</span>
              </button>

              <div className="cook-secondary-actions">
                {recipes[0] && !recipes[0].is_custom && !recipes[0].id.startsWith('custom-') && (
                  <button
                    type="button"
                    className={`button secondary small-button ${isSaved(recipes[0].id) ? 'saved' : ''}`}
                    onClick={() => toggleSave(recipes[0].id)}
                  >
                    <Heart size={15} fill={isSaved(recipes[0].id) ? 'currentColor' : 'none'} aria-hidden="true" />
                    <span>{isSaved(recipes[0].id) ? 'Đã lưu' : 'Lưu món'}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="button secondary small-button"
                  onClick={() =>
                    void shareItem(
                      `Công thức ${recipes.map(r => r.name).join(' + ')}`,
                      `Khẩu phần ${servings} người · Xem cách nấu và nguyên liệu trên Bữa Nhà:`
                    )
                  }
                >
                  <Share2 size={15} aria-hidden="true" />
                  <span>Chia sẻ</span>
                </button>
              </div>

              {savedStapleCount > 0 && quote && quote.items.length > 0 && (
                <div className="pantry-savings-card">
                  <div className="pantry-savings-header">
                    <Sparkles size={15} className="text-emerald" aria-hidden="true" />
                    <strong>Tiết kiệm ~{money(savedEstimate)} tiền gia vị</strong>
                  </div>
                  <p className="small muted">
                    Bếp nhà mình đã có sẵn mắm muối dầu ăn, không cần mua thêm!
                  </p>
                </div>
              )}

              <p className="small muted center mt-2">
                Chi phí ước tính tham khảo theo khẩu phần
              </p>
            </aside>
          </div>

          {/* Mobile Bottom Quick Action Bar */}
          {quote && quote.items.length > 0 && (
            <div className="cook-mobile-bar" role="region" aria-label="Thanh sao chép danh sách">
              <div className="cook-mobile-bar-info">
                <span className="cook-mobile-bar-label">{quote.items.length} nguyên liệu</span>
                <strong className="cook-mobile-bar-price">~{money(quote.total)}</strong>
              </div>
              <button
                type="button"
                className="button primary cook-mobile-bar-btn"
                disabled={quoteLoading || !!quoteError || !quote.items.length || !!quote.missing.length}
                onClick={() => void copyShoppingList()}
              >
                <Copy size={15} aria-hidden="true" />
                <span>Copy danh sách</span>
              </button>
            </div>
          )}

          <PantryModal open={showPantry} onClose={() => setShowPantry(false)} />
        </>
      )}
    </>
  );
}
