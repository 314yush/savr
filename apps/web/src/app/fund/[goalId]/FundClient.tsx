"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useGoal } from "@/hooks/useGoals";
import { formatUsd, progressPercent } from "@/lib/format";
import { ProgressRing } from "@/components/goals/GoalCard";

export default function FundClient() {
  const params = useParams();
  const goalId = Number(params.goalId);
  const { goal } = useGoal(goalId);

  if (!goal) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-[#8E8E93]">Loading goal…</p>
      </div>
    );
  }

  const progress = progressPercent(goal.currentValue, goal.targetAmount);
  const remaining = goal.targetAmount > goal.currentValue ? goal.targetAmount - goal.currentValue : 0n;

  return (
    <div className="px-6 py-8 min-h-screen flex flex-col items-center">
      <p className="text-[#636366] text-[12px] uppercase tracking-widest font-bold mb-6">Savr</p>
      <ProgressRing percent={progress} size={140} />
      <h1 className="text-[24px] font-semibold mt-6 text-center">{goal.name}</h1>
      <p className="text-[#8E8E93] mt-2 text-center">
        {formatUsd(goal.currentValue)} saved · {formatUsd(remaining)} to go
      </p>

      <div className="w-full mt-10 space-y-3">
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <button
              type="button"
              onClick={openConnectModal}
              disabled={!mounted}
              className="w-full bg-white text-[#171719] font-semibold py-4 rounded-full"
            >
              Connect wallet to contribute
            </button>
          )}
        </ConnectButton.Custom>
        <Link
          href={`/goals/${goalId}/deposit`}
          className="block w-full bg-[#242426] text-white font-semibold py-4 rounded-full text-center"
        >
          Deposit USDC
        </Link>
      </div>

      <p className="text-[#636366] text-[12px] mt-8 text-center leading-relaxed">
        Contributions go directly on-chain. Goal owner wallet is not shown publicly.
      </p>
    </div>
  );
}
