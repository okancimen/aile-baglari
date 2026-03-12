import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, CheckCircle, PartyPopper, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ChildCompleteProps {
  childName: string;
  childGender: "girl" | "boy";
  parentScores: Record<string, number>;
  childScores: Record<string, number>;
  childAge?: number;
  /** If email already exists (Flow 1), auto-send and hide form */
  existingEmail?: string;
  /** Session ID if already saved */
  sessionId?: string;
}

const confettiEmojis = ["🎉", "🌟", "🎊", "✨", "🏆", "💫", "🎈", "🥳"];

const ChildComplete = ({
  childName,
  childGender,
  parentScores,
  childScores,
  childAge,
  existingEmail,
  sessionId,
}: ChildCompleteProps) => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(!!existingEmail);
  const displayName = childName || "Çocuk";
  const genderEmoji = childGender === "girl" ? "👧" : "👦";

  const sendResultsEmail = async (targetEmail: string, sessKey: string) => {
    const resultsUrl = `${window.location.origin}/?continue=${sessKey}`;
    await supabase.functions.invoke("send-action-plan", {
      body: {
        to: targetEmail,
        subject: `EduBot - ${displayName} Test Sonuçları Hazır!`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="text-align: center; color: #333;">🎉 ${displayName} Testi Tamamladı!</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Merhaba! ${displayName} çocuk testini başarıyla tamamladı. Ebeveyn-çocuk uyum analizinizi ve kişiselleştirilmiş aksiyon planınızı görmek için aşağıdaki bağlantıya tıklayın.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resultsUrl}" style="background: linear-gradient(135deg, #2b9a8f, #3b82c4); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                Sonuçları Gör
              </a>
            </div>
            <p style="color: #888; font-size: 13px; text-align: center;">
              Bu bağlantı sizin test oturumunuza özeldir.
            </p>
          </div>
        `,
      },
    });
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setSending(true);
    try {
      // Save session to DB (Flow 2)
      const { data: session, error: dbError } = await supabase
        .from("quiz_sessions")
        .insert({
          parent_scores: parentScores,
          child_scores: childScores,
          child_name: childName,
          child_gender: childGender,
          email: email,
          completed: true,
        })
        .select("session_key")
        .single();

      if (dbError || !session) {
        throw new Error(dbError?.message || "Oturum kaydedilemedi");
      }

      await sendResultsEmail(email, session.session_key);
      setSent(true);
      toast.success("Sonuç bağlantısı e-postanıza gönderildi!");
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
      {/* Confetti animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {confettiEmojis.map((emoji, i) => (
          <motion.div
            key={i}
            initial={{ y: -50, x: `${10 + i * 12}%`, opacity: 0, scale: 0 }}
            animate={{
              y: ["0%", "110%"],
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.8],
              rotate: [0, 360],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 4 + Math.random() * 3,
            }}
            className="absolute text-3xl"
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 150 }}
        className="text-center max-w-lg mx-auto relative z-10"
      >
        {/* Trophy / celebration icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: "var(--gradient-warm)" }}
        >
          <PartyPopper className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="font-display text-3xl md:text-4xl font-black text-foreground mb-3"
        >
          Harika {displayName}! {genderEmoji}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-muted-foreground font-body text-lg mb-2">
            Testi başarıyla tamamladın! 🎉
          </p>
          <p className="text-muted-foreground font-body mb-8">
            Süpersin! Tüm soruları cevapladın.
          </p>
        </motion.div>

        {/* Stars animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-center gap-2 mb-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2 + i * 0.15, type: "spring", stiffness: 300 }}
            >
              <Star className="w-8 h-8 text-primary fill-primary" />
            </motion.div>
          ))}
        </motion.div>

        {/* Parent email section - only for Flow 2 (no existing email) */}
        {!existingEmail && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mt-8 pt-6 border-t border-border"
          >
            {!sent ? (
              <div className="bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <p className="font-display font-bold text-card-foreground text-sm">
                    Ebeveyn: Sonuçlarınızı e-posta ile alın
                  </p>
                </div>
                <p className="text-xs text-muted-foreground font-body mb-3">
                  Detaylı uyum analizi ve kişiselleştirilmiş aksiyon planınız e-posta adresinize gönderilecek.
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
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-primary-foreground transition-all disabled:opacity-60"
                  style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-card)" }}
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  {sending ? "Gönderiliyor..." : "Sonuçları Gönder"}
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-5 text-center border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                <CheckCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
                <p className="font-display font-bold text-card-foreground mb-1">
                  Sonuçlar Gönderildi! 📬
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Detaylı uyum analizi ve aksiyon planı <strong>{email}</strong> adresine gönderildi.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Flow 1: Already sent confirmation */}
        {existingEmail && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mt-8 pt-6 border-t border-border"
          >
            <div className="bg-card rounded-2xl p-5 text-center border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
              <CheckCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="font-display font-bold text-card-foreground mb-1">
                Sonuçlar Gönderildi! 📬
              </p>
              <p className="text-xs text-muted-foreground font-body">
                Detaylı uyum analizi <strong>{existingEmail}</strong> adresine gönderildi. Ebeveyn e-postayı kontrol edebilir.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ChildComplete;
