export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) { super(message); this.code = code; }
}

export async function api<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, {
      method, credentials: 'same-origin', headers: body !== undefined ? {'Content-Type': 'application/json'} : {},
      body: body === undefined ? undefined : JSON.stringify(body), signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('Chưa kết nối được dịch vụ. Kiểm tra mạng rồi thử lại nhé.', 'NETWORK_ERROR');
  }
  const data = await response.json().catch(() => ({message: 'Dịch vụ đang khởi động. Vui lòng thử lại.', code: 'SERVER_ERROR'}));
  if (!response.ok) {
    if (data.code === 'SESSION_EXPIRED') window.dispatchEvent(new Event('session-expired'));
    throw new ApiError(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.', data.code || 'SERVER_ERROR');
  }
  return data;
}

export const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' đ';
export const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh'}).format(new Date(value));
