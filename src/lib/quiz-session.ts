import { getEduentryApiBase } from "@/lib/eduentry-api";

export type QuizQuestionItem = {
  id: string;
  kategori: string;
  soru: string;
};

type CreateQuizSessionPayload = {
  p_parent_scores: Record<string, number>;
  p_email?: string | null;
  p_child_name?: string | null;
  p_child_gender?: string | null;
  p_child_scores?: Record<string, number> | null;
  p_completed?: boolean;
  p_child_age?: number | null;
  p_parent_questions?: QuizQuestionItem[] | null;
  p_child_questions?: QuizQuestionItem[] | null;
};

type QuizSessionRow = {
  id: string;
  email: string | null;
  parent_scores: Record<string, number>;
  child_scores: Record<string, number> | null;
  child_name: string | null;
  child_gender: "girl" | "boy" | null;
  child_age: number | null;
  completed: boolean;
  expires_at: string | null;
  parent_questions?: QuizQuestionItem[] | null;
  child_questions?: QuizQuestionItem[] | null;
  action_plan: {
    id: string;
    generated_at: string;
    items: {
      category_key: string;
      summary: string;
      actions: string[];
      item_order: number;
    }[];
  } | null;
};

type EnqueueActionJobResponse = {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  already_exists: boolean;
  message?: string | null;
};

function buildError(status: number, json: unknown, fallback: string): Error {
  const detail =
    typeof json === "object" && json !== null && "detail" in json
      ? String((json as { detail?: unknown }).detail ?? fallback)
      : fallback;
  return new Error(`${detail} (HTTP ${status})`);
}

function isNetworkFetchFailure(message: string): boolean {
  return (
    message === "Failed to fetch" ||
    message.includes("NetworkError") ||
    message.includes("Load failed") ||
    message.includes("network error")
  );
}

/** Tarayıcı ağ/TLS/CORS kaynaklı fetch reddini Türkçe mesaja çevirir; teşhis için apiBase loglanır. */
async function fetchWithMappedNetworkError(url: string, init: RequestInit | undefined, apiBase: string): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isNetworkFetchFailure(msg)) {
      console.warn("[WARNING] eduentry-api fetch network failure", { apiBase, path: new URL(url).pathname, browserMessage: msg });
      throw new Error(
        `Sunucuya ulaşılamadı (${apiBase}). Ağ, TLS, güvenlik duvarı veya API kapalı olabilir; üretimde VITE_EDUENTRY_API_URL build sırasında doğru tanımlanmalı. (Tarayıcı: ${msg})`
      );
    }
    console.error("[ERROR] eduentry-api fetch unexpected", { apiBase, browserMessage: msg });
    throw e instanceof Error ? e : new Error(msg);
  }
}

function normalizeQuestions(raw: unknown): QuizQuestionItem[] {
  if (!Array.isArray(raw)) return [];
  const out: QuizQuestionItem[] = [];
  for (const x of raw) {
    if (x && typeof x === "object" && "kategori" in x && "soru" in x) {
      const o = x as Record<string, unknown>;
      out.push({
        id: String(o.id ?? ""),
        kategori: String(o.kategori ?? ""),
        soru: String(o.soru ?? ""),
      });
    }
  }
  return out;
}

export const generateQuizQuestions = async (body: {
  child_name?: string;
  child_age?: number;
  child_gender?: "girl" | "boy";
}): Promise<{ parent: QuizQuestionItem[]; child: QuizQuestionItem[] }> => {
  const base = getEduentryApiBase();
  const res = await fetchWithMappedNetworkError(
    `${base}/api/quiz/generate-questions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_name: body.child_name ?? null,
        child_age: body.child_age ?? null,
        child_gender: body.child_gender ?? null,
      }),
    },
    base
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw buildError(res.status, json, "Sorular üretilemedi.");
  }
  const j = json as { parent?: unknown; child?: unknown };
  return {
    parent: normalizeQuestions(j.parent),
    child: normalizeQuestions(j.child),
  };
};

export const createQuizSession = async (payload: CreateQuizSessionPayload): Promise<{ id: string; session_key: string; email: string | null }> => {
  const base = getEduentryApiBase();
  const res = await fetchWithMappedNetworkError(
    `${base}/api/quiz/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    base
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw buildError(res.status, json, "Quiz session could not be created.");
  }
  return json as { id: string; session_key: string; email: string | null };
};

export const getQuizSessionByKey = async (sessionKey: string): Promise<QuizSessionRow> => {
  const base = getEduentryApiBase();
  const res = await fetchWithMappedNetworkError(`${base}/api/quiz/sessions/${encodeURIComponent(sessionKey)}`, undefined, base);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw buildError(res.status, json, "Quiz session not found.");
  }
  return json as QuizSessionRow;
};

export const completeQuizSessionByKey = async (
  sessionKey: string,
  childScores: Record<string, number>
): Promise<{ id: string; email: string | null; session_key: string }> => {
  const base = getEduentryApiBase();
  const res = await fetchWithMappedNetworkError(
    `${base}/api/quiz/sessions/${encodeURIComponent(sessionKey)}/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_child_scores: childScores }),
    },
    base
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw buildError(res.status, json, "Quiz session could not be completed.");
  }
  return json as { id: string; email: string | null; session_key: string };
};

export const enqueueActionJob = async (sessionKey: string, email: string): Promise<EnqueueActionJobResponse> => {
  const base = getEduentryApiBase();
  const res = await fetchWithMappedNetworkError(
    `${base}/api/quiz/action-jobs/enqueue`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_key: sessionKey, email }),
    },
    base
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw buildError(res.status, json, "Action job could not be enqueued.");
  }
  return json as EnqueueActionJobResponse;
};
