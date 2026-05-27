"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { displayName } from "@/lib/format";

export function Header() {
  const { address } = useAccount();

  return (
    <div className="px-6 mt-2 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-[34px] h-[34px] rounded-full bg-[#303033] flex items-center justify-center text-[15px] font-semibold text-[#EBEBEB]">
          {address ? address.slice(2, 3).toUpperCase() : "?"}
        </div>
        <h1 className="text-[19px] font-semibold tracking-tight">Hi, {displayName(address)}</h1>
      </div>
      <ConnectButton chainStatus="none" showBalance={false} accountStatus="avatar" />
    </div>
  );
}

export function PageTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 mt-6 flex justify-between items-end mb-5">
      <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="text-[14px] font-medium text-[#8E8E93] mb-0.5">
      {label}
    </Link>
  );
}
