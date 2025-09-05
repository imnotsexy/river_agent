// src/components/ChatHistoryView.tsx
import { memo, useEffect, useState } from "react";
import { MessageSquare, Clock, Trash2, ArrowLeft, Edit3, Download, Check, X } from "lucide-react";
import type { ChatHistory } from "@/utils/types";
import { getChatHistories, deleteChatHistory, updateChatHistoryTitle, downloadSingleChatHistory } from "@/utils/chatHistory";

export const ChatHistoryView = memo(function ChatHistoryView({
  onBack,
  onLoadChatHistory,
}: {
  onBack: () => void;
  onLoadChatHistory: (history: ChatHistory) => void;
}) {
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  useEffect(() => {
    setHistories(getChatHistories());
  }, []);

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('このトーク履歴を削除しますか？')) {
      deleteChatHistory(id);
      setHistories(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleEditStart = (id: string, currentTitle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle);
  };

  const handleEditSave = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (editingTitle.trim() && updateChatHistoryTitle(id, editingTitle.trim())) {
      setHistories(prev => prev.map(h => 
        h.id === id ? { ...h, title: editingTitle.trim() } : h
      ));
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleEditCancel = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingId(null);
    setEditingTitle("");
  };

  const handleDownload = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    downloadSingleChatHistory(id);
  };

  const sortedHistories = histories.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-full p-2 hover:bg-neutral-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">トーク履歴一覧</h1>
      </div>

      {sortedHistories.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">まだトーク履歴がありません</p>
          <p className="text-sm text-neutral-400 mt-1">チャットを開始すると履歴が保存されます</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedHistories.map((history) => (
            <div
              key={history.id}
              onClick={() => editingId !== history.id && onLoadChatHistory(history)}
              className={`group relative flex items-center gap-4 p-4 rounded-xl border bg-white hover:bg-neutral-50 transition-colors shadow-sm ${
                editingId === history.id ? '' : 'cursor-pointer'
              }`}
            >
              <MessageSquare className="h-5 w-5 text-neutral-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {editingId === history.id ? (
                  <div className="mb-1">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm font-medium"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditSave(history.id, e as any);
                        } else if (e.key === 'Escape') {
                          handleEditCancel(e as any);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="font-medium text-neutral-900 truncate mb-1">
                    {history.title}
                  </div>
                )}
                <div className="text-xs text-neutral-500 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    更新: {new Date(history.updatedAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>
                    {history.messages.length} メッセージ
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {editingId === history.id ? (
                  <>
                    <button
                      onClick={(e) => handleEditSave(history.id, e)}
                      className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-all"
                      aria-label="保存"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all"
                      aria-label="キャンセル"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => handleEditStart(history.id, history.title, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-blue-100 text-blue-500 transition-all"
                      aria-label="編集"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDownload(history.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-green-100 text-green-600 transition-all"
                      aria-label="ダウンロード"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(history.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-100 text-red-500 transition-all"
                      aria-label="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
});