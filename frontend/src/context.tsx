import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {api} from './api';
import type {Cart} from './types';

const EMPTY: Cart = {items: [], version: 0, total: 0, count: 0, delivery_fee: 0};
interface Store {
  cart: Cart; ready: boolean; busy: boolean; expired: boolean; error: string; toast: string;
  refreshCart: () => Promise<void>; setCart: (cart: Cart) => void;
  addProduct: (id: string, quantity?: number) => Promise<void>;
  act: <T>(fn: () => Promise<T>, success?: string) => Promise<T | undefined>;
  renew: () => Promise<void>; notify: (text: string) => void; clearError: () => void;
}
const Context = createContext<Store | null>(null);
export function StoreProvider({children}: {children: ReactNode}) {
  const [cart, setCart] = useState<Cart>(EMPTY);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const refreshCart = useCallback(async () => { setCart(await api<Cart>('/cart')); }, []);
  const notify = useCallback((text: string) => setToast(text), []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); } }, [toast]);
  useEffect(() => {
    const expiredHandler = () => {setExpired(true); setReady(false);};
    window.addEventListener('session-expired', expiredHandler);
    api('/sessions', 'POST', {}).then(refreshCart).then(() => setReady(true)).catch(e => setError(e.message));
    return () => window.removeEventListener('session-expired', expiredHandler);
  }, [refreshCart]);
  async function act<T>(fn: () => Promise<T>, success?: string): Promise<T | undefined> {
    setBusy(true); setError('');
    try { const result = await fn(); if (success) notify(success); return result; }
    catch (e) {setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); await refreshCart().catch(() => {}); return undefined;}
    finally {setBusy(false);}
  }
  async function addProduct(id: string, quantity = 1) {
    await act(async () => {
      const updated = await api<Cart>('/cart', 'PATCH', {items: [{product_id: id, quantity}], mode: 'add', expected_version: cart.version});
      setCart(updated);
    }, 'Đã thêm vào giỏ của bạn');
  }
  async function renew() {
    setBusy(true); setError('');
    try {await api('/sessions', 'POST', {renew: expired}); await refreshCart(); setExpired(false); setReady(true);}
    catch (e) {setError((e as Error).message);}
    finally {setBusy(false);}
  }
  return <Context.Provider value={{cart, ready, busy, expired, error, toast, refreshCart, setCart, addProduct, act, renew, notify, clearError: () => setError('')}}>{children}</Context.Provider>;
}
export function useStore() {const value = useContext(Context); if (!value) throw new Error('Missing store'); return value;}

export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const {ready} = useStore();
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setLoading(true); setError('');
    api<T>(path, 'GET', undefined, controller.signal).then(setData)
      .catch(e => {if (e.name !== 'AbortError') setError(e.message);})
      .finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [path, ready, revision]);
  return {data, setData, error, loading, retry: () => setRevision(v => v + 1)};
}
