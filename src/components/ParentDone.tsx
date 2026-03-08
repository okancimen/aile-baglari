import { motion } from "framer-motion";
import { Baby, CheckCircle } from "lucide-react";

interface ParentDoneProps {
  onStartChildQuiz: () => void;
}

const ParentDone = ({ onStartChildQuiz }: ParentDoneProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: "var(--gradient-warm)" }}
        >
          <CheckCircle className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        <h2 className="font-display text-3xl font-black text-foreground mb-3">
          Ebeveyn Testi Tamamlandı! ✅
        </h2>
        <p className="text-muted-foreground font-body mb-2">
          Harika! Yanıtlarınız kaydedildi.
        </p>
        <p className="text-muted-foreground font-body mb-8">
          Şimdi cihazı <strong>çocuğunuza</strong> verin. Çocuğunuz kendi sorularını yanıtlayacak.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStartChildQuiz}
          className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-display font-bold text-lg text-secondary-foreground transition-all"
          style={{ background: "var(--gradient-cool)", boxShadow: "var(--shadow-elevated)" }}
        >
          <Baby className="w-6 h-6" />
          Çocuk Testini Başlat
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ParentDone;
