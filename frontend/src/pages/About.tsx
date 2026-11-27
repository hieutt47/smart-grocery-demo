import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, Check, RotateCcw, ShieldCheck, Sparkles, UtensilsCrossed} from 'lucide-react';
import {api} from '../api';
import {RECIPE_PHOTOS} from '../recipe-photos';
import {useStore} from '../context';
import {PageTitle} from '../components';

export function About() {
  const [confirm, setConfirm] = useState(false);
  const {busy, act} = useStore();

  async function erase() {
    await act(async () => {
      await api('/session-data', 'DELETE');
      try {
        localStorage.removeItem('bua_nha_saved_recipes');
        localStorage.removeItem('bua_nha_taste_profile_v3');
      } catch {
        // ignore
      }
      window.location.href = '/';
    });
  }

  return (
    <div className="about-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={17} />
        <span>Quay về trang chủ Bữa Nhà</span>
      </Link>

      <PageTitle
        eyebrow="Về sản phẩm"
        title="Bữa Nhà — Trợ lý gợi ý ăn uống thông minh"
        description="Chọn bữa ăn phù hợp với thời gian, ngân sách và khẩu vị của bạn; xem công thức hoặc tham khảo gợi ý ăn trưa ngoài."
      />

      <section className="form-section">
        <div className="section-heading compact">
          <div className="flex-row items-center gap-2">
            <Sparkles size={20} className="text-emerald" />
            <h2>Bạn đang trải nghiệm điều gì?</h2>
          </div>
        </div>

        <p className="muted mb-4">
          Bữa Nhà tập trung vào trải nghiệm <strong>tư vấn món ăn thông minh</strong>, tối ưu tính tiện dụng hằng ngày cho người bận rộn: gợi ý theo ngân sách, thời gian nấu, khẩu vị và chuẩn bị sẵn checklist nguyên liệu mang đi.
        </p>

        <div className="about-facts-grid">
          <div className="about-fact-card">
            <span className="about-fact-icon">
              <Sparkles size={20} />
            </span>
            <div className="about-fact-copy">
              <strong>Trợ lý AI gợi ý theo ngữ cảnh</strong>
              <p className="small muted">
                Hiểu nhu cầu tự nhiên về số người, ngân sách (35k–150k), thời gian nấu và các món muốn tránh.
              </p>
            </div>
          </div>

          <div className="about-fact-card">
            <span className="about-fact-icon">
              <UtensilsCrossed size={20} />
            </span>
            <div className="about-fact-copy">
              <strong>Công thức & Checklist thông minh</strong>
              <p className="small muted">
                Tự chia định lượng theo khẩu phần 1–6 người, ghi nhớ tủ gia vị sẵn có và sao chép danh sách đi chợ chỉ với 1 chạm.
              </p>
            </div>
          </div>

          <div className="about-fact-card">
            <span className="about-fact-icon">
              <Check size={20} />
            </span>
            <div className="about-fact-copy">
              <strong>Lưu & Chia sẻ dễ dàng</strong>
              <p className="small muted">
                Lưu lại món yêu thích ngay trên thiết bị không cần đăng nhập, chia sẻ gợi ý bữa ăn nhanh qua tin nhắn cho đồng nghiệp hoặc người thân.
              </p>
            </div>
          </div>

          <div className="about-fact-card">
            <span className="about-fact-icon">
              <ShieldCheck size={20} />
            </span>
            <div className="about-fact-copy">
              <strong>Quyền riêng tư & Phiên tạm</strong>
              <p className="small muted">
                Lịch sử hội thoại chỉ lưu tạm trong phiên hiện tại (tối đa 24 giờ). Bạn có thể xóa sạch dữ liệu bất cứ lúc nào.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="recipe-photo-credits" aria-labelledby="photo-credits-title">
        <h2 id="photo-credits-title">Nguồn ảnh món ăn</h2>
        <p>Ảnh chụp được đối chiếu với món trong công thức. Món chưa có ảnh phù hợp sẽ không dùng ảnh của món khác.</p>
        {Object.entries(RECIPE_PHOTOS).map(([id, photo]) => (
          <p key={id}>
            <a href={photo.attributionUrl || photo.source}>{photo.name} — {photo.author}</a>
            {' · '}<a href={photo.licenseUrl}>{photo.license}</a>
            {' · '}Đã thu nhỏ và chuyển WebP, không thay đổi nội dung món ăn.
          </p>
        ))}
      </section>

      <section className="form-section">
        <h2>Quản lý dữ liệu phiên hiện tại</h2>
        <p className="muted small mb-4">
          Nếu muốn làm mới lịch sử trò chuyện với trợ lý AI và danh sách món đã lưu trên thiết bị này, bạn có thể xóa dữ liệu phiên tại đây.
        </p>
        {!confirm ? (
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => setConfirm(true)}
          >
            <RotateCcw size={16} />
            <span>Xóa dữ liệu phiên của tôi</span>
          </button>
        ) : (
          <div className="flex-row gap-2">
            <button
              type="button"
              className="button danger"
              disabled={busy}
              onClick={() => void erase()}
            >
              Xác nhận xóa sạch
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Hủy
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
