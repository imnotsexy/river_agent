// src/components/HomeView.tsx
import { memo, useMemo } from "react";
import { calculateRank } from "@/utils/helpers";
import { POINTS_PER_QUEST, rankOrder, DAILY_BONUS_POINTS } from "@/utils/constants";
import type { DayPlan, Rank } from "@/utils/types";

export const HomeView = memo(function HomeView({
  username,
  plans,
  createdAt,
  onOpenQuest,
}: {
  username: string;
  plans: DayPlan[];
  createdAt?: string;
  onOpenQuest: () => void;
}) {
  const todayIndex = useMemo(() => {
    if (!createdAt) return 0;
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.min(6, Math.floor(diffMs / 86400000)));
  }, [createdAt]);

  const flat = useMemo(() => plans.flatMap((p) => p.quests), [plans]);

  // その日が「有効クエストすべて完了」か（有効0件は対象外）
  const isDayComplete = (p?: DayPlan) => {
    if (!p) return false;
    const enabled = p.quests.filter((q) => q.enabled);
    return enabled.length > 0 && enabled.every((q) => q.done);
  };

  // 週のボーナス日数
  const bonusDays = useMemo(
    () => plans.filter((p) => isDayComplete(p)).length,
    [plans]
  );

  // ベースポイント（完了×10）
  const basePoints = useMemo(
    () => flat.filter((q) => q.enabled && q.done).length * POINTS_PER_QUEST,
    [flat]
  );

  // ボーナス込みの合計ポイント
  const totalPoints = useMemo(
    () => basePoints + bonusDays * DAILY_BONUS_POINTS,
    [basePoints, bonusDays]
  );

  // ランク関連
  const currentRank: Rank = useMemo(() => calculateRank(totalPoints), [totalPoints]);
  const nextRank = rankOrder[Math.min(rankOrder.indexOf(currentRank) + 1, rankOrder.length - 1)];
  const thresholdByRank: Record<Rank, number> = {
    "入門者 (Novice)": 0,
    "従者 (Squire)": 50,
    "騎士 (Knight)": 100,
    "侯爵 (Marquis)": 200,
    "公爵 (Duke)": 500,
    "王者 (Sovereign)": 1000,
  };
  const toNext = Math.max(thresholdByRank[nextRank] - totalPoints, 0);

  // 今週の進捗
  const weekDoneTotal = useMemo(
    () => plans.reduce((s, p) => s + p.quests.filter((q) => q.enabled && q.done).length, 0),
    [plans]
  );
  const weekAllTotal = useMemo(
    () => plans.reduce((s, p) => s + p.quests.filter((q) => q.enabled).length, 0),
    [plans]
  );
  const weekProgress = weekAllTotal ? Math.round((weekDoneTotal / weekAllTotal) * 100) : 0;

  // 今日の表示用
  const todayEnabled = plans[todayIndex]?.quests.filter((q) => q.enabled) ?? [];
  const doneCount = todayEnabled.filter((q) => q.done).length;
  const totalCount = todayEnabled.length;
  const todayBonus = isDayComplete(plans[todayIndex]) ? DAILY_BONUS_POINTS : 0;
  const todayEarned = doneCount * POINTS_PER_QUEST + todayBonus;
  const achievementRate = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return (
    <>
      <section className="mb-6 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-lg font-bold text-blue-700 dark:from-sky-900/40 dark:to-indigo-900/40 dark:text-sky-200">
            👦
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-neutral-500">{username}</p>
              <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs text-white dark:bg-sky-600">{currentRank}</span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <KPI title="所持ポイント" value={totalPoints.toLocaleString()} />
              <div className="rounded-2xl border bg-white/80 p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-neutral-500">ランク</div>
                <div className="mt-1 text-lg font-semibold">{currentRank}</div>
                <div className="mt-1 text-xs text-neutral-500">次まで {toNext.toLocaleString()} pt</div>
              </div>
              <KPI title="今週の達成率" value={`${weekProgress}%`} />
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-neutral-900 transition-all dark:bg-sky-500" style={{ width: `${weekProgress}%` }} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {["月", "火", "水", "木", "金", "土", "日"].map((d, i) => {
                const st = i < todayIndex ? "done" : i === todayIndex ? "active" : "future";
                return (
                  <div key={d} className="flex items-center gap-2">
                    <div
                      className={[
                        "grid h-7 w-7 place-items-center rounded-full text-xs",
                        st === "done" && "bg-neutral-900 text-white dark:bg-sky-500",
                        st === "active" && "border-2 border-neutral-900 text-neutral-900 dark:border-sky-400 dark:text-sky-200",
                        st === "future" && "bg-neutral-100 text-neutral-400 dark:bg-white/10",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs text-neutral-500">{d}</span>
                  </div>
                );
              })}
              <div className="grow basis-full sm:basis-auto" />
              <button
                className="ms-auto inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                onClick={onOpenQuest}
              >
                クエスト確認
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="sr-only">今日のクエスト</h2>
        {todayEnabled.map((q) => (
          <article
            key={q.id}
            className="group rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm transition hover:bg-white dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-start gap-3">
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-tight">{q.title}</p>
                    <p className="text-xs text-neutral-500">
                      Day {todayIndex + 1}{q.category ? ` ・ ${q.category}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-white dark:bg-sky-600">
                        +{POINTS_PER_QUEST}ポイント
                      </span>
                    </span>
                  </div>
                </div>
                <div className="mt-2 min-h-[18px] text-xs text-neutral-500">
                    <span className={q.done ? "font-bold" : "invisible"}>完了済み</span>
                  <span className={!q.done ? "" : "invisible"}>未開始</span>
                </div>
              </div>
            </div>
          </article>
        ))}
        {todayEnabled.length === 0 && (
          <div className="rounded-2xl border bg-white/60 p-4 text-sm text-neutral-500">
            今日は有効なクエストがありません
          </div>
        )}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KPI title="完了クエスト" value={`${doneCount}/${totalCount}`} />
        <KPI title="獲得ポイント" value={`${todayEarned}`} />
        <KPI title="達成率" value={`${achievementRate}%`} />
      </section>
    </>
  );
});

const KPI = memo(function KPI({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white/80 p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="text-xs text-neutral-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
});
