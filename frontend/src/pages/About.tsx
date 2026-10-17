import {Link} from 'react-router-dom';
import {useState} from 'react';
import {Check, Code2, Info, RotateCcw} from 'lucide-react';
import {PageTitle} from '../components';
import {api} from '../api';
import {useStore} from '../context';

export function About() {
  const [confirm, setConfirm] = useState(false);
  const {busy, act} = useStore();
  async function erase() {await act(async () => {await api('/session-data', 'DELETE'); window.location.href = '/';});}
  return <div className="about-page"><PageTitle eyebrow="MINH BẠCH TỪ ĐẦU" title="Một bản demo, một ý tưởng" description="AI Smart Grocery & Robot Delivery · v0.1"/><section className="form-section"><h2><Info size={20}/>Bạn đang trải nghiệm điều gì?</h2><p>Bữa Nhà là tên giao diện tạm cho ý tưởng đi chợ, gợi ý món và giao hàng đến cửa căn hộ. Dành cho cư dân chung cư nói chung.</p><div className="about-facts"><div><Check/><span><strong>Chức năng đã chạy</strong>Tìm sản phẩm, công thức, tính giá gói hàng, giỏ, tạo đơn thử nghiệm và mua lại.</span></div><div><Code2/><span><strong>Trợ lý theo quy tắc</strong>Hiểu một số nhóm câu và giữ ngữ cảnh; chưa có mô hình AI thật.</span></div><div><Info/><span><strong>Dữ liệu và vận hành mô phỏng</strong>Giá, nguồn hàng, checkout và robot. Không thu tiền; không có robot hay đối tác giao hàng thực.</span></div></div></section><section className="form-section"><h2>Phiên và quyền riêng tư</h2><p>Không cần tài khoản. Giỏ, hội thoại và đơn được lưu tạm trong phiên, tối đa 24 giờ. Hosting miễn phí có thể ngủ hoặc khởi động lại; dữ liệu phiên khi đó có thể mất.</p><p>Dùng thông tin liên hệ và căn hộ hư cấu khi thử checkout. Dữ liệu đơn không được dùng để suy luận sở thích cá nhân.</p><p>Nội dung công thức tự biên soạn phục vụ thử nghiệm và chưa được thẩm định chuyên môn. Không đưa ra bảo đảm về dị ứng hoặc tư vấn dinh dưỡng.</p>{!confirm ? <button className="button secondary" onClick={() => setConfirm(true)}><RotateCcw size={17}/>Xóa dữ liệu phiên của tôi</button> : <div className="soft-callout"><p>Xóa giỏ, đơn và hội thoại của phiên hiện tại?</p><button className="button danger" disabled={busy} onClick={() => void erase()}>Xác nhận xóa phiên</button> <button className="button secondary" onClick={() => setConfirm(false)}>Giữ lại</button></div>}</section><Link className="text-link" to="/">← Trở lại Bữa Nhà</Link></div>;
}
