import { Resend } from "resend";
import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";
import { pool } from "../db/client.js";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const webUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";
const rpcUrl = process.env.RPC_URL ?? "https://sepolia.base.org";
const vaultAddress = process.env.GOAL_VAULT_ADDRESS as `0x${string}` | undefined;

const goalVaultAbi = parseAbi([
  "function getGoal(uint256 goalId) view returns (address owner, string name, uint256 targetAmount, uint256 deadline, uint256 sharesOwned, uint256 principalDeposited, uint256 currentValue, bool active)",
]);

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});

function getWeeksUntilDeadline(deadline: bigint): number {
  const seconds = Number(deadline) - Date.now() / 1000;
  return Math.max(1, Math.ceil(seconds / (7 * 24 * 3600)));
}

function formatUsd(amount: bigint): string {
  return `$${(Number(amount) / 1e6).toFixed(2)}`;
}

export async function runReminderJob() {
  const today = new Date().getDay();
  const sent: string[] = [];

  const { rows } = await pool.query(`
    SELECT p.wallet_address, p.email, gm.goal_id, gm.reminder_cadence, gm.reminder_day
    FROM profiles p
    JOIN goal_metadata gm ON gm.wallet_address = p.wallet_address
    WHERE p.email_consent = true AND p.email IS NOT NULL
      AND gm.reminder_cadence != 'off'
      AND gm.reminder_day = $1
  `, [today]);

  for (const row of rows) {
    if (!vaultAddress) continue;

    try {
      const goal = await client.readContract({
        address: vaultAddress,
        abi: goalVaultAbi,
        functionName: "getGoal",
        args: [BigInt(row.goal_id)],
      });

      const [, name, targetAmount, deadline, , , currentValue, active] = goal;
      if (!active) continue;

      const remaining = targetAmount > currentValue ? targetAmount - currentValue : 0n;
      const weeksLeft = getWeeksUntilDeadline(deadline);
      const weeklyTarget = remaining / BigInt(weeksLeft);
      const progress = targetAmount > 0n ? Number((currentValue * 10000n) / targetAmount) / 100 : 0;

      const behind = weeklyTarget > 0n;
      const subject = behind
        ? `You're behind on ${name} — Savr reminder`
        : `${name} is at ${progress.toFixed(0)}%! Keep it up`;
      const depositUrl = `${webUrl}/goals/${row.goal_id}/deposit?amount=${Number(weeklyTarget / 1_000_000n)}`;
      const html = `
        <p>Hi there,</p>
        <p>${behind ? `You're about ${formatUsd(weeklyTarget)} behind your weekly target for <strong>${name}</strong>.` : `<strong>${name}</strong> is at ${progress.toFixed(0)}% — you're on track!`}</p>
        <p>Current saved: ${formatUsd(currentValue)} of ${formatUsd(targetAmount)}</p>
        <p><a href="${depositUrl}">Deposit now</a></p>
        <p><a href="${webUrl}/unsubscribe?wallet=${row.wallet_address}">Unsubscribe</a></p>
      `;

      if (resend) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "reminders@savr.app",
          to: row.email,
          subject,
          html,
        });
      }

      sent.push(`${row.email}:${row.goal_id}`);
    } catch (err) {
      console.error(`Failed reminder for goal ${row.goal_id}`, err);
    }
  }

  return { sent: sent.length, recipients: sent };
}
