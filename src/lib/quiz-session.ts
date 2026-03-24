import { getEduentryApiBase } from "@/lib/eduentry-api";

type CreateQuizSessionPayload = {
  p_parent_scores: Record<string, number>;
  p_email?: string | null;
  p_child_name?: string | null;
  p_child_gender?: string | null;
  p_child_scores?: Record<string, number> | null;
  p_completed?: boolean;
  p_child_age?: number | null;
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
  action_insights: {
    category_order: string[];
    insights: { summary: string; actions: string[] }[];
    generated_at: string;
  } | null;
};

function buildError(status: number, json: unknown, fallback: string): Error {
  const detail =
    typeof json === "object" && json !== null && "detail" in json
      ? String((json as { detail?: unknown }).detail ?? fallback)
      : fallback;
  return new Error(`${detail} (HTTP ${status})`);
}

export const createQuizSession = async (payload: CreateQuizSessionPayload): Promise<{ id: string; session_key: string; email: string | null }> => {
  const base = getEduentryApiBase();
  const res = await fetch(`${base}/api/quiz/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw buildError(res.status, json, "Quiz session could not be created.");
  }
  return json as { id: string; session_key: string; email: string | null };
};

export const getQuizSessionByKey = async (sessionKey: string): Promise<QuizSessionRow> => {
  const base = getEduentryApiBase();
  const res = await fetch(`${base}/api/quiz/sessions/${encodeURIComponent(sessionKey)}`);
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
  const res = await fetch(`${base}/api/quiz/sessions/${encodeURIComponent(sessionKey)}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_child_scores: childScores }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw buildError(res.status, json, "Quiz session could not be completed.");
  }
  return json as { id: string; email: string | null; session_key: string };
};
