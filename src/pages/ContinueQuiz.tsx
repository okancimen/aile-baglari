import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QuizQuestion from "@/components/QuizQuestion";
import QuizComparison from "@/components/QuizComparison";
import ChildComplete from "@/components/ChildComplete";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import quizData from "@/data/quiz-data.json";

interface Question {
  id: string;
  kategori: string;
  soru: string;
}

function pickRandomPerCategory(questions: Question[], categories: string[]): Question[] {
  const selected: Question[] = [];
  for (const cat of categories) {
    const catQuestions = questions.filter((q) => q.kategori === cat);
    if (catQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * catQuestions.length);
      selected.push(catQuestions[randomIndex]);
    }
  }
  return selected;
}

const ContinueQuiz = () => {
  const [searchParams] = useSearchParams();
  const sessionKey = searchParams.get("continue");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentScores, setParentScores] = useState<Record<string, number>>({});
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionEmail, setSessionEmail] = useState<string>("");
  const [childName, setChildName] = useState<string>("");
  const [childGender, setChildGender] = useState<"girl" | "boy">("boy");

  // Child quiz state
  const [phase, setPhase] = useState<"loading" | "child-quiz" | "child-done" | "results">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [childScores, setChildScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!sessionKey) {
      setError("Geçersiz bağlantı. Lütfen e-postanızdaki bağlantıyı kullanın.");
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      const { data, error: dbError } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("session_key", sessionKey)
        .single();

      if (dbError || !data) {
        setError("Oturum bulunamadı. Bağlantının süresi dolmuş olabilir.");
        setLoading(false);
        return;
      }

      if (data.completed) {
        setParentScores(data.parent_scores as Record<string, number>);
        setChildScores(data.child_scores as Record<string, number>);
        setChildName((data as any).child_name || "");
        setChildGender(((data as any).child_gender as "girl" | "boy") || "boy");
        setPhase("results");
        setLoading(false);
        return;
      }

      setParentScores(data.parent_scores as Record<string, number>);
      setSessionId(data.id);
      setSessionEmail(data.email || "");
      setChildName((data as any).child_name || "");
      setChildGender(((data as any).child_gender as "girl" | "boy") || "boy");
      const childQuestions = pickRandomPerCategory(
        quizData.cocuk_testi as Question[],
        quizData.kategoriler
      );
      setQuestions(childQuestions);
      setPhase("child-quiz");
      setLoading(false);
    };

    loadSession();
  }, [sessionKey]);

  const selectAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  };

  const sendResultsEmail = async (targetEmail: string, sessKey: string, name: string) => {
    const resultsUrl = `${window.location.origin}/?continue=${sessKey}`;
    await supabase.functions.invoke("send-action-plan", {
      body: {
        to: targetEmail,
        subject: `EduBot - ${name || "Çocuk"} Test Sonuçları Hazır!`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="text-align: center; color: #333;">🎉 ${name || "Çocuğunuz"} Testi Tamamladı!</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              ${name || "Çocuğunuz"} çocuk testini başarıyla tamamladı. Ebeveyn-çocuk uyum analizinizi ve kişiselleştirilmiş aksiyon planınızı görmek için aşağıdaki bağlantıya tıklayın.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resultsUrl}" style="background: linear-gradient(135deg, #2b9a8f, #3b82c4); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                Sonuçları Gör
              </a>
            </div>
          </div>
        `,
      },
    });
  };

  const next = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Finished child quiz
      const scores: Record<string, number> = {};
      questions.forEach((q, i) => {
        if (answers[i] !== undefined) {
          scores[q.kategori] = answers[i];
        }
      });
      setChildScores(scores);

      // Save to DB
      if (sessionId) {
        await supabase
          .from("quiz_sessions")
          .update({ child_scores: scores, completed: true })
          .eq("id", sessionId);
      }

      // Send results email automatically (Flow 1)
      if (sessionEmail && sessionKey) {
        try {
          await sendResultsEmail(sessionEmail, sessionKey, childName);
        } catch (err) {
          console.error("Failed to send results email:", err);
        }
      }

      setPhase("child-done");
    }
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const restart = () => {
    window.location.href = "/";
  };

  if (loading || phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="font-display font-bold text-foreground">Oturum yükleniyor...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-hero)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Bir Sorun Oluştu</h2>
          <p className="text-muted-foreground font-body mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-2xl font-display font-bold text-primary-foreground"
            style={{ background: "var(--gradient-warm)" }}
          >
            Ana Sayfaya Dön
          </a>
        </motion.div>
      </div>
    );
  }

  if (phase === "child-done") {
    return (
      <ChildComplete
        childName={childName}
        childGender={childGender}
        parentScores={parentScores}
        childScores={childScores}
        existingEmail={sessionEmail || undefined}
        sessionId={sessionId}
      />
    );
  }

  if (phase === "results") {
    return (
      <QuizComparison
        parentScores={parentScores}
        childScores={childScores}
        onRestart={restart}
        childName={childName}
        childGender={childGender}
      />
    );
  }

  if (phase === "child-quiz" && questions[currentIndex]) {
    return (
      <QuizQuestion
        question={questions[currentIndex].soru}
        questionIndex={currentIndex}
        totalQuestions={questions.length}
        category={questions[currentIndex].kategori}
        selectedValue={answers[currentIndex] ?? null}
        onSelect={selectAnswer}
        onNext={next}
        onPrev={prev}
        isFirst={currentIndex === 0}
        isLast={currentIndex === questions.length - 1}
        roleLabel="Çocuk Testi"
      />
    );
  }

  return null;
};

export default ContinueQuiz;
