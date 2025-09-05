// src/utils/chatHistory.ts
import type { ChatHistory, ChatMsg } from "./types";
import { getUserSessionId } from "./userSession";

const CHAT_HISTORY_KEY_PREFIX = "chat-history-";

/**
 * ユーザー固有のチャット履歴キーを取得
 */
function getChatHistoryKey(): string {
  return CHAT_HISTORY_KEY_PREFIX + getUserSessionId();
}

export function saveChatHistory(history: ChatHistory): void {
  const existingHistories = getChatHistories();
  const updatedHistories = [history, ...existingHistories.filter(h => h.id !== history.id)];
  localStorage.setItem(getChatHistoryKey(), JSON.stringify(updatedHistories));
}

export function getChatHistories(): ChatHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(getChatHistoryKey());
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getChatHistory(id: string): ChatHistory | null {
  const histories = getChatHistories();
  return histories.find(h => h.id === id) || null;
}

export function deleteChatHistory(id: string): void {
  const histories = getChatHistories();
  const filtered = histories.filter(h => h.id !== id);
  localStorage.setItem(getChatHistoryKey(), JSON.stringify(filtered));
}

export function createChatHistory(messages: ChatMsg[]): ChatHistory {
  // タイトルを最初のユーザーメッセージから生成（最大30文字）
  const firstUserMessage = messages.find(m => m.role === "user");
  const title = firstUserMessage 
    ? firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "")
    : "新しいチャット";

  return {
    id: Date.now().toString(),
    title,
    messages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateChatHistory(id: string, messages: ChatMsg[]): void {
  const history = getChatHistory(id);
  if (history) {
    history.messages = messages;
    history.updatedAt = new Date().toISOString();
    saveChatHistory(history);
  }
}

export function getRecentChatHistories(limit: number = 5): ChatHistory[] {
  const histories = getChatHistories();
  return histories
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

/**
 * 現在のユーザーの全てのチャット履歴を削除
 */
export function clearCurrentUserChatHistories(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getChatHistoryKey());
}

/**
 * チャット履歴のタイトルを更新
 */
export function updateChatHistoryTitle(id: string, newTitle: string): boolean {
  const history = getChatHistory(id);
  if (history) {
    history.title = newTitle;
    history.updatedAt = new Date().toISOString();
    saveChatHistory(history);
    return true;
  }
  return false;
}

/**
 * 個別チャット履歴をJSONファイルとしてダウンロード
 */
export function downloadSingleChatHistory(id: string): void {
  if (typeof window === "undefined") return;
  
  const history = getChatHistory(id);
  if (!history) {
    alert('指定された履歴が見つかりません');
    return;
  }

  const dataStr = JSON.stringify(history, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // ファイル名に安全な文字のみを使用
  const safeTitle = history.title.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_');
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeTitle}-${history.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 全チャット履歴をJSONファイルとしてダウンロード
 */
export function downloadChatHistories(): void {
  if (typeof window === "undefined") return;
  
  const histories = getChatHistories();
  if (histories.length === 0) {
    alert('ダウンロードする履歴がありません');
    return;
  }

  const dataStr = JSON.stringify(histories, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat-histories-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}