import {useEffect, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {ArrowRight, Bot, Brain, ChefHat, Clock3, Dices, Heart, HeartPulse, RotateCcw, Send, Share2, Sparkles, X} from 'lucide-react';
import {api, money, trackEvent} from '../api';
import {useResource, useStore} from '../context';
import {LoadState, PageTitle, PantryModal} from '../components';
import {OFFICE_LUNCH_OPTIONS} from '../nutrition';
import {getPantryStaples, subscribePantry} from '../pantry';
import {RecipeVisual} from '../recipe-art';
import type {ActiveMemory, AssistantResult, ChatMessage, Conversation, Recipe} from '../types';

const ALLERGEN_LABELS: Record<string, string> = {
  shellfish: 'Tôm / Hải sản',
  fish: 'Cá / Nước mắm',
  egg: 'Trứng',
  soy: 'Đậu nành / Đậu hũ',
  wheat: 'Lúa mì',
  sesame: 'Mè / Vừng'
};

const CUSTOM_RECIPES_KEY = 'bua_nha_custom_recipes';

function saveCustomRecipes(recipes: Recipe[]) {
  const custom = recipes.filter(r => r.is_custom || r.id.startsWith('custom-'));
  if (!custom.length) return;
  try {
    const raw = sessionStorage.getItem(CUSTOM_RECIPES_KEY);
    const existing: Record<string, Recipe> = raw ? JSON.parse(raw) : {};
    for (const r of custom) {
      existing[r.id] = r;
    }
    sessionStorage.setItem(CUSTOM_RECIPES_KEY, JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
}

const PROMPTS = [
  {label: 'Trưa nay · 50k', text: 'Trưa nay ăn gì nhẹ bụng, tầm 50k cho 1 người?'},
  {label: 'Nấu nhanh 15p', text: 'Đi làm về muộn, có món nào nấu nhanh trong 15 phút?'},
  {label: 'Eat clean · ít dầu', text: 'Có món nào thanh đạm, ít dầu mỡ, dễ mang đi làm không?'},
  {label: '2 người · 100k', text: 'Tối nay 2 người, ngân sách khoảng 100k, không biết ăn gì.'}
];

export function Assistant() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resource = useResource<Conversation | null>('/assistant/conversation');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showPantry, setShowPantry] = useState(false);
  const [pantryIds, setPantryIds] = useState<string[]>(getPantryStaples());
  const mode = searchParams.get('mode') === 'lunch' ? 'lunch' : 'cook';

  function setMode(nextMode: 'cook' | 'lunch') {
    const next = new URLSearchParams(searchParams);
    if (nextMode === 'lunch') next.set('mode', 'lunch');
    else next.delete('mode');
    setSearchParams(next);
  }
  const [lunchSeed, setLunchSeed] = useState(0);
  const [memory, setMemory] = useState<ActiveMemory | null>(null);
  const {ready, isSaved, toggleSave, shareItem} = useStore();
  const bottom = useRef<HTMLDivElement>(null);
  const sentQueryRef = useRef<string | null>(null);

  useEffect(() => subscribePantry(setPantryIds), []);

  useEffect(() => {
    if (resource.data) {
      setMessages(resource.data.messages);
      setConversationId(resource.data.id);
      if (resource.data.context?.memory) {
        setMemory(resource.data.context.memory);
      }
    }
  }, [resource.data]);

  useEffect(() => {
    if (messages.length) {
      bottom.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }
  }, [messages]);

  useEffect(() => {
    const qParam = searchParams.get('q')?.trim();
    if (!qParam || !ready || resource.loading || sending || sentQueryRef.current === qParam) return;
    sentQueryRef.current = qParam;
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next, {replace: true});
    void send(qParam);
  });

  const lunchSuggestions = Array.from({length: 3}, (_, idx) => {
    return OFFICE_LUNCH_OPTIONS[(lunchSeed * 3 + idx) % OFFICE_LUNCH_OPTIONS.length];
  });

  async function send(content = input) {
    if (!content.trim() || sending) return;
    trackEvent('assistant_ask');
    setSending(true);
    setError('');
    try {
      const result = await api<AssistantResult>('/assistant/messages', 'POST', {
        content,
        conversation_id: conversationId,
        pantry: pantryIds
      });
      setMessages(prev => [...prev, {role: 'user', content}, {role: 'assistant', result}]);
      setConversationId(result.conversation_id);
      if (result.context?.memory) {
        setMemory(result.context.memory);
      }
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
      setMemory(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function removeMemoryChip(category: string, value: string) {
    try {
      const res = await api<{memory: ActiveMemory}>(
        `/assistant/memory?category=${encodeURIComponent(category)}&value=${encodeURIComponent(value)}`,
        'DELETE'
      );
      setMemory(res.memory);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const memoryChips: {category: string; value: string; label: string}[] = memory
    ? [
        ...(memory.health_conditions || []).map(v => ({category: 'health_conditions', value: v, label: `Sức khỏe: ${v}`})),
        ...(memory.pregnancy ? [{category: 'pregnancy', value: 'true', label: 'Đang mang thai'}] : []),
        ...(memory.allergies || []).map(v => ({
          category: 'allergies',
          value: v,
          label: `Dị ứng: ${ALLERGEN_LABELS[v] || v}`
        })),
        ...(memory.dislikes || []).map(v => ({category: 'dislikes', value: v, label: `Tránh: ${v}`})),
        ...(memory.diet_goals || []).map(v => ({category: 'diet_goals', value: v, label: `Mục tiêu: ${v}`})),
        ...(memory.fridge_items || []).map(v => ({category: 'fridge_items', value: v, label: `Tủ lạnh: ${v}`}))
      ]
    : [];

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

          <Link to="/recipes" className="text-link">
            <ChefHat size={15} aria-hidden="true" />
            <span>Xem tất cả công thức</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </aside>

        {/* Khung trò chuyện */}
        <section className="chat-panel" aria-label="Khung trò chuyện trợ lý">
          <div className="chat-mode-bar" role="tablist" aria-label="Chế độ tư vấn">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'cook'}
              className={`chat-mode-tab ${mode === 'cook' ? 'active' : ''}`}
              onClick={() => setMode('cook')}
            >
              🍳 Tối tự nấu (AI)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'lunch'}
              className={`chat-mode-tab ${mode === 'lunch' ? 'active' : ''}`}
              onClick={() => setMode('lunch')}
            >
              🥢 Trưa ăn ngoài văn phòng
            </button>
          </div>

          {mode === 'lunch' ? (
            <div className="lunch-advisor-panel">
              <div className="lunch-advisor-header">
                <div>
                  <h3>Gợi ý ăn trưa nhanh cho dân văn phòng</h3>
                  <p className="small muted">Chọn nhanh món dễ ăn, rõ calo & tầm giá để rủ đồng nghiệp.</p>
                </div>
                <button
                  type="button"
                  className="button secondary small-button"
                  onClick={() => setLunchSeed(v => v + 1)}
                >
                  <Dices size={15} aria-hidden="true" />
                  <span>Đổi 3 gợi ý khác</span>
                </button>
              </div>
              <div className="lunch-cards-list">
                {lunchSuggestions.map(item => (
                  <article className="suggestion-card" key={item.id}>
                    <div className="suggestion-thumb lunch-emoji-thumb" aria-hidden="true">
                      <span>{item.emoji}</span>
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-header-row">
                        <h3 className="suggestion-title">{item.name}</h3>
                        <span className="suggestion-time-badge">~{item.kcal} kcal</span>
                      </div>
                      <p className="suggestion-summary">{item.tag} · {item.note}</p>
                      <div className="suggestion-footer-row">
                        <strong className="suggestion-price">≈ {money(item.price)}</strong>
                        <button
                          type="button"
                          className="button primary small-button"
                          onClick={() =>
                            void shareItem(
                              `Trưa nay ăn ${item.name} không cả nhà?`,
                              `Tầm ${money(item.price)} · ~${item.kcal} kcal · ${item.tag}`,
                              '/assistant?mode=lunch'
                            )
                          }
                        >
                          <Share2 size={14} aria-hidden="true" />
                          <span>Rủ đồng nghiệp</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <>
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-dot" aria-hidden="true" />
              <Sparkles size={16} className="text-emerald" aria-hidden="true" />
              <strong>Cùng lên thực đơn gia đình</strong>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                className="chip pantry-pill-btn"
                onClick={() => setShowPantry(true)}
                title="Tùy chỉnh các gia vị đã có sẵn trong bếp"
                aria-label="Tủ gia vị nhà mình"
              >
                <Sparkles size={13} className="text-emerald" aria-hidden="true" />
                <span>Gia vị ({pantryIds.length})</span>
              </button>
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
          </div>

          {memoryChips.length > 0 && (
            <div className="memory-chips-bar" aria-label="Thông tin trợ lý đang ghi nhớ">
              <span className="memory-bar-label">
                <Brain size={13} aria-hidden="true" />
                <span>Đang nhớ:</span>
              </span>
              {memoryChips.map(chip => (
                <span className="memory-chip" key={`${chip.category}-${chip.value}`}>
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    className="memory-chip-remove"
                    aria-label={`Quên ${chip.label}`}
                    onClick={() => void removeMemoryChip(chip.category, chip.value)}
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

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

                    {m.result.health_advisory && (
                      <div className="health-advisory-box" role="note">
                        <HeartPulse size={17} aria-hidden="true" />
                        <div>
                          <strong>Lưu ý dinh dưỡng & chế biến</strong>
                          <p>{m.result.health_advisory}</p>
                          <small>Thông tin tham khảo phổ thông, không thay thế tư vấn bác sĩ điều trị.</small>
                        </div>
                      </div>
                    )}

                    {m.result.suggestions.map(s => (
                      <article className="suggestion-card" key={s.id}>
                        <div className="suggestion-thumb">
                          {s.recipes && s.recipes.length > 0 && (
                            <RecipeVisual recipe={s.recipes[0]} className="suggestion-thumb-art" decorative={true} />
                          )}
                          {s.recipes.length > 1 && (
                            <span className="suggestion-combo-badge">Combo {s.recipes.length} món</span>
                          )}
                          {s.recipes.some(r => r.is_custom || r.id.startsWith('custom-')) && (
                            <span className="custom-ai-badge">✨ AI thiết kế riêng</span>
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
                            <strong className="suggestion-price">≈ {money(s.total)}</strong>
                            <div className="suggestion-actions-group">
                              {s.recipes[0] && !s.recipes[0].is_custom && !s.recipes[0].id.startsWith('custom-') && (
                                <button
                                  type="button"
                                  className={`icon-chip-btn ${isSaved(s.recipes[0].id) ? 'saved' : ''}`}
                                  aria-label={isSaved(s.recipes[0].id) ? `Bỏ lưu ${s.name}` : `Lưu ${s.name}`}
                                  onClick={() => toggleSave(s.recipes[0].id)}
                                >
                                  <Heart size={14} fill={isSaved(s.recipes[0].id) ? 'currentColor' : 'none'} aria-hidden="true" />
                                </button>
                              )}
                              <button
                                type="button"
                                className="icon-chip-btn"
                                aria-label={`Chia sẻ gợi ý ${s.name}`}
                                onClick={() =>
                                  void shareItem(
                                    `Gợi ý hôm nay: ${s.name}`,
                                    `Cho ${s.servings} người · ~${s.minutes} phút · Ước tính ${money(s.total)}`,
                                    `/cook?ids=${s.recipes.map(r => r.id).join(',')}&servings=${s.servings}`
                                  )
                                }
                              >
                                <Share2 size={14} aria-hidden="true" />
                              </button>
                              <Link
                                className="button primary small-button suggestion-btn"
                                to={`/cook?ids=${s.recipes.map(r => r.id).join(',')}&servings=${s.servings}${
                                  s.selections.some(x => x.variant_id) ? '&lighter=1' : ''
                                }`}
                                state={{customRecipes: s.recipes.filter(r => r.is_custom || r.id.startsWith('custom-'))}}
                                onClick={() => saveCustomRecipes(s.recipes)}
                                aria-label="Chọn món này"
                              >
                                <span>Xem công thức</span>
                                <ArrowRight size={13} aria-hidden="true" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}

                    {(m.result.lunch_suggestions || []).map(item => (
                      <article className="suggestion-card" key={item.id}>
                        <div className="suggestion-thumb lunch-emoji-thumb" aria-hidden="true">
                          <span>{item.emoji}</span>
                        </div>
                        <div className="suggestion-info">
                          <div className="suggestion-header-row">
                            <h3 className="suggestion-title">{item.name}</h3>
                            <span className="suggestion-time-badge">~{item.kcal} kcal</span>
                          </div>
                          <p className="suggestion-summary">{item.tag} · {item.note}</p>
                          <div className="suggestion-footer-row">
                            <strong className="suggestion-price">≈ {money(item.price)}</strong>
                            <button
                              type="button"
                              className="button primary small-button"
                              onClick={() =>
                                void shareItem(
                                  `Trưa nay ăn ${item.name} không cả nhà?`,
                                  `Tầm ${money(item.price)} · ~${item.kcal} kcal · ${item.tag}`,
                                  '/assistant?mode=lunch'
                                )
                              }
                            >
                              <Share2 size={14} aria-hidden="true" />
                              <span>Rủ đồng nghiệp</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
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
            Chi phí ước tính tham khảo theo khẩu phần. Dữ liệu từ trợ lý AI Bữa Nhà.
          </p>
            </>
          )}
        </section>
      </div>

      <PantryModal open={showPantry} onClose={() => setShowPantry(false)} />
    </>
  );
}

