// src/components/QuestView.tsx
import { memo, useMemo, useState } from "react";
import type { DayPlan } from "@/utils/types";
import { POINTS_PER_QUEST, DAILY_BONUS_POINTS } from "@/utils/constants";

type ViewMode = "today" | "week";

export const QuestView = memo(function QuestView({
  plans,
  todayIndex,
  onToggleDone,
  onToggleEnabled,
  onToggleDayEnabled,
}: {
  plans: DayPlan[];
  todayIndex: number;
  onToggleDone: (dayIdx: number, qid: string) => void;
  onToggleEnabled: (dayIdx: number, qid: string) => void;
  onToggleDayEnabled: (dayIdx: number, enabled: boolean) => void;
}) {
  const [view, setView] = useState<ViewMode>("today");

  const entries = useMemo(
    () => plans.map((p, idx) => ({ plan: p, dayIdx: idx })),
    [plans]
  );

  // 有効（enabled）のクエストのみで「全部完了」を判定。0件は対象外。
  const allQuestsDone = useMemo(
    () =>
      plans.map((p) => {
        const enabled = p.quests.filter((q) => q.enabled);
        return enabled.length > 0 && enabled.every((q) => q.done);
      }),
    [plans]
  );

  const visible = useMemo(() => {
    if (view === "today") return entries.filter((_, i) => i === todayIndex);
    return entries;
  }, [entries, view, todayIndex]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">クエスト</h1>

        {/* タブ（今日 / 週全体） */}
        <div
          role="tablist"
          aria-label="表示切り替え"
          className="inline-flex rounded-xl border border-neutral-200 bg-white p-1 text-sm"
        >
          <button
            role="tab"
            aria-selected={view === "today"}
            onClick={() => setView("today")}
            className={[
              "rounded-lg px-3 py-1.5 transition",
              view === "today"
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-black/5",
            ].join(" ")}
          >
            今日
          </button>
          <button
            role="tab"
            aria-selected={view === "week"}
            onClick={() => setView("week")}
            className={[
              "rounded-lg px-3 py-1.5 transition",
              view === "week"
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-black/5",
            ].join(" ")}
          >
            週全体
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {visible.map(({ plan: p, dayIdx: idx }) => {
          const isToday = idx === todayIndex;
          const dayEnabled = p.quests.some((q) => q.enabled);

          return (
            <div
              key={p.day}
              className={[
                "rounded-2xl border bg-white p-4 shadow-sm",
                isToday
                  ? "border-rose-300 ring-2 ring-rose-100"
                  : "border-neutral-200",
              ].join(" ")}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-sm font-medium text-neutral-700">
                    {p.day}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">Day {p.day}</div>
                    {isToday && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        TODAY
                      </span>
                    )}
                  </div>
                </div>

                <label className="inline-flex select-none items-center gap-2">
                  <span className="hidden text-xs text-neutral-500 sm:inline">
                    {dayEnabled ? "有効" : "無効"}
                  </span>
                  <input
                    type="checkbox"
                    checked={dayEnabled}
                    onChange={(e) => onToggleDayEnabled(idx, e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className="relative h-6 w-11 rounded-full bg-neutral-200 transition-colors peer-checked:bg-emerald-500 before:absolute before:left-1 before:top-1 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform peer-checked:before:translate-x-5"
                    aria-hidden
                  />
                </label>
              </div>

              <ul className="space-y-3">
                {p.quests.map((q) => (
                  <li
                    key={q.id}
                    onClick={() => onToggleDone(idx, q.id)}
                    className="group cursor-pointer rounded-xl border border-neutral-100 bg-white/80 p-3 shadow-sm transition hover:bg-neutral-50"
                    role="button"
                    aria-pressed={q.done}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={[
                                "break-words font-medium",
                                q.done ? "text-neutral-400 line-through" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {q.title}
                            </p>
                            {(q.category || q.note) && (
                              <p className="text-xs text-neutral-500">
                                {q.category}
                                {q.note ? ` ・ ${q.note}` : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                              +{q.points ?? POINTS_PER_QUEST}pt
                            </span>
                          </div>
                        </div>

                        {typeof q.progress === "number" && !q.done ? (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                              <div
                                className="h-full rounded-full bg-orange-400 transition-all"
                                style={{ width: `${q.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-500">
                              {q.progress}%
                            </span>
                          </div>
                        ) : (
                          <div className="mt-2 h-2" />
                        )}

                        <div className="mt-2 flex min-h-[20px] items-center gap-3 text-xs">
                          <span
                            className={[
                              "inline-flex items-center gap-1",
                              q.done ? "text-emerald-600" : "invisible",
                            ].join(" ")}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                            完了済み
                          </span>
                          <span
                            className={[
                              "inline-flex items-center gap-1",
                              !q.enabled || q.locked
                                ? "text-neutral-400"
                                : "invisible",
                            ].join(" ")}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <path d="M12 17a2 2 0 0 0 2-2V7a2 2 0 0 0-4 0v8a2 2 0 0 0 2 2z" />
                              <path d="M5 11h14v10H5z" />
                            </svg>
                            ロック中
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleEnabled(idx, q.id);
                        }}
                        className={[
                          "rounded-full border px-2 py-1 text-xs",
                          q.enabled
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-neutral-200 bg-neutral-100 text-neutral-500",
                        ].join(" ")}
                        title="ON/OFF"
                        aria-pressed={q.enabled}
                      >
                        {q.enabled ? "ON" : "OFF"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* 今日だけ、未完なら案内カード／完了ならお祝いカード */}
              {isToday &&
                (allQuestsDone[idx] ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    <div className="flex items-center gap-2 font-medium">
                      <span>🎉 おめでとう！ボーナス獲得</span>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-emerald-600">
                        +{DAILY_BONUS_POINTS}pt
                      </span>
                    </div>
                    <p className="mt-1 text-emerald-600/90">
                      今日のクエストをすべて達成しました！
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <div className="flex items-center gap-2 font-medium">
                      <span>🔥 今日のボーナス</span>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-rose-600">
                        +{DAILY_BONUS_POINTS}pt
                      </span>
                    </div>
                    <p className="mt-1 text-rose-600/90">
                      すべてのクエストを完了すると追加ポイントを獲得！
                    </p>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
});
