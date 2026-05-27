export function formatUsd(amount: bigint | number, decimals = 6): string {
  const value = typeof amount === "bigint" ? Number(amount) / 10 ** decimals : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseUsdInput(value: string): bigint {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0n;
  return BigInt(Math.round(num * 1e6));
}

export function progressPercent(current: bigint, target: bigint): number {
  if (target === 0n) return 0;
  return Math.min(100, Number((current * 10000n) / target) / 100);
}

export function weeklySaveAmount(current: bigint, target: bigint, deadline: bigint): bigint {
  const remaining = target > current ? target - current : 0n;
  const secondsLeft = Number(deadline) - Date.now() / 1000;
  const weeksLeft = Math.max(1, Math.ceil(secondsLeft / (7 * 24 * 3600)));
  return remaining / BigInt(weeksLeft);
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function displayName(address?: string): string {
  if (!address) return "there";
  return shortAddress(address);
}
