// src/app/page.tsx
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { Header } from "../components/Header";
import { BottomNav, type Tab } from "../components/BottomNav";
import { HomeView } from "../components/HomeView";
import { QuestView } from "../components/QuestView";
import { SettingsView } from "../components/SettingsView";



import { ALL_CATEGORIES, DEFAULT_THEME } from "@/utils/constants";
import { buildWeekPlan, loadState, saveState } from "@/utils/helpers";
import type { AppState, CategoryKey, Theme, ChatHistory, ChatMsg } from "@/utils/types";

const ChatView = dynamic(() => import("@/components/ChatView").then((m) => m.ChatView), { ssr: false });
const ChatHistoryView = dynamic(() => import("@/components/ChatHistoryView").then((m) => m.ChatHistoryView), { ssr: false });

export default function Page() {
  const [tab, setTab] = useState<Tab>("ホーム");
  const [state, setState] = useState<AppState | null>(null);
  const [selected, setSelected] = useState<CategoryKey[]>([]);
  const [showInitialSetup, setShowInitialSetup] = useState(true); // デフォルトをtrueに変更
  const [isLoading, setIsLoading] = useState(true); // ローディング状態を追加
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [currentChatHistory, setCurrentChatHistory] = useState<ChatHistory | null>(null);

  const todayIndex = useMemo(() => {
    if (!state?.createdAt) return 0;
    const diffMs = Date.now() - new Date(state.createdAt).getTime();
    return Math.max(0, Math.min(6, Math.floor(diffMs / 86400000)));
  }, [state?.createdAt]);

  useEffect(() => {
    const s = loadState();
    // 既存のデータがあり、かつ3つ選択済みでプランがある場合のみ初期設定をスキップ
    if (s && s.selectedCategories && s.selectedCategories.length === 3 && s.plans?.length > 0) {
      setState(s);
      setShowInitialSetup(false);
    } else {
      // それ以外は全て初期設定画面を表示
      setShowInitialSetup(true);
      if (s?.selectedCategories) {
        setSelected(s.selectedCategories);
      }
    }
    setIsLoading(false);
  }, []);

  const hasPlan = !!state?.plans?.length && !showInitialSetup;

  const toggleDone = useCallback((dayIdx: number, qid: string) => {
    if (!state) return;
    const copy: AppState = JSON.parse(JSON.stringify(state));
    const q = copy.plans[dayIdx].quests.find((x) => x.id === qid);
    if (!q || !q.enabled) return;
    q.done = !q.done;
    setState(copy);
    saveState(copy);
  }, [state]);

  const toggleEnabled = useCallback((dayIdx: number, qid: string) => {
    if (!state) return;
    const copy: AppState = JSON.parse(JSON.stringify(state));
    const q = copy.plans[dayIdx].quests.find((x) => x.id === qid);
    if (!q) return;
    q.enabled = !q.enabled;
    if (!q.enabled) q.done = false;
    setState(copy);
    saveState(copy);
  }, [state]);

  const setDayEnabledAll = useCallback((dayIdx: number, enabled: boolean) => {
    if (!state) return;
    const copy: AppState = JSON.parse(JSON.stringify(state));
    copy.plans[dayIdx].quests = copy.plans[dayIdx].quests.map((q) => ({ ...q, enabled, done: enabled ? q.done : false }));
    setState(copy);
    saveState(copy);
  }, [state]);

  const resetAll = useCallback(() => {
    setState(null);
    setSelected([]);
    setShowInitialSetup(true);
    if (typeof window !== "undefined") localStorage.removeItem("growth-planner-v1");
  }, []);

  const addQuestToPlans = useCallback((questTitle: string, dayIndex: number, category?: CategoryKey) => {
    if (!state) return;
    const copy: AppState = JSON.parse(JSON.stringify(state));
    
    // 新しいクエストを作成
    const newQuest = {
      id: Date.now().toString(),
      title: questTitle,
      category: category || "習慣",
      done: false,
      enabled: true,
      points: 10
    };
    
    // 指定された日にクエストを追加
    if (copy.plans[dayIndex]) {
      copy.plans[dayIndex].quests.push(newQuest);
      setState(copy);
      saveState(copy);
    }
  }, [state]);

  // 新しいチャット開始（現在のチャット履歴をリセット）
  const startNewChat = useCallback(() => {
    setCurrentChatHistory(null);
  }, []);

  // ローディング中は何も表示しない
  if (isLoading) {
    return null;
  }

  // 初回ウィザード（3つ選択するまで表示）
  if (showInitialSetup || !hasPlan) {
    const toggleCategory = (key: CategoryKey) => setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    const generate = () => {
      if (selected.length !== 3) {
        alert("ちょうど3つの分野を選択してください");
        return;
      }
      
      const plans = buildWeekPlan(selected);
      const next: AppState = { selectedCategories: selected, plans, createdAt: new Date().toISOString() };
      setState(next);
      saveState(next);
      setShowInitialSetup(false);
    };
    return (
      <main className="mx-auto max-w-screen-sm p-4 transition-colors" style={{
        backgroundColor: "#f7f7f7",
        color: "#111111"
      }}>
        <h1 className="mb-4 text-xl font-semibold">どんな分野を伸ばしたい？</h1>
        <p className="mb-3 text-sm text-neutral-600">ちょうど3つ選択してください（後で変更できます）</p>
        <div className="grid grid-cols-3 gap-3">
          {ALL_CATEGORIES.map((c) => {
            const active = selected.includes(c.key);
            return (
              <button key={c.key} onClick={() => toggleCategory(c.key)} className={`rounded-2xl border p-4 text-sm shadow-sm transition ${active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:bg-neutral-50"}`}>{c.label}</button>
            );
          })}
        </div>
        <div className="mt-6 space-y-3">
          {selected.length > 0 && (
            <div className="text-sm text-neutral-600">
              選択中: {selected.join("、")} ({selected.length}/3個)
            </div>
          )}
          <div className="flex items-center justify-between">
            <button 
              onClick={generate} 
              disabled={selected.length !== 3}
              className={`rounded-xl px-4 py-2 shadow transition ${
                selected.length !== 3 
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" 
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
            >
              7日間プランを作成 {selected.length !== 3 ? `(${3 - selected.length}個追加で選択してください)` : ""}
            </button>
            {selected.length > 0 && (
              <button onClick={() => setSelected([])} className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-800">
                選択をクリア
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-dvh transition-colors ${state?.theme?.backgroundColor === "#000000" ? "dark" : ""}`} style={{
      backgroundColor: state?.theme?.backgroundColor || "#f7f7f7",
      color: state?.theme?.textColor || "#111111"
    }}>
      <style jsx global>{`
        :root { 
          --background: ${state?.theme?.backgroundColor || "#f7f7f7"}; 
          --foreground: ${state?.theme?.textColor || "#111111"}; 
        }
        .dark { 
          --background: #0a0a0a; 
          --foreground: #e5e5e5; 
        }
        body {
          background-color: ${state?.theme?.backgroundColor || "#f7f7f7"};
          color: ${state?.theme?.textColor || "#111111"};
        }
      `}</style>
      <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 lg:px-6">
        <Header />
        {tab === "ホーム" && (
          <HomeView username="勇者タクロウ" plans={state!.plans} createdAt={state!.createdAt} onOpenQuest={() => setTab("クエスト")} theme={state!.theme} />
        )}
        {tab === "クエスト" && (
          <QuestView plans={state!.plans} todayIndex={todayIndex} onToggleDone={toggleDone} onToggleEnabled={toggleEnabled} onToggleDayEnabled={setDayEnabledAll} theme={state!.theme} />
        )}
        {tab === "チャット" && !showChatHistory && (
          <ChatView 
            onAddQuest={addQuestToPlans} 
            theme={state!.theme} 
            initialMessages={currentChatHistory?.messages}
            currentHistoryId={currentChatHistory?.id}
            onShowChatHistories={() => setShowChatHistory(true)}
            onStartNewChat={startNewChat}
          />
        )}
        {showChatHistory && (
          <ChatHistoryView
            onBack={() => setShowChatHistory(false)}
            onLoadChatHistory={(history) => {
              setCurrentChatHistory(history);
              setShowChatHistory(false);
              setTab("チャット");
            }}
          />
        )}
        {tab === "設定" && !showChatHistory && (
          <SettingsView
            onReset={resetAll}
            theme={state!.theme ?? (DEFAULT_THEME as Theme)}
            onThemeChange={(theme) => {
              setState((prev) => (prev ? { ...prev, theme } : null));
              if (state) saveState({ ...state, theme });
            }}
            onShowChatHistories={() => setShowChatHistory(true)}
            onLoadChatHistory={(history) => {
              setCurrentChatHistory(history);
              setTab("チャット");
            }}
          />
        )}
      </div>
      <BottomNav tab={tab} onChange={setTab} />
    </main>
  );
}
