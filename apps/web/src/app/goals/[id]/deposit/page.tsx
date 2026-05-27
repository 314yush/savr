import { Suspense } from "react";
import DepositPage from "./DepositClient";

export default function DepositRoute() {
  return (
    <Suspense fallback={<div className="px-6 py-8 text-[#8E8E93]">Loading…</div>}>
      <DepositPage />
    </Suspense>
  );
}
