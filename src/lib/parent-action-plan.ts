import { getEduentryApiBase } from "@/lib/eduentry-api";

export type ParentIntent = "will_try" | "skip_for_now";

export interface ParentPlanActionRow {
  index: number;
  text: string;
  intent: ParentIntent | null;
  note: string | null;
}

export interface ParentPlanCategory {
  action_plan_item_id: string;
  category_key: string;
  label: string;
  summary: string;
  item_order: number;
  actions: ParentPlanActionRow[];
}

export interface ParentActionPlanResponse {
  child_name: string | null;
  categories: ParentPlanCategory[];
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token.trim()}` };
}

export async function fetchParentActionPlan(token: string): Promise<ParentActionPlanResponse> {
  const base = getEduentryApiBase();
  const res = await fetch(`${base}/api/parent/action-plan`, { headers: authHeaders(token) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof json === "object" && json !== null && "detail" in json ? String((json as { detail?: unknown }).detail) : res.statusText;
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return json as ParentActionPlanResponse;
}

export async function patchParentActionFeedback(
  token: string,
  body: { action_plan_item_id: string; action_index: number; intent: ParentIntent; note?: string | null },
): Promise<void> {
  const base = getEduentryApiBase();
  const res = await fetch(`${base}/api/parent/action-plan/feedback`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      action_plan_item_id: body.action_plan_item_id,
      action_index: body.action_index,
      intent: body.intent,
      note: body.note ?? null,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof json === "object" && json !== null && "detail" in json ? String((json as { detail?: unknown }).detail) : res.statusText;
    throw new Error(detail || `HTTP ${res.status}`);
  }
}
