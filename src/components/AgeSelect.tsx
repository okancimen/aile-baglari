import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface AgeSelectProps {
  onSelect: (age: number, name: string, gender: "girl" | "boy") => void;
}

const ageGroupsByGender = {
  boy: [
    { range: "3-6", label: "3–6 yaş", emoji: "🧒", value: 5 },
    { range: "7-9", label: "7–9 yaş", emoji: "🦸‍♂️", value: 8 },
    { range: "10-13", label: "10–13 yaş", emoji: "🚀", value: 11 },
    { range: "13-18", label: "13–18 yaş", emoji: "🎮", value: 15 },
  ],
  girl: [
    { range: "3-6", label: "3–6 yaş", emoji: "👧", value: 5 },
    { range: "7-9", label: "7–9 yaş", emoji: "🦸‍♀️", value: 8 },
    { range: "10-13", label: "10–13 yaş", emoji: "🌟", value: 11 },
    { range: "13-18", label: "13–18 yaş", emoji: "🎯", value: 15 },
  ],
  default: [
    { range: "3-6", label: "3–6 yaş", emoji: "🐰", value: 5 },
    { range: "7-9", label: "7–9 yaş", emoji: "🦸", value: 8 },
    { range: "10-13", label: "10–13 yaş", emoji: "🚀", value: 11 },
    { range: "13-18", label: "13–18 yaş", emoji: "🎯", value: 15 },
  ],
};

const AgeSelect = ({ onSelect }: AgeSelectProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [childName, setChildName] = useState("");
  const [gender, setGender] = useState<"girl" | "boy" | null>(null);

  const isReady = selected !== null && childName.trim() && gender;
  const ageGroups = gender ? ageGroupsByGender[gender] : ageGroupsByGender.default;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--gradient-hero)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg mx-auto w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="text-6xl mb-6"
        >
          👶
        </motion.div>

        <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
          Çocuğunuz Hakkında Bilgiler
        </h2>
        <p className="text-muted-foreground font-body mb-10">
          Kişiselleştirilmiş deneyim için çocuğunuzun bilgilerini girin
        </p>

        {/* 1. Cinsiyet Seçimi */}
        <div className="mb-8">
          <p className="font-display font-bold text-lg text-foreground mb-4">Cinsiyet</p>
          <div className="flex justify-center gap-6">
            {([
              { value: "girl" as const, label: "Kız", emoji: "👧", bg: "hsl(340, 70%, 55%)" },
              { value: "boy" as const, label: "Erkek", emoji: "👦", bg: "hsl(210, 70%, 55%)" },
            ]).map((g) => {
              const isSelected = gender === g.value;
              return (
                <motion.button
                  key={g.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setGender(g.value);
                    setSelected(null);
                  }}
                  className={`relative flex flex-col items-center gap-3 p-6 rounded-3xl border-3 transition-all duration-300 ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                  style={{
                    boxShadow: isSelected
                      ? `0 8px 30px -8px ${g.bg}`
                      : "var(--shadow-card)",
                    minWidth: "130px",
                  }}
                >
                  <motion.span
                    className="text-6xl"
                    animate={isSelected ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : { scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    {g.emoji}
                  </motion.span>
                  <span className="font-display font-bold text-xl text-card-foreground">{g.label}</span>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm"
                        style={{ background: g.bg, color: "white" }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 2. İsim */}
        <div className="mb-8">
          <p className="font-display font-bold text-lg text-foreground mb-4">İsim</p>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Çocuğunuzun adı"
            className="w-full px-5 py-3 rounded-2xl border-2 border-border bg-card text-card-foreground font-body text-lg text-center focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* 3. Yaş Grubu */}
        <div className="mb-10">
          <p className="font-display font-bold text-lg text-foreground mb-4">Yaş Grubu</p>
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="wait">
              {ageGroups.map((group, i) => (
                <motion.button
                  key={`${gender}-${group.range}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelected(group.value)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ${
                    selected === group.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                  style={{
                    boxShadow:
                      selected === group.value
                        ? "var(--shadow-elevated)"
                        : "var(--shadow-card)",
                  }}
                >
                  <span className="text-3xl">{group.emoji}</span>
                  <span className="font-display font-bold text-base text-card-foreground">
                    {group.label}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => isReady && onSelect(selected, childName.trim(), gender)}
          disabled={!isReady}
          className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-display font-bold text-lg text-primary-foreground transition-all disabled:opacity-30"
          style={{
            background: isReady ? "var(--gradient-warm)" : undefined,
            boxShadow: isReady ? "var(--shadow-elevated)" : undefined,
          }}
        >
          Devam Et →
        </motion.button>
      </motion.div>
    </div>
  );
};

export default AgeSelect;
