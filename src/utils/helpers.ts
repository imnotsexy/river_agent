// src/utils/helpers.ts
import { TEMPLATE_QUESTS } from "./constants";
import type { AppState, CategoryKey, DayPlan, Rank } from "./types";
import { STORAGE_KEY, POINTS_PER_QUEST } from "./constants";

export const uid = () => Math.random().toString(36).slice(2, 10); // 簡易的なUID生成

// 選択されたカテゴリに基づいて1週間分のプランを生成
export function buildWeekPlan(selected: CategoryKey[]): DayPlan[] {
const days: DayPlan[] = [];
for (let i = 1; i <= 7; i++) {
const quests = [] as DayPlan["quests"];
selected.forEach((cat, idx) => {
const candidates = TEMPLATE_QUESTS[cat];
const base = (i + idx) % candidates.length;
const titles = [candidates[base], candidates[(base + 1) % candidates.length]];
titles.forEach((t) =>
quests.push({
id: uid(),
title: t,
done: false,
enabled: true,
category: cat,
points: POINTS_PER_QUEST,
}),
);
});
days.push({ day: i, quests: quests.slice(0, 5) });
}
return days;
}

// スコアに基づいてランクを計算
export function calculateRank(score: number): Rank {
if (score >= 1000) return "王者 (Sovereign)";
if (score >= 500) return "公爵 (Duke)";
if (score >= 200) return "侯爵 (Marquis)";
if (score >= 100) return "騎士 (Knight)";
if (score >= 50) return "従者 (Squire)";
return "入門者 (Novice)";
}

// ローカルストレージから状態を読み込み
export function loadState(): AppState | null {
if (typeof window === "undefined") return null;
try {
const raw = localStorage.getItem(STORAGE_KEY);
return raw ? (JSON.parse(raw) as AppState) : null;
} catch {
return null;
}
}

// ローカルストレージに状態を保存
export function saveState(state: AppState) {
if (typeof window === "undefined") return;
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}