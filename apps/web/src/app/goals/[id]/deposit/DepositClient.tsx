"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { motion } from "framer-motion";
import { GOAL_VAULT_ADDRESS, USDC_ADDRESS, erc20Abi, goalVaultAbi } from "@/lib/contracts";
import { formatUsd, parseUsdInput, progressPercent, weeklySaveAmount } from "@/lib/format";
import { useGoal } from "@/hooks/useGoals";
import { ProgressRing } from "@/components/goals/GoalCard";

const QUICK_AMOUNTS = [5, 10, 25, 50];

export default function DepositPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const goalId = Number(params.id);
  const { address, isConnected } = useAccount();
  const { goal, deadline, refetch } = useGoal(goalId);
  const [amount, setAmount] = useState(searchParams.get("amount") ?? "");
  const [step, setStep] = useState<"idle" | "approving" | "depositing" | "done">("idle");

  const amountBig = parseUsdInput(amount);
  const previewValue = goal ? goal.currentValue + amountBig : 0n;
  const previewProgress = goal ? progressPercent(previewValue, goal.targetAmount) : 0;

  const behindAmount = useMemo(() => {
    if (!goal || !deadline) return 0n;
    return weeklySaveAmount(goal.currentValue, goal.targetAmount, deadline);
  }, [goal, deadline]);

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, GOAL_VAULT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract();
  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: depositSuccess, isLoading: depositConfirming } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  useEffect(() => {
    if (approveSuccess && step === "approving") {
      setStep("depositing");
      writeDeposit({
        address: GOAL_VAULT_ADDRESS,
        abi: goalVaultAbi,
        functionName: "deposit",
        args: [BigInt(goalId), amountBig],
      });
    }
  }, [approveSuccess, step, writeDeposit, goalId, amountBig]);

  useEffect(() => {
    if (depositSuccess) {
      setStep("done");
      refetch();
    }
  }, [depositSuccess, refetch]);

  function handleDeposit() {
    if (!address || amountBig < 1_000_000n) return;
    if ((allowance ?? 0n) < amountBig) {
      setStep("approving");
      writeApprove({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [GOAL_VAULT_ADDRESS, amountBig],
      });
    } else {
      setStep("depositing");
      writeDeposit({
        address: GOAL_VAULT_ADDRESS,
        abi: goalVaultAbi,
        functionName: "deposit",
        args: [BigInt(goalId), amountBig],
      });
    }
  }

  if (!goal) return <div className="px-6 py-8 text-[#8E8E93]">Loading…</div>;

  if (step === "done") {
    return (
      <div className="px-6 py-12 min-h-screen flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[48px] mb-4"
        >
          ✓
        </motion.div>
        <h1 className="text-[24px] font-semibold">Deposited {formatUsd(amountBig)}!</h1>
        <p className="text-[#8E8E93] mt-2">Interest starts accruing immediately.</p>
        <Link href={`/goals/${goalId}`} className="mt-8 bg-white text-[#171719] font-semibold px-8 py-4 rounded-full">
          Back to goal
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 min-h-screen pb-12">
      <Link href={`/goals/${goalId}`} className="text-[#8E8E93] text-[14px]">
        ← Back
      </Link>
      <h1 className="text-[22px] font-semibold mt-4">{goal.name}</h1>
      <div className="flex justify-center mt-6">
        <ProgressRing percent={previewProgress} size={120} />
      </div>
      <p className="text-center text-[#8E8E93] text-[14px] mt-4">
        {behindAmount > 0n
          ? `You're ${formatUsd(behindAmount)} behind your weekly goal`
          : "You're on track!"}
      </p>

      <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(String(v))}
            className="flex-shrink-0 px-4 py-2 bg-[#242426] rounded-full text-[14px] font-medium"
          >
            ${v}
          </button>
        ))}
        {behindAmount > 0n && (
          <button
            type="button"
            onClick={() => setAmount(String(Number(behindAmount) / 1e6))}
            className="flex-shrink-0 px-4 py-2 bg-[#242426] rounded-full text-[14px] font-medium"
          >
            {formatUsd(behindAmount)}
          </button>
        )}
      </div>

      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="Custom amount"
        className="w-full mt-4 bg-[#242426] rounded-[12px] px-4 py-3 text-white outline-none text-[18px]"
      />

      <p className="text-[#636366] text-[13px] mt-3">Wallet balance: {formatUsd(balance ?? 0n)}</p>

      {!isConnected ? (
        <p className="text-[#8E8E93] mt-6">Connect wallet to deposit.</p>
      ) : (
        <button
          type="button"
          onClick={handleDeposit}
          disabled={step !== "idle" || depositConfirming || amountBig < 1_000_000n}
          className="w-full mt-8 bg-white text-[#171719] font-semibold py-4 rounded-full disabled:opacity-50"
        >
          {step === "approving"
            ? "Approving…"
            : step === "depositing" || depositConfirming
              ? "Depositing…"
              : `Deposit ${amount ? formatUsd(amountBig) : ""}`}
        </button>
      )}
    </div>
  );
}
