import Link from "next/link";

const slides = [
  {
    title: "Set Your Goals",
    body: "Name what you're saving for — a trip, a gift, new gear. Set a target and deadline.",
  },
  {
    title: "Deposit USDC",
    body: "Add funds whenever you want. No auto-deductions. You stay in full control of your wallet.",
  },
  {
    title: "Earn Real Yield",
    body: "Deposits go into Euler Finance on Base. Your savings grow from real lending interest.",
  },
  {
    title: "Understand the Risks",
    body: "Savr is non-custodial but smart contract and DeFi risks apply. USDC may depeg. Savr takes 15% of yield earned at withdrawal — never from your principal.",
  },
];

export default function OnboardingPage() {
  return (
    <div className="px-6 py-8 min-h-screen pb-12">
      <Link href="/" className="text-[#8E8E93] text-[14px]">
        ← Back
      </Link>
      <h1 className="text-[28px] font-semibold mt-6 mb-2">Start Saving.</h1>
      <p className="text-[#8E8E93] mb-8">Goal-based savings on Base.</p>
      <div className="space-y-4">
        {slides.map((slide, i) => (
          <div key={i} className="bg-[#242426] rounded-[20px] p-5">
            <span className="text-[#636366] text-[12px] font-bold">{i + 1}/4</span>
            <h2 className="text-[18px] font-semibold mt-2">{slide.title}</h2>
            <p className="text-[#8E8E93] text-[14px] mt-2 leading-relaxed">{slide.body}</p>
          </div>
        ))}
      </div>
      <Link
        href="/goals/create"
        className="block w-full mt-8 bg-white text-[#171719] font-semibold py-4 rounded-full text-center"
      >
        Create your first goal
      </Link>
    </div>
  );
}
