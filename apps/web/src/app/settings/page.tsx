"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { fetchProfile, updateProfile } from "@/lib/api";
import { shortAddress } from "@/lib/format";

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const [emailReminders, setEmailReminders] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!address) return;
    fetchProfile(address)
      .then((p) => {
        setEmail(p.email ?? "");
        setEmailReminders(p.emailConsent);
      })
      .catch(() => undefined);
  }, [address]);

  async function handleSave() {
    if (!address) return;
    setSaving(true);
    try {
      await updateProfile(address, { email: email || undefined, emailConsent: emailReminders });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col relative pb-[84px]">
      <Header />
      <div className="px-6 mt-6 flex-1 flex flex-col">
        <h2 className="text-[20px] font-semibold tracking-tight mb-5">Settings</h2>
        <div className="bg-[#242426] rounded-[20px] overflow-hidden mb-4">
          <div className="p-5 border-b border-[#3A3A3C]">
            <p className="text-white text-[14px] font-medium">Wallet</p>
            <p className="text-[#8E8E93] text-[12px] mt-0.5">
              {isConnected && address ? shortAddress(address) : "Not connected"}
            </p>
          </div>
          <div className="p-5 flex justify-between items-center border-b border-[#3A3A3C]">
            <div>
              <p className="text-white text-[14px] font-medium">Email Reminders</p>
              <p className="text-[#8E8E93] text-[12px] mt-0.5">Weekly save nudges via email</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailReminders(!emailReminders)}
              className={`w-12 h-6 rounded-full transition-colors ${emailReminders ? "bg-[#34C759]" : "bg-[#3A3A3C]"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${emailReminders ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>
          <div className="p-5 border-b border-[#3A3A3C]">
            <label className="text-white text-[14px] font-medium">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full mt-2 bg-[#303033] rounded-[8px] px-3 py-2 text-white text-[14px] outline-none"
            />
          </div>
          <button type="button" onClick={handleSave} disabled={saving} className="w-full p-5 text-left border-b border-[#3A3A3C]">
            <p className="text-white text-[14px] font-medium">{saving ? "Saving…" : saved ? "Saved ✓" : "Save preferences"}</p>
          </button>
          <div className="p-5 border-b border-[#3A3A3C]">
            <p className="text-white text-[14px] font-medium">Risk disclosures</p>
            <p className="text-[#8E8E93] text-[12px] mt-2 leading-relaxed">
              Savr is non-custodial. Funds are deposited into Euler Finance smart contracts on Base. Smart contract and
              stablecoin (USDC) risks apply. Yield is not guaranteed.
            </p>
          </div>
          <a href="/onboarding" className="block p-5">
            <p className="text-white text-[14px] font-medium">How Savr works</p>
          </a>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
