// src/components/BottomNav.tsx
import { memo } from "react";
import { Home, ClipboardList, MessageCircle, Settings as SettingsIcon } from "lucide-react";

export type Tab = "ホーム" | "クエスト" | "チャット" | "設定";

const items = [
{ label: "ホーム", icon: Home },
{ label: "クエスト", icon: ClipboardList },
{ label: "チャット", icon: MessageCircle },
{ label: "設定", icon: SettingsIcon },
] as const;

export const BottomNav = memo(function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
return (
<nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-white/10 dark:bg-zinc-900/70">
<ul className="mx-auto grid max-w-4xl grid-cols-4 px-4 py-2 text-xs">
{items.map((item) => (
<li key={item.label} className="flex items-center justify-center">
<button
className={[
"flex min-w-[4.5rem] flex-col items-center rounded-xl px-3 py-1.5",
tab === item.label ? "bg-neutral-900 text-white dark:bg-sky-600" : "text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10",
].join(" ")}
onClick={() => onChange(item.label)}
aria-pressed={tab === item.label}
>
<item.icon className="mb-1 h-5 w-5" strokeWidth={2} aria-hidden />
<span>{item.label}</span>
</button>
</li>
))}
</ul>
</nav>
);
});