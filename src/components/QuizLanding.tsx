import { motion } from "framer-motion";
import { Baby, Heart, Users } from "lucide-react";

interface QuizLandingProps {
  onStart: (role: "parent" | "child") => void;
}

const QuizLanding = ({ onStart }: QuizLandingProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-2xl mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{ background: "var(--gradient-warm)" }}
        >
          <Heart className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight">
          Çocuğunuzu Ne Kadar{" "}
          <span className="text-primary">İyi Tanıyorsunuz?</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-4 font-body">
          Ücretsiz ankete katılın, farklılıklarınızı görün
        </p>
        <p className="text-sm text-muted-foreground mb-12 max-w-md mx-auto">
          Kapsamlı Ebeveyn-Çocuk Uyum Analizi ile beklentileriniz ve çocuğunuzun
          gerçek yapısı arasındaki farkları keşfedin.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart("parent")}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-display font-bold text-lg text-primary-foreground transition-all"
            style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-elevated)" }}
          >
            <Users className="w-6 h-6" />
            Ebeveyn Olarak Başla
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onStart("child")}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-display font-bold text-lg text-secondary-foreground transition-all"
            style={{ background: "var(--gradient-cool)", boxShadow: "var(--shadow-elevated)" }}
          >
            <Baby className="w-6 h-6" />
            Çocuk Olarak Başla
          </motion.button>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          10 kategoride 10 rastgele soru • Yaklaşık 3 dakika
        </p>
      </motion.div>
    </div>
  );
};

export default QuizLanding;
