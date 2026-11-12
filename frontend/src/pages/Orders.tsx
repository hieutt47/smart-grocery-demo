import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Bot, Check, Clock3, FastForward, Home, MapPin, Package, RotateCcw, Truck} from 'lucide-react';
import {api, dateTime, money} from '../api';
import {useResource, useStore} from '../context';
import {Empty, LoadState, PageTitle, ProductVisual} from '../components';
import type {Cart, Delivery, Order, Reorder} from '../types';

export function Orders() {
  const resource = useResource<Order[]>('/orders');

  return (
    <>
      <PageTitle
        eyebrow="Lịch sử đơn hàng"
        title="Những bữa cơm nhà đã chọn"
        description="Danh sách các đơn mô phỏng trong phiên làm việc hiện tại. Bạn có thể xem lộ trình robot hoặc mua lại bất kỳ lúc nào."
      />

      <LoadState {...resource} />

      {resource.data?.length === 0 && (
        <Empty
          title="Chưa có đơn hàng nào trong phiên"
          text="Sau khi xác nhận đặt hàng mô phỏng tại giỏ hàng, thông tin hành trình robot sẽ hiển thị tại đây."
          to="/products"
          label="Đi chợ ngay"
        />
      )}

      <div className="orders-grid">
        {resource.data?.map(o => (
          <Link className="order-card" key={o.id} to={`/orders/${o.id}`} aria-label={`Xem chi tiết đơn ${o.id.slice(0, 8)}`}>
            <div className="order-card-top">
              <span className="order-code-badge">
                <Bot size={13} className="text-emerald" />
                <span>#{o.id.slice(0, 8).toUpperCase()}</span>
              </span>
              <span className={`status-pill ${o.delivery.complete ? 'status-pill-success' : 'status-pill-active'}`}>
                {o.delivery.status}
              </span>
            </div>

            <div className="order-previews" aria-hidden="true">
              {o.items.slice(0, 4).map(i => (
                <span className="order-preview-thumb" key={i.product_id}><ProductVisual id={i.product_id} name={i.name} /></span>
              ))}
              {o.items.length > 4 && <span className="order-preview-more">+{o.items.length - 4}</span>}
            </div>

            <h3 className="order-card-title">
              {o.items.map(i => i.name).slice(0, 3).join(', ')}
              {o.items.length > 3 ? '…' : ''}
            </h3>

            <p className="small muted">
              {dateTime(o.created_at)} · {o.items.length} mặt hàng
            </p>

            <div className="order-card-footer">
              <div className="order-price-stack">
                <span className="small muted">Tổng đơn mẫu</span>
                <strong className="order-total-price">{money(o.total)}</strong>
              </div>
              <span className="text-link">
                <span>Xem lộ trình robot</span>
                <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function OrderDetail() {
  const {id} = useParams();
  const resource = useResource<Order>(`/orders/${id}`);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [pollError, setPollError] = useState('');
  const [preview, setPreview] = useState<Reorder | null>(null);
  const {act, busy, setCart} = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    setDelivery(resource.data?.delivery || null);
  }, [resource.data]);

  useEffect(() => {
    if (!resource.data || delivery?.complete) return;
    let active = true;

    const update = async () => {
      if (document.hidden) return;
      try {
        const data = await api<Delivery>(`/orders/${id}/delivery`);
        if (active) {
          setDelivery(data);
          setPollError('');
        }
      } catch (e) {
        if (active) setPollError((e as Error).message);
      }
    };

    const timer = setInterval(() => void update(), 3000);
    const visible = () => {
      if (!document.hidden) void update();
    };
    document.addEventListener('visibilitychange', visible);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
    };
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
    const c = await act(
      () =>
        api<Cart>('/cart', 'PATCH', {
          items: preview.items.map(i => ({product_id: i.product_id, quantity: i.quantity})),
          mode: 'add',
          expected_version: preview.cart_version
        }),
      'Đã ghép sản phẩm vào giỏ hàng'
    );
    if (c) {
      setCart(c);
      navigate('/cart');
    }
  }

  const o = resource.data;

  return (
    <>
      <Link className="back-link" to="/orders">
        <ArrowLeft size={17} />
        <span>Quay lại danh sách đơn hàng</span>
      </Link>

      <LoadState {...resource} />

      {o && delivery && (
        <>
          <div className="order-heading">
            <div className="order-heading-copy">
              <span className="order-code-badge">
                <Bot size={13} className="text-emerald" />
                <span>Đơn mô phỏng #{o.id.slice(0, 8).toUpperCase()}</span>
              </span>
              <h1>
                {delivery.complete
                  ? 'Một hành trình đã hoàn tất!'
                  : 'Hành trình giao hàng mô phỏng'}
              </h1>
              <p className="muted">
                Trải nghiệm điều phối robot tự hành trong chung cư. Mô phỏng kỹ thuật, không có giao dịch thật.
              </p>
            </div>
            <span
              className={`status-pill large ${
                delivery.complete ? 'status-pill-success' : 'status-pill-active'
              }`}
            >
              {delivery.status}
            </span>
          </div>

          <div className="order-layout">
            {/* Robot Express Visual Tracking Card */}
            <section className="tracking-card" aria-label="Bản đồ lộ trình Robot">
              <div className="tracking-title">
                <div className="flex-row items-center gap-2">
                  <Bot size={22} className="text-emerald" />
                  <h2>Lộ trình Robot tự hành</h2>
                </div>
                <span className="sample-tag">Mô phỏng trực tiếp</span>
              </div>

              {/* Graphic 3-stop route indicator */}
              <div className="route-visual" role="img" aria-label={`Trạng thái: ${delivery.status}`}>
                <div className={`route-stop ${delivery.index >= 0 ? 'reached' : ''}`}>
                  <span className="route-stop-icon">
                    <Package size={22} />
                  </span>
                  <strong>Trạm kho trung tâm</strong>
                  <small>Chuẩn bị hàng</small>
                </div>

                <div className={`route-connector ${delivery.index >= 3 ? 'reached' : ''}`}>
                  <span className="route-connector-line" />
                </div>

                <div className={`route-stop ${delivery.index >= 3 ? 'reached' : ''}`}>
                  <span className="route-stop-icon">
                    <Truck size={22} />
                  </span>
                  <strong>Sảnh Tòa {o.address.tower}</strong>
                  <small>Thang máy căn hộ</small>
                </div>

                <div className={`route-connector ${delivery.index >= 5 ? 'reached' : ''}`}>
                  <span className="route-connector-line" />
                </div>

                <div className={`route-stop ${delivery.index >= 5 ? 'reached' : ''}`}>
                  <span className="route-stop-icon">
                    <Home size={22} />
                  </span>
                  <strong>Căn hộ {o.address.apartment}</strong>
                  <small>Giao trước cửa</small>
                </div>
              </div>

              {/* Destination & Timing Info */}
              <div className="delivery-destination">
                <MapPin size={20} className="text-emerald shrink-0" />
                <div>
                  <strong>{o.address.building}</strong>
                  <small className="muted">{delivery.destination}</small>
                </div>
              </div>

              <div className="tracking-time">
                <Clock3 size={17} className="text-emerald shrink-0" />
                <span>
                  {o.delivery_mode === 'scheduled' ? 'Khung giờ hẹn nhận: ' : 'Thời gian dự kiến: '}
                  <strong>{dateTime(o.scheduled_at || delivery.estimated_at)}</strong>
                </span>
              </div>

              {delivery.time_advanced && (
                <p className="time-advanced-badge">
                  Đang xem thời gian đã được tua nhanh trong trình mô phỏng
                </p>
              )}

              {/* Stage-by-stage Stepper */}
              <ol className="timeline" aria-label="Tiến độ từng chặng">
                {delivery.stages.map((s, i) => {
                  const isDone = i <= delivery.index;
                  const isCurrent = i === delivery.index;

                  return (
                    <li key={s} className={`timeline-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                      <span className="timeline-marker">
                        {isDone ? <Check size={13} /> : i + 1}
                      </span>
                      <div className="timeline-content">
                        <strong>{s}</strong>
                        {isCurrent && (
                          <small className="timeline-hint">
                            {delivery.waiting
                              ? 'Đơn hàng đang chờ đến khung giờ bạn đã hẹn'
                              : delivery.complete
                              ? 'Robot đã đến trước cửa căn hộ trong mô phỏng'
                              : 'Trạng thái mô phỏng hiện tại'}
                          </small>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {pollError && (
                <p className="inline-error" role="alert">
                  {pollError}. Đang tự động thử kết nối lại với hệ thống robot…
                </p>
              )}

              {/* Simulation Controls */}
              {!delivery.complete && (
                <div className="simulation-controls">
                  <span className="simulation-controls-label">Điều khiển mô phỏng:</span>
                  <div className="simulation-buttons-row">
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busy}
                      onClick={() => void advance('next')}
                    >
                      <span>Chuyển bước tiếp theo</span>
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      className="button ghost advance-complete-btn"
                      disabled={busy}
                      onClick={() => void advance('complete')}
                    >
                      <FastForward size={16} aria-hidden="true" />
                      <span>
                        {o.delivery_mode === 'scheduled'
                          ? 'Tua đến giờ giao (mô phỏng)'
                          : 'Hoàn tất giao ngay'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Order Items & Reorder Summary */}
            <aside className="summary-card" aria-label="Chi tiết đơn hàng">
              <h2>Sản phẩm trong đơn</h2>
              <div className="order-items-list">
                {o.items.map(i => (
                  <div className="order-item" key={i.product_id}>
                    <span className="mini-art" aria-hidden="true"><ProductVisual id={i.product_id} name={i.name} /></span>
                    <div className="order-item-meta">
                      <strong>{i.name}</strong>
                      <small className="muted">{i.quantity} gói × {i.pack_size} {i.unit}</small>
                    </div>
                    <span className="order-item-price">{money(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="summary-total">
                <span>Tổng tiền mẫu</span>
                <strong>{money(o.total)}</strong>
              </div>

              <button
                type="button"
                className="button secondary full"
                disabled={busy}
                onClick={() => void reorderPreview()}
              >
                <RotateCcw size={16} />
                <span>Mua lại đơn hàng này</span>
              </button>
              <p className="small muted center mt-2">
                Hệ thống sẽ cập nhật lại giá hiện tại trước khi ghép vào giỏ
              </p>
            </aside>
          </div>

          {/* Reorder Preview Modal/Panel */}
          {preview && (
            <section className="reorder-panel" aria-label="Xem trước đơn mua lại">
              <div className="section-heading compact">
                <h2>Xem trước sản phẩm mua lại</h2>
                <button type="button" className="text-button" onClick={() => setPreview(null)}>
                  Đóng
                </button>
              </div>
              <p className="muted small mb-3">
                Các sản phẩm dưới đây sẽ được cộng thêm vào giỏ hàng hiện có của bạn (chưa tạo đơn mới).
              </p>

              {preview.items.map(i => (
                <div className="summary-line" key={i.product_id}>
                  <span>
                    {i.name} × {i.quantity}
                    {i.old_price !== i.price && (
                      <small className="price-change-notice">
                        · Giá cập nhật: {money(i.old_price)} → {money(i.price)}
                      </small>
                    )}
                  </span>
                  <strong>{money(i.subtotal)}</strong>
                </div>
              ))}

              {preview.missing.length > 0 && (
                <p className="inline-error">
                  Một số mặt hàng tạm hết hàng mẫu: {preview.missing.join(', ')}
                </p>
              )}

              <button
                type="button"
                className="button primary mt-3"
                disabled={busy || !preview.items.length}
                onClick={() => void merge()}
              >
                <span>Ghép vào giỏ hàng ({money(preview.total)})</span>
                <ArrowRight size={17} />
              </button>
            </section>
          )}
        </>
      )}
    </>
  );
}

