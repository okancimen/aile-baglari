import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface QuizResultsProps {
  answers: Record<string, number>;
  role: "parent" | "child";
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

const getLevel = (score: number): { label: string; color: string } => {
  if (score <= 2) return { label: "Düşük", color: "hsl(175, 45%, 45%)" };
  if (score <= 3) return { label: "Orta", color: "hsl(45, 90%, 50%)" };
  if (score <= 4) return { label: "Yüksek", color: "hsl(25, 95%, 55%)" };
  return { label: "Çok Yüksek", color: "hsl(340, 75%, 55%)" };
};

const QuizResults = ({ answers, role, onRestart }: QuizResultsProps) => {
  const categories = Object.keys(categoryLabels);
  const avgScore = categories.length > 0
    ? categories.reduce((sum, cat) => sum + (answers[cat] || 3), 0) / categories.length
    : 3;

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-2">
            {role === "parent" ? "Ebeveyn" : "Çocuk"} Profil Sonuçları
          </h1>
          <p className="text-muted-foreground font-body">
            Ortalama Puan: <span className="font-bold text-primary">{avgScore.toFixed(1)} / 5</span>
          </p>
        </motion.div>

        <div className="grid gap-4">
          {categories.map((cat, i) => {
            const score = answers[cat] || 3;
            const level = getLevel(score);
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card rounded-2xl p-5 flex items-center gap-4"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <span className="text-3xl">{categoryEmojis[cat]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display font-bold text-card-foreground text-sm">
                      {categoryLabels[cat]}
                    </span>
                    <span className="text-xs font-body font-semibold px-2 py-1 rounded-full" style={{ background: level.color, color: "white" }}>
                      {level.label}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: level.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(score / 5) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.06 + 0.2 }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block font-body">{score} / 5</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-10"
        >
          <p className="text-sm text-muted-foreground mb-6 font-body">
            💡 Her iki testi de tamamlayarak ebeveyn-çocuk uyum analizi yapabilirsiniz.
          </p>
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

export default QuizResults;
