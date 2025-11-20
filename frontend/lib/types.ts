import { Variant } from "./variants";

export type EventType =
  | "none"
  | "swipe"
  | "swipe2"
  | "rating"
  | "lifeline"
  | "evaluation"
  | "chapter";
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

export type MyceliaConversationItem = {
  // role: string;
  role: "user" | "agent" | "chapter";
  content: string;
  timestamp?: number;
};

export type MyceliaConversation = MyceliaConversationItem[];

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

export type ConversationChapter = {
  title: string;
  messageId?: string;
};
