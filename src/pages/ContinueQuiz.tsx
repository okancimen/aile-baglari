import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { completeQuizSessionByKey, getQuizSessionByKey } from "@/lib/quiz-session";
import QuizQuestion from "@/components/QuizQuestion";
import QuizComparison from "@/components/QuizComparison";
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
  const sessionKey = searchParams.get("continue")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentScores, setParentScores] = useState<Record<string, number>>({});
  const [childName, setChildName] = useState<string>("");
  const [childGender, setChildGender] = useState<"girl" | "boy">("boy");
  const [childAge, setChildAge] = useState<number | undefined>(undefined);

  const [phase, setPhase] = useState<"loading" | "child-quiz" | "results">("loading");
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
      try {
        const row = await getQuizSessionByKey(sessionKey);
        if (row.completed) {
          setParentScores(row.parent_scores || {});
          setChildScores(row.child_scores || {});
          setChildName(row.child_name || "");
          setChildGender(row.child_gender || "boy");
          setChildAge(row.child_age ?? undefined);
          setPhase("results");
          setLoading(false);
          return;
        }

        setParentScores(row.parent_scores || {});
        setChildName(row.child_name || "");
        setChildGender(row.child_gender || "boy");
        setChildAge(row.child_age ?? undefined);
        const fromDb = row.child_questions;
        const cats = quizData.kategoriler as string[];
        const useDb =
          Array.isArray(fromDb) &&
          fromDb.length >= cats.length &&
          fromDb.every((q) => q && typeof q === "object" && "kategori" in q && "soru" in q);
        const childQuestions = useDb
          ? (fromDb as Question[])
          : pickRandomPerCategory(quizData.cocuk_testi as Question[], cats);
        if (!useDb) {
          console.warn("[WARNING] ContinueQuiz: child_questions missing or short; static pool");
        }
        setQuestions(childQuestions);
        setPhase("child-quiz");
        setLoading(false);
      } catch (e) {
        console.error("[ERROR] getQuizSessionByKey:", e);
        setError("Oturum bulunamadı. Bağlantının süresi dolmuş olabilir.");
        setLoading(false);
      }
    };

    void loadSession();
  }, [sessionKey]);

  const selectAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  };

  const next = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const scores: Record<string, number> = {};
      questions.forEach((q, i) => {
        if (answers[i] !== undefined) {
          scores[q.kategori] = answers[i];
        }
      });
      setChildScores(scores);

      try {
        await completeQuizSessionByKey(sessionKey, scores);
        setPhase("results");
      } catch (e) {
        console.error("[ERROR] completeQuizSessionByKey:", e);
        setError("Sonuçlar kaydedilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
      }
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

  if (phase === "results") {
    return (
      <QuizComparison
        parentScores={parentScores}
        childScores={childScores}
        onRestart={restart}
        sessionKey={sessionKey}
        childName={childName}
        childGender={childGender}
        childAge={childAge}
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
