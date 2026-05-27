import { ImageResponse } from "@vercel/og";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { GOAL_VAULT_ADDRESS, goalVaultAbi } from "@/lib/contracts";

export const runtime = "edge";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://sepolia.base.org"),
});

export async function GET(_req: Request, { params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params;
  let name = "Savings Goal";
  let progress = 0;

  try {
    const goal = await client.readContract({
      address: GOAL_VAULT_ADDRESS,
      abi: goalVaultAbi,
      functionName: "getGoal",
      args: [BigInt(goalId)],
    });
    const [, goalName, targetAmount, , , , currentValue] = goal;
    name = goalName;
    progress = targetAmount > 0n ? Math.min(100, Number((currentValue * 100n) / targetAmount)) : 0;
  } catch {
    // fallback for undeployed contract
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#171719",
          color: "white",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 32, marginTop: 16, color: "#34C759" }}>{progress}% funded</div>
        <div style={{ fontSize: 24, marginTop: 32, color: "#8E8E93" }}>savr.app</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
