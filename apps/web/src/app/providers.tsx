"use client";

import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { chainId } from "@/lib/contracts";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "Savr",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo-project-id",
  chains: [chainId === base.id ? base : baseSepolia, chainId === base.id ? baseSepolia : base],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#FFFFFF", accentColorForeground: "#171719" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
