// src/utils/userSession.ts
const USER_SESSION_KEY = "user-session-id";

/**
 * ユニークなユーザーセッションIDを生成
 */
function generateSessionId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 現在のユーザーセッションIDを取得（存在しない場合は新規生成）
 */
export function getUserSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  
  let sessionId = localStorage.getItem(USER_SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(USER_SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * 新しいユーザーセッションを開始（既存のセッションIDを削除して新規生成）
 */
export function startNewUserSession(): string {
  if (typeof window === "undefined") return "server_session";
  
  const newSessionId = generateSessionId();
  localStorage.setItem(USER_SESSION_KEY, newSessionId);
  return newSessionId;
}

/**
 * 現在のユーザーセッションをクリア
 */
export function clearUserSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_SESSION_KEY);
}