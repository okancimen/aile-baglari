import QuizLanding from "@/components/QuizLanding";
import QuizQuestion from "@/components/QuizQuestion";
import QuizResults from "@/components/QuizResults";
import { useQuiz } from "@/hooks/useQuiz";

const Index = () => {
  const {
    role,
    setRole,
    currentIndex,
    currentQuestion,
    questions,
    answers,
    selectAnswer,
    next,
    prev,
    restart,
    finished,
    categoryScores,
  } = useQuiz();

  if (!role) {
    return <QuizLanding onStart={(r) => setRole(r)} />;
  }

  if (finished) {
    return <QuizResults answers={categoryScores} role={role} onRestart={restart} />;
  }

  if (!currentQuestion) return null;

  return (
    <QuizQuestion
      question={currentQuestion.soru}
      questionIndex={currentIndex}
      totalQuestions={questions.length}
      category={currentQuestion.kategori}
      selectedValue={answers[currentIndex] ?? null}
      onSelect={selectAnswer}
      onNext={next}
      onPrev={prev}
      isFirst={currentIndex === 0}
      isLast={currentIndex === questions.length - 1}
    />
  );
};

export default Index;
