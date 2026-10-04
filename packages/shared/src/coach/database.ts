import type { CoachTopic, CoachThread, CoachMessage, CoachMemory, CoachRun, CoachAction } from "./contracts";
import type { Json } from "../supabase/database.types";
type Table<R> = { Row: R; Insert: Partial<R>; Update: Partial<R>; Relationships: [] };
export type CoachDatabaseTables = {
  coach_action_requests: Table<{ owner_id: string; request_id: string; action_id: string; receipt: Json }>;
  coach_context_versions: Table<{ owner_id:string; revision:number; updated_at:string }>;
  coach_topics: Table<CoachTopic>;
  coach_threads: Table<CoachThread>;
  coach_messages: Table<Omit<CoachMessage, "source"> & { source: Json }>;
  coach_memories: Table<CoachMemory>;
  coach_runs: Table<CoachRun & { payload_digest: string; page_context: Json }>;
  coach_actions: Table<Omit<CoachAction, "preview" | "result"> & { command: Json; preview: Json; result: Json; inverse: Json }>;
  coach_topic_goals: Table<{ topic_id: string; owner_id: string; goal_id: string }>;
};
export type CoachDatabaseFunctions = {
  create_coach_topic: { Args: { p_owner: string; p_title: string }; Returns: Json };
  manage_coach_entity: { Args: { p_owner: string; p_kind: string; p_id: string; p_version: number; p_patch?: Json | null }; Returns: undefined };
  set_planner_preferences: { Args: { p_timezone: string; p_confirmed_at: string; p_week_start: number; p_rest_days: number[]; p_blackouts: Json; p_expected_digest?: string }; Returns: Json };
  apply_coach_action: { Args: { p_action: string; p_request: string }; Returns: Json };
  replace_coach_action: { Args: { p_owner: string; p_original: string; p_new: Json; p_undo?: boolean }; Returns: string };
  ensure_coach_home: { Args: { p_owner: string }; Returns: string };
  begin_coach_run: { Args: { p_owner: string; p_thread: string; p_request: string; p_content: string; p_page: Json; p_expected_version: number; p_digest: string; p_retry?: string | null }; Returns: Json };
  finish_coach_run: { Args: { p_owner: string; p_run: string; p_content: string; p_source: Json; p_actions?: Json }; Returns: Json };
};
