"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { motion } from "framer-motion";
import { GOAL_VAULT_ADDRESS, goalVaultAbi } from "@/lib/contracts";
import { formatUsd } from "@/lib/format";
import { useGoal } from "@/hooks/useGoals";

export default function WithdrawPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = Number(params.id);
  const { address, isConnected } = useAccount();
  const { goal, owner, refetch } = useGoal(goalId);
  const [done, setDone] = useState(false);

  const { data: feeRateBps } = useReadContract({
    address: GOAL_VAULT_ADDRESS,
    abi: goalVaultAbi,
    functionName: "feeRateBps",
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const yieldAmount = goal?.yieldAmount ?? 0n;
  const feeAmount = feeRateBps ? (yieldAmount * feeRateBps) / 10_000n : 0n;
  const netAmount = goal ? goal.currentValue - feeAmount : 0n;
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  useEffect(() => {
    if (isSuccess) {
      setDone(true);
      refetch();
    }
  }, [isSuccess, refetch]);

  if (!goal) return <div className="px-6 py-8 text-[#8E8E93]">Loading…</div>;

  if (done) {
    return (
      <div className="px-6 py-12 min-h-screen flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-[48px] mb-4">
          🎉
        </motion.div>
        <h1 className="text-[24px] font-semibold">Withdrawal complete!</h1>
        <p className="text-[#8E8E93] mt-2">{formatUsd(netAmount)} sent to your wallet.</p>
        <Link href="/goals/create" className="mt-8 bg-white text-[#171719] font-semibold px-8 py-4 rounded-full">
          Start a new goal
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 min-h-screen pb-12">
      <Link href={`/goals/${goalId}`} className="text-[#8E8E93] text-[14px]">
        ← Back
      </Link>
      <h1 className="text-[22px] font-semibold mt-4">Withdraw from {goal.name}</h1>

      <div className="mt-8 bg-[#242426] rounded-[20px] p-5 space-y-4">
        <Row label="Principal" value={formatUsd(goal.currentValue - yieldAmount)} />
        <Row label="Yield earned" value={`+${formatUsd(yieldAmount)}`} highlight />
        <Row
          label={`Savr fee (${feeRateBps ? Number(feeRateBps) / 100 : 15}%)`}
          value={`-${formatUsd(feeAmount)}`}
        />
        <div className="border-t border-[#3A3A3C] pt-4 flex justify-between">
          <span className="font-semibold">You receive</span>
          <span className="font-semibold text-[#34C759]">{formatUsd(netAmount)}</span>
        </div>
      </div>

      <p className="text-[#636366] text-[12px] mt-4 leading-relaxed">
        Early withdrawal is allowed. Your principal is always returned in full; the fee applies only to yield earned.
      </p>

      {!isConnected ? (
        <p className="text-[#8E8E93] mt-6">Connect wallet to withdraw.</p>
      ) : !isOwner ? (
        <p className="text-[#8E8E93] mt-6">Only the goal owner can withdraw.</p>
      ) : (
        <button
          type="button"
          onClick={() =>
            writeContract({
              address: GOAL_VAULT_ADDRESS,
              abi: goalVaultAbi,
              functionName: "withdraw",
              args: [BigInt(goalId)],
            })
          }
          disabled={isPending || confirming || goal.currentValue === 0n}
          className="w-full mt-8 bg-white text-[#171719] font-semibold py-4 rounded-full disabled:opacity-50"
        >
          {isPending || confirming ? "Withdrawing…" : "Confirm Withdraw"}
        </button>
      )}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-[14px]">
      <span className="text-[#8E8E93]">{label}</span>
      <span className={highlight ? "text-[#34C759] font-semibold" : "text-white font-medium"}>{value}</span>
    </div>
  );
}
