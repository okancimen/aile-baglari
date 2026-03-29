import { useState, useMemo, useEffect } from "react";
import quizData from "@/data/quiz-data.json";
import { createQuizSession, generateQuizQuestions, type QuizQuestionItem } from "@/lib/quiz-session";

interface Question {
  id: string;
  kategori: string;
  soru: string;
}

type Phase =
  | "landing"
  | "age-select"
  | "loading-questions"
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

const CATEGORY_COUNT = (quizData.kategoriler as string[]).length;

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
  const [persistError, setPersistError] = useState<string | null>(null);
  const [parentQuestions, setParentQuestions] = useState<QuizQuestionItem[] | null>(null);
  const [childQuestions, setChildQuestions] = useState<QuizQuestionItem[] | null>(null);

  useEffect(() => {
    if (phase !== "loading-questions") return;
    let cancelled = false;
    (async () => {
      try {
        const { parent, child } = await generateQuizQuestions({
          child_name: childName || undefined,
          child_age: childAge,
          child_gender: childGender,
        });
        if (cancelled) return;
        const okP = parent.length >= CATEGORY_COUNT;
        const okC = child.length >= CATEGORY_COUNT;
        setParentQuestions(okP ? parent : null);
        setChildQuestions(okC ? child : null);
        if (!okP || !okC) {
          console.warn("[WARNING] LLM questions short; using static pool", { parent: parent.length, child: child.length });
        }
      } catch (e) {
        console.error("[ERROR] generateQuizQuestions:", e);
        if (!cancelled) {
          setParentQuestions(null);
          setChildQuestions(null);
        }
      } finally {
        if (!cancelled) setPhase("parent-quiz");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, childName, childAge, childGender]);

  const questions = useMemo(() => {
    const cats = quizData.kategoriler as string[];
    if (phase === "parent-quiz") {
      if (parentQuestions && parentQuestions.length >= CATEGORY_COUNT) return parentQuestions as Question[];
      return pickRandomPerCategory(quizData.ebeveyn_testi as Question[], cats);
    }
    if (phase === "child-quiz") {
      if (childQuestions && childQuestions.length >= CATEGORY_COUNT) return childQuestions as Question[];
      return pickRandomPerCategory(quizData.cocuk_testi as Question[], cats);
    }
    return [];
  }, [phase, parentQuestions, childQuestions]);

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
            setPersistError(null);
            const row = await createQuizSession({
              p_parent_scores: parentScores,
              p_child_scores: scores,
              p_child_name: childName,
              p_child_gender: childGender,
              p_child_age: childAge,
              p_completed: true,
              p_parent_questions: parentQuestions ?? undefined,
              p_child_questions: childQuestions ?? undefined,
            });
            const key = typeof row.session_key === "string" ? row.session_key.trim() : "";
            if (!key) {
              throw new Error("API geçerli session_key döndürmedi.");
            }
            setSessionKey(key);
            try {
              const u = new URL(window.location.href);
              u.searchParams.set("continue", key);
              window.history.replaceState({}, "", u.toString());
            } catch {
              /* [WARNING] replaceState başarısız — sonuç ekranı yine de sessionKey state ile çalışır */
            }
          } catch (e) {
            console.error("[ERROR] createQuizSession (completed):", e);
            setSessionKey(null);
            setPersistError(e instanceof Error ? e.message : "Sonuçlar kaydedilemedi.");
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
    setPhase("loading-questions");
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
    setPersistError(null);
    setParentQuestions(null);
    setChildQuestions(null);
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("continue");
      const path = u.search ? `${u.pathname}${u.search}` : u.pathname;
      window.history.replaceState({}, "", path);
    } catch {
      /* ignore */
    }
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
    persistError,
    parentQuestions,
    childQuestions,
  };
}
