import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Same order as aile-baglari/src/data/quiz-data.json kategoriler */
const CATEGORY_ORDER = [
  "duzen_ve_rutin",
  "sosyallik",
  "sebat_ve_azim",
  "duyusal_hassasiyet",
  "uyum_saglama",
  "duygusal_tepki",
  "bagimsizlik",
  "fiziksel_aktivite",
  "merak_ve_kesif",
  "odaklanma",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  duzen_ve_rutin: "Düzen ve Rutin",
  sosyallik: "Sosyallik",
  sebat_ve_azim: "Sebat ve Azim",
  duyusal_hassasiyet: "Duyusal Hassasiyet",
  uyum_saglama: "Uyum Sağlama",
  duygusal_tepki: "Duygusal Tepki",
  bagimsizlik: "Bağımsızlık",
  fiziksel_aktivite: "Fiziksel Aktivite",
  merak_ve_kesif: "Merak ve Keşif",
  odaklanma: "Odaklanma",
};

type InsightItem = { summary: string; actions: string[] };

type StoredInsights = {
  category_order: string[];
  insights: InsightItem[];
  generated_at: string;
};

function buildPayload(
  parentScores: Record<string, number>,
  childScores: Record<string, number>,
  childName: string | null,
  childAge: number | null,
  childGender: string | null,
) {
  const categories = CATEGORY_ORDER.map((key) => {
    const p = parentScores[key] ?? 3;
    const c = childScores[key] ?? 3;
    const diff = p - c;
    const absDiff = Math.abs(diff);
    const direction = absDiff === 0 ? "match" : diff > 0 ? "parentHigh" : "childHigh";
    return {
      key,
      label: CATEGORY_LABELS[key] ?? key,
      parentScore: p,
      childScore: c,
      direction,
    };
  });
  return {
    childName: childName ?? undefined,
    childAge: childAge ?? undefined,
    childGender: childGender === "girl" || childGender === "boy" ? childGender : undefined,
    categories,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const eduentryUrl = (Deno.env.get("EDUENTRY_API_URL") || "").replace(/\/$/, "");

    if (!supabaseUrl || !serviceRole) {
      console.error("[ERROR] ensure-action-plan missing SUPABASE_URL or SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!eduentryUrl) {
      console.error("[ERROR] ensure-action-plan EDUENTRY_API_URL not set");
      return new Response(JSON.stringify({ error: "EDUENTRY_API_URL not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const session_key = typeof body.session_key === "string" ? body.session_key.trim() : "";
    if (!session_key) {
      return new Response(JSON.stringify({ error: "session_key required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const { data: row, error: readErr } = await supabase
      .from("quiz_sessions")
      .select(
        "id, completed, parent_scores, child_scores, child_name, child_gender, child_age, action_insights, expires_at",
      )
      .eq("session_key", session_key)
      .maybeSingle();

    if (readErr || !row) {
      console.warn("[WARNING] ensure-action-plan session not found key=%s err=%s", session_key, readErr?.message);
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = row.expires_at ? new Date(row.expires_at as string) : null;
    if (expiresAt && expiresAt < new Date()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!row.completed) {
      console.info("[INFO] ensure-action-plan session not completed key=%s", session_key);
      return new Response(JSON.stringify({ error: "Quiz not completed yet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache read disabled intentionally: always regenerate action plan from LLM.
    console.info("[INFO] ensure-action-plan cache bypass key=%s", session_key);

    const parentScores = (row.parent_scores || {}) as Record<string, number>;
    const childScores = (row.child_scores || {}) as Record<string, number>;
    const llmBody = buildPayload(
      parentScores,
      childScores,
      row.child_name as string | null,
      row.child_age as number | null,
      row.child_gender as string | null,
    );

    console.info("[INFO] ensure-action-plan calling eduentry categories=%s", llmBody.categories.length);
    const apiRes = await fetch(`${eduentryUrl}/api/generate-action-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(llmBody),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("[ERROR] eduentry-api HTTP %s: %s", apiRes.status, errText.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Action plan generation failed", detail: errText.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiJson = (await apiRes.json()) as { insights?: InsightItem[] };
    const insights = Array.isArray(apiJson.insights) ? apiJson.insights : [];
    if (insights.length !== CATEGORY_ORDER.length) {
      console.error("[ERROR] unexpected insights length got=%s want=%s", insights.length, CATEGORY_ORDER.length);
      return new Response(JSON.stringify({ error: "Invalid insights from API" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stored: StoredInsights = {
      category_order: [...CATEGORY_ORDER],
      insights,
      generated_at: new Date().toISOString(),
    };

    const { error: updErr } = await supabase
      .from("quiz_sessions")
      .update({ action_insights: stored })
      .eq("id", row.id);

    if (updErr) {
      console.error("[ERROR] ensure-action-plan DB update failed: %s", updErr.message);
      return new Response(JSON.stringify({ error: "Failed to save action plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.info("[INFO] ensure-action-plan stored key=%s", session_key);
    return new Response(JSON.stringify({ cached: false, ...stored }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[ERROR] ensure-action-plan: %s", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
