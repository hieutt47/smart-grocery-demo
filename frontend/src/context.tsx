import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {api, trackEvent} from './api';
import type {Cart} from './types';

const EMPTY: Cart = {items: [], version: 0, total: 0, count: 0, delivery_fee: 0};
const SAVED_KEY = 'bua_nha_saved_recipes';

function loadSavedIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

interface Store {
  cart: Cart;
  ready: boolean;
  busy: boolean;
  expired: boolean;
  error: string;
  toast: string;
  savedIds: string[];
  refreshCart: () => Promise<void>;
  setCart: (cart: Cart) => void;
  addProduct: (id: string, quantity?: number) => Promise<void>;
  act: <T>(fn: () => Promise<T>, success?: string) => Promise<T | undefined>;
  renew: () => Promise<void>;
  notify: (text: string) => void;
  clearError: () => void;
  toggleSave: (recipeId: string) => void;
  isSaved: (recipeId: string) => boolean;
  shareItem: (title: string, text: string, path?: string) => Promise<void>;
}

const Context = createContext<Store | null>(null);

export function StoreProvider({children}: {children: ReactNode}) {
  const [cart, setCart] = useState<Cart>(EMPTY);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>(loadSavedIds);

  const refreshCart = useCallback(async () => {
    setCart(await api<Cart>('/cart'));
  }, []);

  const notify = useCallback((text: string) => setToast(text), []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const expiredHandler = () => {
      setExpired(true);
      setReady(false);
    };
    window.addEventListener('session-expired', expiredHandler);
    api('/sessions', 'POST', {})
      .then(() => setReady(true))
      .catch(e => setError(e.message));
    return () => window.removeEventListener('session-expired', expiredHandler);
  }, []);

  async function act<T>(fn: () => Promise<T>, success?: string): Promise<T | undefined> {
    setBusy(true);
    setError('');
    try {
      const result = await fn();
      if (success) notify(success);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function addProduct(id: string, quantity = 1) {
    await act(async () => {
      const updated = await api<Cart>('/cart', 'PATCH', {
        items: [{product_id: id, quantity}],
        mode: 'add',
        expected_version: cart.version
      });
      setCart(updated);
    }, 'Đã thêm vào giỏ của bạn');
  }

  async function renew() {
    setBusy(true);
    setError('');
    try {
      await api('/sessions', 'POST', {renew: expired});
      setExpired(false);
      setReady(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const toggleSave = useCallback(
    (recipeId: string) => {
      setSavedIds(prev => {
        const exists = prev.includes(recipeId);
        const next = exists ? prev.filter(id => id !== recipeId) : [recipeId, ...prev];
        try {
          localStorage.setItem(SAVED_KEY, JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }
        if (!exists) trackEvent('save_recipe', recipeId);
        notify(exists ? 'Đã bỏ khỏi danh sách đã lưu' : 'Đã lưu món vào mục Đã lưu');
        return next;
      });
    },
    [notify]
  );

  const isSaved = useCallback((recipeId: string) => savedIds.includes(recipeId), [savedIds]);

  const shareItem = useCallback(
    async (title: string, text: string, path?: string) => {
      trackEvent('share_click', path);
      const url = path ? `${window.location.origin}${path}` : window.location.href;
      const shareText = `${title}\n${text}\n${url}`;
      if (navigator.share) {
        try {
          await navigator.share({title, text, url});
          return;
        } catch {
          // user cancelled or share unavailable -> fallback to clipboard
        }
      }
      try {
        await navigator.clipboard.writeText(shareText);
        notify('Đã sao chép gợi ý để gửi cho bạn bè!');
      } catch {
        notify('Hãy sao chép đường dẫn trên trình duyệt để chia sẻ nhé.');
      }
    },
    [notify]
  );

  return (
    <Context.Provider
      value={{
        cart,
        ready,
        busy,
        expired,
        error,
        toast,
        savedIds,
        refreshCart,
        setCart,
        addProduct,
        act,
        renew,
        notify,
        clearError: () => setError(''),
        toggleSave,
        isSaved,
        shareItem
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing store');
  return value;
}

export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const {ready} = useStore();
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api<T>(path, 'GET', undefined, controller.signal)
      .then(setData)
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, ready, revision]);
  return {data, setData, error, loading, retry: () => setRevision(v => v + 1)};
}
