import { useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import QuizLanding from "@/components/QuizLanding";
import QuizQuestion from "@/components/QuizQuestion";
import QuizComparison from "@/components/QuizComparison";
import ParentDone from "@/components/ParentDone";
import ContinueQuiz from "@/pages/ContinueQuiz";
import AgeSelect from "@/components/AgeSelect";
import ChildQuizCharacter from "@/components/ChildQuizCharacter";
import { useQuiz } from "@/hooks/useQuiz";

const Index = () => {
  const [searchParams] = useSearchParams();
  const continueKey = searchParams.get("continue");
  const quiz = useQuiz();

  /* Soğuk giriş: e-posta / yer imi ile ?continue= — tamamlanan akışta URL'ye eklenen continue ile karışmasın */
  if (continueKey?.trim() && quiz.phase === "landing") {
    return <ContinueQuiz />;
  }

  if (quiz.phase === "landing") {
    return <QuizLanding onStart={quiz.startAgeSelect} />;
  }

  if (quiz.phase === "age-select") {
    return <AgeSelect onSelect={quiz.selectAge} />;
  }

  if (quiz.phase === "parent-done") {
    return (
      <ParentDone
        onStartChildQuiz={quiz.startChildQuiz}
        parentScores={quiz.parentScores}
        childName={quiz.childName}
        childGender={quiz.childGender}
        childAge={quiz.childAge}
      />
    );
  }

  if (quiz.phase === "persisting-results") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4" style={{ background: "var(--gradient-hero)" }}>
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-display font-bold text-foreground text-center">Sonuçlarınız kaydediliyor…</p>
      </div>
    );
  }

  if (quiz.phase === "results" && quiz.persistError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-md text-center bg-card rounded-2xl p-8 shadow-lg border border-border">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Sonuçlar kaydedilemedi</h2>
          <p className="text-sm text-muted-foreground font-body mb-6">{quiz.persistError}</p>
          <p className="text-xs text-muted-foreground font-body mb-6">
            Ağ bağlantınızı kontrol edin. Üretimde <code className="rounded bg-muted px-1">VITE_EDUENTRY_API_URL</code> build sırasında tanımlı olmalı;
            tarayıcı konsolu ve ağ sekmesinde <code className="rounded bg-muted px-1">POST …/api/quiz/sessions</code> yanıtını doğrulayın.
          </p>
          <button
            type="button"
            onClick={quiz.restart}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-display font-bold text-primary-foreground w-full"
            style={{ background: "var(--gradient-warm)" }}
          >
            Başa dön
          </button>
        </div>
      </div>
    );
  }

  if (quiz.phase === "results") {
    const sessionKey = quiz.sessionKey?.trim() || searchParams.get("continue")?.trim() || "";
    return (
      <QuizComparison
        parentScores={quiz.parentScores}
        childScores={quiz.childScores}
        onRestart={quiz.restart}
        sessionKey={sessionKey}
        childName={quiz.childName}
        childGender={quiz.childGender}
        childAge={quiz.childAge}
      />
    );
  }

  if ((quiz.phase === "parent-quiz" || quiz.phase === "child-quiz") && quiz.currentQuestion) {
    const isParent = quiz.phase === "parent-quiz";
    const isChild = quiz.phase === "child-quiz";
    return (
      <QuizQuestion
        question={quiz.currentQuestion.soru}
        questionIndex={quiz.currentIndex}
        totalQuestions={quiz.questions.length}
        category={quiz.currentQuestion.kategori}
        selectedValue={quiz.answers[quiz.currentIndex] ?? null}
        onSelect={quiz.selectAnswer}
        onNext={quiz.next}
        onPrev={quiz.prev}
        isFirst={quiz.currentIndex === 0}
        isLast={quiz.currentIndex === quiz.questions.length - 1}
        roleLabel={isParent ? "Ebeveyn Testi" : `${quiz.childName} için Çocuk Testi`}
        characterSlot={
          isChild ? (
            <ChildQuizCharacter
              age={quiz.childAge}
              category={quiz.currentQuestion.kategori}
              questionIndex={quiz.currentIndex}
            />
          ) : undefined
        }
      />
    );
  }

  return null;
};

export default Index;
