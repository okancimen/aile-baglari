import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchParentActionPlan,
  patchParentActionFeedback,
  type ParentIntent,
  type ParentPlanCategory,
} from "@/lib/parent-action-plan";

const DEBOUNCE_MS = 550;

const ACCENT_BAR = ["hsl(25 95% 55%)", "hsl(175 45% 45%)"] as const;

function rowKey(itemId: string, index: number) {
  return `${itemId}:${index}`;
}

const ParentActionPlan = () => {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("t") || "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childName, setChildName] = useState<string | null>(null);
  const [categories, setCategories] = useState<ParentPlanCategory[]>([]);

  /** Local draft: intent + note per micro-action */
  const [draft, setDraft] = useState<Record<string, { intent: ParentIntent | null; note: string }>>({});

  const debouncers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    return () => {
      Object.values(debouncers.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Bağlantıda oturum bilgisi yok. E-postadaki bağlantıyı kullanın.");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchParentActionPlan(token);
        if (cancelled) return;
        setChildName(data.child_name);
        setCategories(data.categories);
        const initial: Record<string, { intent: ParentIntent | null; note: string }> = {};
        for (const cat of data.categories) {
          for (const a of cat.actions) {
            initial[rowKey(cat.action_plan_item_id, a.index)] = {
              intent: a.intent,
              note: a.note ?? "",
            };
          }
        }
        setDraft(initial);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (/401|Invalid|expired|Token/i.test(msg)) {
          setError("Bağlantının süresi dolmuş veya geçersiz. Güncel e-postadaki bağlantıyı kullanın.");
        } else if (/410|expired/i.test(msg)) {
          setError("Bu test oturumunun süresi dolmuş.");
        } else {
          setError(msg || "Plan yüklenemedi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const flushNote = useCallback(
    (itemId: string, actionIndex: number, intent: ParentIntent, note: string) => {
      const t = tokenRef.current;
      if (!t) return;
      patchParentActionFeedback(t, {
        action_plan_item_id: itemId,
        action_index: actionIndex,
        intent,
        note: note.trim() || null,
      }).catch((e) => {
        console.error("[ERROR] parent-action feedback save:", e);
      });
    },
    [],
  );

  const scheduleNoteSave = useCallback(
    (itemId: string, actionIndex: number, intent: ParentIntent, note: string) => {
      const k = rowKey(itemId, actionIndex);
      const prev = debouncers.current[k];
      if (prev) clearTimeout(prev);
      debouncers.current[k] = setTimeout(() => {
        flushNote(itemId, actionIndex, intent, note);
        delete debouncers.current[k];
      }, DEBOUNCE_MS);
    },
    [flushNote],
  );

  const onSelectIntent = (itemId: string, actionIndex: number, intent: ParentIntent) => {
    const k = rowKey(itemId, actionIndex);
    let noteToSend = "";
    setDraft((d) => {
      const cur = d[k] ?? { intent: null, note: "" };
      noteToSend = cur.note ?? "";
      return { ...d, [k]: { ...cur, intent } };
    });
    const t = tokenRef.current;
    if (!t) return;
    patchParentActionFeedback(t, {
      action_plan_item_id: itemId,
      action_index: actionIndex,
      intent,
      note: noteToSend.trim() || null,
    }).catch((e) => console.error("[ERROR] parent-action intent save:", e));
  };

  const onNoteChange = (itemId: string, actionIndex: number, note: string) => {
    const k = rowKey(itemId, actionIndex);
    let intentForSchedule: ParentIntent | null = null;
    setDraft((d) => {
      const cur = d[k] ?? { intent: null, note: "" };
      intentForSchedule = cur.intent;
      return { ...d, [k]: { ...cur, note } };
    });
    if (intentForSchedule === "will_try" || intentForSchedule === "skip_for_now") {
      scheduleNoteSave(itemId, actionIndex, intentForSchedule, note);
    }
  };

  const displayChild = childName?.trim() || "Çocuğunuz";

  if (!token && !loading) {
    return (
      <div className="min-h-screen px-4 py-16" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-lg mx-auto bg-card rounded-3xl border border-border shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Bağlantı eksik</h1>
          <p className="text-sm text-muted-foreground font-body">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4" style={{ background: "var(--gradient-hero)" }}>
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-display font-bold text-foreground">Plan yükleniyor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-16" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-lg mx-auto bg-card rounded-3xl border border-border shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Plan açılamadı</h1>
          <p className="text-sm text-muted-foreground font-body">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-xl mx-auto px-4 pt-10 pb-6">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl shadow-md"
            style={{ background: "var(--gradient-warm)" }}
            aria-hidden
          >
            <span className="text-primary-foreground">✓</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
            Ebeveyn <span style={{ background: "var(--gradient-warm)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Aksiyon Planı</span>
          </h1>
          <p className="text-sm text-muted-foreground font-body max-w-md mx-auto leading-relaxed">
            {displayChild} için öneriler. Her satırda niyetinizi işaretleyin; kısa notlar otomatik kaydedilir.
          </p>
        </div>

        <div className="space-y-10">
          {categories.map((cat, catIdx) => (
            <section key={cat.action_plan_item_id}>
              <h2 className="font-display font-bold text-lg text-foreground mb-2">{cat.label}</h2>
              {cat.summary ? (
                <p className="text-sm text-muted-foreground font-body mb-4 leading-relaxed">{cat.summary}</p>
              ) : null}

              <div className="space-y-5">
                {cat.actions.map((action, aIdx) => {
                  const k = rowKey(cat.action_plan_item_id, action.index);
                  const local = draft[k] ?? { intent: action.intent, note: action.note ?? "" };
                  const selected = local.intent;
                  const bar = ACCENT_BAR[(catIdx + aIdx) % 2];

                  return (
                    <div
                      key={k}
                      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <div className="pl-4 pr-4 pt-4 pb-3 border-l-4" style={{ borderLeftColor: bar }}>
                        <p className="text-[15px] sm:text-base text-foreground font-body leading-relaxed whitespace-pre-wrap">{action.text}</p>
                      </div>
                      <div className="px-4 pb-4 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Button
                            type="button"
                            size="sm"
                            variant={selected === "will_try" ? "default" : "outline"}
                            className={
                              selected === "will_try"
                                ? "rounded-full font-display font-bold border-0 text-primary-foreground"
                                : "rounded-full font-display font-semibold"
                            }
                            style={selected === "will_try" ? { background: "var(--gradient-warm)" } : undefined}
                            onClick={() => onSelectIntent(cat.action_plan_item_id, action.index, "will_try")}
                          >
                            {selected === "will_try" ? <Check className="w-4 h-4" /> : null}
                            Deneyeceğiz
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={selected === "skip_for_now" ? "default" : "outline"}
                            className={
                              selected === "skip_for_now"
                                ? "rounded-full font-display font-bold border-0 text-secondary-foreground"
                                : "rounded-full font-display font-semibold"
                            }
                            style={selected === "skip_for_now" ? { background: "var(--gradient-cool)" } : undefined}
                            onClick={() => onSelectIntent(cat.action_plan_item_id, action.index, "skip_for_now")}
                          >
                            {selected === "skip_for_now" ? <Check className="w-4 h-4" /> : null}
                            Şimdilik atlayalım
                          </Button>
                        </div>

                        {selected === "will_try" || selected === "skip_for_now" ? (
                          <Textarea
                            placeholder="İsterseniz kısaca not düşün (otomatik kaydedilir)"
                            value={local.note}
                            onChange={(e) => onNoteChange(cat.action_plan_item_id, action.index, e.target.value)}
                            onBlur={() => {
                              if (selected === "will_try" || selected === "skip_for_now") {
                                flushNote(cat.action_plan_item_id, action.index, selected, local.note);
                              }
                            }}
                            className="rounded-xl min-h-[88px] font-body text-sm resize-y"
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground font-body mt-10 max-w-sm mx-auto leading-relaxed">
          Geri bildiriminiz otomatik kaydedilir; ayrıca bir kaydet düğmesi yoktur.
        </p>
      </div>
    </div>
  );
};

export default ParentActionPlan;
