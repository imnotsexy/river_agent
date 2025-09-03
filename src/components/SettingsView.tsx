// src/components/SettingsView.tsx
import { memo } from "react";
import type { Theme } from "@/utils/types";

export const SettingsView = memo(function SettingView({
  onReset,
  theme,
  onThemeChange,
}: {
  onReset: () => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}) {
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
      <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-neutral-600">進行中のクエストをリセットして最初から始めます。</div>
        <button onClick={onReset} className="rounded-xl bg-neutral-900 px-4 py-2 text-white">すべてをリセット</button>
      </div>
    </section>
  );
});
