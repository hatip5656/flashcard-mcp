/**
 * Test generator endpoints of the Wordagram backend (/admin/test-generator). Logs in on its own and logs in
 * again when the token expires, so long authoring sessions keep working.
 */
import { login } from "./admin-api.js";

export function createTestGeneratorClient(baseUrl: string, username: string, password: string) {
  let token: string | null = null;

  async function request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
    if (!token) token = await login(baseUrl, username, password);
    const res = await fetch(`${baseUrl}/admin/test-generator${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && !retried) {
      token = null;
      return request<T>(method, path, body, true);
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`API ${res.status}: ${text.substring(0, 300)}`);
    return (text ? JSON.parse(text) : undefined) as T;
  }

  const q = (params: Record<string, string | undefined>) => {
    const s = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join("&");
    return s ? `?${s}` : "";
  };

  return {
    blueprints: () => request<{ blueprints: any[] }>("GET", "/blueprints"),
    instructions: (blueprintId: string, level: string, topic?: string) =>
      request<{ format: string; instructions: string }>("GET", `/format${q({ blueprintId, level, topic })}`),
    createDraft: (blueprintId: string, level: string, draft: unknown, topic?: string) =>
      request<any>("POST", "/drafts", { blueprintId, level, topic, author: "claude", draft }),
    listDrafts: () => request<{ tests: any[] }>("GET", "/drafts"),
    getDraft: (id: string) => request<any>("GET", `/drafts/${encodeURIComponent(id)}`),
    updateDraft: (id: string, draft: unknown) => request<any>("PUT", `/drafts/${encodeURIComponent(id)}`, { draft }),
    publish: (id: string, planRole: string) => request<any>("POST", `/drafts/${encodeURIComponent(id)}/publish`, { planRole }),
    remove: (id: string) => request<any>("DELETE", `/drafts/${encodeURIComponent(id)}`),
  };
}

export type TestGeneratorClient = ReturnType<typeof createTestGeneratorClient>;
