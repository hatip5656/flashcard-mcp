/**
 * Admin API client for the Wordagram backend.
 * Authenticates via JWT and provides typed methods for admin operations.
 */

const DEFAULT_BASE_URL = "https://wordagram.hatip.dev/api";

let cachedToken: string | null = null;

export async function login(baseUrl: string, username: string, password: string): Promise<string> {
  const res = await fetch(`${baseUrl}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const { token } = await res.json();
  cachedToken = token;
  return token;
}

async function request<T>(baseUrl: string, method: string, path: string, body?: unknown): Promise<T> {
  if (!cachedToken) throw new Error("Not authenticated. Call login() first.");

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cachedToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    cachedToken = null;
    throw new Error("Token expired. Re-authenticate.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.substring(0, 200)}`);
  }

  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) return res.json();
  return undefined as T;
}

export function createAdminClient(baseUrl: string = DEFAULT_BASE_URL) {
  const get = <T>(path: string) => request<T>(baseUrl, "GET", path);
  const post = <T>(path: string, body?: unknown) => request<T>(baseUrl, "POST", path, body);
  const patch = <T>(path: string, body?: unknown) => request<T>(baseUrl, "PATCH", path, body);
  const del = <T>(path: string) => request<T>(baseUrl, "DELETE", path);

  return {
    // Grammar
    getGrammarLessons: () => get<any>("/admin/grammar"),
    getGrammarLesson: (id: string) => get<any>(`/admin/grammar/${id}`),

    // Words
    getAllWords: (limit = 50) => get<any>(`/admin/words/all?limit=${limit}`),
    getWordDetail: (id: string) => get<any>(`/admin/words/${id}`),
    getWordSentences: (wordId: string) => get<any>(`/admin/words/sentences/${wordId}`),

    // Sentence-Grammar Links
    getSentenceGrammarLinks: (wordId?: string, grammarId?: string) => {
      let url = "/admin/sentence-grammar?";
      if (wordId) url += `wordId=${wordId}&`;
      if (grammarId) url += `grammarId=${grammarId}&`;
      return get<{ items: any[]; count: number }>(url);
    },
    createSentenceGrammarLink: (data: {
      wordId: string;
      sentenceEstonian: string;
      grammarLessonId: string;
      confidence?: number;
      notes?: string;
    }) => post<any>("/admin/sentence-grammar", { ...data, createdBy: "mcp-ai" }),
    bulkCreateLinks: (links: any[]) =>
      post<any>("/admin/sentence-grammar/bulk", { links }),
    deleteSentenceGrammarLink: (id: number) => del<any>(`/admin/sentence-grammar/${id}`),
    getSentenceGrammarStats: () => get<any>("/admin/sentence-grammar/stats"),
    getAIPrompt: () => get<any>("/admin/sentence-grammar/ai-prompt"),
    getUnlinkedSentences: (limit = 20, offset = 0) =>
      get<{ items: any[]; total: number }>(`/admin/sentence-grammar/unlinked?limit=${limit}&offset=${offset}`),

    // Users
    getUsers: (limit = 50) => get<any>(`/admin/users?limit=${limit}`),
    getUserStats: (chatId: number) => get<any>(`/admin/users/${chatId}/stats`),
    exportUserContext: (chatId: number) => get<any>(`/admin/users/${chatId}/export`),

    // Podcasts
    getPodcasts: (limit = 50) => get<any>(`/admin/podcast?limit=${limit}`),

    // System
    getHealth: () => get<any>("/admin/system/health"),
    getGrammarSchedulerStatus: () => get<any>("/admin/grammar/scheduler"),
  };
}

export type AdminClient = ReturnType<typeof createAdminClient>;
