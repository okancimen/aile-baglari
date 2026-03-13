import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Baby, CheckCircle, Mail, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createQuizSession } from "@/lib/quiz-session";

interface ParentDoneProps {
  onStartChildQuiz: () => void;
  parentScores: Record<string, number>;
  childName: string;
  childGender: "girl" | "boy";
}

const ParentDone = ({
  onStartChildQuiz,
  parentScores,
  childName,
  childGender,
}: ParentDoneProps) => {
  const [showEmailOption, setShowEmailOption] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendLink = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setSending(true);
    try {
      const session = await createQuizSession({
        p_parent_scores: parentScores,
        p_email: email,
        p_child_name: childName,
        p_child_gender: childGender,
        p_completed: false,
      });

      const continueUrl = `${window.location.origin}/?continue=${session.session_key}`;

      // Send email with the link
      const { error: fnError } = await supabase.functions.invoke("send-action-plan", {
        body: {
          to: email,
          subject: "EduBot - Çocuk Testi Devam Bağlantısı",
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="text-align: center; color: #333;">🧩 EduBot Çocuk Testi</h1>
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Merhaba! Ebeveyn testini başarıyla tamamladınız. Çocuğunuz hazır olduğunda aşağıdaki bağlantıya tıklayarak çocuk testine devam edebilirsiniz.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${continueUrl}" style="background: linear-gradient(135deg, #2b9a8f, #3b82c4); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                  Çocuk Testini Başlat
                </a>
              </div>
              <p style="color: #888; font-size: 13px; text-align: center;">
                Bu bağlantı sizin test oturumunuza özeldir. Çocuğunuzla birlikte kullanabilirsiniz.
              </p>
              <p style="color: #888; font-size: 13px; text-align: center;">
                Devam anahtarınız: <strong>${session.session_key}</strong>
              </p>
            </div>
          `,
        },
      });

      if (fnError) throw fnError;

      setSent(true);
      toast.success("Devam bağlantısı e-postanıza gönderildi!");
    } catch (err: any) {
      console.error(err);
      toast.error("E-posta gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--gradient-hero)" }}
    >
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
        <p className="text-muted-foreground font-body mb-6">
          Harika! Yanıtlarınız kaydedildi.
        </p>

        {/* Option 1: Start child quiz now */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStartChildQuiz}
          className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-display font-bold text-lg text-secondary-foreground transition-all mb-4"
          style={{ background: "var(--gradient-cool)", boxShadow: "var(--shadow-elevated)" }}
        >
          <Baby className="w-6 h-6" />
          Çocuğum Yanımda — Şimdi Başlat
        </motion.button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4 max-w-sm mx-auto">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground font-body text-sm">veya</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Option 2: Send link via email */}
        <AnimatePresence mode="wait">
          {!showEmailOption && !sent && (
            <motion.button
              key="show-email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowEmailOption(true)}
              className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-display font-bold text-base text-card-foreground bg-card border-2 border-dashed border-primary/30 transition-all"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <Link2 className="w-5 h-5 text-primary" />
              Çocuğum Yanımda Değil — Daha Sonra Devam Et
            </motion.button>
          )}

          {showEmailOption && !sent && (
            <motion.div
              key="email-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-sm mx-auto bg-card rounded-2xl p-5 border border-border"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-primary" />
                <p className="font-display font-bold text-card-foreground text-sm">
                  E-posta ile devam bağlantısı gönderin
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-body mb-3">
                Çocuğunuz hazır olduğunda, e-postadaki bağlantı ile çocuk testine devam edebilirsiniz.
              </p>
              <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-body mb-3 outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={sending}
              />
              <button
                onClick={handleSendLink}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-primary-foreground transition-all disabled:opacity-60"
                style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-card)" }}
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {sending ? "Gönderiliyor..." : "Bağlantıyı Gönder"}
              </button>
            </motion.div>
          )}

          {sent && (
            <motion.div
              key="sent-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm mx-auto bg-card rounded-2xl p-5 text-center border border-border"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <CheckCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="font-display font-bold text-card-foreground mb-1">
                Bağlantı Gönderildi! 📬
              </p>
              <p className="text-xs text-muted-foreground font-body">
                <strong>{email}</strong> adresine devam bağlantısı gönderildi. Çocuğunuz hazır olduğunda e-postadaki bağlantıya tıklayarak teste devam edebilirsiniz.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ParentDone;
