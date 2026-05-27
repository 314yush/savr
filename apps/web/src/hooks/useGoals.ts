"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GOAL_VAULT_ADDRESS, goalVaultAbi } from "@/lib/contracts";
import type { GoalView } from "@/components/goals/GoalCard";
import { fetchGoalMetadata, fetchWalletGoalMetadata } from "@/lib/api";

export function useGoals() {
  const { address } = useAccount();

  const { data: goalIds, isLoading: idsLoading, refetch: refetchIds } = useReadContract({
    address: GOAL_VAULT_ADDRESS,
    abi: goalVaultAbi,
    functionName: "getOwnerGoalIds",
    args: address ? [address] : undefined,
    query: { enabled: !!address && GOAL_VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000" },
  });

  const ids = goalIds ?? [];

  const goalContracts = useMemo(
    () =>
      ids.flatMap((id) => [
        {
          address: GOAL_VAULT_ADDRESS,
          abi: goalVaultAbi,
          functionName: "getGoal" as const,
          args: [id],
        },
        {
          address: GOAL_VAULT_ADDRESS,
          abi: goalVaultAbi,
          functionName: "getYield" as const,
          args: [id],
        },
      ]),
    [ids]
  );

  const { data: goalResults, isLoading: goalsLoading, refetch: refetchGoals } = useReadContracts({
    contracts: goalContracts,
    query: { enabled: ids.length > 0 },
  });

  const { data: metadata } = useQuery({
    queryKey: ["goal-metadata", address],
    queryFn: () => fetchWalletGoalMetadata(address!),
    enabled: !!address,
  });

  const goals: GoalView[] = useMemo(() => {
    if (!goalResults) return [];
    const metaMap = new Map(metadata?.map((m) => [m.goalId, m]) ?? []);

    return ids.map((id, index) => {
      const goalData = goalResults[index * 2]?.result as
        | [string, string, bigint, bigint, bigint, bigint, bigint, boolean]
        | undefined;
      const yieldAmount = (goalResults[index * 2 + 1]?.result as bigint | undefined) ?? 0n;
      if (!goalData) {
        return {
          id: Number(id),
          name: "Loading…",
          targetAmount: 0n,
          currentValue: 0n,
          yieldAmount: 0n,
          active: true,
        };
      }
      const [, name, targetAmount, , , , currentValue, active] = goalData;
      return {
        id: Number(id),
        name,
        targetAmount,
        currentValue,
        yieldAmount,
        coverImage: metaMap.get(Number(id))?.coverImage,
        active,
      };
    });
  }, [goalResults, ids, metadata]);

  return {
    goals,
    activeGoals: goals.filter((g) => g.active),
    isLoading: idsLoading || goalsLoading,
    refetch: async () => {
      await refetchIds();
      await refetchGoals();
    },
  };
}

export function useGoal(goalId: number) {
  const { data: goalData, refetch: refetchGoal } = useReadContract({
    address: GOAL_VAULT_ADDRESS,
    abi: goalVaultAbi,
    functionName: "getGoal",
    args: [BigInt(goalId)],
    query: { enabled: goalId > 0 },
  });

  const { data: yieldAmount, refetch: refetchYield } = useReadContract({
    address: GOAL_VAULT_ADDRESS,
    abi: goalVaultAbi,
    functionName: "getYield",
    args: [BigInt(goalId)],
    query: { enabled: goalId > 0 },
  });

  const { data: metadata } = useQuery({
    queryKey: ["goal-metadata", goalId],
    queryFn: () => fetchGoalMetadata(goalId),
  });

  const goal: GoalView | null = useMemo(() => {
    if (!goalData) return null;
    const [, name, targetAmount, , , , currentValue, active] = goalData;
    return {
      id: goalId,
      name,
      targetAmount,
      currentValue,
      yieldAmount: yieldAmount ?? 0n,
      coverImage: metadata?.coverImage,
      active,
    };
  }, [goalData, goalId, metadata, yieldAmount]);

  return {
    goal,
    owner: goalData?.[0],
    deadline: goalData?.[3],
    refetch: async () => {
      await refetchGoal();
      await refetchYield();
    },
  };
}
