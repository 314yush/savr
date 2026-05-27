"use client";

import Link from "next/link";
import { formatUsd, progressPercent } from "@/lib/format";

export type GoalView = {
  id: number;
  name: string;
  targetAmount: bigint;
  currentValue: bigint;
  yieldAmount: bigint;
  coverImage?: string | null;
  active: boolean;
};

export function ProgressRing({ percent, size = 100 }: { percent: number; size?: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#303033" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
        <span className="text-[22px] font-bold text-white leading-none tracking-tight">
          {Math.round(percent)}%
        </span>
        <span className="text-[9px] font-bold text-[#8E8E93] tracking-widest mt-1.5">OVERALL</span>
      </div>
    </div>
  );
}

export function SavingsOverview({ goals }: { goals: GoalView[] }) {
  const activeGoals = goals.filter((g) => g.active);
  const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentValue, 0n);
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0n);
  const totalYield = activeGoals.reduce((sum, g) => sum + g.yieldAmount, 0n);
  const leftToSave = totalTarget > totalSaved ? totalTarget - totalSaved : 0n;
  const overallProgress = progressPercent(totalSaved, totalTarget);

  return (
    <div className="mx-6 mt-6 bg-[#242426] rounded-[28px] p-6 pb-7">
      <div className="flex items-start">
        <ProgressRing percent={overallProgress} />
        <div className="ml-7 flex-1">
          <h2 className="text-[10px] font-bold text-[#8E8E93] tracking-widest uppercase">Total saved</h2>
          <div className="text-[34px] font-semibold text-white leading-none mt-2 tracking-tight">
            {formatUsd(totalSaved)}
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <div className="bg-[#1B3B26] text-[#34C759] text-[12px] font-semibold px-2 py-0.5 rounded-[4px] tracking-tight">
              +{formatUsd(totalYield)}
            </div>
            <span className="text-[#8E8E93] text-[13px] font-medium">interest</span>
          </div>
          <div className="flex items-center mt-5">
            <div className="flex flex-col">
              <span className="text-white font-semibold text-[15px] leading-tight">{activeGoals.length}</span>
              <span className="text-[#8E8E93] text-[11px] font-medium mt-0.5">goals</span>
            </div>
            <div className="w-[1px] h-[22px] bg-[#3A3A3C] mx-5 mt-1" />
            <div className="flex flex-col">
              <span className="text-white font-semibold text-[15px] leading-tight">{formatUsd(leftToSave)}</span>
              <span className="text-[#8E8E93] text-[11px] font-medium mt-0.5">left to save</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GoalCard({ goal }: { goal: GoalView }) {
  const progress = progressPercent(goal.currentValue, goal.targetAmount);

  return (
    <Link href={`/goals/${goal.id}`} className="block bg-[#242426] rounded-[20px] overflow-hidden mb-5">
      <div className="h-[105px] bg-[#303033] flex items-center justify-center overflow-hidden">
        {goal.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={goal.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#636366] text-[13px] font-medium">cover image</span>
        )}
      </div>
      <div className="p-5 pb-6">
        <h3 className="text-white font-semibold text-[17px] tracking-tight">{goal.name}</h3>
        <div className="flex justify-between items-center mt-1.5 mb-4">
          <div className="text-[14px]">
            <span className="text-white font-medium">{formatUsd(goal.currentValue)}</span>
            <span className="text-[#8E8E93] font-medium"> / {formatUsd(goal.targetAmount)}</span>
          </div>
          <span className="text-[#34C759] text-[13px] font-semibold tracking-tight">
            +{formatUsd(goal.yieldAmount)} yield
          </span>
        </div>
        <div className="w-full h-[3px] bg-[#3A3A3C] rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </Link>
  );
}
