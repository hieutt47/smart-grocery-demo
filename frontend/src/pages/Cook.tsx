import {useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Check, ChefHat, Clock3, ShoppingBasket, Users, X} from 'lucide-react';
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
    setLoading(true); setError(''); setSelected({});
    if (!key) {setError('Chưa có món được chọn. Quay lại khám phá món nhé.'); setLoading(false); return;}
    Promise.all(key.split(',').map(id => api<Recipe>(`/recipes/${id}`, 'GET', undefined, controller.signal)))
      .then(rows => {setRecipes(rows); setVariants(lighter ? Object.fromEntries(rows.filter(r => r.variants?.length).map(r => [r.id, r.variants![0].id])) : {});})
      .catch(e => {if (e.name !== 'AbortError') setError(e.message);})
      .finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [key, lighter, revision]);
  const selections: Selection[] = recipes.map(r => ({recipe_id: r.id, servings, ingredient_ids: selected[r.id] || [], variant_id: variants[r.id] || null}));
  const serialized = JSON.stringify(selections);
  useEffect(() => {
    const controller = new AbortController();
    const rows: Selection[] = JSON.parse(serialized);
    setQuote(null); setQuoteError('');
    if (!rows.length) return;
    setQuoteLoading(true);
    api<Quote>('/recipe-quotes', 'POST', {selections: rows}, controller.signal).then(setQuote)
      .catch(e => {if (e.name !== 'AbortError') setQuoteError(e.message);})
      .finally(() => {if (!controller.signal.aborted) setQuoteLoading(false);});
    return () => controller.abort();
  }, [serialized, revision]);
  function toggle(rid: string, iid: string) {
    setSelected(prev => ({...prev, [rid]: prev[rid]?.includes(iid) ? prev[rid].filter(i => i !== iid) : [...(prev[rid] || []), iid]}));
  }
  async function add() {
    const result = await act(() => api<Cart>('/cart/ingredients', 'POST', {selections, expected_version: cart.version}), 'Đã thêm nguyên liệu được chọn');
    if (result) {setCart(result); navigate('/cart');}
  }
  return <><Link className="back-link" to="/recipes"><ArrowLeft size={17}/>Khám phá món</Link><LoadState loading={loading} error={error} retry={() => setRevision(v => v + 1)}/>{!loading && !error && <>
    <div className="cook-title"><div><span className="eyebrow">TỪ CÔNG THỨC ĐẾN GIỎ HÀNG</span><h1>{recipes.length === 1 ? recipes[0].name : 'Bữa cơm bạn chọn'}</h1><p className="muted">Tích những nguyên liệu cần mua. Những thứ đã có, cứ bỏ qua.</p></div><div className="servings-control"><span><Users size={17}/>Số người</span><Quantity value={servings} max={6} onChange={setServings}/></div></div>
    <div className="cook-layout"><div>{recipes.map(r => <section className="cook-recipe" key={r.id}><div className={`cook-cover ${r.color}`}><span className="dish-plate">{r.emoji}</span><div><h2>{r.name}</h2><span><Clock3 size={15}/>{r.minutes} phút · Thời gian mẫu</span></div>{recipes.length > 1 && <button className="icon-button" aria-label={`Bỏ món ${r.name}`} onClick={() => navigate(`/cook?ids=${ids.filter(id => id !== r.id).join(',')}&servings=${servings}`)}><X size={18}/></button>}</div>
      <div className="cook-content"><div className="section-heading compact"><h3>Nguyên liệu cho {servings} người</h3><button className="text-button" onClick={() => setSelected(prev => ({...prev, [r.id]: selected[r.id]?.length === r.ingredients?.length ? [] : r.ingredients!.map(i => i.id)}))}>{selected[r.id]?.length === r.ingredients?.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</button></div>
      {r.variants && r.variants.length > 0 && <label className="variant-label">Khẩu vị <select value={variants[r.id] || ''} onChange={e => setVariants(v => ({...v, [r.id]: e.target.value}))}><option value="">Công thức gốc</option>{r.variants.map(v => <option value={v.id} key={v.id}>{v.name}</option>)}</select></label>}
      {variants[r.id] && <p className="small muted">{r.variants?.find(v => v.id === variants[r.id])?.note}</p>}
      <div className="ingredient-list">{r.ingredients?.map(i => {const factor = variants[r.id] && ['salt', 'fish-sauce', 'soy-sauce'].includes(i.id) ? 0.5 : 1; const amount = i.quantity * servings / r.servings * factor; return <label className={selected[r.id]?.includes(i.id) ? 'selected' : ''} key={i.id}><input type="checkbox" checked={selected[r.id]?.includes(i.id) || false} onChange={() => toggle(r.id, i.id)}/><span>{i.name}</span><strong>{Number(amount.toFixed(2))} {i.unit}</strong></label>;})}</div>
      <h3 className="steps-title"><ChefHat size={20}/>Mình vào bếp nhé</h3><ol className="cooking-steps">{r.steps?.map((s, i) => <li key={s}><span>{i + 1}</span><p>{s}</p></li>)}</ol><p className="content-source">{r.source}. Định lượng tăng theo số người; thời gian nấu cần điều chỉnh theo thực tế.</p></div></section>)}</div>
      <aside className="summary-card ingredient-summary"><span className="summary-icon"><ShoppingBasket/></span><h2>Mua đúng thứ bạn cần</h2><p className="muted small">Định lượng được đổi sang gói bán. Tổng tiền tính theo số gói bạn mua.</p>{quoteLoading && <p className="small" role="status">Đang tính lượng mua…</p>}{quoteError && <div role="alert" className="inline-error">{quoteError}<button onClick={() => setRevision(v => v + 1)}>Thử lại</button></div>}
        {quote?.items.map(i => <div className="quote-line" key={i.product_id}><div><strong>{i.name}</strong><small>Cần {Number(i.required.toFixed(2))} {i.unit} → mua {i.quantity} gói × {i.pack_size} {i.unit}</small></div><span>{money(i.subtotal)}</span></div>)}
        {quote?.missing.map(m => <p className="inline-error small" key={m.ingredient_id}>{m.name}: {m.reason} Bỏ chọn để tiếp tục.</p>)}
        {!quote?.items.length && !quoteLoading && <div className="selection-hint"><Check size={20}/><span>Tích nguyên liệu bên cạnh để xem số tiền cần mua.</span></div>}
        <div className="summary-total"><span>Tạm tính</span><strong>{money(quote?.total || 0)}</strong></div><button className="button primary full" disabled={busy || quoteLoading || !!quoteError || !quote?.items.length || !!quote?.missing.length} onClick={() => void add()}>Thêm {quote?.items.length || 0} mục vào giỏ <ArrowRight size={17}/></button><p className="small muted center">Giá mẫu · Bạn có thể sửa số lượng trong giỏ</p>
      </aside></div></>}
  </>;
}
