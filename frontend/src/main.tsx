import {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import {House, Info, ReceiptText, RotateCcw, Search, ShoppingBasket, Sparkles, Store, X} from 'lucide-react';
import {StoreProvider, useStore} from './context';
import {Brand, Empty} from './components';
import {Home} from './pages/Home';
import {Catalog, ProductDetail, Recipes} from './pages/Catalog';
import {Assistant} from './pages/Assistant';
import {Cook} from './pages/Cook';
import {CartPage, Checkout} from './pages/CartCheckout';
import {Orders, OrderDetail} from './pages/Orders';
import {About} from './pages/About';
import './styles.css';

const NAVIGATION = [
  {to: '/', label: 'Trang chủ', icon: House},
  {to: '/products', label: 'Đi chợ', icon: Store},
  {to: '/assistant', label: 'Gợi ý món', icon: Sparkles},
  {to: '/cart', label: 'Giỏ hàng', icon: ShoppingBasket},
  {to: '/orders', label: 'Đơn hàng', icon: ReceiptText}
];

function CommerceSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('q') || '';
  const [search, setSearch] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);

  if (query !== prevQuery) {
    setPrevQuery(query);
    setSearch(query);
  }

  return (
    <form
      className="commerce-search"
      role="search"
      onSubmit={event => {
        event.preventDefault();
        navigate(`/products?q=${encodeURIComponent(search.trim())}`);
      }}
    >
      <input
        type="text"
        name="q"
        autoComplete="off"
        aria-label="Tìm sản phẩm trên Bữa Nhà"
        placeholder="Hôm nay bạn muốn mua gì…"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      <button type="submit" aria-label="Tìm sản phẩm">
        <Search size={19} />
      </button>
    </form>
  );
}

function App() {
  const store = useStore();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main">
        Chuyển đến nội dung chính
      </a>

      {/* Top Demo Transparency Bar */}
      <div className="demo-banner-strip" role="banner">
        <div className="demo-banner-content">
          <span className="demo-indicator-dot" />
          <span>Bản demo trải nghiệm: Mô phỏng Đi chợ & Robot giao hàng tự hành</span>
          <Link to="/about" className="demo-banner-link">
            <span>Tìm hiểu thêm & Quyền riêng tư</span>
            <Info size={13} className="inline-icon" />
          </Link>
        </div>
      </div>

      <header className="site-header commerce-header">
        <div className="commerce-masthead">
          <Brand />
          <CommerceSearch />
          <Link className="header-cart commerce-cart" to="/cart" aria-label={`Giỏ hàng có ${store.cart.count} sản phẩm`}><ShoppingBasket size={21} /><span>Giỏ của bạn</span><b>{store.cart.count}</b></Link>
        </div>
        <nav className="commerce-links" aria-label="Điều hướng chính"><NavLink to="/" end>Trang chủ</NavLink><NavLink to="/products">Đi chợ</NavLink><NavLink to="/recipes">Góc bếp</NavLink><NavLink to="/assistant"><Sparkles size={15} /> Gợi ý món</NavLink><NavLink to="/orders">Đơn hàng</NavLink><NavLink to="/about">Về Bữa Nhà</NavLink><span aria-hidden="true">Tươi ý tưởng. Trọn bữa nhà.</span></nav>
      </header>

      {/* Global Error Notice */}
      {store.error && !store.expired && (
        <div className="global-error" role="alert">
          <span>{store.error}</span>
          {!store.ready && (
            <button type="button" onClick={() => void store.renew()} disabled={store.busy}>
              Thử kết nối lại
            </button>
          )}
          <button type="button" aria-label="Đóng thông báo" onClick={store.clearError}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main" className="container">
        {store.expired ? (
          <div className="empty-state">
            <span className="empty-icon">
              <RotateCcw size={32} />
            </span>
            <h1>Phiên demo đã kết thúc</h1>
            <p className="muted">
              Dịch vụ có thể vừa khởi động lại hoặc phiên duyệt web đã quá 24 giờ.
              <br />
              Bạn có thể bắt đầu phiên mới bất kỳ lúc nào để tiếp tục trải nghiệm.
            </p>
            <button
              type="button"
              className="button primary"
              disabled={store.busy}
              onClick={() => void store.renew().then(() => { window.location.href = '/'; })}
            >
              Bắt đầu phiên làm việc mới
            </button>
          </div>
        ) : !store.ready ? (
          <div className="loading" role="status">
            <span className="spinner" />
            <span>Đang chuẩn bị không gian Bữa Nhà…</span>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Catalog />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/cook" element={<Cook />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/about" element={<About />} />
            <Route
              path="*"
              element={
                <Empty
                  title="Trang này không tồn tại"
                  text="Hãy quay lại gian bếp của Bữa Nhà để tiếp tục đi chợ nhé."
                  to="/"
                  label="Về trang chủ"
                />
              }
            />
          </Routes>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div>
          <Brand />
          <p>Chọn điều giản dị. Chăm chút bữa nhà.</p>
        </div>
        <div>
          <span>AI Smart Grocery & Robot Delivery System</span>
          <small className="muted">Demo v0.1 · Dữ liệu & Giá mô phỏng · Hoàn toàn không thu tiền</small>
          <Link to="/about">Minh bạch dự án & Quản lý phiên</Link>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Visible on viewport <= 768px) */}
      <nav className="mobile-nav" aria-label="Điều hướng điện thoại">
        {NAVIGATION.map(({to, label, icon: Icon}) => (
          <NavLink to={to} end={to === '/'} key={to}>
            <span>
              <Icon size={21} />
              {to === '/cart' && store.cart.count > 0 && <b>{store.cart.count}</b>}
            </span>
            <small>{label}</small>
          </NavLink>
        ))}
      </nav>

      {/* Toast Notification */}
      {store.toast && (
        <div className="toast" role="status">
          <ShoppingBasket size={18} />
          <span>{store.toast}</span>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StoreProvider>
      <App />
    </StoreProvider>
  </BrowserRouter>
);

