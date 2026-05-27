"use client";

import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useGoals } from "@/hooks/useGoals";
import { formatUsd } from "@/lib/format";

export default function ActivityPage() {
  const { goals } = useGoals();

  const activities = goals.flatMap((goal) => [
    {
      label: `${goal.name} — saved`,
      amount: formatUsd(goal.currentValue),
      date: "Current",
    },
    ...(goal.yieldAmount > 0n
      ? [{ label: `Interest on ${goal.name}`, amount: `+${formatUsd(goal.yieldAmount)}`, date: "Accrued" }]
      : []),
  ]);

  return (
    <div className="w-full min-h-screen flex flex-col relative pb-[84px]">
      <Header />
      <div className="px-6 mt-6 flex-1 flex flex-col">
        <h2 className="text-[20px] font-semibold tracking-tight mb-5">Activity</h2>
        {activities.length === 0 ? (
          <p className="text-[#8E8E93]">No activity yet.</p>
        ) : (
          <div className="bg-[#242426] rounded-[20px] overflow-hidden">
            {activities.map((activity, index) => (
              <div
                key={index}
                className={`p-5 flex justify-between items-center ${index < activities.length - 1 ? "border-b border-[#3A3A3C]" : ""}`}
              >
                <div>
                  <p className="text-white text-[14px] font-medium">{activity.label}</p>
                  <p className="text-[#8E8E93] text-[12px] mt-0.5">{activity.date}</p>
                </div>
                <span className="text-[#34C759] text-[14px] font-semibold">{activity.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
