import { useState, useMemo } from "react";
import quizData from "@/data/quiz-data.json";

type Role = "parent" | "child";

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

export function useQuiz() {
  const [role, setRole] = useState<Role | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);

  const questions = useMemo(() => {
    if (!role) return [];
    const pool = role === "parent" ? quizData.ebeveyn_testi : quizData.cocuk_testi;
    return pickRandomPerCategory(pool as Question[], quizData.kategoriler);
  }, [role]);

  const currentQuestion = questions[currentIndex] || null;

  const selectAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  };

  const next = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const restart = () => {
    setRole(null);
    setCurrentIndex(0);
    setAnswers({});
    setFinished(false);
  };

  const categoryScores = useMemo(() => {
    const scores: Record<string, number> = {};
    questions.forEach((q, i) => {
      if (answers[i] !== undefined) {
        scores[q.kategori] = answers[i];
      }
    });
    return scores;
  }, [answers, questions]);

  return {
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
  };
}
