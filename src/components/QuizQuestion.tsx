import { motion, AnimatePresence } from "framer-motion";

interface QuizQuestionProps {
  question: string;
  questionIndex: number;
  totalQuestions: number;
  category: string;
  selectedValue: number | null;
  onSelect: (value: number) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  roleLabel: string;
  characterSlot?: React.ReactNode;
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

const likertLabels = [
  "Hiç katılmıyorum",
  "Katılmıyorum",
  "Kararsızım",
  "Katılıyorum",
  "Kesinlikle katılıyorum",
];

const QuizQuestion = ({
  question,
  questionIndex,
  totalQuestions,
  category,
  selectedValue,
  onSelect,
  onNext,
  onPrev,
  isFirst,
  isLast,
  roleLabel,
  characterSlot,
}: QuizQuestionProps) => {
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-xl mx-auto">
        {/* Role label */}
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-display font-bold text-primary-foreground" style={{ background: "var(--gradient-warm)" }}>
            {roleLabel}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2 font-body">
            <span>{categoryLabels[category] || category}</span>
            <span>{questionIndex + 1} / {totalQuestions}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--gradient-warm)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-3xl p-8 md:p-10"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            <p className="font-display font-bold text-xl md:text-2xl text-card-foreground mb-8 leading-relaxed">
              {question}
            </p>

            {/* Likert scale */}
            <div className="flex justify-between items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => onSelect(value)}
                  className={`quiz-option-likert ${selectedValue === value ? "selected" : ""}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground font-body">
              <span>{likertLabels[0]}</span>
              <span>{likertLabels[4]}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 gap-4">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="px-6 py-3 rounded-xl font-display font-bold text-muted-foreground bg-muted disabled:opacity-30 transition-all hover:scale-105"
          >
            ← Geri
          </button>
          <button
            onClick={onNext}
            disabled={selectedValue === null}
            className="px-6 py-3 rounded-xl font-display font-bold text-primary-foreground disabled:opacity-30 transition-all hover:scale-105"
            style={{ background: selectedValue !== null ? "var(--gradient-warm)" : undefined, opacity: selectedValue === null ? 0.3 : 1 }}
          >
            {isLast ? "Sonuçları Gör →" : "İleri →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestion;
