import { API_URL } from "./contracts";

export async function fetchProfile(wallet: string) {
  const res = await fetch(`${API_URL}/profiles/${wallet}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json() as Promise<{ walletAddress: string; email: string | null; emailConsent: boolean }>;
}

export async function updateProfile(wallet: string, data: { email?: string; emailConsent?: boolean }) {
  const res = await fetch(`${API_URL}/profiles/${wallet}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: wallet, ...data }),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function fetchGoalMetadata(goalId: number) {
  const res = await fetch(`${API_URL}/goals/${goalId}/metadata`);
  if (!res.ok) throw new Error("Failed to fetch goal metadata");
  return res.json() as Promise<{ goalId: number; coverImage: string | null; reminderCadence: string }>;
}

export async function updateGoalMetadata(data: {
  goalId: number;
  walletAddress: string;
  coverImage?: string;
  reminderCadence?: string;
  reminderDay?: number;
}) {
  const res = await fetch(`${API_URL}/goals/metadata`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update goal metadata");
  return res.json();
}

export async function fetchWalletGoalMetadata(wallet: string) {
  const res = await fetch(`${API_URL}/goals/metadata/wallet/${wallet}`);
  if (!res.ok) throw new Error("Failed to fetch wallet goal metadata");
  return res.json() as Promise<
    Array<{ goalId: number; coverImage: string | null; reminderCadence: string; reminderDay: number }>
  >;
}

export async function unsubscribe(wallet: string) {
  const res = await fetch(`${API_URL}/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  if (!res.ok) throw new Error("Failed to unsubscribe");
  return res.json();
}
