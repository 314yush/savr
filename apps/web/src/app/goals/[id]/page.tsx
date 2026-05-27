"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useGoal } from "@/hooks/useGoals";
import { formatUsd, progressPercent } from "@/lib/format";
import { ProgressRing } from "@/components/goals/GoalCard";

export default function GoalDetailPage() {
  const params = useParams();
  const goalId = Number(params.id);
  const { goal, deadline } = useGoal(goalId);

  if (!goal) {
    return (
      <div className="px-6 py-8">
        <p className="text-[#8E8E93]">Loading goal…</p>
      </div>
    );
  }

  const progress = progressPercent(goal.currentValue, goal.targetAmount);
  const isComplete = progress >= 100;

  return (
    <div className="px-6 py-6 min-h-screen pb-12">
      <Link href="/goals" className="text-[#8E8E93] text-[14px]">
        ← Back
      </Link>
      <div className="mt-6 flex justify-center">
        <ProgressRing percent={progress} size={140} />
      </div>
      <h1 className="text-[24px] font-semibold text-center mt-6">{goal.name}</h1>
      <p className="text-center text-[#8E8E93] mt-2">
        {formatUsd(goal.currentValue)} of {formatUsd(goal.targetAmount)}
      </p>
      <p className="text-center text-[#34C759] mt-1">+{formatUsd(goal.yieldAmount)} yield earned</p>
      {deadline && (
        <p className="text-center text-[#636366] text-[13px] mt-2">
          Deadline: {new Date(Number(deadline) * 1000).toLocaleDateString()}
        </p>
      )}

      <div className="mt-8 space-y-3">
        <Link
          href={`/goals/${goalId}/deposit`}
          className="block w-full bg-white text-[#171719] font-semibold py-4 rounded-full text-center"
        >
          Deposit
        </Link>
        <Link
          href={`/goals/${goalId}/withdraw`}
          className="block w-full bg-[#242426] text-white font-semibold py-4 rounded-full text-center"
        >
          Withdraw
        </Link>
        <Link
          href={`/fund/${goalId}`}
          className="block w-full text-[#8E8E93] text-[14px] text-center py-2"
        >
          Share goal link
        </Link>
      </div>

      {isComplete && (
        <div className="mt-8 bg-[#1B3B26] rounded-[20px] p-5 text-center">
          <p className="text-[#34C759] font-semibold text-[18px]">Goal reached!</p>
          <p className="text-[#8E8E93] text-[14px] mt-2">Time to withdraw and celebrate.</p>
        </div>
      )}
    </div>
  );
}
