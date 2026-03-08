import { motion } from "framer-motion";
import { Baby, Heart, Users } from "lucide-react";

interface QuizLandingProps {
  onStart: () => void;
}

const QuizLanding = ({ onStart }: QuizLandingProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-2xl mx-auto">
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{ background: "var(--gradient-warm)" }}>
          
          <Heart className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        <h1 className="font-display text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight">
          Çocuğunuzu Ne Kadar{" "}
          <span className="text-primary">İyi Tanıyorsunuz?</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-4 font-body">Ankete katılın, farklılıklarınızı görün

        </p>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          Kapsamlı Ebeveyn-Çocuk Uyum Analizi ile beklentileriniz ve çocuğunuzun
          gerçek yapısı arasındaki farkları keşfedin.
        </p>

        <div className="bg-card rounded-2xl p-6 mb-8 max-w-md mx-auto text-left" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="font-display font-bold text-card-foreground mb-3">Nasıl Çalışır?</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-primary-foreground font-display font-bold text-sm" style={{ background: "var(--gradient-warm)" }}>1</div>
              <div>
                <p className="font-body text-sm text-card-foreground"><Users className="inline w-4 h-4 mr-1" />Önce <strong>ebeveyn</strong> 10 soruyu yanıtlar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-secondary-foreground font-display font-bold text-sm" style={{ background: "var(--gradient-cool)" }}>2</div>
              <div>
                <p className="font-body text-sm text-card-foreground"><Baby className="inline w-4 h-4 mr-1" />Sonra <strong>çocuk</strong> 10 soruyu yanıtlar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-accent text-accent-foreground font-display font-bold text-sm">3</div>
              <div>
                <p className="font-body text-sm text-card-foreground">🎯 Sonuçlar karşılaştırılır, tavsiyeler gösterilir</p>
              </div>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-display font-bold text-lg text-primary-foreground transition-all"
          style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-elevated)" }}>
          
          Ankete Başla
        </motion.button>

        <p className="text-xs text-muted-foreground mt-6">
          Toplam 20 soru (10 ebeveyn + 10 çocuk) • Yaklaşık 5 dakika
        </p>
      </motion.div>
    </div>);

};

export default QuizLanding;