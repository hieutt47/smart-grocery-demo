import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, Bot, Check, Code2, Database, Info, RotateCcw, ShieldCheck, Sparkles} from 'lucide-react';
import {api} from '../api';
import {useStore} from '../context';
import {PageTitle} from '../components';

export function About() {
  const [confirm, setConfirm] = useState(false);
  const {busy, act} = useStore();

  async function erase() {
    await act(async () => {
      await api('/session-data', 'DELETE');
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
        eyebrow="MINH BẠCH DỰ ÁN"
        title="Bữa Nhà — Smart Grocery & Robot Express"
        description="Bản demo đi chợ, gợi ý món và giao hàng mô phỏng đến căn hộ."
      />

      <section className="form-section">
        <div className="section-heading compact">
          <div className="flex-row items-center gap-2">
            <Sparkles size={20} className="text-emerald" />
            <h2>Bạn đang trải nghiệm điều gì?</h2>
          </div>
        </div>

        <p className="muted mb-4">
          Bữa Nhà kết hợp hai nhu cầu thiết yếu: <strong>Đi chợ mua thực phẩm tươi sạch</strong> và{' '}
          <strong>Gợi ý bữa cơm gia đình theo ngân sách</strong>, đi kèm giải pháp mô phỏng{' '}
          <strong>Robot tự hành giao hàng tận sảnh & cửa căn hộ</strong>.
        </p>

        <div className="about-facts-grid">
          <div className="about-fact-card">
            <span className="about-fact-icon">
              <Check size={20} />
            </span>
            <div className="about-fact-copy">
              <strong>Nghiệp vụ mua sắm hoàn chỉnh</strong>
              <p className="small muted">
                Khám phá danh mục thực phẩm tươi, công thức món Việt, tự động tính số lượng gói theo khẩu phần ăn, quản lý giỏ hàng và mua lại đơn cũ.
              </p>
            </div>
          </div>

          <div className="about-fact-card">
            <span className="about-fact-icon">
              <Code2 size={20} />
            </span>
            <div className="about-fact-copy">
              <strong>Trợ lý gợi ý món chuẩn quy tắc</strong>
              <p className="small muted">
                Hỗ trợ một số cách nói tiếng Việt về ngân sách, số người và thời gian bằng quy tắc nội bộ. Khả năng hiểu có giới hạn; không gọi mô hình AI bên ngoài.
              </p>
            </div>
          </div>

          <div className="about-fact-card">
            <span className="about-fact-icon">
              <Bot size={20} />
            </span>
            <div className="about-fact-copy">
              <strong>Mô phỏng Robot tự hành</strong>
              <p className="small muted">
                Theo dõi các bước giao hàng và tua thời gian trong mô phỏng. Không kết nối robot, thang máy hay đối tác giao hàng thật.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading compact">
          <div className="flex-row items-center gap-2">
            <ShieldCheck size={20} className="text-emerald" />
            <h2>Dữ liệu phiên & Quyền riêng tư</h2>
          </div>
        </div>

        <div className="privacy-notes">
          <div className="flex-row items-start gap-2 mb-2">
            <Database size={16} className="text-emerald shrink-0 mt-0.5" />
            <p className="small muted">
              <strong>Không yêu cầu tài khoản cá nhân:</strong> Giỏ hàng, hội thoại và đơn mô phỏng được lưu tạm trên máy chủ theo phiên tối đa 24 giờ; cookie HttpOnly nhận diện phiên. Hosting khởi động lại hoặc triển khai lại có thể làm mất lịch sử.
            </p>
          </div>
          <div className="flex-row items-start gap-2 mb-2">
            <Info size={16} className="text-emerald shrink-0 mt-0.5" />
            <p className="small muted">
              <strong>Chỉ dùng thông tin hư cấu:</strong> Địa chỉ và liên hệ đã nhập được lưu tạm trên máy chủ cùng đơn mô phỏng; không nhập thông tin cá nhân thật. Không thu tiền thật. Công thức tự biên soạn chưa được thẩm định chuyên môn; không bảo đảm về dị ứng hay cung cấp tư vấn dinh dưỡng.
            </p>
          </div>
        </div>

        <div className="session-action-box">
          {!confirm ? (
            <button
              type="button"
              className="button secondary"
              onClick={() => setConfirm(true)}
            >
              <RotateCcw size={16} />
              <span>Xóa toàn bộ dữ liệu phiên của tôi</span>
            </button>
          ) : (
            <div className="soft-callout confirmation-box" role="alert">
              <div>
                <strong>Bạn có chắc muốn xóa dữ liệu phiên hiện tại?</strong>
                <p className="small muted">
                  Giỏ hàng, lịch sử trò chuyện và các đơn hàng mô phỏng sẽ được làm sạch ngay lập tức.
                </p>
              </div>
              <div className="flex-row gap-2 mt-2">
                <button
                  type="button"
                  className="button danger small-button"
                  disabled={busy}
                  onClick={() => void erase()}
                >
                  Xác nhận xóa sạch
                </button>
                <button
                  type="button"
                  className="button secondary small-button"
                  onClick={() => setConfirm(false)}
                >
                  Giữ lại
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

