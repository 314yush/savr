"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { unsubscribe } from "@/lib/api";
import Link from "next/link";

export default function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const wallet = searchParams.get("wallet") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    if (!wallet) return;
    setStatus("loading");
    unsubscribe(wallet)
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));
  }, [wallet]);

  return (
    <div className="px-6 py-12 min-h-screen text-center">
      <h1 className="text-[24px] font-semibold">Email preferences</h1>
      {status === "loading" && <p className="text-[#8E8E93] mt-4">Unsubscribing…</p>}
      {status === "done" && (
        <p className="text-[#34C759] mt-4">You&apos;ve been unsubscribed from Savr email reminders.</p>
      )}
      {status === "error" && <p className="text-[#FF3B30] mt-4">Something went wrong. Try again from Settings.</p>}
      {!wallet && <p className="text-[#8E8E93] mt-4">Invalid unsubscribe link.</p>}
      <Link href="/settings" className="inline-block mt-8 text-[#8E8E93] underline">
        Manage settings
      </Link>
    </div>
  );
}
