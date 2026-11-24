import {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate} from 'react-router-dom';
import {ChefHat, Heart, House, Info, RotateCcw, Search, Sparkles, X} from 'lucide-react';
import {StoreProvider, useStore} from './context';
import {Brand, Empty} from './components';
import {Home} from './pages/Home';
import {Recipes} from './pages/Catalog';
import {Assistant} from './pages/Assistant';
import {Cook} from './pages/Cook';
import {SavedRecipes} from './pages/Saved';
import {About} from './pages/About';
import './styles.css';
import './pivot.css';

const NAVIGATION = [
  {to: '/', label: 'Trang chủ', icon: House},
  {to: '/assistant', label: 'Gợi ý món', icon: Sparkles},
  {to: '/recipes', label: 'Góc bếp', icon: ChefHat},
  {to: '/saved', label: 'Đã lưu', icon: Heart}
];

function RecipeSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('q') || '';
  const [search, setSearch] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);

  if (query !== prevQuery && location.pathname === '/recipes') {
    setPrevQuery(query);
    setSearch(query);
  }

  return (
    <form
      className="commerce-search"
      role="search"
      onSubmit={event => {
        event.preventDefault();
        const trimmed = search.trim();
        navigate(trimmed ? `/recipes?q=${encodeURIComponent(trimmed)}` : '/recipes');
      }}
    >
      <input
        type="text"
        name="q"
        autoComplete="off"
        aria-label="Tìm món ăn hoặc công thức"
        placeholder="Tìm món nhanh, eat clean, gà, trứng…"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      <button type="submit" aria-label="Tìm công thức">
        <Search size={19} aria-hidden="true" />
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

      {/* Top Banner */}
      <div className="demo-banner-strip" role="banner">
        <div className="demo-banner-content">
          <span className="demo-indicator-dot" />
          <span>Chọn món · Xem cách nấu · Lên danh sách nguyên liệu</span>
          <Link to="/about" className="demo-banner-link">
            <span>Về Bữa Nhà</span>
            <Info size={13} className="inline-icon" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <header className="site-header commerce-header">
        <div className="commerce-masthead">
          <Brand />
          <RecipeSearch />
          <Link className="header-cart commerce-cart" to="/saved" aria-label={`Đã lưu ${store.savedIds.length} món ăn`}>
            <Heart size={20} />
            <span>Đã lưu</span>
            <b>{store.savedIds.length}</b>
          </Link>
        </div>
        <nav className="commerce-links" aria-label="Điều hướng chính">
          <NavLink to="/" end>Trang chủ</NavLink>
          <NavLink to="/assistant"><Sparkles size={15} aria-hidden="true" /> Gợi ý món</NavLink>
          <NavLink to="/recipes">Góc bếp</NavLink>
          <NavLink to="/saved">Món đã lưu</NavLink>
          <NavLink to="/about">Về Bữa Nhà</NavLink>
          <span aria-hidden="true">Từ chọn món đến chuẩn bị bữa ăn.</span>
        </nav>
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
            <h1>Phiên làm việc đã hết hạn</h1>
            <p className="muted">
              Dịch vụ vừa khởi động lại hoặc phiên duyệt web đã quá 24 giờ.
              <br />
              Bạn có thể bắt đầu phiên mới ngay để tiếp tục trò chuyện với trợ lý.
            </p>
            <button
              type="button"
              className="button primary"
              disabled={store.busy}
              onClick={() => void store.renew().then(() => { window.location.href = '/'; })}
            >
              Bắt đầu phiên mới
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
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/cook" element={<Cook />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/saved" element={<SavedRecipes />} />
            <Route path="/about" element={<About />} />
            <Route path="/products/*" element={<Navigate to="/recipes" replace />} />
            <Route path="/cart" element={<Navigate to="/" replace />} />
            <Route path="/checkout" element={<Navigate to="/" replace />} />
            <Route path="/orders/*" element={<Navigate to="/" replace />} />
            <Route
              path="*"
              element={
                <Empty
                  title="Trang này không tồn tại"
                  text="Hãy quay lại trang chủ để khám phá gợi ý bữa ăn hôm nay nhé."
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
          <span>Bữa Nhà — Trợ lý gợi ý ăn uống thông minh</span>
          <small className="muted">Phiên bản trải nghiệm dành cho dân văn phòng · Hoàn toàn miễn phí</small>
          <Link to="/about">Giới thiệu & Quản lý phiên</Link>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav" aria-label="Điều hướng điện thoại">
        {NAVIGATION.map(({to, label, icon: Icon}) => (
          <NavLink to={to} end={to === '/'} key={to}>
            <span>
              <Icon size={21} aria-hidden="true" />
              {to === '/saved' && store.savedIds.length > 0 && <b>{store.savedIds.length}</b>}
            </span>
            <small>{label}</small>
          </NavLink>
        ))}
      </nav>

      {/* Toast Notification */}
      {store.toast && (
        <div className="toast" role="status">
          <Sparkles size={18} />
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
