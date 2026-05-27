"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SavingsOverview, GoalCard } from "@/components/goals/GoalCard";
import { useGoals } from "@/hooks/useGoals";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { goals, activeGoals, isLoading } = useGoals();

  return (
    <div className="w-full min-h-screen flex flex-col relative pb-[84px]">
      <Header />
      {!isConnected ? (
        <div className="px-6 mt-12 flex flex-col items-center text-center gap-6">
          <h2 className="text-[24px] font-semibold tracking-tight">Save for what matters</h2>
          <p className="text-[#8E8E93] text-[15px] leading-relaxed">
            Create goals, deposit USDC, and earn real yield on Base through Euler Finance.
          </p>
          <ConnectButton />
          <Link href="/onboarding" className="text-[14px] text-[#8E8E93] underline">
            Learn how Savr works
          </Link>
        </div>
      ) : (
        <>
          <SavingsOverview goals={goals} />
          <div className="px-6 mt-8 flex-1 flex flex-col">
            <div className="flex justify-between items-end mb-5">
              <h2 className="text-[20px] font-semibold tracking-tight">My goals</h2>
              <Link href="/goals" className="text-[14px] font-medium text-[#8E8E93] mb-0.5">
                View all
              </Link>
            </div>
            {isLoading ? (
              <p className="text-[#8E8E93]">Loading goals…</p>
            ) : activeGoals.length === 0 ? (
              <div className="bg-[#242426] rounded-[20px] p-6 text-center">
                <p className="text-[#8E8E93] mb-4">No goals yet. Create your first one!</p>
                <Link
                  href="/goals/create"
                  className="inline-block bg-white text-[#171719] font-semibold px-6 py-3 rounded-full"
                >
                  + New Goal
                </Link>
              </div>
            ) : (
              activeGoals.slice(0, 2).map((goal) => <GoalCard key={goal.id} goal={goal} />)
            )}
          </div>
          {isConnected && (
            <Link
              href="/goals/create"
              className="fixed bottom-[100px] right-[calc(50%-195px)] w-14 h-14 bg-white text-[#171719] rounded-full flex items-center justify-center text-2xl font-light shadow-lg z-40"
            >
              +
            </Link>
          )}
        </>
      )}
      <BottomNav />
    </div>
  );
}
