// src/components/SettingsView.tsx
import { memo, useEffect, useState } from "react";
import { MessageSquare, Clock, ArrowRight, UserPlus, Download } from "lucide-react";
import type { Theme, ChatHistory } from "@/utils/types";
import { getRecentChatHistories, getChatHistories, clearCurrentUserChatHistories, downloadChatHistories } from "@/utils/chatHistory";
import { startNewUserSession } from "@/utils/userSession";

export const SettingsView = memo(function SettingView({
  onReset,
  theme,
  onThemeChange,
  onShowChatHistories,
  onLoadChatHistory,
  hideHistorySection,
}: {
  onReset: () => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onShowChatHistories?: () => void;
  onLoadChatHistory?: (history: ChatHistory) => void;
  hideHistorySection?: boolean;
}) {
  const [recentHistories, setRecentHistories] = useState<ChatHistory[]>([]);
  const [totalHistories, setTotalHistories] = useState<number>(0);

  useEffect(() => {
    const allHistories = getChatHistories();
    setTotalHistories(allHistories.length);
    setRecentHistories(getRecentChatHistories(5));
  }, []);

  const handleStartNewUserSession = () => {
    if (confirm('新しいユーザーセッションを開始しますか？現在のチャット履歴は保持されますが、別のユーザーとして新しい履歴が作成されます。')) {
      startNewUserSession();
      // ページをリロードして新しいセッションを反映
      window.location.reload();
    }
  };
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">設定</h1>

      <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-medium">テーマ設定</h2>
        <div className="text-sm text-neutral-600">現在のテーマ: {theme.backgroundColor === "#ffffff" ? "ライト" : "ダーク"}</div>
        <div className="flex gap-2">
          <button 
            onClick={() => onThemeChange({ backgroundColor: "#ffffff", textColor: "#000000" })} 
            className={`px-3 py-1 rounded ${theme.backgroundColor === "#ffffff" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            ライト
          </button>
          <button 
            onClick={() => onThemeChange({ backgroundColor: "#000000", textColor: "#ffffff" })} 
            className={`px-3 py-1 rounded ${theme.backgroundColor === "#000000" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            ダーク
          </button>
        </div>
      </div>

      {/* ユーザーセッション管理 */}
      <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-medium flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          ユーザーセッション
        </h2>
        <div className="text-sm text-neutral-600">
          新しいユーザーとしてセッションを開始できます。他のユーザーと履歴を分離したい場合にご使用ください。
        </div>
        <button 
          onClick={handleStartNewUserSession}
          className="rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
        >
          新しいユーザーセッションを開始
        </button>
      </div>

      {/* トーク履歴セクション */}
      {!hideHistorySection && (
        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              最近のトーク履歴
            </h2>
            <div className="flex items-center gap-2">
              {totalHistories > 0 && (
                <button
                  onClick={downloadChatHistories}
                  className="text-sm text-green-600 hover:underline flex items-center gap-1"
                  title="履歴をダウンロード"
                >
                  <Download className="h-3 w-3" />
                  ダウンロード
                </button>
              )}
              {totalHistories > 5 && (
                <button
                  onClick={onShowChatHistories}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  すべて表示 ({totalHistories}件)
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          
          {recentHistories.length === 0 ? (
            <div className="text-sm text-neutral-500 py-4 text-center">
              まだトーク履歴がありません
            </div>
          ) : (
            <div className="space-y-2">
              {recentHistories.map((history) => (
                <div
                  key={history.id}
                  onClick={() => onLoadChatHistory?.(history)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                >
                  <MessageSquare className="h-4 w-4 text-neutral-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate">
                      {history.title}
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(history.updatedAt).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-neutral-600">進行中のクエストをリセットして最初から始めます。</div>
        <button onClick={onReset} className="rounded-xl bg-neutral-900 px-4 py-2 text-white">すべてをリセット</button>
      </div>
    </section>
  );
});
