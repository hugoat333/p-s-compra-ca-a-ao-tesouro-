import type { OrderView } from "../orderView";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message?: string };

async function post<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) return { ok: true, data };
    return { ok: false, status: res.status, code: data.code ?? "error", message: data.message };
  } catch {
    return { ok: false, status: 0, code: "network" };
  }
}

export const api = {
  lookup: (email: string) => post<{ token: string; order: OrderView }>("/api/orders/lookup", { email }),
  status: (token: string) => post<{ order: OrderView }>("/api/orders/status", { token }),
  personalize: (token: string, childName: string, theme: string) =>
    post<{ order: OrderView }>("/api/personalization", { token, childName, theme }),
};

export function downloadUrl(token: string) {
  return `/api/download/${encodeURIComponent(token)}`;
}
