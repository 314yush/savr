"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { GoalCard } from "@/components/goals/GoalCard";
import { useGoals } from "@/hooks/useGoals";

export default function GoalsPage() {
  const { isConnected } = useAccount();
  const { activeGoals, isLoading } = useGoals();

  return (
    <div className="w-full min-h-screen flex flex-col relative pb-[84px]">
      <Header />
      <div className="px-6 mt-6 flex-1 flex flex-col">
        <div className="flex justify-between items-end mb-5">
          <h2 className="text-[20px] font-semibold tracking-tight">All Goals</h2>
          <Link href="/goals/create" className="text-[14px] font-medium text-[#34C759] mb-0.5">
            + New
          </Link>
        </div>
        {!isConnected ? (
          <p className="text-[#8E8E93]">Connect your wallet to view goals.</p>
        ) : isLoading ? (
          <p className="text-[#8E8E93]">Loading…</p>
        ) : activeGoals.length === 0 ? (
          <p className="text-[#8E8E93]">No active goals.</p>
        ) : (
          activeGoals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
        )}
      </div>
      <BottomNav />
    </div>
  );
}
