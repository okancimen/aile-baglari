import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type CreateQuizSessionPayload = {
  p_parent_scores: Json;
  p_email?: string | null;
  p_child_name?: string | null;
  p_child_gender?: string | null;
  p_child_scores?: Json | null;
  p_completed?: boolean;
  p_child_age?: number | null;
};

export const createQuizSession = async (payload: CreateQuizSessionPayload) => {
  const { data, error } = await supabase.rpc("create_quiz_session", payload);

  if (error || !data?.[0]) {
    throw error || new Error("Quiz session could not be created.");
  }

  return data[0];
};

export const getQuizSessionByKey = async (sessionKey: string) => {
  const { data, error } = await supabase.rpc("get_quiz_session_by_key", {
    p_session_key: sessionKey,
  });

  if (error || !data?.[0]) {
    throw error || new Error("Quiz session not found.");
  }

  return data[0];
};

export const completeQuizSessionByKey = async (
  sessionKey: string,
  childScores: Json
) => {
  const { data, error } = await supabase.rpc("complete_quiz_session_by_key", {
    p_session_key: sessionKey,
    p_child_scores: childScores,
  });

  if (error || !data?.[0]) {
    throw error || new Error("Quiz session could not be completed.");
  }

  return data[0];
};
