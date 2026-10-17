import {useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ArrowLeft, ArrowRight, CalendarClock, Check, Clock3, Info, MapPin, ShoppingBasket, Trash2} from 'lucide-react';
import {api, ApiError, money} from '../api';
import {useStore} from '../context';
import {Empty, PageTitle, Quantity} from '../components';
import type {Address, Cart, Order} from '../types';

export function CartPage() {
  const {cart, setCart, act, busy} = useStore();
  async function change(product_id: string, quantity: number) {
    const updated = await act(() => api<Cart>('/cart', 'PATCH', {items: [{product_id, quantity}], mode: 'set', expected_version: cart.version}));
    if (updated) setCart(updated);
  }
  return <><PageTitle eyebrow="GIỎ CỦA BẠN" title="Sắp có một bữa ngon rồi" description="Kiểm tra lại những món đồ bạn cần, rồi chọn giờ nhận phù hợp."/>{!cart.items.length ? <Empty title="Giỏ đang chờ những món ngon" text="Đi chợ một chút hoặc tìm cảm hứng từ những công thức quen thuộc." to="/products" label="Đi chợ ngay"/> : <div className="checkout-layout"><div><div className="cart-items">{cart.items.map(i => <article className="cart-row" key={i.product_id}><Link to={`/products/${i.product_id}`} className="cart-art">{i.emoji}</Link><div className="cart-item-copy"><Link to={`/products/${i.product_id}`}><h3>{i.name}</h3></Link><p className="small muted">Gói {i.pack_size} {i.unit} · {money(i.price)}</p>{!i.available && <span className="small error-text">Tạm hết hàng mẫu</span>}<div className={busy ? 'disabled-controls' : ''}><Quantity value={i.quantity} onChange={q => void change(i.product_id, q)}/></div></div><div className="cart-item-end"><strong>{money(i.subtotal)}</strong><button className="icon-button" disabled={busy} onClick={() => void change(i.product_id, 0)} aria-label={`Xóa ${i.name}`}><Trash2 size={17}/></button></div></article>)}</div><Link className="back-link" to="/products"><ArrowLeft size={16}/>Chọn thêm sản phẩm</Link></div><aside className="summary-card"><h2>Giỏ hàng của bạn</h2><div className="summary-line"><span>{cart.count} gói sản phẩm</span><span>{money(cart.total)}</span></div><div className="summary-line"><span>Phí giao mô phỏng</span><span>{money(0)}</span></div><div className="summary-total"><span>Tạm tính</span><strong>{money(cart.total)}</strong></div><Link className="button primary full" to="/checkout">Chọn giờ & đặt đơn <ArrowRight size={17}/></Link><div className="soft-note"><Info size={16}/><span>Đây là đơn mô phỏng. Bạn sẽ không bị thu tiền.</span></div></aside></div>}</>;
}

interface CheckoutQuote {quote_id: string; total: number; expires_at: string}
interface OrderBody {quote_id: string; idempotency_key: string; address: Address; contact: string}
const EMPTY_ADDRESS: Address = {building: '', tower: '', floor: '', apartment: ''};
const localTime = (offset: number) => new Date(Date.now() + (7 * 3600 + offset) * 1000).toISOString().slice(0, 16);

