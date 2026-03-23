import { useState, useMemo } from "react";
import quizData from "@/data/quiz-data.json";
import { createQuizSession } from "@/lib/quiz-session";

interface Question {
  id: string;
  kategori: string;
  soru: string;
}

type Phase =
  | "landing"
  | "age-select"
  | "parent-quiz"
  | "parent-done"
  | "child-quiz"
  | "persisting-results"
  | "results";

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
  const [phase, setPhase] = useState<Phase>("landing");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [parentScores, setParentScores] = useState<Record<string, number>>({});
  const [childScores, setChildScores] = useState<Record<string, number>>({});
  const [childAge, setChildAge] = useState<number>(8);
  const [childName, setChildName] = useState<string>("");
  const [childGender, setChildGender] = useState<"girl" | "boy">("boy");
  const [sessionKey, setSessionKey] = useState<string | null>(null);

  const questions = useMemo(() => {
    if (phase === "parent-quiz") {
      return pickRandomPerCategory(quizData.ebeveyn_testi as Question[], quizData.kategoriler);
    }
    if (phase === "child-quiz") {
      return pickRandomPerCategory(quizData.cocuk_testi as Question[], quizData.kategoriler);
    }
    return [];
  }, [phase]);

  const currentQuestion = questions[currentIndex] || null;

  const selectAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  };

  const getCategoryScores = () => {
    const scores: Record<string, number> = {};
    questions.forEach((q, i) => {
      if (answers[i] !== undefined) {
        scores[q.kategori] = answers[i];
      }
    });
    return scores;
  };

  const next = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Finished current quiz
      const scores = getCategoryScores();
      if (phase === "parent-quiz") {
        setParentScores(scores);
        setPhase("parent-done");
      } else if (phase === "child-quiz") {
        setChildScores(scores);
        setCurrentIndex(0);
        setAnswers({});
        setPhase("persisting-results");
        void (async () => {
          try {
            const row = await createQuizSession({
              p_parent_scores: parentScores,
              p_child_scores: scores,
              p_child_name: childName,
              p_child_gender: childGender,
              p_child_age: childAge,
              p_completed: true,
            });
            setSessionKey(row.session_key);
          } catch (e) {
            console.error("[ERROR] createQuizSession (completed):", e);
            setSessionKey(null);
          } finally {
            setPhase("results");
          }
        })();
        return;
      }
      setCurrentIndex(0);
      setAnswers({});
    }
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const startAgeSelect = () => {
    setPhase("age-select");
  };

  const selectAge = (age: number, name: string, gender: "girl" | "boy") => {
    setChildAge(age);
    setChildName(name);
    setChildGender(gender);
    setPhase("parent-quiz");
    setCurrentIndex(0);
    setAnswers({});
  };

  const startParentQuiz = () => {
    setPhase("parent-quiz");
    setCurrentIndex(0);
    setAnswers({});
  };

  const startChildQuiz = () => {
    setPhase("child-quiz");
    setCurrentIndex(0);
    setAnswers({});
  };

  const restart = () => {
    setPhase("landing");
    setCurrentIndex(0);
    setAnswers({});
    setParentScores({});
    setChildScores({});
    setChildAge(8);
    setChildName("");
    setChildGender("boy");
    setSessionKey(null);
  };

  return {
    phase,
    currentIndex,
    currentQuestion,
    questions,
    answers,
    selectAnswer,
    next,
    prev,
    startAgeSelect,
    selectAge,
    startParentQuiz,
    startChildQuiz,
    restart,
    parentScores,
    childScores,
    childAge,
    childName,
    childGender,
    sessionKey,
  };
}
