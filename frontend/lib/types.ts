import { Variant } from "./variants";

export type EventType = "none" | "swipe" | "rating" | "lifeline" | "evaluation";
export type UserInstructionType = "none" | "dm";

export interface Userinfo {
  subject_id: string;
  avatar_id: string;
  variant: Variant;
  start_time: number;
}

export interface EventInput {
  type?: EventType;
  items?: string[];
  description?: string;
  chapter_id?: string;
  userdata?: {
    preferences: {
      [key: string]: EventItemResult[];
    };
    userinfo: Userinfo;
  };
}

export interface EventResult {
  id: string;
  results: EventItemResult[];
  created_at: string;
}

export interface EventItemResult {
  item: string;
  skill?: string;
  rating: number;
}

export type MyceliaConversation = {
  role: string;
  content: string;
}[];

export type MyceliaGames = {
  name: string;
  items: EventItemResult[];
}[];

export type MyceliaEvaluationRequestBody = {
  conversation: MyceliaConversation;
  games: MyceliaGames;
  userinfo: Userinfo;
};

export type MyceliaEvaluationResponseBody = {
  mobileUrl: string;
  desktopUrl: string;
};
