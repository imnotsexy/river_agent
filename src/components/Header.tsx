// src/components/Header.tsx
import { memo, useState } from "react";
import { Bell, X } from "lucide-react";

export const Header = memo(function Header() {
  const [open, setOpen] = useState(false);

  // 仮の通知データ（本番は props や API から渡す）
const notifications = [
  { id: 1, text: "今日1日、少しずつで大丈夫。一歩ずつ進んでいきましょう！" },
  { id: 2, text: "できたことを振り返って、自分を褒めてあげてください" },
  { id: 3, text: "全クエスト達成で+50pt 獲得できます。コツコツ続けて大きな成果に！" },
  { id: 4, text: "完璧じゃなくていい。挑戦した時点で前進しています" },
  { id: 5, text: "あなたの努力は必ず積み重なり、未来の計画性につながります" },
  { id: 6, text: "休憩も大事なクエストです。自分を大切にしましょう" },
];


  return (
    <header className="relative mb-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">River Agent</h1>

      {/* 通知ボタン */}
      <button
        className="relative inline-flex items-center justify-center rounded-full p-2 text-neutral-600 hover:bg-black/5"
        aria-label="通知"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white" />
        )}
      </button>

      {/* 通知ドロップダウン */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800">通知一覧</h2>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
              >
                {n.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
});
