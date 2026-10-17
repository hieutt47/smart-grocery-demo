import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Clock3, RotateCcw, Send, Sparkles, Users} from 'lucide-react';
import {api, money} from '../api';
import {useResource, useStore} from '../context';
import {LoadState, PageTitle, ProductCard} from '../components';
import type {AssistantResult, ChatMessage, Conversation} from '../types';

const PROMPTS = ['Tối nay 2 người, khoảng 100k, không biết ăn gì.', 'Có món nào nấu trong 20 phút không?', 'T muốn nấu gà rang gừng.', 'Lên bữa cơm cho 3 người khoảng 150k.'];
export function Assistant() {
  const resource = useResource<Conversation | null>('/assistant/conversation');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const {ready} = useStore();
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {if (resource.data) {setMessages(resource.data.messages); setConversationId(resource.data.id);}}, [resource.data]);
  useEffect(() => {if (messages.length) bottom.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});}, [messages]);
  async function send(content = input) {
    if (!content.trim() || sending) return;
    setSending(true); setError('');
    try {
      const result = await api<AssistantResult>('/assistant/messages', 'POST', {content, conversation_id: conversationId});
      setMessages(prev => [...prev, {role: 'user', content}, {role: 'assistant', result}]);
      setConversationId(result.conversation_id); setInput('');
    } catch (e) {setError((e as Error).message); setInput(content);}
    finally {setSending(false);}
  }
  async function reset() {
    setSending(true); setError('');
    try {await api('/assistant/conversation', 'DELETE'); setMessages([]); setConversationId(null);}
    catch (e) {setError((e as Error).message);}
    finally {setSending(false);}
  }
  return <><PageTitle eyebrow="MỘT CHÚT CẢM HỨNG" title="Hôm nay ăn gì?" description="Nói điều bạn muốn, chọn món bạn thích. Mình bắt đầu thật đơn giản nhé."/>
    <div className="assistant-layout"><aside className="assistant-guide"><span className="assistant-orb"><Sparkles size={30}/></span><h2>Bữa ăn vừa vặn<br/>với ngày của bạn.</h2><p className="muted">Thời gian, số người, ngân sách — chỉ cần nói những gì bạn đã biết.</p><div className="prompt-list">{PROMPTS.map(p => <button key={p} disabled={sending || !ready || resource.loading} onClick={() => void send(p)}>{p}<ArrowRight size={17}/></button>)}</div><div className="assistant-disclosure"><strong>Trợ lý demo</strong><p>Gợi ý theo kịch bản và dữ liệu mẫu. Chưa tích hợp mô hình AI thật; khả năng hiểu câu nói còn giới hạn.</p></div><Link to="/products" className="text-link">Mình chỉ muốn đi chợ <ArrowRight size={16}/></Link></aside>
    <section className="chat-panel" aria-label="Hội thoại gợi ý món"><div className="chat-header"><span><Sparkles size={18}/>Cùng nghĩ một bữa ngon</span><button className="icon-button" onClick={() => void reset()} disabled={sending || resource.loading} aria-label="Cuộc trò chuyện mới"><RotateCcw size={18}/></button></div><LoadState {...resource}/><div className="chat-messages" aria-live="polite">{!messages.length && !resource.loading && <div className="chat-welcome"><span>🥣</span><h3>Chào bạn, hôm nay thế nào?</h3><p className="muted">Thử “100k cho 2 người” hoặc chọn một câu gợi ý bên cạnh.</p></div>}
    {messages.map((m, index) => m.role === 'user' ? <div className="user-message" key={index}>{m.content}</div> : <div className="assistant-message" key={index}><span className="message-avatar"><Sparkles size={16}/></span><div className="message-body"><p>{m.result.message}</p>{m.result.suggestions.map(s => <article className="suggestion-card" key={s.id}><div className="suggestion-title"><span>{s.recipes[0].emoji}</span><div><h3>{s.name}</h3><span className="small muted"><Users size={13}/>{s.servings} người <Clock3 size={13}/>{s.minutes} phút</span></div></div>{s.recipes.length > 1 && <p className="small">{s.recipes.map(r => r.name).join(' + ')}</p>}<p className="small muted">{s.reason}</p><div className="suggestion-footer"><strong>{money(s.total)}</strong><Link className="button small-button primary" to={`/cook?ids=${s.recipes.map(r => r.id).join(',')}&servings=${s.servings}${s.selections.some(x => x.variant_id) ? '&lighter=1' : ''}`}>Chọn món <ArrowRight size={14}/></Link></div></article>)}{m.result.products.length > 0 && <div className="chat-products">{m.result.products.map(p => <ProductCard product={p} key={p.id}/>)}</div>}</div></div>)}{sending && <p className="small muted" role="status">Đang xem những món phù hợp…</p>}<div ref={bottom}/></div>
    {messages.length > 0 && <div className="chat-followups"><button className="chip" disabled={sending} onClick={() => void send('Đổi món khác đi')}>Đổi món khác</button><button className="chip" disabled={sending} onClick={() => void send('Đổi món khác đi, hôm nay không thích cá')}>Hôm nay không thích cá</button></div>}
    {error && <p className="inline-error" role="alert">{error}</p>}<form className="chat-input" onSubmit={e => {e.preventDefault(); void send();}}><input value={input} onChange={e => setInput(e.target.value)} maxLength={500} aria-label="Nhu cầu bữa ăn" placeholder="Ví dụ: 100k cho 2 người, nấu nhanh…"/><button className="button primary" aria-label="Gửi yêu cầu" disabled={sending || !ready || !input.trim() || resource.loading}><Send size={19}/></button></form><p className="chat-footnote">Giá lấy từ danh mục mẫu. Trợ lý không tự thêm sản phẩm vào giỏ.</p></section></div></>;
}
