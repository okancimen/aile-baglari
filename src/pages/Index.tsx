import QuizLanding from "@/components/QuizLanding";
import QuizQuestion from "@/components/QuizQuestion";
import QuizComparison from "@/components/QuizComparison";
import ParentDone from "@/components/ParentDone";
import { useQuiz } from "@/hooks/useQuiz";

const Index = () => {
  const quiz = useQuiz();

  if (quiz.phase === "landing") {
    return <QuizLanding onStart={quiz.startParentQuiz} />;
  }

  if (quiz.phase === "parent-done") {
    return <ParentDone onStartChildQuiz={quiz.startChildQuiz} />;
  }

  if (quiz.phase === "results") {
    return (
      <QuizComparison
        parentScores={quiz.parentScores}
        childScores={quiz.childScores}
        onRestart={quiz.restart}
      />
    );
  }

  if ((quiz.phase === "parent-quiz" || quiz.phase === "child-quiz") && quiz.currentQuestion) {
    const isParent = quiz.phase === "parent-quiz";
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
        roleLabel={isParent ? "Ebeveyn Testi" : "Çocuk Testi"}
      />
    );
  }

  return null;
};

export default Index;
