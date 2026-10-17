import {useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Link, NavLink, Route, Routes, useLocation} from 'react-router-dom';
import {House, Info, Leaf, ReceiptText, ShoppingBasket, Sparkles, X} from 'lucide-react';
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

function App() {
  const store = useStore();
  const location = useLocation();
  useEffect(() => {window.scrollTo(0, 0);}, [location.pathname]);
  const navigation = [{to: '/', label: 'Trang chủ', icon: House}, {to: '/assistant', label: 'Gợi ý món', icon: Sparkles}, {to: '/cart', label: 'Giỏ hàng', icon: ShoppingBasket}, {to: '/orders', label: 'Đơn hàng', icon: ReceiptText}];
  return <><a className="skip-link" href="#main">Đến nội dung chính</a><div className="announcement"><span><Leaf size={13}/>Một chút tiện lợi, thêm nhiều thời gian cho bữa nhà.</span><Link to="/about">Bản demo trải nghiệm <Info size={13}/></Link></div><header className="site-header"><div className="header-inner"><Brand/><nav className="desktop-nav" aria-label="Điều hướng chính"><NavLink to="/" end>Trang chủ</NavLink><NavLink to="/products">Đi chợ</NavLink><NavLink to="/recipes">Góc bếp</NavLink><NavLink to="/assistant">Gợi ý món <Sparkles size={14}/></NavLink><NavLink to="/orders">Đơn hàng</NavLink></nav><Link className="header-cart" to="/cart"><ShoppingBasket size={19}/><span>Giỏ hàng</span><b>{store.cart.count}</b></Link></div></header>
    {store.error && !store.expired && <div className="global-error" role="alert"><span>{store.error}</span>{!store.ready && <button onClick={() => void store.renew()} disabled={store.busy}>Thử kết nối lại</button>}<button aria-label="Đóng thông báo" onClick={store.clearError}><X size={17}/></button></div>}
    <main id="main" className="container">{store.expired ? <div className="empty-state"><span className="empty-icon"><RotateIcon/></span><h1>Phiên demo đã kết thúc</h1><p className="muted">Dịch vụ có thể vừa khởi động lại hoặc phiên đã quá 24 giờ.<br/>Bạn có thể bắt đầu một giỏ mới để tiếp tục khám phá.</p><button className="button primary" disabled={store.busy} onClick={() => void store.renew().then(() => {window.location.href = '/';})}>Bắt đầu phiên mới</button></div> : !store.ready ? <div className="loading" role="status"><span className="spinner"/>Đang chuẩn bị Bữa Nhà…</div> : <Routes><Route path="/" element={<Home/>}/><Route path="/products" element={<Catalog/>}/><Route path="/products/:id" element={<ProductDetail/>}/><Route path="/recipes" element={<Recipes/>}/><Route path="/cook" element={<Cook/>}/><Route path="/assistant" element={<Assistant/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/orders" element={<Orders/>}/><Route path="/orders/:id" element={<OrderDetail/>}/><Route path="/about" element={<About/>}/><Route path="*" element={<Empty title="Trang này chưa có" text="Quay lại gian bếp của bạn nhé." to="/" label="Về trang chủ"/>}/></Routes>}</main>
    <footer className="site-footer"><div><Brand/><p>Đi chợ nhẹ nhàng. Bữa nhà đủ đầy.</p></div><div><span>AI Smart Grocery & Robot Delivery</span><small>Demo v0.1 · Dữ liệu mẫu · Không thu tiền</small><Link to="/about">Về bản demo & quyền riêng tư</Link></div></footer>
    <nav className="mobile-nav" aria-label="Điều hướng điện thoại">{navigation.map(({to, label, icon: Icon}) => <NavLink to={to} end={to === '/'} key={to}><span><Icon size={21}/>{to === '/cart' && store.cart.count > 0 && <b>{store.cart.count}</b>}</span><small>{label}</small></NavLink>)}</nav>{store.toast && <div className="toast" role="status"><ShoppingBasket size={18}/>{store.toast}</div>}</>;
}
function RotateIcon() {return <Leaf size={32}/>;}
createRoot(document.getElementById('root')!).render(<BrowserRouter><StoreProvider><App/></StoreProvider></BrowserRouter>);
