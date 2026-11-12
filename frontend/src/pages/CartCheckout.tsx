import {useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Bot, CalendarClock, Check, Clock3, Info, MapPin, ShoppingBag, ShoppingBasket, Trash2} from 'lucide-react';
import {api, ApiError, money} from '../api';
import {useStore} from '../context';
import {Empty, PageTitle, ProductVisual, Quantity} from '../components';
import type {Address, Cart, Order} from '../types';

export function CartPage() {
  const {cart, setCart, act, busy} = useStore();

  async function change(product_id: string, quantity: number) {
    const updated = await act(() =>
      api<Cart>('/cart', 'PATCH', {
        items: [{product_id, quantity}],
        mode: 'set',
        expected_version: cart.version
      })
    );
    if (updated) setCart(updated);
  }

  return (
    <>
      <PageTitle
        eyebrow="GIỎ HÀNG CỦA BẠN"
        title="Chuẩn bị cho bữa ngon"
        description="Kiểm tra lại số lượng các món đồ cần mua, sau đó tiến hành chọn lịch nhận hàng."
      />

      {!cart.items.length ? (
        <Empty
          title="Giỏ hàng đang trống"
          text="Hãy dạo qua khu chợ tươi ngon hoặc tìm công thức món ăn yêu thích để thêm nguyên liệu vào giỏ."
          to="/products"
          label="Đi chợ ngay"
        />
      ) : (
        <div className="checkout-layout">
          <div>
            <div className="cart-items" role="region" aria-label="Danh sách sản phẩm trong giỏ">
              {cart.items.map(i => (
                <article className="cart-row" key={i.product_id}>
                  <Link to={`/products/${i.product_id}`} className="cart-art" aria-label={`Xem ${i.name}`}>
                    <ProductVisual id={i.product_id} name={i.name} />
                  </Link>

                  <div className="cart-item-copy">
                    <Link to={`/products/${i.product_id}`} className="cart-item-title">
                      <h3>{i.name}</h3>
                    </Link>
                    <p className="small muted">
                      Gói {i.pack_size} {i.unit} · {money(i.price)}/gói
                    </p>
                    {!i.available && <span className="small error-text">Tạm hết hàng mẫu</span>}
                    <Quantity value={i.quantity} disabled={busy} onChange={q => void change(i.product_id, q)} />
                  </div>

                  <div className="cart-item-end">
                    <strong className="cart-item-subtotal">{money(i.subtotal)}</strong>
                    <button
                      type="button"
                      className="icon-button delete-btn"
                      disabled={busy}
                      onClick={() => void change(i.product_id, 0)}
                      aria-label={`Xóa ${i.name} khỏi giỏ hàng`}
                      title="Xóa sản phẩm"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <Link className="back-link mt-4" to="/products">
              <ArrowLeft size={16} />
              <span>Tiếp tục chọn thêm sản phẩm khác</span>
            </Link>
          </div>

          <aside className="summary-card" aria-label="Tóm tắt đơn hàng">
            <div className="summary-card-header">
              <ShoppingBag size={22} className="text-emerald" />
              <h2>Tóm tắt giỏ hàng</h2>
            </div>

            <div className="summary-line">
              <span>Tổng số lượng</span>
              <strong className="text-dark">{cart.count} gói sản phẩm</strong>
            </div>
            <div className="summary-line">
              <span>Tiền hàng</span>
              <span>{money(cart.total)}</span>
            </div>
            <div className="summary-line">
              <span>Phí giao robot mô phỏng</span>
              <span className="text-emerald font-semibold">Miễn phí 0 ₫</span>
            </div>

            <div className="summary-total">
              <span>Tổng tạm tính</span>
              <strong>{money(cart.total)}</strong>
            </div>

            <Link className="button primary full" to="/checkout">
              <span>Tiến hành chọn giờ & đặt đơn</span>
              <ArrowRight size={17} />
            </Link>

            <div className="soft-note">
              <Info size={16} className="text-emerald" />
              <span>Đây là bản demo trải nghiệm. Đơn hàng và chi phí đều là mô phỏng, không thu tiền thật.</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

interface CheckoutQuote {
  quote_id: string;
  total: number;
  expires_at: string;
}

interface OrderBody {
  quote_id: string;
  idempotency_key: string;
  address: Address;
  contact: string;
}

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

  function invalidate() {
    setQuote(null);
    pending.current = null;
    setError('');
  }

  async function verify() {
    setWorking(true);
    setError('');
    pending.current = null;
    try {
      const q = await api<CheckoutQuote>('/checkout/quote', 'POST', {
        delivery_mode: mode,
        scheduled_at: mode === 'scheduled' ? `${schedule}:00+07:00` : null
      });
      setQuote(q);
    } catch (e) {
      setError((e as Error).message);
      setQuote(null);
      await refreshCart().catch(() => {});
    } finally {
      setWorking(false);
    }
  }

  async function place() {
    if (!quote || working) return;
    setWorking(true);
    setError('');
    pending.current ??= {
      quote_id: quote.quote_id,
      idempotency_key: crypto.randomUUID(),
      address,
      contact
    };
    try {
      const order = await api<Order>('/orders', 'POST', pending.current);
      await refreshCart();
      navigate(`/orders/${order.id}`);
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError && ['CART_CHANGED', 'QUOTE_EXPIRED', 'INVALID_SCHEDULE'].includes(e.code)) {
        setQuote(null);
        pending.current = null;
        await refreshCart().catch(() => {});
      }
    } finally {
      setWorking(false);
    }
  }

  if (!cart.items.length && !pending.current) {
    return (
      <Empty
        title="Chưa có sản phẩm để đặt hàng"
        text="Vui lòng thêm sản phẩm vào giỏ trước khi tiến hành thanh toán."
        to="/products"
        label="Đi chợ ngay"
      />
    );
  }

  return (
    <>
      <Link className="back-link" to="/cart">
        <ArrowLeft size={17} />
        <span>Xem lại giỏ hàng</span>
      </Link>

      <PageTitle
        eyebrow="ĐẶT HÀNG MÔ PHỎNG"
        title="Thông tin nhận hàng căn hộ"
        description="Chỉ dùng địa chỉ và liên hệ hư cấu. Dữ liệu được lưu tạm trên máy chủ theo phiên demo; không thu tiền và không giao hàng thật."
      />

      <form
        className="checkout-layout"
        onSubmit={e => {
          e.preventDefault();
          if (quote) void place();
          else void verify();
        }}
      >
        <div className="checkout-form">
          <fieldset disabled={working}>
            <section className="form-section">
              <div className="section-heading compact">
                <div className="flex-row items-center gap-2">
                  <MapPin size={20} className="text-emerald" />
                  <h2>Địa chỉ căn hộ nhận hàng</h2>
                </div>
                <button
                  type="button"
                  className="text-button fill-sample-btn"
                  onClick={() => {
                    setAddress({
                      building: 'Chung cư An Nhiên (mẫu)',
                      tower: 'A',
                      floor: '12',
                      apartment: '1208'
                    });
                    setContact('Khách demo 01 (0901234567)');
                    invalidate();
                  }}
                >
                  <span>Dùng thông tin mẫu</span>
                </button>
              </div>

              <label className="form-field">
                <span className="field-label">Tên chung cư / Tòa nhà:</span>
                <input
                  required
                  value={address.building}
                  maxLength={80}
                  placeholder="Ví dụ: Chung cư An Nhiên"
                  onChange={e => {
                    setAddress(a => ({...a, building: e.target.value}));
                    invalidate();
                  }}
                />
              </label>

              <div className="address-grid">
                {(
                  [
                    ['tower', 'Tòa / Block', 'A'],
                    ['floor', 'Tầng', '12'],
                    ['apartment', 'Số căn hộ', '1208']
                  ] as const
                ).map(([key, label, placeholder]) => (
                  <label key={key} className="form-field">
                    <span className="field-label">{label}:</span>
                    <input
                      required
                      maxLength={key === 'floor' ? 10 : 20}
                      value={address[key]}
                      placeholder={placeholder}
                      onChange={e => {
                        setAddress(a => ({...a, [key]: e.target.value}));
                        invalidate();
                      }}
                    />
                  </label>
                ))}
              </div>

              <label className="form-field">
                <span className="field-label">Thông tin liên hệ nhận hàng:</span>
                <input
                  required
                  minLength={3}
                  maxLength={80}
                  value={contact}
                  placeholder="Ví dụ: Khách demo 01 (SĐT mẫu)"
                  onChange={e => {
                    setContact(e.target.value);
                    invalidate();
                  }}
                />
              </label>

              <p className="small muted">
                Địa chỉ và liên hệ được lưu tạm trên máy chủ cùng đơn mô phỏng theo phiên tối đa 24 giờ. Không nhập dữ liệu cá nhân thật.
              </p>
            </section>

            <section className="form-section">
              <div className="flex-row items-center gap-2 mb-3">
                <Bot size={20} className="text-emerald" />
                <h2>Lịch giao hàng mô phỏng</h2>
              </div>

              <div className="delivery-options" role="radiogroup" aria-label="Hình thức giao hàng">
                <label className={`delivery-option-card ${mode === 'now' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="now"
                    checked={mode === 'now'}
                    onChange={() => {
                      setMode('now');
                      invalidate();
                    }}
                  />
                  <Clock3 size={24} className="delivery-option-icon" />
                  <div className="delivery-option-content">
                    <strong>Giao ngay trong mô phỏng</strong>
                    <small>Bắt đầu hành trình mô phỏng sau khi tạo đơn; không có robot giao hàng thật.</small>
                  </div>
                </label>

                <label className={`delivery-option-card ${mode === 'scheduled' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="scheduled"
                    checked={mode === 'scheduled'}
                    onChange={() => {
                      setMode('scheduled');
                      invalidate();
                    }}
                  />
                  <CalendarClock size={24} className="delivery-option-icon" />
                  <div className="delivery-option-content">
                    <strong>Hẹn giờ nhận hàng thuận tiện</strong>
                    <small>Chọn thời điểm bắt đầu hành trình giao hàng mô phỏng.</small>
                  </div>
                </label>
              </div>

              {mode === 'scheduled' && (
                <label className="form-field schedule-field mt-3">
                  <span className="field-label">Khung giờ nhận mong muốn (Giờ Việt Nam):</span>
                  <input
                    type="datetime-local"
                    required
                    value={schedule}
                    min={localTime(1800)}
                    max={localTime(7 * 86400)}
                    onChange={e => {
                      setSchedule(e.target.value);
                      invalidate();
                    }}
                  />
                  <small className="muted">
                    Sau thời điểm hiện tại ít nhất 30 phút. Bạn có thể dùng nút tua thời gian trong trang chi tiết đơn.
                  </small>
                </label>
              )}
            </section>
          </fieldset>
        </div>

        <aside className="summary-card" aria-label="Xác nhận đơn hàng">
          <div className="summary-card-header">
            <ShoppingBasket size={21} className="text-emerald" />
            <h2>Xác nhận đặt đơn</h2>
          </div>

          <div className="order-items-preview">
            {cart.items.map(i => (
              <div className="summary-line" key={i.product_id}>
                <span>{i.name} × {i.quantity}</span>
                <span className="font-medium">{money(i.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="summary-line border-t-line pt-2">
            <span>Phí giao hàng mô phỏng</span>
            <span className="text-emerald font-semibold">0 ₫ (Miễn phí)</span>
          </div>

          <div className="summary-total">
            <span>Tổng giá mẫu</span>
            <strong>{money(quote?.total ?? cart.total)}</strong>
          </div>

          {quote && (
            <div className="checked-note">
              <Check size={18} className="text-emerald" />
              <span>Đã kiểm tra báo giá và lịch giao mô phỏng</span>
            </div>
          )}

          {error && <p className="inline-error" role="alert">{error}</p>}

          <button className="button primary full" disabled={working || busy}>
            <span>{working ? 'Đang xác thực…' : quote ? 'Tạo đơn mô phỏng' : 'Kiểm tra & chốt đơn'}</span>
            <ArrowRight size={17} />
          </button>

          <div className="soft-note">
            <Info size={17} className="text-emerald" />
            <span>Đơn hàng mô phỏng thử nghiệm. Không phát sinh thanh toán thật.</span>
          </div>

          <button
            type="button"
            className="text-button center-btn"
            onClick={() => void act(refreshCart)}
            disabled={working}
          >
            <span>Làm mới giỏ hàng</span>
          </button>
        </aside>
      </form>
    </>
  );
}

