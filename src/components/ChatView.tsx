// src/components/ChatView.tsx
"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Circle,
  Plus,
  Smile,
  Send,
  Paperclip,
  X,
  History,
  Settings,
  List,
  FileText,
  MessageSquarePlus,
} from "lucide-react";
import type { ChatMsg, ChatRole, CategoryKey, Theme, ChatHistory } from "@/utils/types";
import { ALL_CATEGORIES, TEMPLATE_QUESTS } from "@/utils/constants";
import { VoiceInput } from "./VoiceInput";
import { FileAttachment } from "./FileAttachment";
import { createChatHistory, saveChatHistory, getChatHistory } from "@/utils/chatHistory";
import { detectLocation, generateMapUrl, addMapLinkToText } from "@/utils/locationUtils";

export const ChatView = memo(function ChatView({
  onReplaceQuest, // 親へ置き換え依頼するコールバック
  onAddQuest, // 親へクエスト追加依頼するコールバック
  theme, // テーマ設定
  initialMessages, // 初期メッセージ（履歴読み込み用）
  currentHistoryId, // 現在のトーク履歴ID
  onShowChatHistories, // トーク履歴一覧を表示するコールバック
  onStartNewChat, // 新しいチャット開始のコールバック
}: {
  onReplaceQuest?: (payload: { category: CategoryKey; newTitle: string }) => void;
  onAddQuest?: (questTitle: string, dayIndex: number, category?: CategoryKey) => void;
  theme?: Theme;
  initialMessages?: ChatMsg[];
  currentHistoryId?: string;
  onShowChatHistories?: () => void;
  onStartNewChat?: () => void;
}) {
  const isDark = theme?.backgroundColor === "#000000";
  const [messages, setMessages] = useState<ChatMsg[]>(
    initialMessages || [
      { role: "assistant", content: "River Agentです！ 何でもお聞きください 🤖" },
      { role: "assistant", content: "こんにちは！今日はどのようなことでお手伝いできますか？" },
    ]
  );
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedQuests, setSuggestedQuests] = useState<string[]>([]);
  const [historyId, setHistoryId] = useState<string | null>(currentHistoryId || null);
  const [responseFormat, setResponseFormat] = useState<"bullet" | "free">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("chat-response-format") as "bullet" | "free") || "free";
    }
    return "free";
  });
  const [showFormatSettings, setShowFormatSettings] = useState(false);

  // 回答形式の変更を保存
  const handleFormatChange = (format: "bullet" | "free") => {
    setResponseFormat(format);
    setShowFormatSettings(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("chat-response-format", format);
    }
  };

  // クエスト追加パネル
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 新しいチャット開始関数
  const handleStartNewChat = () => {
    // 現在のチャットを履歴に保存
    if (messages.length > 2) { // 初期メッセージより多い場合のみ保存
      saveToHistory(messages);
    }
    
    // 新しいチャット開始のコールバック呼び出し
    if (onStartNewChat) {
      onStartNewChat();
    }
  };

  // トーク履歴保存関数
  const saveToHistory = (msgs: ChatMsg[]) => {
    if (msgs.length <= 2) return; // 初期メッセージのみの場合は保存しない
    
    try {
      if (historyId) {
        // 既存履歴の更新
        const history = getChatHistory(historyId);
        if (history) {
          history.messages = msgs;
          history.updatedAt = new Date().toISOString();
          saveChatHistory(history);
        }
      } else {
        // 新規履歴の作成
        const newHistory = createChatHistory(msgs);
        saveChatHistory(newHistory);
        setHistoryId(newHistory.id);
      }
    } catch (error) {
      console.error('トーク履歴の保存に失敗しました:', error);
    }
  };

  // AIの応答からクエスト提案を抽出する関数
  const extractQuestSuggestions = (content: string): string[] => {
    const quests: string[] = [];
    
    // 箇条書き（- や • や数字で始まる行）を検出
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // - や • で始まる行
      if (trimmed.match(/^[-•]\s*.+/)) {
        const quest = trimmed.replace(/^[-•]\s*/, '').trim();
        if (quest.length > 0) quests.push(quest);
      }
      
      // 1. 2. などの番号で始まる行
      if (trimmed.match(/^\d+\.\s*.+/)) {
        const quest = trimmed.replace(/^\d+\.\s*/, '').trim();
        if (quest.length > 0) quests.push(quest);
      }
    });
    
    return quests.slice(0, 5); // 最大5個まで
  };

  const handleSubmit = async (text: string, attachments?: AttachedFile[]) => {
    const t = text.trim();
    if (!t && (!attachments || attachments.length === 0)) return;

    const newMessage: ChatMsg = {
      role: "user",
      content: t || "ファイルを送信しました",
      attachments: attachments?.map(file => ({
        id: file.id,
        file: file.file,
        preview: file.preview,
        type: file.type
      }))
    };

    setMessages((prev) => [...prev, newMessage]);

    // 「クエスト追加」で編集パネルを開く
    if (/クエスト追加/.test(t)) {
      setOpenEdit(true);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    
    try {
      const apiKey = localStorage.getItem("openai_api_key");
      
      // 回答形式に応じてメッセージを調整
      const formatInstruction = responseFormat === "bullet" 
        ? "\n\n【回答形式】箇条書きで100文字以内で簡潔に回答してください。"
        : "";
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: t + formatInstruction, 
          apiKey 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMsg = { role: "assistant" as ChatRole, content: data.response };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // AIの応答からクエスト提案を抽出
        const suggestions = extractQuestSuggestions(data.response);
        if (suggestions.length > 0) {
          setSuggestedQuests(suggestions);
        }

        // トーク履歴を保存
        setTimeout(() => {
          const updatedMessages = [...messages, newMessage, assistantMessage];
          saveToHistory(updatedMessages);
        }, 100);
      } else {
        setMessages((prev) => [...prev, { role: "assistant" as ChatRole, content: "申し訳ございませんが、現在応答できません。しばらくしてから再度お試しください。" }]);
      }
    } catch (error) {
      console.error('チャットエラー:', error);
      setMessages((prev) => [...prev, { role: "assistant" as ChatRole, content: "エラーが発生しました。しばらくしてから再度お試しください。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, openEdit, selectedCategory]);

  // 設定パネル外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFormatSettings && !target.closest('[data-format-settings]')) {
        setShowFormatSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFormatSettings]);

  const categoryButtons = useMemo(
    () =>
      ALL_CATEGORIES.map((c) => (
        <button
          key={c.key}
          onClick={() => setSelectedCategory(c.key)}
          className={[
            "rounded-full border px-3 py-1 text-sm shadow-sm transition",
            selectedCategory === c.key
              ? "bg-neutral-900 text-white"
              : "hover:bg-neutral-50",
          ].join(" ")}
        >
          {c.label}
        </button>
      )),
    [selectedCategory]
  );

  const suggestions = useMemo(() => {
    if (!selectedCategory) return [];
    return TEMPLATE_QUESTS[selectedCategory];
  }, [selectedCategory]);

  const applyReplacement = (title: string) => {
    if (selectedCategory) {
      if (onReplaceQuest) {
        onReplaceQuest({ category: selectedCategory, newTitle: title });
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `カテゴリ「${selectedCategory}」のクエスト"${title}"を追加しました。`,
          },
        ]);
      }
      setOpenEdit(false);
      setSelectedCategory(null);
    }
  };

  return (
    <section className="my-2 space-y-3">
      {/* ヘッダー：ボットの顔を favicon に */}
      <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="overflow-hidden rounded-full ring-1 ring-black/5">
              <Image src="/favicon.ico" alt="River Agent" width={40} height={40} className="h-10 w-10" />
            </div>
            {/* オンラインドット */}
            <span className="absolute -right-0.5 -bottom-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white">
              <Circle
                className="h-2.5 w-2.5 fill-green-500 stroke-green-500"
                aria-hidden
              />
            </span>
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold leading-5">River Agent</div>
            <div className="text-xs text-neutral-500">
              オンライン • {responseFormat === "bullet" ? "箇条書き" : "自由形式"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative" data-format-settings>
              <button
                onClick={() => setShowFormatSettings(!showFormatSettings)}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="回答形式設定"
                title="回答形式を変更"
                data-format-settings
              >
                <Settings className="h-4 w-4" aria-hidden />
              </button>
              
              {showFormatSettings && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border bg-white p-2 shadow-lg z-10" data-format-settings>
                  <div className="text-xs font-medium text-neutral-700 mb-2">回答形式を選択</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleFormatChange("bullet")}
                      className={`w-full flex items-center gap-2 p-2 text-sm rounded transition ${
                        responseFormat === "bullet" 
                          ? "bg-blue-50 text-blue-700 border border-blue-200" 
                          : "hover:bg-neutral-50"
                      }`}
                    >
                      <List className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">箇条書き</div>
                        <div className="text-xs text-neutral-500">100文字以内で簡潔に</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleFormatChange("free")}
                      className={`w-full flex items-center gap-2 p-2 text-sm rounded transition ${
                        responseFormat === "free" 
                          ? "bg-blue-50 text-blue-700 border border-blue-200" 
                          : "hover:bg-neutral-50"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">自由形式</div>
                        <div className="text-xs text-neutral-500">詳細な回答</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleStartNewChat}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              aria-label="新しいチャット"
              title="新しいチャットを開始"
            >
              <MessageSquarePlus className="h-5 w-5" aria-hidden />
            </button>
            <button
              onClick={onShowChatHistories}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              aria-label="トーク履歴"
              title="トーク履歴一覧"
            >
              <History className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* メッセージ */}
      <div className="h-80 space-y-3 overflow-y-auto rounded-2xl border bg-white p-4 shadow-sm">
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <BotBubble key={i}>{m.content}</BotBubble>
          ) : (
            <UserBubble key={i} message={m}>{m.content}</UserBubble>
          )
        )}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="overflow-hidden rounded-full ring-1 ring-black/5">
              <Image src="/favicon.ico" alt="River Agent" width={32} height={32} className="h-8 w-8" />
            </div>
            <div className="rounded-2xl bg-neutral-100 px-3 py-2 text-sm shadow">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce [animation-delay:150ms]">•</span>
                <span className="animate-bounce [animation-delay:300ms]">•</span>
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
        {!isTyping && (
          <div className="mt-2 flex flex-wrap gap-2">
            <SuggestChip onClick={() => handleSubmit("クエストを提案して欲しい")}>
              クエスト提案
            </SuggestChip>
            <SuggestChip
              onClick={() => {
                setOpenEdit(true);
                setSelectedCategory(null);
              }}
            >
              クエスト追加
            </SuggestChip>
          </div>
        )}

        {/* AI提案クエスト選択UI */}
        {suggestedQuests.length > 0 && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-800">提案されたクエスト</h3>
              <button
                onClick={() => setSuggestedQuests([])}
                className="rounded p-1 text-blue-600 hover:bg-blue-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {suggestedQuests.map((quest, index) => {
                const location = detectLocation(quest);
                return (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-2 rounded-lg bg-white p-3 shadow-sm"
                  >
                    <div className="flex-1">
                      <span className="text-sm text-gray-800 block mb-2">{quest}</span>
                      {location && (
                        <a
                          href={generateMapUrl(location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          📍 {location}をマップで見る
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSuggestedQuests(prev => prev.filter((_, i) => i !== index))}
                        className="text-xl hover:scale-110 transition-transform"
                        title="このクエストを却下"
                      >
                        ❌
                      </button>
                      <button
                        onClick={() => {
                          // クエスト承認時の処理（今日に追加）
                          const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // 月曜日を0とする
                          if (onAddQuest) {
                            onAddQuest(quest, today, "習慣");
                            setSuggestedQuests(prev => prev.filter((_, i) => i !== index));
                          }
                        }}
                        className="text-xl hover:scale-110 transition-transform"
                        title="このクエストを承認して今日に追加"
                      >
                        🔵
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 入力 */}
      <ChatInput onSubmit={handleSubmit} />

      {/* クエスト追加パネル（ドロワー） */}
      {openEdit && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/20">
          <div className="w-full max-w-lg rounded-t-2xl border border-neutral-200 bg-white p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">クエスト追加</h3>
              <button
                onClick={() => {
                  setOpenEdit(false);
                  setSelectedCategory(null);
                }}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* カテゴリ選択 */}
            <div className="mb-3 flex flex-wrap gap-2">{categoryButtons}</div>

            {/* 候補一覧 */}
            {selectedCategory ? (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50"
                  >
                    <span className="min-w-0 flex-1 break-words">{s}</span>
                    <button
                      onClick={() => applyReplacement(s)}
                      className="whitespace-nowrap rounded-full bg-neutral-900 px-3 py-1 text-xs text-white hover:bg-neutral-800"
                    >
                      追加
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                分野を選んでください
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
});

/* ====== ここから下：バブル/入力（アバター差し替え済み） ====== */

const BotBubble = memo(function BotBubble({
  children,
}: {
  children: React.ReactNode;
}) {
  // Markdownの基本的な変換
  const formatMessage = (text: string) => {
    // 場所検出とMapリンク追加
    const { text: textWithMap, hasMap } = addMapLinkToText(text);
    
    // 改行を<br>に変換
    const lines = textWithMap.split('\n');
    return lines.map((line, index) => {
      // 見出し（###）を削除
      line = line.replace(/^#{1,6}\s+/, '');
      // 太字（**text**）を処理
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // リスト項目（- または *）を処理
      if (line.match(/^[\-\*]\s+/)) {
        line = '• ' + line.replace(/^[\-\*]\s+/, '');
      }
      
      return (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: line }} />
          {index < lines.length - 1 && <br />}
        </span>
      );
    });
  };
  
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 overflow-hidden rounded-full ring-1 ring-black/5">
        <Image src="/favicon.ico" alt="River Agent" width={32} height={32} className="h-8 w-8" />
      </div>
      <div className="max-w-[85%] rounded-2xl bg-white px-3 py-2 text-sm shadow ring-1 ring-black/5">
        {typeof children === 'string' ? formatMessage(children) : children}
      </div>
    </div>
  );
});

const UserBubble = memo(function UserBubble({
  children,
  message,
}: {
  children: React.ReactNode;
  message?: ChatMsg;
}) {
  return (
    <div className="flex items-start justify-end gap-2">
      <div className="max-w-[85%] space-y-2">
        {/* 添付ファイル表示 */}
        {message?.attachments && message.attachments.length > 0 && (
          <div className="space-y-1">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className="rounded-lg bg-blue-500 p-2">
                {attachment.type === 'image' && attachment.preview ? (
                  <div className="space-y-1">
                    <Image
                      src={attachment.preview}
                      alt={attachment.file.name}
                      width={200}
                      height={160}
                      className="max-h-40 max-w-full rounded object-cover"
                    />
                    <p className="text-xs text-blue-100">{attachment.file.name}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-white">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-xs">{attachment.file.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* テキストメッセージ */}
        {children && (
          <div className="rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white shadow">
            {children}
          </div>
        )}
      </div>
      {/* 右側のユーザー顔を 👦 に */}
      <div
        className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-[16px] font-bold text-blue-700 ring-1 ring-black/5 dark:from-sky-900/40 dark:to-indigo-900/40 dark:text-sky-200"
        aria-label="ユーザー"
      >
        <span role="img" aria-hidden>
          👦
        </span>
      </div>
    </div>
  );
});

const SuggestChip = memo(function SuggestChip({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-sm shadow-sm transition hover:bg-neutral-50"
    >
      {children}
    </button>
  );
});

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

const ChatInput = memo(function ChatInput({
  onSubmit,
}: {
  onSubmit: (text: string, attachments?: AttachedFile[]) => void;
}) {
  const [text, setText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = () => {
    const t = text.trim();
    if (!t && attachedFiles.length === 0) return;
    
    onSubmit(t, attachedFiles);
    
    // 入力をクリア
    setText("");
    setAttachedFiles([]);
    setShowAttachments(false);
    
    // refを使って直接クリア
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  const handleVoiceResult = (voiceText: string) => {
    setText(prev => prev + voiceText);
  };

  const handleFilesAttached = (files: AttachedFile[]) => {
    setAttachedFiles(files);
    if (files.length > 0) {
      setShowAttachments(true);
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== id));
  };
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      {/* ファイル添付エリア */}
      {showAttachments && (
        <div className="mb-3 border-b pb-3">
          <FileAttachment
            onFilesAttached={handleFilesAttached}
            attachedFiles={attachedFiles}
            onRemoveFile={handleRemoveFile}
          />
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAttachments(!showAttachments)}
          className={`rounded-full p-2 text-neutral-600 hover:bg-neutral-100 ${showAttachments ? 'bg-blue-50 text-blue-600' : ''}`}
          aria-label="添付"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>
        <input
          ref={inputRef}
          className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400/40"
          placeholder="メッセージを入力…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <VoiceInput onResult={handleVoiceResult} />
        <button
          className="rounded-full p-2 text-neutral-600 hover:bg-neutral-100"
          aria-label="絵文字"
        >
          <Smile className="h-5 w-5" aria-hidden />
        </button>
        <button
          onClick={send}
          className="rounded-full bg-blue-600 p-2 text-white shadow hover:bg-blue-600/90"
          aria-label="送信"
        >
          <Send className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
});


