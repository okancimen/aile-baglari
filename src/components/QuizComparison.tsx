import { motion } from "framer-motion";
import { RotateCcw, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface QuizComparisonProps {
  parentScores: Record<string, number>;
  childScores: Record<string, number>;
  onRestart: () => void;
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
  odaklanma: "Odaklanma",
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
  odaklanma: "🎯",
};

const categoryInsights: Record<string, { match: string; parentHigh: string; childHigh: string }> = {
  duzen_ve_rutin: {
    match: "Düzen ve rutin konusunda uyumlusunuz!",
    parentHigh: "Ebeveyn daha fazla düzen bekliyor, çocuk daha esnek bir yapıya sahip.",
    childHigh: "Çocuğunuz rutinlere doğal olarak yatkın, beklentileriniz gerçekçi.",
  },
  sosyallik: {
    match: "Sosyallik konusunda benzer bakış açılarınız var.",
    parentHigh: "Ebeveyn daha sosyal bir çocuk bekliyor; çocuğunuz daha sakin bir yapıda olabilir.",
    childHigh: "Çocuğunuz sosyal ortamları seviyor, bu enerjisini destekleyin!",
  },
  sebat_ve_azim: {
    match: "Sebat ve azim konusunda uyum içindesiniz.",
    parentHigh: "Ebeveyn daha fazla kararlılık bekliyor; çocuğunuzun motivasyonunu artırın.",
    childHigh: "Çocuğunuz azimli bir yapıya sahip, onu desteklemeye devam edin!",
  },
  duyusal_hassasiyet: {
    match: "Duyusal hassasiyet konusunda anlayış birliği var.",
    parentHigh: "Ebeveyn daha az hassasiyet bekliyor; çocuğunuzun duyusal ihtiyaçlarına dikkat edin.",
    childHigh: "Çocuğunuz duyusal uyaranlara karşı hassas, ortamı ona göre düzenleyin.",
  },
  uyum_saglama: {
    match: "Uyum sağlama konusunda paralel düşünüyorsunuz.",
    parentHigh: "Ebeveyn hızlı adaptasyon bekliyor; çocuğunuza geçiş süreleri tanıyın.",
    childHigh: "Çocuğunuz değişimlere kolay uyum sağlıyor, harika!",
  },
  duygusal_tepki: {
    match: "Duygusal tepkiler konusunda uyumlusunuz.",
    parentHigh: "Ebeveyn daha kontrollü tepkiler bekliyor; çocuğunuzun duygularını ifade etmesine alan tanıyın.",
    childHigh: "Çocuğunuz duygularını yoğun yaşıyor, bu normaldir ve desteklenmelidir.",
  },
  bagimsizlik: {
    match: "Bağımsızlık beklentileriniz örtüşüyor.",
    parentHigh: "Ebeveyn daha fazla bağımsızlık bekliyor; adım adım sorumluluk verin.",
    childHigh: "Çocuğunuz bağımsız olmak istiyor, ona güvenli alanlar yaratın.",
  },
  fiziksel_aktivite: {
    match: "Fiziksel aktivite konusunda aynı sayfadasınız.",
    parentHigh: "Ebeveyn daha aktif bir çocuk bekliyor; çocuğunuzun tercihlerine de kulak verin.",
    childHigh: "Çocuğunuz çok enerjik, fiziksel aktivite fırsatları sunun!",
  },
  merak_ve_kesif: {
    match: "Merak ve keşif konusunda uyum var.",
    parentHigh: "Ebeveyn daha meraklı bir çocuk bekliyor; çocuğunuzun ilgi alanlarını keşfedin.",
    childHigh: "Çocuğunuz çok meraklı, bu harika bir özellik - destekleyin!",
  },
  odaklanma: {
    match: "Odaklanma konusunda benzer beklentileriniz var.",
    parentHigh: "Ebeveyn daha uzun odaklanma bekliyor; yaşa uygun beklentiler belirleyin.",
    childHigh: "Çocuğunuz iyi odaklanabiliyor, onu zorlayan aktiviteler sunun.",
  },
};

const QuizComparison = ({ parentScores, childScores, onRestart }: QuizComparisonProps) => {
  const categories = Object.keys(categoryLabels);

  const totalDiff = categories.reduce((sum, cat) => {
    const p = parentScores[cat] || 3;
    const c = childScores[cat] || 3;
    return sum + Math.abs(p - c);
  }, 0);
  const avgDiff = totalDiff / categories.length;
  const compatibilityScore = Math.max(0, Math.round(100 - avgDiff * 20));

  const getCompatLabel = (score: number) => {
    if (score >= 80) return { text: "Mükemmel Uyum! 🌟", color: "hsl(150, 60%, 40%)" };
    if (score >= 60) return { text: "İyi Uyum 👍", color: "hsl(175, 45%, 45%)" };
    if (score >= 40) return { text: "Geliştirilmeli 💡", color: "hsl(45, 90%, 50%)" };
    return { text: "Dikkat Gerektiriyor ⚠️", color: "hsl(25, 95%, 55%)" };
  };

  const compat = getCompatLabel(compatibilityScore);

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
            Ebeveyn-Çocuk Uyum Analizi
          </h1>
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
            <span className="text-muted-foreground">Çocuk</span>
          </div>
        </div>

        {/* Category comparisons */}
        <div className="grid gap-4">
          {categories.map((cat, i) => {
            const p = parentScores[cat] || 3;
            const c = childScores[cat] || 3;
            const diff = p - c;
            const absDiff = Math.abs(diff);
            const insight = categoryInsights[cat];
            let insightText = insight?.match || "";
            if (absDiff >= 2) {
              insightText = diff > 0 ? (insight?.parentHigh || "") : (insight?.childHigh || "");
            } else if (absDiff === 1) {
              insightText = diff > 0 ? (insight?.parentHigh || "") : (insight?.childHigh || "");
            }

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card rounded-2xl p-5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{categoryEmojis[cat]}</span>
                  <span className="font-display font-bold text-card-foreground flex-1">
                    {categoryLabels[cat]}
                  </span>
                  {absDiff === 0 ? (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  ) : diff > 0 ? (
                    <TrendingUp className="w-5 h-5 text-primary" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-secondary" />
                  )}
                </div>

                {/* Parent bar */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-body w-16">Ebeveyn</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "var(--gradient-warm)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(p / 5) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                    />
                  </div>
                  <span className="text-xs font-bold font-display w-6 text-right text-card-foreground">{p}</span>
                </div>

                {/* Child bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground font-body w-16">Çocuk</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "var(--gradient-cool)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(c / 5) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06 + 0.1 }}
                    />
                  </div>
                  <span className="text-xs font-bold font-display w-6 text-right text-card-foreground">{c}</span>
                </div>

                {/* Diff indicator */}
                {absDiff >= 1 && (
                  <div
                    className="text-xs font-body px-3 py-2 rounded-lg"
                    style={{
                      background: absDiff >= 2 ? "hsl(25, 95%, 55%, 0.1)" : "hsl(45, 90%, 50%, 0.1)",
                      color: absDiff >= 2 ? "hsl(25, 70%, 40%)" : "hsl(45, 70%, 35%)",
                    }}
                  >
                    {insightText}
                  </div>
                )}
                {absDiff === 0 && (
                  <div
                    className="text-xs font-body px-3 py-2 rounded-lg"
                    style={{ background: "hsl(150, 60%, 40%, 0.1)", color: "hsl(150, 50%, 30%)" }}
                  >
                    {insight?.match}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Restart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-10"
        >
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-display font-bold text-primary-foreground transition-all hover:scale-105"
            style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-elevated)" }}
          >
            <RotateCcw className="w-5 h-5" />
            Tekrar Başla
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default QuizComparison;
