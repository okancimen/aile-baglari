import { motion, AnimatePresence } from "framer-motion";

interface ChildQuizCharacterProps {
  age: number;
  category: string;
  questionIndex: number;
}

// Characters per age group and category
const characterMap: Record<string, Record<string, { emoji: string; name: string; color: string }>> = {
  young: {
    duzen_ve_rutin: { emoji: "🐻", name: "Düzenli Ayıcık", color: "hsl(30 70% 55%)" },
    sosyallik: { emoji: "🐶", name: "Arkadaş Köpek", color: "hsl(25 80% 55%)" },
    sebat_ve_azim: { emoji: "🐢", name: "Azimli Kaplumbağa", color: "hsl(140 50% 45%)" },
    duyusal_hassasiyet: { emoji: "🐱", name: "Hassas Kedicik", color: "hsl(280 50% 55%)" },
    uyum_saglama: { emoji: "🐙", name: "Esnek Ahtapot", color: "hsl(200 60% 50%)" },
    duygusal_tepki: { emoji: "🐰", name: "Duygusal Tavşan", color: "hsl(340 60% 55%)" },
    bagimsizlik: { emoji: "🦁", name: "Cesur Aslan", color: "hsl(40 80% 50%)" },
    fiziksel_aktivite: { emoji: "🐒", name: "Enerjik Maymun", color: "hsl(25 60% 45%)" },
    merak_ve_kesif: { emoji: "🦉", name: "Meraklı Baykuş", color: "hsl(220 50% 50%)" },
    odaklanma: { emoji: "🐝", name: "Odaklı Arıcık", color: "hsl(50 80% 50%)" },
  },
  mid: {
    duzen_ve_rutin: { emoji: "🦸‍♂️", name: "Kaptan Düzen", color: "hsl(220 70% 55%)" },
    sosyallik: { emoji: "🦸‍♀️", name: "Dostluk Kahramanı", color: "hsl(340 70% 55%)" },
    sebat_ve_azim: { emoji: "🏋️", name: "Güçlü Kahraman", color: "hsl(140 50% 45%)" },
    duyusal_hassasiyet: { emoji: "🧙", name: "Duygu Büyücüsü", color: "hsl(280 50% 55%)" },
    uyum_saglama: { emoji: "🦎", name: "Bukalemun", color: "hsl(160 60% 45%)" },
    duygusal_tepki: { emoji: "🎭", name: "Duygu Maskesi", color: "hsl(25 80% 55%)" },
    bagimsizlik: { emoji: "🦅", name: "Özgür Kartal", color: "hsl(200 50% 45%)" },
    fiziksel_aktivite: { emoji: "⚡", name: "Şimşek", color: "hsl(50 90% 50%)" },
    merak_ve_kesif: { emoji: "🔍", name: "Dedektif", color: "hsl(25 60% 50%)" },
    odaklanma: { emoji: "🎯", name: "Nişancı", color: "hsl(0 70% 50%)" },
  },
  older: {
    duzen_ve_rutin: { emoji: "🤖", name: "Robo Düzen", color: "hsl(200 60% 50%)" },
    sosyallik: { emoji: "🌐", name: "Sosyal Ağ", color: "hsl(220 70% 55%)" },
    sebat_ve_azim: { emoji: "🏔️", name: "Zirve Avcısı", color: "hsl(175 45% 45%)" },
    duyusal_hassasiyet: { emoji: "🎵", name: "Ses Uzmanı", color: "hsl(280 50% 55%)" },
    uyum_saglama: { emoji: "🌊", name: "Dalga Sörfçüsü", color: "hsl(200 60% 50%)" },
    duygusal_tepki: { emoji: "🎬", name: "Duygu Yönetmeni", color: "hsl(340 60% 55%)" },
    bagimsizlik: { emoji: "🚀", name: "Uzay Kaşifi", color: "hsl(260 60% 55%)" },
    fiziksel_aktivite: { emoji: "🏄", name: "Aksiyon Yıldızı", color: "hsl(25 80% 55%)" },
    merak_ve_kesif: { emoji: "🔬", name: "Bilim İnsanı", color: "hsl(175 50% 45%)" },
    odaklanma: { emoji: "🧩", name: "Puzzle Master", color: "hsl(40 70% 50%)" },
  },
};

function getAgeGroup(age: number): string {
  if (age <= 6) return "young";
  if (age <= 9) return "mid";
  return "older";
}

const bounceVariants = {
  initial: { scale: 0, rotate: -15 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 15 },
  },
  exit: { scale: 0, rotate: 15, transition: { duration: 0.2 } },
};

const floatAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 2.5,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

const ChildQuizCharacter = ({ age, category, questionIndex }: ChildQuizCharacterProps) => {
  const group = getAgeGroup(age);
  const charData = characterMap[group]?.[category] || {
    emoji: "⭐",
    name: "Yıldız",
    color: "hsl(50 80% 50%)",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${category}-${questionIndex}`}
        className="flex flex-col items-center gap-1 mb-4"
        variants={bounceVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Character bubble */}
        <motion.div
          animate={floatAnimation}
          className="relative"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{
              background: `linear-gradient(135deg, ${charData.color}, ${charData.color.replace(/\d+%\)$/, (m) => `${Math.min(parseInt(m) + 15, 95)}%)`)}`,
              boxShadow: `0 8px 24px -4px ${charData.color.replace(")", " / 0.35)")}`,
            }}
          >
            {charData.emoji}
          </div>

          {/* Sparkle effects */}
          <motion.div
            className="absolute -top-1 -right-1 text-sm"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute -bottom-1 -left-1 text-xs"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            ⭐
          </motion.div>
        </motion.div>

        {/* Character name */}
        <motion.span
          className="text-xs font-display font-bold text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {charData.name}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChildQuizCharacter;
