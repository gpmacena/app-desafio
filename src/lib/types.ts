export interface Participant {
  id: string;
  name: string;
  color: string;
  waterGoal: number;
}

export interface ChallengeData {
  fastfood?: boolean;
  water?: number;
  running?: boolean;
  gym?: boolean;
  steps?: number;
}

export interface DiaryEntry {
  workout_done?: boolean;
  workout_duration?: number;
  workout_energy?: number;
  workout_notes?: string;
  core_birddog?: boolean;
  core_plank?: number;
  core_deadbug?: boolean;
  core_pain?: number;
  run_done?: boolean;
  run_time?: number;
  run_distance?: number;
}

export interface RunningSession {
  date: string;
  weekday: string;
  phase: number;
  protocol: string;
  done?: boolean;
  minutes?: number;
  km?: number;
  heartRate?: number;
  feeling?: string;
}

export interface WeightEntry {
  date: string;
  weight?: number;
  waist?: number;
  hip?: number;
  arm?: number;
  thigh?: number;
  notes?: string;
}

export interface FeedPost {
  id: string;
  userId: string;
  msg: string;
  tag: string;
  ts: number;
  reactions?: {
    fire?: Record<string, boolean>;
    like?: Record<string, boolean>;
  };
}

export type ChallengeStatus = 'done' | 'failed' | 'pending';
