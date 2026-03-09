import { motion } from "framer-motion";
import { useState } from "react";

interface AgeSelectProps {
  onSelect: (age: number, name: string) => void;
}

const ageGroups = [
  { range: "3-6", label: "3–6 yaş", emoji: "🐰", value: 5 },
  { range: "7-9", label: "7–9 yaş", emoji: "🦸", value: 8 },
  { range: "10-13", label: "10–13 yaş", emoji: "🚀", value: 11 },
  { range: "13-18", label: "13–18 yaş", emoji: "🎯", value: 15 },
];

const AgeSelect = ({ onSelect }: AgeSelectProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [childName, setChildName] = useState("");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--gradient-hero)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg mx-auto"
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
          Çocuğunuz Kaç Yaşında?
        </h2>
        <p className="text-muted-foreground font-body mb-8">
          Yaşa uygun deneyim için çocuğunuzun yaş grubunu seçin
        </p>

        <div className="mb-6">
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Çocuğunuzun adı"
            className="w-full px-5 py-3 rounded-2xl border-2 border-border bg-card text-card-foreground font-body text-lg text-center focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {ageGroups.map((group, i) => (
            <motion.button
              key={group.range}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(group.value)}
              className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all duration-200 ${
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
              <span className="text-4xl">{group.emoji}</span>
              <span className="font-display font-bold text-lg text-card-foreground">
                {group.label}
              </span>
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => selected !== null && onSelect(selected)}
          disabled={selected === null}
          className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-display font-bold text-lg text-primary-foreground transition-all disabled:opacity-30"
          style={{
            background: selected !== null ? "var(--gradient-warm)" : undefined,
            boxShadow:
              selected !== null ? "var(--shadow-elevated)" : undefined,
          }}
        >
          Devam Et →
        </motion.button>
      </motion.div>
    </div>
  );
};

export default AgeSelect;
