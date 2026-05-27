"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import Link from "next/link";
import { GOAL_VAULT_ADDRESS, goalVaultAbi } from "@/lib/contracts";
import { parseUsdInput, formatUsd } from "@/lib/format";

export default function CreateGoalPage() {
  const { address, isConnected } = useAccount();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [reminderCadence, setReminderCadence] = useState("weekly");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const weeklyHint = target && deadline
    ? formatUsd(parseUsdInput(target) / BigInt(Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / (7 * 24 * 3600 * 1000)))))
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    const targetAmount = parseUsdInput(target);
    const deadlineTs = BigInt(Math.floor(new Date(deadline).getTime() / 1000));

    writeContract({
      address: GOAL_VAULT_ADDRESS,
      abi: goalVaultAbi,
      functionName: "createGoal",
      args: [name, targetAmount, deadlineTs],
    });
  }

  if (isSuccess && hash && address) {
    return (
      <div className="px-6 py-8 min-h-screen">
        <h1 className="text-[24px] font-semibold mb-4">Goal created!</h1>
        <p className="text-[#8E8E93] mb-6">Your goal is live on-chain.</p>
        <Link href="/" className="block w-full bg-white text-[#171719] font-semibold py-4 rounded-full text-center">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 min-h-screen pb-12">
      <Link href="/goals" className="text-[#8E8E93] text-[14px]">
        ← Back
      </Link>
      <h1 className="text-[24px] font-semibold mt-4 mb-6">New Goal</h1>

      {!isConnected ? (
        <p className="text-[#8E8E93]">Connect your wallet to create a goal.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[12px] text-[#8E8E93] uppercase tracking-widest font-bold">Goal name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
              className="w-full mt-2 bg-[#242426] rounded-[12px] px-4 py-3 text-white outline-none"
              placeholder="Trip to Japan"
            />
          </div>
          <div>
            <label className="text-[12px] text-[#8E8E93] uppercase tracking-widest font-bold">Target amount</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
              inputMode="decimal"
              className="w-full mt-2 bg-[#242426] rounded-[12px] px-4 py-3 text-white outline-none"
              placeholder="$500"
            />
            {weeklyHint && (
              <p className="text-[#8E8E93] text-[13px] mt-2">
                To reach {formatUsd(parseUsdInput(target))} by {deadline}, save ~{weeklyHint}/week
              </p>
            )}
          </div>
          <div>
            <label className="text-[12px] text-[#8E8E93] uppercase tracking-widest font-bold">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              min={new Date().toISOString().split("T")[0]}
              className="w-full mt-2 bg-[#242426] rounded-[12px] px-4 py-3 text-white outline-none"
            />
          </div>
          <div>
            <label className="text-[12px] text-[#8E8E93] uppercase tracking-widest font-bold">Cover image URL (optional)</label>
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full mt-2 bg-[#242426] rounded-[12px] px-4 py-3 text-white outline-none"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="text-[12px] text-[#8E8E93] uppercase tracking-widest font-bold">Email reminders</label>
            <select
              value={reminderCadence}
              onChange={(e) => setReminderCadence(e.target.value)}
              className="w-full mt-2 bg-[#242426] rounded-[12px] px-4 py-3 text-white outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="off">Off</option>
            </select>
          </div>
          <p className="text-[#636366] text-[12px] leading-relaxed">
            Savr takes 15% of yield earned at withdrawal. Principal is always returned in full. Funds are deposited into
            Euler Finance on Base — see onboarding for risk disclosures.
          </p>
          <button
            type="submit"
            disabled={isPending || confirming}
            className="w-full bg-white text-[#171719] font-semibold py-4 rounded-full disabled:opacity-50"
          >
            {isPending || confirming ? "Creating…" : "Create Goal"}
          </button>
        </form>
      )}
    </div>
  );
}
