import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Bot, Clock3, RotateCcw, Send, Sparkles, Store} from 'lucide-react';
import {api, money} from '../api';
import {useResource, useStore} from '../context';
import {LoadState, PageTitle, ProductCard} from '../components';
import {RecipeVisual} from '../recipe-art';
import type {AssistantResult, ChatMessage, Conversation} from '../types';

const PROMPTS = [
  {label: '2 người · 100k', text: 'Tối nay 2 người, ngân sách khoảng 100k, không biết ăn gì.'},
  {label: 'Món thanh mát · 20p', text: 'Có món nào thanh mát nấu trong 20 phút không?'},
  {label: 'Gà rang gừng thơm', text: 'Tôi muốn nấu món gà rang gừng thơm ngon.'},
  {label: '3 người · 150k', text: 'Lên thực đơn bữa cơm cho 3 người tầm 150k.'}
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
      if (content === input) {
        setInput('');
      }
    } catch (e) {
      setError((e as Error).message);
      if (content === input) {
        setInput(content);
      }
    } finally {
      setSending(false);
    }
  }

  async function reset() {
    setSending(true);
    setError('');
    try {
      await api('/assistant/conversation', 'DELETE');
      resource.setData(null);
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
        eyebrow="Trợ lý gợi ý món"
        title="Hôm nay gia đình mình ăn gì?"
        description="Nói ra số người, thời gian hoặc ngân sách dự kiến. Trợ lý sẽ gợi ý bữa cơm vừa vặn nhất cho bạn."
      />

      {/* Thanh câu hỏi gợi ý nhanh dạng cuộn ngang trên mobile */}
      <div className="assistant-mobile-prompts horizontal-scroll-row" role="group" aria-label="Gợi ý câu hỏi nhanh">
        {PROMPTS.map(p => (
          <button
            key={p.label}
            type="button"
            className="chip prompt-pill"
            disabled={sending || !ready || resource.loading}
            onClick={() => void send(p.text)}
            aria-label={p.text}
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <div className="assistant-layout">
        {/* Cột trái desktop: Hướng dẫn & Câu hỏi mẫu */}
        <aside className="assistant-guide" aria-label="Hướng dẫn trợ lý">
          <div className="assistant-orb-wrapper">
            <span className="assistant-orb" aria-hidden="true">
              <Sparkles size={26} strokeWidth={1.7} />
            </span>
            <div className="assistant-guide-title">
              <h2>Gợi ý bữa cơm<br className="desktop-break" /> vừa vặn hôm nay</h2>
              <p className="muted small">Chỉ cần nói những điều bạn muốn, hệ thống sẽ tự tính toán nguyên liệu và cân đối chi phí.</p>
            </div>
          </div>

          <div className="prompt-list" role="group" aria-label="Câu hỏi gợi ý nhanh">
            <span className="prompt-list-heading">Gợi ý câu hỏi mẫu:</span>
            {PROMPTS.map(p => (
              <button
                key={p.label}
                type="button"
                className="prompt-chip"
                disabled={sending || !ready || resource.loading}
                onClick={() => void send(p.text)}
              >
                <span>{p.text}</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="assistant-disclosure">
            <div className="flex-row items-center gap-2 mb-1">
              <Bot size={15} className="text-emerald" aria-hidden="true" />
              <strong>Trợ lý Bữa Nhà</strong>
            </div>
            <p>
              Trợ lý AI gợi ý bữa ngon kết hợp kiểm tra nguyên liệu & giá mẫu thực tế từ hệ thống. Giữ nguyên ngữ cảnh khi đổi món.
            </p>
          </div>

          <Link to="/products" className="text-link">
            <Store size={15} aria-hidden="true" />
            <span>Mình muốn tự đi chợ chọn hàng</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </aside>

        {/* Khung trò chuyện */}
        <section className="chat-panel" aria-label="Khung trò chuyện trợ lý">
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-dot" aria-hidden="true" />
              <Sparkles size={16} className="text-emerald" aria-hidden="true" />
              <strong>Cùng lên thực đơn gia đình</strong>
            </div>
            <button
              type="button"
              className="icon-button chat-reset-btn"
              onClick={() => void reset()}
              disabled={sending || resource.loading || !messages.length}
              aria-label="Làm mới cuộc trò chuyện"
              title="Làm mới cuộc trò chuyện"
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          </div>

          <LoadState {...resource} />

          <div className="chat-messages" role="log" aria-live="polite">
            {!messages.length && !resource.loading && (
              <div className="chat-welcome">
                <span className="welcome-emoji" aria-hidden="true">
                  <Sparkles size={38} strokeWidth={1.4} />
                </span>
                <h3>Chào bạn, hôm nay gian bếp nhà mình thế nào?</h3>
                <p className="muted">
                  Hãy thử gõ “100k cho 2 người” hoặc chọn một câu gợi ý mẫu bên trên để bắt đầu nhé.
                </p>
              </div>
            )}

            {messages.map((m, index) =>
              m.role === 'user' ? (
                <div className="user-message" key={`user-${index}-${m.content.slice(0, 15)}`}>
                  <p>{m.content}</p>
                </div>
              ) : (
                <div className="assistant-message" key={`assistant-${m.result.conversation_id || index}-${index}`}>
                  <span className="message-avatar" aria-hidden="true">
                    <Sparkles size={16} />
                  </span>
                  <div className="message-body">
                    <div className="message-bubble">
                      <p>{m.result.message}</p>
                    </div>

                    {m.result.suggestions.map(s => (
                      <article className="suggestion-card" key={s.id}>
                        <div className="suggestion-thumb">
                          {s.recipes && s.recipes.length > 0 && (
                            <RecipeVisual recipe={s.recipes[0]} className="suggestion-thumb-art" decorative={true} />
                          )}
                          {s.recipes.length > 1 && (
                            <span className="suggestion-combo-badge">Combo {s.recipes.length} món</span>
                          )}
                        </div>

                        <div className="suggestion-info">
                          <div className="suggestion-header-row">
                            <h3 className="suggestion-title">{s.name}</h3>
                            <span className="suggestion-time-badge">
                              <Clock3 size={11} aria-hidden="true" />
                              <span>{s.minutes}p</span>
                            </span>
                          </div>

                          <p className="suggestion-summary">
                            {s.recipes.length > 1
                              ? `Mâm cơm: ${s.recipes.map(r => r.name).join(' · ')}`
                              : `${s.servings} người · ${s.recipes[0]?.tags?.join(' · ') || 'Món ngon cơm nhà'}`}
                          </p>

                          <div className="suggestion-footer-row">
                            <strong className="suggestion-price">{money(s.total)}</strong>
                            <Link
                              className="button primary small-button suggestion-btn"
                              to={`/cook?ids=${s.recipes.map(r => r.id).join(',')}&servings=${s.servings}${
                                s.selections.some(x => x.variant_id) ? '&lighter=1' : ''
                              }`}
                              aria-label="Chọn món này"
                            >
                              <span>Chọn món này</span>
                              <ArrowRight size={13} aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}

                    {m.result.products.length > 0 && (
                      <div className="chat-products product-grid">
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
                disabled={sending || !ready || resource.loading}
                onClick={() => void send('Đổi món khác đi')}
              >
                Đổi món khác
              </button>
              <button
                type="button"
                className="chip"
                disabled={sending || !ready || resource.loading}
                onClick={() => void send('Đổi món khác đi, hôm nay không thích cá')}
              >
                Không thích ăn cá
              </button>
              <button
                type="button"
                className="chip"
                disabled={sending || !ready || resource.loading}
                onClick={() => void send('Có món nào thanh đạm, ít dầu mỡ hơn không?')}
              >
                Nấu thanh đạm hơn
              </button>
            </div>
          )}

          {error && <p className="inline-error" role="alert">{error}</p>}

          <form
            className="chat-input"
            aria-label="Gửi yêu cầu bữa ăn cho trợ lý"
            onSubmit={e => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              type="text"
              name="prompt"
              autoComplete="off"
              spellCheck={false}
              disabled={sending || resource.loading}
              value={input}
              onChange={e => setInput(e.target.value)}
              maxLength={500}
              aria-label="Nhập nhu cầu bữa ăn của bạn"
              placeholder="Ví dụ: 100k cho 2 người, muốn ăn món canh thanh mát…"
            />
            <button
              type="submit"
              className="chat-send-btn"
              aria-label="Gửi yêu cầu"
              disabled={sending || !ready || !input.trim() || resource.loading}
            >
              <Send size={18} aria-hidden="true" />
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

