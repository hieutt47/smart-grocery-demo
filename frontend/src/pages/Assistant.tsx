import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Bot, Clock3, RotateCcw, Send, Sparkles, Store, Users} from 'lucide-react';
import {api, money} from '../api';
import {useResource, useStore} from '../context';
import {LoadState, PageTitle, ProductCard} from '../components';
import type {AssistantResult, ChatMessage, Conversation} from '../types';

const PROMPTS = [
  'Tối nay 2 người, ngân sách khoảng 100k, không biết ăn gì.',
  'Có món nào thanh mát nấu trong 20 phút không?',
  'Tôi muốn nấu món gà rang gừng thơm ngon.',
  'Lên thực đơn bữa cơm cho 3 người tầm 150k.'
];

export function Assistant() {
  const resource = useResource<Conversation | null>('/assistant/conversation');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const {ready} = useStore();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resource.data) {
      setMessages(resource.data.messages);
      setConversationId(resource.data.id);
    }
  }, [resource.data]);

  useEffect(() => {
    if (messages.length) {
      bottom.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }
  }, [messages]);

  async function send(content = input) {
    if (!content.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const result = await api<AssistantResult>('/assistant/messages', 'POST', {
        content,
        conversation_id: conversationId
      });
      setMessages(prev => [...prev, {role: 'user', content}, {role: 'assistant', result}]);
      setConversationId(result.conversation_id);
      setInput('');
    } catch (e) {
      setError((e as Error).message);
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  async function reset() {
    setSending(true);
    setError('');
    try {
      await api('/assistant/conversation', 'DELETE');
      setMessages([]);
      setConversationId(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="TRỢ LÝ THÔNG MINH"
        title="Hôm nay mình ăn gì?"
        description="Nói ra số người, thời gian hoặc ngân sách dự kiến. Trợ lý sẽ gợi ý bữa cơm vừa vặn nhất cho bạn."
      />

      <div className="assistant-layout">
        {/* Left Side: Prompts & Guidance */}
        <aside className="assistant-guide">
          <div className="assistant-orb-wrapper">
            <span className="assistant-orb">
              <Sparkles size={28} />
            </span>
            <div className="assistant-guide-title">
              <h2>Gợi ý bữa cơm<br className="desktop-break" /> vừa vặn hôm nay</h2>
              <p className="muted small">Chỉ cần nói những điều bạn muốn, hệ thống sẽ tự tính toán nguyên liệu.</p>
            </div>
          </div>

          <div className="prompt-list" role="group" aria-label="Câu hỏi gợi ý nhanh">
            <span className="prompt-list-heading">GỢI Ý CÂU HỎI MẪU:</span>
            {PROMPTS.map(p => (
              <button
                key={p}
                type="button"
                className="prompt-chip"
                disabled={sending || !ready || resource.loading}
                onClick={() => void send(p)}
              >
                <span>{p}</span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>

          <div className="assistant-disclosure">
            <div className="flex-row items-center gap-2 mb-1">
              <Bot size={15} className="text-emerald" />
              <strong>Trợ lý Bữa Nhà</strong>
            </div>
            <p>
              Gợi ý theo thuật toán quy tắc & dữ liệu mẫu (không gọi mô hình bên ngoài). Giữ nguyên ngữ cảnh khi đổi món.
            </p>
          </div>

          <Link to="/products" className="text-link">
            <Store size={15} />
            <span>Mình muốn tự đi chợ chọn hàng</span>
            <ArrowRight size={14} />
          </Link>
        </aside>

        {/* Right Side: Chat Panel */}
        <section className="chat-panel" aria-label="Khung trò chuyện trợ lý">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-dot" />
              <Sparkles size={18} className="text-emerald" />
              <strong>Cùng lên thực đơn gia đình</strong>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => void reset()}
              disabled={sending || resource.loading || !messages.length}
              aria-label="Làm mới cuộc trò chuyện"
              title="Làm mới cuộc trò chuyện"
            >
              <RotateCcw size={17} />
            </button>
          </div>

          <LoadState {...resource} />

          <div className="chat-messages" role="log" aria-live="polite">
            {!messages.length && !resource.loading && (
              <div className="chat-welcome">
                <span className="welcome-emoji" aria-hidden="true"><Sparkles size={38} strokeWidth={1.3} /></span>
                <h3>Chào bạn, hôm nay gian bếp nhà mình thế nào?</h3>
                <p className="muted">
                  Hãy thử gõ “100k cho 2 người” hoặc chọn một câu gợi ý mẫu bên cạnh để bắt đầu nhé.
                </p>
              </div>
            )}

            {messages.map((m, index) =>
              m.role === 'user' ? (
                <div className="user-message" key={index}>
                  <p>{m.content}</p>
                </div>
              ) : (
                <div className="assistant-message" key={index}>
                  <span className="message-avatar">
                    <Sparkles size={16} />
                  </span>
                  <div className="message-body">
                    <div className="message-bubble">
                      <p>{m.result.message}</p>
                    </div>

                    {m.result.suggestions.map(s => (
                      <article className="suggestion-card" key={s.id}>
                        <div className="suggestion-title">
                          <span className="suggestion-emoji"><Sparkles size={25} strokeWidth={1.3} /></span>
                          <div className="suggestion-meta">
                            <h3>{s.name}</h3>
                            <span className="suggestion-specs small muted">
                              <Users size={13} className="inline-icon" />
                              <span>{s.servings} người</span>
                              <Clock3 size={13} className="inline-icon ml-2" />
                              <span>{s.minutes} phút</span>
                            </span>
                          </div>
                        </div>

                        {s.recipes.length > 1 && (
                          <p className="suggestion-recipes-list small">
                            <strong>Món gồm: </strong>
                            {s.recipes.map(r => r.name).join(' · ')}
                          </p>
                        )}

                        <p className="suggestion-reason small muted">{s.reason}</p>

                        <div className="suggestion-footer">
                          <div className="suggestion-price-stack">
                            <span className="small muted">Chi phí nguyên liệu dự kiến</span>
                            <strong className="suggestion-price">{money(s.total)}</strong>
                          </div>
                          <Link
                            className="button primary small-button"
                            to={`/cook?ids=${s.recipes.map(r => r.id).join(',')}&servings=${s.servings}${
                              s.selections.some(x => x.variant_id) ? '&lighter=1' : ''
                            }`}
                          >
                            <span>Chọn món này</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </article>
                    ))}

                    {m.result.products.length > 0 && (
                      <div className="chat-products">
                        {m.result.products.map(p => (
                          <ProductCard product={p} key={p.id} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {sending && (
              <div className="assistant-typing" role="status">
                <span className="spinner" />
                <span>Trợ lý đang xem các món phù hợp…</span>
              </div>
            )}
            <div ref={bottom} />
          </div>

          {/* Quick Context Follow-ups */}
          {messages.length > 0 && (
            <div className="chat-followups" role="group" aria-label="Tùy chọn gợi ý tiếp theo">
              <button
                type="button"
                className="chip"
                disabled={sending}
                onClick={() => void send('Đổi món khác đi')}
              >
                Đổi món khác
              </button>
              <button
                type="button"
                className="chip"
                disabled={sending}
                onClick={() => void send('Đổi món khác đi, hôm nay không thích cá')}
              >
                Không thích ăn cá
              </button>
              <button
                type="button"
                className="chip"
                disabled={sending}
                onClick={() => void send('Có món nào thanh đạm, ít dầu mỡ hơn không?')}
              >
                Nấu thanh đạm hơn
              </button>
            </div>
          )}

          {error && <p className="inline-error" role="alert">{error}</p>}

          <form
            className="chat-input"
            role="search"
            onSubmit={e => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={500}
              aria-label="Nhập nhu cầu bữa ăn của bạn"
              placeholder="Ví dụ: 100k cho 2 người, muốn ăn món canh thanh mát…"
            />
            <button
              type="submit"
              className="button primary chat-send-btn"
              aria-label="Gửi yêu cầu"
              disabled={sending || !ready || !input.trim() || resource.loading}
            >
              <Send size={18} />
            </button>
          </form>

          <p className="chat-footnote">
            Giá tính theo danh mục hàng mẫu. Trợ lý gợi ý và không tự động thay đổi giỏ hàng của bạn.
          </p>
        </section>
      </div>
    </>
  );
}

