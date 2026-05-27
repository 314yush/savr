import { Suspense } from "react";
import UnsubscribeContent from "./UnsubscribeContent";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="px-6 py-12 text-[#8E8E93]">Loading…</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
