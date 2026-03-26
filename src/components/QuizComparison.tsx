import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Lightbulb, Loader2, Mail, MessageSquareWarning } from "lucide-react";
import RadarChart3D from "./RadarChart3D";
import { enqueueActionJob } from "@/lib/quiz-session";

interface QuizComparisonProps {
  parentScores: Record<string, number>;
  childScores: Record<string, number>;
  onRestart: () => void;
  /** quiz_sessions.session_key — eduentry-api POST /api/quiz/action-jobs/enqueue */
  sessionKey: string;
  childName?: string;
  childGender?: "girl" | "boy";
  childAge?: number;
}

const categoryLabels: Record<string, string> = {
  duzen_ve_rutin: "Düzen ve Rutin",
  sosyallik: "Sosyallik",
  sebat_ve_azim: "Sebat ve Azim",
  duyusal_hassasiyet: "Duyusal Hassasiyet",
  uyum_saglama: "Uyum Sağlama",
  duygusal_tepki: "Duygusal Tepki",
  bagimsizlik: "Bağımsızlık",
  fiziksel_aktivite: "Fiziksel Aktivite",
  merak_ve_kesif: "Merak ve Keşif",
  odaklanma: "Odaklanma"
};

const categoryEmojis: Record<string, string> = {
  duzen_ve_rutin: "📋",
  sosyallik: "🤝",
  sebat_ve_azim: "💪",
  duyusal_hassasiyet: "🎵",
  uyum_saglama: "🔄",
  duygusal_tepki: "💖",
  bagimsizlik: "🦋",
  fiziksel_aktivite: "🏃",
  merak_ve_kesif: "🔍",
  odaklanma: "🎯"
};

const MAX_CATEGORY_DIFF = 4;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const ENQUEUE_DONE_KEY_PREFIX = "action-job-enqueued";

function calculateCompatibilityScore(
  categories: string[],
  parentScores: Record<string, number>,
  childScores: Record<string, number>
) {
  if (categories.length === 0) {
    return 100;
  }

  // RMS penalizes large mismatches more than a simple average absolute gap.
  // This makes the overall score more sensitive to strong divergence.
  const squaredGapSum = categories.reduce((sum, cat) => {
    const p = parentScores[cat] ?? 3;
    const c = childScores[cat] ?? 3;
    const normalizedDiff = Math.abs(p - c) / MAX_CATEGORY_DIFF;
    return sum + normalizedDiff ** 2;
  }, 0);

  const rmsGap = Math.sqrt(squaredGapSum / categories.length);
  const rawScore = Math.round(100 * (1 - rmsGap));

  return Math.max(0, Math.min(100, rawScore));
}

