import { useSearchParams } from "react-router-dom";
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

  if (continueKey) {
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
      />
    );
  }

  if (quiz.phase === "results") {
    return (
      <QuizComparison
        parentScores={quiz.parentScores}
        childScores={quiz.childScores}
        onRestart={quiz.restart}
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
