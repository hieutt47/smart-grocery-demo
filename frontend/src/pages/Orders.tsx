import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Check, Clock3, FastForward, Home, MapPin, Package, RotateCcw, Truck} from 'lucide-react';
import {api, dateTime, money} from '../api';
import {useResource, useStore} from '../context';
import {Empty, LoadState, PageTitle} from '../components';
import type {Cart, Delivery, Order, Reorder} from '../types';

export function Orders() {
  const resource = useResource<Order[]>('/orders');
  return <><PageTitle eyebrow="ĐƠN HÀNG CỦA BẠN" title="Những bữa nhà đã chọn" description="Lịch sử trong phiên demo hiện tại. Bạn có thể mua lại rồi sửa giỏ theo ý mình."/><LoadState {...resource}/>{resource.data?.length === 0 && <Empty title="Chưa có đơn nào trong phiên" text="Đơn sẽ xuất hiện ở đây sau khi bạn xác nhận đặt hàng mô phỏng." to="/products" label="Đi chợ ngay"/>}<div className="orders-grid">{resource.data?.map(o => <Link className="order-card" key={o.id} to={`/orders/${o.id}`}><div className="order-card-top"><span className="eyebrow">ĐƠN #{o.id.slice(0, 8).toUpperCase()}</span><span className="status-pill">{o.delivery.status}</span></div><div className="order-previews">{o.items.slice(0, 4).map(i => <span key={i.product_id}>{i.emoji}</span>)}</div><h3>{o.items.map(i => i.name).slice(0, 3).join(', ')}{o.items.length > 3 ? '…' : ''}</h3><p className="small muted">{dateTime(o.created_at)} · {o.items.length} sản phẩm</p><div className="suggestion-footer"><strong>{money(o.total)}</strong><span className="text-link">Xem đơn <ArrowRight size={16}/></span></div></Link>)}</div></>;
}

export function OrderDetail() {
  const {id} = useParams();
  const resource = useResource<Order>(`/orders/${id}`);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [pollError, setPollError] = useState('');
  const [preview, setPreview] = useState<Reorder | null>(null);
  const {act, busy, setCart} = useStore();
  const navigate = useNavigate();
  useEffect(() => {setDelivery(resource.data?.delivery || null);}, [resource.data]);
  useEffect(() => {
    if (!resource.data || delivery?.complete) return;
    let active = true;
    const update = async () => {
      if (document.hidden) return;
      try {const data = await api<Delivery>(`/orders/${id}/delivery`); if (active) {setDelivery(data); setPollError('');}}
      catch (e) {if (active) setPollError((e as Error).message);}
    };
    const timer = setInterval(() => void update(), 3000);
    const visible = () => {if (!document.hidden) void update();};
    document.addEventListener('visibilitychange', visible);
    return () => {active = false; clearInterval(timer); document.removeEventListener('visibilitychange', visible);};
  }, [resource.data, delivery?.complete, id]);
  async function advance(target: 'next' | 'complete') {
    const d = await act(() => api<Delivery>(`/orders/${id}/simulation/advance`, 'POST', {target}));
    if (d) setDelivery(d);
  }
  async function reorderPreview() {
    const p = await act(() => api<Reorder>(`/orders/${id}/reorder-preview`, 'POST', {}));
    if (p) setPreview(p);
  }
  async function merge() {
    if (!preview) return;
    const c = await act(() => api<Cart>('/cart', 'PATCH', {items: preview.items.map(i => ({product_id: i.product_id, quantity: i.quantity})), mode: 'add', expected_version: preview.cart_version}), 'Đã ghép sản phẩm vào giỏ');
    if (c) {setCart(c); navigate('/cart');}
  }
  const o = resource.data;
  return <><Link className="back-link" to="/orders"><ArrowLeft size={17}/>Đơn hàng của bạn</Link><LoadState {...resource}/>{o && delivery && <>
    <div className="order-heading"><div><span className="eyebrow">ĐƠN MÔ PHỎNG #{o.id.slice(0, 8).toUpperCase()}</span><h1>{delivery.complete ? 'Một hành trình đã hoàn tất!' : 'Bữa nhà đang đến gần'}</h1><p className="muted">Không có giao dịch thanh toán hoặc giao hàng thật.</p></div><span className="status-pill large">{delivery.status}</span></div>
    <div className="order-layout"><section className="tracking-card"><div className="tracking-title"><h2><Truck size={20}/>Hành trình robot</h2><span className="sample-tag">MÔ PHỎNG</span></div><div className="route-visual"><div className={`route-stop ${delivery.index >= 0 ? 'reached' : ''}`}><span><Package/></span><strong>Điểm tập kết</strong></div><div className={`route-connector ${delivery.index >= 3 ? 'reached' : ''}`}/><div className={`route-stop ${delivery.index >= 3 ? 'reached' : ''}`}><span><Truck/></span><strong>Tòa {o.address.tower}</strong></div><div className={`route-connector ${delivery.index >= 5 ? 'reached' : ''}`}/><div className={`route-stop ${delivery.index >= 5 ? 'reached' : ''}`}><span><Home/></span><strong>Căn {o.address.apartment}</strong></div></div><div className="delivery-destination"><MapPin size={18}/><div><strong>{o.address.building}</strong><small>{delivery.destination}</small></div></div>
    <div className="tracking-time"><Clock3 size={17}/><span>{o.delivery_mode === 'scheduled' ? 'Lịch nhận: ' : 'Dự kiến mô phỏng: '}{dateTime(o.scheduled_at || delivery.estimated_at)}</span></div>{delivery.time_advanced && <p className="small muted">Đang xem thời gian đã tua trong mô phỏng.</p>}
    <ol className="timeline">{delivery.stages.map((s, i) => <li key={s} className={i <= delivery.index ? 'done' : ''}><span>{i <= delivery.index ? <Check size={13}/> : i + 1}</span><div><strong>{s}</strong>{i === delivery.index && <small>{delivery.waiting ? 'Đơn đang chờ lịch bạn chọn' : delivery.complete ? 'Robot đã đến cửa căn hộ trong mô phỏng' : 'Trạng thái hiện tại'}</small>}</div></li>)}</ol>
    {pollError && <p className="inline-error" role="alert">{pollError} Hệ thống sẽ thử kết nối lại.</p>}{!delivery.complete && <div className="simulation-controls"><button className="button secondary" disabled={busy} onClick={() => void advance('next')}>Bước tiếp theo <ArrowRight size={16}/></button><button className="text-button" disabled={busy} onClick={() => void advance('complete')}><FastForward size={16}/>{o.delivery_mode === 'scheduled' ? 'Tua đến giờ giao — mô phỏng' : 'Hoàn tất mô phỏng'}</button></div>}</section>
    <aside className="summary-card"><h2>Những món trong đơn</h2>{o.items.map(i => <div className="order-item" key={i.product_id}><span className="mini-art">{i.emoji}</span><div><strong>{i.name}</strong><small>{i.quantity} gói × {i.pack_size} {i.unit}</small></div><span>{money(i.price * i.quantity)}</span></div>)}<div className="summary-total"><span>Tổng giá mẫu</span><strong>{money(o.total)}</strong></div><button className="button secondary full" disabled={busy} onClick={() => void reorderPreview()}><RotateCcw size={16}/>Mua lại đơn này</button><p className="small muted center">Xem lại giá và chỉnh giỏ trước khi đặt.</p></aside></div>
    {preview && <section className="reorder-panel" aria-label="Xem trước mua lại"><div className="section-heading compact"><h2>Xem trước mua lại</h2><button className="text-button" onClick={() => setPreview(null)}>Đóng</button></div><p className="muted">Các sản phẩm dưới đây sẽ được cộng vào giỏ hiện có, chưa tạo đơn mới.</p>{preview.items.map(i => <div className="summary-line" key={i.product_id}><span>{i.name} × {i.quantity}{i.old_price !== i.price && <small> · Giá đã cập nhật từ {money(i.old_price)} → {money(i.price)}</small>}</span><strong>{money(i.subtotal)}</strong></div>)}{preview.missing.length > 0 && <p className="inline-error">Không thêm vì hết hàng mẫu: {preview.missing.join(', ')}</p>}<button className="button primary" disabled={busy || !preview.items.length} onClick={() => void merge()}>Ghép vào giỏ · {money(preview.total)} <ArrowRight size={17}/></button></section>}
  </>}</>;
}
