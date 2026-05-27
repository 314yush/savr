import type { Metadata } from "next";

type Props = { params: Promise<{ goalId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { goalId } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    title: "Fund this goal — Savr",
    description: "Contribute USDC toward a savings goal on Savr.",
    openGraph: {
      title: "Fund this goal — Savr",
      images: [`${appUrl}/api/og/${goalId}`],
    },
  };
}

export { default } from "./FundClient";
