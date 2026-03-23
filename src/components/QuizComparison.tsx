// 3D Radar Chart version
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, TrendingUp, TrendingDown, Minus, Lightbulb, Mail, X, Loader2, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import RadarChart3D from "./RadarChart3D";
import { supabase } from "@/integrations/supabase/client";

interface QuizComparisonProps {
  parentScores: Record<string, number>;
  childScores: Record<string, number>;
  onRestart: () => void;
  /** quiz_sessions.session_key — Edge Function ile tek seferlik LLM + DB */
  sessionKey: string;
  childName?: string;
  childGender?: "girl" | "boy";
  childAge?: number;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const categories = Object.keys(categoryLabels);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [generatedInsights, setGeneratedInsights] = useState<Record<string, { summary: string; actions: string[] }> | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(false);
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

  // Find top 3 categories with biggest difference for action plan
  const sortedByDiff = [...categories].sort((a, b) => {
    const diffA = Math.abs((parentScores[a] || 3) - (childScores[a] || 3));
    const diffB = Math.abs((parentScores[b] || 3) - (childScores[b] || 3));
    return diffB - diffA;
  });

  useEffect(() => {
    const key = sessionKey?.trim();
    if (!key) {
      setInsightsError(true);
      return;
    }
    let cancelled = false;
    setInsightsLoading(true);
    setInsightsError(false);
    void (async () => {
      const { data, error } = await supabase.functions.invoke<{
        category_order?: string[];
        insights?: { summary: string; actions: string[] }[];
        cached?: boolean;
      }>("ensure-action-plan", { body: { session_key: key } });
      if (cancelled) return;
      if (error) {
        console.error("[ERROR] ensure-action-plan invoke:", error);
        setInsightsError(true);
        setInsightsLoading(false);
        return;
      }
      const order = data?.category_order;
      const insights = data?.insights;
      if (!order?.length || !insights?.length || order.length !== insights.length) {
        setInsightsError(true);
        setInsightsLoading(false);
        return;
      }
      const next: Record<string, { summary: string; actions: string[] }> = {};
      order.forEach((cat, i) => {
        const item = insights[i];
        if (item && typeof item.summary === "string" && Array.isArray(item.actions)) {
          next[cat] = { summary: item.summary, actions: item.actions.slice(0, 2) };
        }
      });
      if (Object.keys(next).length !== order.length) {
        setInsightsError(true);
        setInsightsLoading(false);
        return;
      }
      setGeneratedInsights(next);
      setInsightsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

  const insightsReady =
    !insightsLoading &&
    !insightsError &&
    generatedInsights !== null &&
    categories.every((c) => Boolean(generatedInsights![c]));

  if (!sessionKey?.trim()) {
    return (
      <div className="min-h-screen px-4 py-12 flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-md text-center bg-card rounded-2xl p-8 shadow-lg">
          <MessageSquareWarning className="w-10 h-10 mx-auto mb-3 text-destructive" />
          <p className="font-display font-bold text-foreground mb-2">Oturum anahtarı eksik</p>
          <p className="text-sm text-muted-foreground font-body">Aksiyon planı yüklenemiyor. Lütfen testi yeniden tamamlayın.</p>
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

        {/* Email CTA - Detaylı sonuçlar için */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-5 mb-8 text-center border-2 border-dashed border-primary/30"
          style={{ boxShadow: "var(--shadow-card)" }}>
          
          <Mail className="w-8 h-8 mx-auto mb-2 text-primary" />
          <p className="font-display font-bold text-card-foreground mb-1">
            Detaylı Sonuçlarınızı Görmek İster Misiniz?
          </p>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            Tüm kategorilerdeki puanlarınız, karşılaştırmalar ve size özel tüm öneriler e-posta adresinize gönderilsin.
            Aşağıdaki aksiyon planı bir özettir; detayları e-posta ile alabilirsiniz.
          </p>
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
            Sonuçlarınıza göre en çok dikkat gerektiren alanlar ve size özel öneriler:
          </p>

          {insightsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-body mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Önerileriniz hazırlanıyor…
            </div>
          )}
          {insightsError && !insightsLoading && (
            <div className="flex items-start gap-2 text-sm text-destructive font-body mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <MessageSquareWarning className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Aksiyon planı yüklenemedi. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</span>
            </div>
          )}

          <div className="relative">
            <div className="grid gap-5">
              {sortedByDiff.slice(0, 3).map((cat, i) => {
                const p = parentScores[cat] || 3;
                const c = childScores[cat] || 3;
                const diff = p - c;
                const absDiff = Math.abs(diff);
                const generated = generatedInsights?.[cat];
                const summary = generated?.summary ?? "";
                const displayActions = generated?.actions ?? [];

                const urgency = absDiff >= 2 ? "Öncelikli" : absDiff === 1 ? "İyileştirilebilir" : "Uyumlu";
                const urgencyColor = absDiff >= 2 ? "hsl(25, 95%, 55%)" : absDiff === 1 ? "hsl(45, 90%, 50%)" : "hsl(150, 60%, 40%)";

                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.08 }}
                    className="bg-card rounded-2xl p-5"
                    style={{ boxShadow: "var(--shadow-card)" }}>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xl">{categoryEmojis[cat]}</span>
                      <span className="font-display font-bold text-card-foreground flex-1">
                        {categoryLabels[cat]}
                      </span>
                      <span
                        className="text-xs font-body font-semibold px-2 py-1 rounded-full"
                        style={{ background: urgencyColor, color: "white" }}>
                        
                        {urgency}
                      </span>
                    </div>

                    {/* Açıklayıcı paragraf */}
                    <p className="text-sm font-body text-muted-foreground mb-4 leading-relaxed">
                      {summary}
                    </p>

                    <ul className="space-y-2">
                      {displayActions.map((action, j) =>
                      <li key={j} className="flex items-start gap-2 text-sm font-body text-card-foreground">
                          <span className="text-primary mt-0.5 shrink-0">✦</span>
                          <span>{action}</span>
                        </li>
                      )}
                    </ul>
                  </motion.div>);

              })}
            </div>

            {/* Blur overlay after first card */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                top: "18%",
                background: "linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.7) 25%, hsl(var(--background) / 0.95) 55%, hsl(var(--background)) 80%)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)"
              }} />
            

            {/* CTA over blur */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-4 pt-16 z-10">
              <p className="font-display font-bold text-foreground text-sm mb-3 text-center">
                Tüm önerileri görmek için e-posta ile alın 👇
              </p>
              <button
                type="button"
                disabled={!insightsReady}
                onClick={() => insightsReady && setShowEmailModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-display font-bold text-primary-foreground transition-all hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
                style={{ background: "var(--gradient-cool)", boxShadow: "var(--shadow-elevated)" }}>
                
                <Mail className="w-5 h-5" />
                Aksiyon Planını E-posta ile Gönder
              </button>
            </div>
          </div>

          {/* Email Modal */}
          <AnimatePresence>
            {showEmailModal &&
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => !sending && setShowEmailModal(false)}>
              
                <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-2xl p-6 w-full max-w-md"
                style={{ boxShadow: "var(--shadow-elevated)" }}
                onClick={(e) => e.stopPropagation()}>
                
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg text-card-foreground">
                      Aksiyon Planını Gönder
                    </h3>
                    <button onClick={() => !sending && setShowEmailModal(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    Aksiyon planınız girdiğiniz e-posta adresine gönderilecektir.
                  </p>
                  <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-body mb-4 outline-none focus:ring-2 focus:ring-primary"
                  disabled={sending} />
                
                  <button
                  onClick={async () => {
                    if (!email || !email.includes('@')) {
                      toast.error('Lütfen geçerli bir e-posta adresi girin.');
                      return;
                    }
                    setSending(true);
                    try {
                      if (!insightsReady || !generatedInsights) {
                        toast.error("Aksiyon planı henüz hazır değil.");
                        return;
                      }
                      const top3 = sortedByDiff.slice(0, 3);
                      const gi = generatedInsights;
                      let htmlBody = `
                          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h1 style="text-align: center; color: #333;">Ebeveyn-Çocuk Uyum Analizi</h1>
                            <div style="text-align: center; background: ${compat.color}; color: white; padding: 15px; border-radius: 12px; margin: 16px 0;">
                              <span style="font-size: 28px; font-weight: bold;">%${compatibilityScore}</span>
                              <br/>${escHtml(compat.text)}
                            </div>

                            <div style="background: #e8f5e9; border-radius: 12px; padding: 16px; margin: 18px 0 24px;">
                              <h3 style="color: #2e7d32; margin-top: 0;">🔄 Düzenli Takip Önemlidir!</h3>
                              <p style="color: #444; font-size: 14px; line-height: 1.6; margin: 0;">
                                Çocuğunuzun gelişimi dinamik bir süreçtir ve zaman içinde değişim gösterebilir. Aksiyon planınızı uyguladıkça,
                                hem sizin beklentileriniz hem de çocuğunuzun tepkileri farklılaşabilir. Bu nedenle, <strong>her 2-4 haftada bir bu testi
                                tekrar yapmanızı</strong> öneriyoruz. Düzenli takip, gelişimi somut olarak gözlemlemenize ve yeni odak noktaları belirlemenize
                                yardımcı olur.
                              </p>
                            </div>

                            <h2 style="color: #333;">Tüm Kategoriler - Özet (LLM)</h2>`;

                      categories.forEach((cat) => {
                        const p = parentScores[cat] || 3;
                        const c = childScores[cat] || 3;
                        const diff = p - c;
                        const absDiff = Math.abs(diff);
                        const row = gi[cat];
                        const insightText = row?.summary ? escHtml(row.summary) : "";

                        const urgency = absDiff >= 2 ? "Öncelikli" : absDiff === 1 ? "İyileştirilebilir" : "Uyumlu";
                        const urgencyColor = absDiff >= 2 ? "#e86830" : absDiff === 1 ? "#d4a017" : "#3d9970";

                        htmlBody += `
                            <div style="background: #f9f9f9; border-radius: 12px; padding: 16px; margin: 12px 0;">
                              <div style="margin-bottom: 8px;">
                                <span style="font-size: 20px;">${categoryEmojis[cat]}</span>
                                <strong>${escHtml(categoryLabels[cat])}</strong>
                                <span style="background: ${urgencyColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px;">${urgency}</span>
                              </div>
                              <div style="font-size: 13px; color: #666; margin-bottom: 6px;">Ebeveyn: ${p}/5 | Çocuk: ${c}/5</div>
                              <div style="font-size: 13px; color: #555; font-style: italic;">${insightText}</div>
                            </div>`;
                      });

                      htmlBody += `<h2 style="color: #333; margin-top: 24px;">🎯 Öncelikli Aksiyon Planı (İlk 3 Alan)</h2>`;
                      top3.forEach((cat) => {
                        const p = parentScores[cat] || 3;
                        const c = childScores[cat] || 3;
                        const diff = p - c;
                        const absDiff = Math.abs(diff);
                        const actions = (gi[cat]?.actions ?? []).slice(0, 2).map((a) => escHtml(a));
                        const urgencyColor = absDiff >= 2 ? "#e86830" : absDiff === 1 ? "#d4a017" : "#3d9970";

                        htmlBody += `
                            <div style="background: #fff3e0; border-left: 4px solid ${urgencyColor}; border-radius: 8px; padding: 14px; margin: 10px 0;">
                              <strong>${categoryEmojis[cat]} ${escHtml(categoryLabels[cat])}</strong>
                              <p style="font-size: 13px; color: #555; margin: 8px 0 4px; font-style: italic;">${escHtml(gi[cat]?.summary ?? "")}</p>
                              <ul style="margin: 8px 0 0; padding-left: 20px;">
                                ${actions.map((a) => `<li style="margin-bottom: 4px; font-size: 14px;">${a}</li>`).join("")}
                              </ul>
                            </div>`;
                      });


                      htmlBody += `
                            <div style="text-align: center; margin-top: 24px; padding: 16px; background: #f0f7ff; border-radius: 12px;">
                              <p style="color: #555; font-size: 14px;">Her çocuk benzersizdir. Küçük adımlarla büyük değişimler yaratabilirsiniz! 💛</p>
                            </div>
                            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 16px;">EduBot - Ebeveyn-Çocuk Uyum Analizi</p>
                          </div>`;

                      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
                      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/send-action-plan`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          to: email,
                          subject: `Ebeveyn Aksiyon Planı - Uyum Puanı %${compatibilityScore}`,
                          htmlBody
                        })
                      });

                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Gönderim başarısız');

                      toast.success('Aksiyon planı e-posta adresinize gönderildi!');
                      setShowEmailModal(false);
                      setEmail('');
                    } catch (err: any) {
                      console.error('Email send error:', err);
                      toast.error('E-posta gönderilemedi: ' + (err.message || 'Bilinmeyen hata'));
                    } finally {
                      setSending(false);
                    }
                  }}
                  disabled={sending || !insightsReady}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-primary-foreground transition-all disabled:opacity-60"
                  style={{ background: "var(--gradient-cool)" }}>
                  
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                    {sending ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </motion.div>
              </motion.div>
            }
          </AnimatePresence>
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