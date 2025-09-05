// src/utils/types.ts
export type CategoryKey =
| "運動"
| "学習"
| "習慣"
| "信仰"
| "人間力"
| "金銭"
| "睡眠"
| "食事"
| "メンタル";

export type Quest = {
id: string;
title: string;
done: boolean;
enabled: boolean;
category?: string;
points?: number;
progress?: number;
locked?: boolean;
note?: string;
};

export type DayPlan = { day: number; quests: Quest[] };

export type Theme = { backgroundColor: string; textColor: string };
{/* default theme 違う書き方 noteより確認 -> export default Theme;*/}


export type AppState = {
selectedCategories: CategoryKey[];
plans: DayPlan[];
createdAt?: string;
theme?: Theme;
};

export type ChatRole = "user" | "assistant";
export type ChatMsg = { 
  role: ChatRole; 
  content: string;
  attachments?: {
    id: string;
    file: File;
    preview?: string;
    type: 'image' | 'document';
  }[];
};

export type Rank =
| "入門者 (Novice)"
| "従者 (Squire)"
| "騎士 (Knight)"
| "侯爵 (Marquis)"
| "公爵 (Duke)"
| "王者 (Sovereign)";

export type ChatHistory = {
  id: string;
  title: string;
  messages: ChatMsg[];
  createdAt: string;
  updatedAt: string;
};