const QuizComparison = ({
  parentScores,
  childScores,
  onRestart,
  sessionKey,
  childName,
  childGender,
  childAge,
}: QuizComparisonProps) => {
  const genderEmoji = childGender === "girl" ? "👧" : "👦";
  const displayName = childName || "Çocuk";
  const categories = useMemo(() => Object.keys(categoryLabels), []);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [enqueuePending, setEnqueuePending] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobAccepted, setJobAccepted] = useState(false);
  const compatibilityScore = calculateCompatibilityScore(
    categories,
    parentScores,
    childScores
  );

  const getCompatLabel = (score: number) => {
    if (score >= 80) return { text: "Mükemmel Uyum! 🌟", color: "hsl(150, 60%, 40%)" };
    if (score >= 60) return { text: "İyi Uyum 👍", color: "hsl(175, 45%, 45%)" };
    if (score >= 40) return { text: "Geliştirilmeli 💡", color: "hsl(45, 90%, 50%)" };
    return { text: "Dikkat Gerektiriyor ⚠️", color: "hsl(25, 95%, 55%)" };
  };

  const compat = getCompatLabel(compatibilityScore);

  const sortedByDiff = [...categories].sort((a, b) => {
    const diffA = Math.abs((parentScores[a] || 3) - (childScores[a] || 3));
    const diffB = Math.abs((parentScores[b] || 3) - (childScores[b] || 3));
    return diffB - diffA;
  });

  useEffect(() => {
    if (!sessionKey?.trim()) {
      setJobError("Oturum anahtarı eksik olduğu için iş kuyruğa alınamadı.");
      return;
    }
    try {
      const key = sessionKey.trim();
      const done = window.sessionStorage.getItem(`${ENQUEUE_DONE_KEY_PREFIX}:${key}`) === "1";
      if (done) {
        setJobAccepted(true);
      }
    } catch {
      /* ignore storage failures */
    }
  }, [sessionKey]);

  const emailError = emailTouched && !EMAIL_RE.test(email.trim()) ? "Geçerli bir e-posta adresi girin." : "";

  const handleEnqueue = async () => {
    if (enqueuePending || jobAccepted) {
      return;
    }
    const key = sessionKey?.trim();
    const normalizedEmail = email.trim().toLowerCase();
    setEmailTouched(true);
    if (!key) {
      setJobError("Oturum anahtarı eksik.");
      return;
    }
    if (!EMAIL_RE.test(normalizedEmail)) {
      setJobError("Geçerli bir e-posta adresi girin.");
      return;
    }
    setJobError(null);
    setEnqueuePending(true);
    setJobAccepted(false);
    try {
      const res = await enqueueActionJob(key, normalizedEmail);
      setJobAccepted(true);
      try {
        window.sessionStorage.setItem(`${ENQUEUE_DONE_KEY_PREFIX}:${key}`, "1");
      } catch {
        /* ignore storage failures */
      }
      console.info("[INFO] action-job enqueue done", res);
    } catch (e) {
      setJobAccepted(false);
      const msg = e instanceof Error ? e.message : "Aksiyon planı işi kuyruğa alınamadı.";
      setJobError(msg);
      console.error("[ERROR] action-job enqueue:", e);
    } finally {
      setEnqueuePending(false);
    }
  };

  if (!sessionKey?.trim()) {
    return (
      <div className="min-h-screen px-4 py-12 flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-md text-center bg-card rounded-2xl p-8 shadow-lg">
          <MessageSquareWarning className="w-10 h-10 mx-auto mb-3 text-destructive" />
          <p className="font-display font-bold text-foreground mb-2">Oturum anahtarı eksik</p>
          <p className="text-sm text-muted-foreground font-body">Aksiyon planı işi başlatılamadı. Lütfen testi yeniden tamamlayın.</p>
          <button
            type="button"
            onClick={onRestart}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-primary-foreground"
            style={{ background: "var(--gradient-warm)" }}>
            <RotateCcw className="w-5 h-5" />
            Başa dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          
          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
            {genderEmoji} {displayName} — Ebeveyn Uyum Analizi
          </h1>
          <p className="text-muted-foreground font-body text-sm mb-3">{displayName} için kişiselleştirilmiş sonuçlar</p>
          <div className="inline-block rounded-2xl px-6 py-3 mb-2" style={{ background: compat.color }}>
            <span className="font-display font-black text-2xl" style={{ color: "white" }}>
              %{compatibilityScore}
            </span>
          </div>
          <p className="font-display font-bold text-lg" style={{ color: compat.color }}>
            {compat.text}
          </p>
        </motion.div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-6 text-sm font-body">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: "var(--gradient-warm)" }} />
            <span className="text-muted-foreground">Ebeveyn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: "var(--gradient-cool)" }} />
            <span className="text-muted-foreground">{displayName}</span>
          </div>
        </div>

        {/* 3D Spider/Radar Chart */}
        <div
          className="bg-card rounded-2xl p-4 md:p-6 mb-8 overflow-hidden"
          style={{ boxShadow: "var(--shadow-elevated)" }}>
          
          <RadarChart3D
            data={categories.map((cat) => ({
              label: categoryLabels[cat],
              parent: parentScores[cat] || 3,
              child: childScores[cat] || 3
            }))} />
          
        </div>

        {/* Job CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-5 mb-8 text-center border-2 border-dashed border-primary/30"
          style={{ boxShadow: "var(--shadow-card)" }}>
          
          <Mail className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="font-display font-bold text-card-foreground mb-1">
            Aksiyonlar E-posta ile İletilecek
          </p>
          <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
            E-posta adresinizi girin. Aksiyon planını bu adrese hazırlayıp birazdan ileteceğiz.
          </p>
          {!jobAccepted ? (
            <div className="max-w-md mx-auto text-left">
              <label htmlFor="action-email" className="block text-xs font-body text-muted-foreground mb-2">
                E-posta adresiniz
              </label>
              <input
                id="action-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="ornek@domain.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-body outline-none focus:ring-2 focus:ring-primary"
                disabled={enqueuePending || jobAccepted}
              />
              {emailError ? (
                <p className="mt-2 text-xs text-destructive font-body">{emailError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleEnqueue}
                disabled={enqueuePending || jobAccepted}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-primary-foreground transition-all disabled:opacity-60"
                style={{ background: "var(--gradient-cool)" }}
              >
                {enqueuePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Aksiyon planını mail adresime gönder
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 font-body">
              Talebiniz alındı. Aksiyon planınız e-posta adresinize iletilecek.
            </div>
          )}
        </motion.div>

        {/* ACTION PLAN SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12">
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-warm)" }}>
              <Lightbulb className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-black text-foreground">
              Ebeveyn Aksiyon Planı
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Sonuçlarınıza göre en çok dikkat gerektiren alanlar aşağıdadır.
          </p>

          {enqueuePending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-body mb-4 rounded-xl border border-border bg-card p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Aksiyon planı işi sıraya alınıyor…
            </div>
          )}
          {jobAccepted && !enqueuePending && (
            <div className="flex items-start gap-2 text-sm text-emerald-700 font-body mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
              <Mail className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Aksiyonlarınız hazırlanıyor, birazdan e-posta olarak iletilecektir.</span>
            </div>
          )}
          {jobError && !enqueuePending && (
            <div className="flex items-start gap-2 text-sm text-destructive font-body mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <MessageSquareWarning className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Aksiyon planı işleme alınamadı: {jobError}</span>
            </div>
          )}

          <div className="grid gap-5">
            {sortedByDiff.slice(0, 3).map((cat, i) => {
              const p = parentScores[cat] || 3;
              const c = childScores[cat] || 3;
              const diff = p - c;
              const absDiff = Math.abs(diff);
              const urgency = absDiff >= 2 ? "Öncelikli" : absDiff === 1 ? "İyileştirilebilir" : "Uyumlu";
              const urgencyColor = absDiff >= 2 ? "hsl(25, 95%, 55%)" : absDiff === 1 ? "hsl(45, 90%, 50%)" : "hsl(150, 60%, 40%)";
              const directionText =
                diff > 0
                  ? "Ebeveyn beklentisi çocuk skorundan daha yüksek."
                  : diff < 0
                    ? "Çocuk eğilimi ebeveyn beklentisinden daha yüksek."
                    : "Ebeveyn ve çocuk skorları uyumlu.";
              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.08 }}
                  className="bg-card rounded-2xl p-5"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{categoryEmojis[cat]}</span>
                    <span className="font-display font-bold text-card-foreground flex-1">{categoryLabels[cat]}</span>
                    <span className="text-xs font-body font-semibold px-2 py-1 rounded-full" style={{ background: urgencyColor, color: "white" }}>
                      {urgency}
                    </span>
                  </div>
                  <p className="text-sm font-body text-muted-foreground leading-relaxed">
                    Ebeveyn: {p}/5 - {displayName}: {c}/5. {directionText}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Closing note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-10 bg-card rounded-2xl p-6 text-center"
          style={{ boxShadow: "var(--shadow-card)" }}>
          
          <MessageSquareWarning className="w-8 h-8 mx-auto mb-3 text-primary" />
          <p className="font-display font-bold text-card-foreground mb-2">Unutmayın!</p>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            Her çocuk benzersizdir. Bu sonuçlar beklentilerinizi ve çocuğunuzun doğal eğilimlerini
            anlamanıza yardımcı olmak içindir. Küçük adımlarla büyük değişimler yaratabilirsiniz.
            Çocuğunuzla birlikte bu yolculuğun keyfini çıkarın! 💛
          </p>
        </motion.div>

        {/* Restart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-center mt-10">
          
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-display font-bold text-primary-foreground transition-all hover:scale-105"
            style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-elevated)" }}>
            
            <RotateCcw className="w-5 h-5" />
            Tekrar Başla
          </button>
        </motion.div>
      </div>
    </div>);

};

export default QuizComparison;