export function Checkout() {
  const {cart, refreshCart, busy, act} = useStore();
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [contact, setContact] = useState('');
  const [mode, setMode] = useState<'now' | 'scheduled'>('now');
  const [schedule, setSchedule] = useState(localTime(3600));
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const pending = useRef<OrderBody | null>(null);
  const navigate = useNavigate();
  function invalidate() {setQuote(null); pending.current = null; setError('');}
  async function verify() {
    setWorking(true); setError(''); pending.current = null;
    try {const q = await api<CheckoutQuote>('/checkout/quote', 'POST', {delivery_mode: mode, scheduled_at: mode === 'scheduled' ? `${schedule}:00+07:00` : null}); setQuote(q);}
    catch (e) {setError((e as Error).message); setQuote(null); await refreshCart().catch(() => {});}
    finally {setWorking(false);}
  }
  async function place() {
    if (!quote || working) return;
    setWorking(true); setError('');
    pending.current ??= {quote_id: quote.quote_id, idempotency_key: crypto.randomUUID(), address, contact};
    try {
      const order = await api<Order>('/orders', 'POST', pending.current);
      await refreshCart(); navigate(`/orders/${order.id}`);
    } catch (e) {
      setError((e as Error).message);
      // Preserve the exact key/body on network errors; retrying cannot create another order.
      if (e instanceof ApiError && ['CART_CHANGED', 'QUOTE_EXPIRED', 'INVALID_SCHEDULE'].includes(e.code)) {
        setQuote(null); pending.current = null; await refreshCart().catch(() => {});
      }
    } finally {setWorking(false);}
  }
  if (!cart.items.length && !pending.current) return <Empty title="Chưa có sản phẩm để đặt" text="Thêm sản phẩm vào giỏ trước nhé." to="/products" label="Đi chợ ngay"/>;
  return <><Link className="back-link" to="/cart"><ArrowLeft size={17}/>Xem lại giỏ</Link><PageTitle eyebrow="CHỈ CÒN MỘT CHÚT NỮA" title="Nhận hàng theo cách của bạn" description="Dùng thông tin thử nghiệm. Bản demo không thu tiền và không giao hàng thật."/>
    <form className="checkout-layout" onSubmit={e => {e.preventDefault(); if (quote) void place(); else void verify();}}><div className="checkout-form"><fieldset disabled={working}><section className="form-section"><div className="section-heading compact"><h2><MapPin size={20}/>Giao đến căn hộ</h2><button type="button" className="text-button" onClick={() => {setAddress({building: 'Chung cư An Nhiên (mẫu)', tower: 'A', floor: '12', apartment: '1208'}); setContact('Khách demo 01'); invalidate();}}>Dùng thông tin mẫu</button></div><label>Tên chung cư<input required value={address.building} maxLength={80} placeholder="Ví dụ: Chung cư An Nhiên" onChange={e => {setAddress(a => ({...a, building: e.target.value})); invalidate();}}/></label><div className="address-grid">{([['tower', 'Tòa'], ['floor', 'Tầng'], ['apartment', 'Căn hộ']] as const).map(([key, label]) => <label key={key}>{label}<input required maxLength={key === 'floor' ? 10 : 20} value={address[key]} placeholder={key === 'tower' ? 'A' : key === 'floor' ? '12' : '1208'} onChange={e => {setAddress(a => ({...a, [key]: e.target.value})); invalidate();}}/></label>)}</div><label>Thông tin liên hệ thử nghiệm<input required minLength={3} maxLength={80} value={contact} placeholder="Ví dụ: Khách demo 01" onChange={e => {setContact(e.target.value); invalidate();}}/></label><p className="small muted">Thông tin chỉ dùng trong đơn mô phỏng của phiên này, không tạo hồ sơ cá nhân.</p></section>
    <section className="form-section"><h2><Clock3 size={20}/>Khi nào bạn muốn nhận?</h2><div className="delivery-options"><label className={mode === 'now' ? 'active' : ''}><input type="radio" name="delivery" value="now" checked={mode === 'now'} onChange={() => {setMode('now'); invalidate();}}/><Clock3 size={22}/><span><strong>Giao ngay</strong><small>Mô phỏng khoảng 90 giây</small></span></label><label className={mode === 'scheduled' ? 'active' : ''}><input type="radio" name="delivery" value="scheduled" checked={mode === 'scheduled'} onChange={() => {setMode('scheduled'); invalidate();}}/><CalendarClock size={22}/><span><strong>Hẹn giờ giao</strong><small>Chọn lúc thuận tiện cho bạn</small></span></label></div>{mode === 'scheduled' && <label className="schedule-label">Giờ nhận hàng (giờ Việt Nam)<input type="datetime-local" required value={schedule} min={localTime(1800)} max={localTime(7 * 86400)} onChange={e => {setSchedule(e.target.value); invalidate();}}/><small>Sau ít nhất 30 phút, trong 7 ngày tới. Có thể tua giờ trong mô phỏng.</small></label>}</section></fieldset></div>
    <aside className="summary-card"><h2><ShoppingBasket size={21}/>Xác nhận đơn</h2>{cart.items.map(i => <div className="summary-line" key={i.product_id}><span>{i.name} × {i.quantity}</span><span>{money(i.subtotal)}</span></div>)}<div className="summary-line"><span>Phí giao mô phỏng</span><span>0 ₫</span></div><div className="summary-total"><span>Tổng giá mẫu</span><strong>{money(quote?.total ?? cart.total)}</strong></div>{quote && <p className="checked-note"><Check size={17}/>Đã kiểm tra giá và lịch giao</p>}{error && <p className="inline-error" role="alert">{error}</p>}<button className="button primary full" disabled={working || busy}>{working ? 'Đang xử lý…' : quote ? 'Tạo đơn mô phỏng' : 'Kiểm tra đơn'}<ArrowRight size={17}/></button><div className="soft-note"><Info size={17}/><span>Không thu tiền. Robot và lịch giao được mô phỏng.</span></div><button type="button" className="text-button" onClick={() => void act(refreshCart)} disabled={working}>Cập nhật lại giỏ</button></aside></form></>;
}
