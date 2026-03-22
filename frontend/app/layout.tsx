"use client";

import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { StarknetConfig, jsonRpcProvider } from "@starknet-react/core";
import { sepolia as starknetSepolia } from "@starknet-react/chains";
import { Toaster } from "sonner";
import { wagmiConfig } from "@/config/wagmi";
import { starknetConnectors, STARKNET_RPC } from "@/config/starknet";
import { FhevmProvider } from "@/components/FhevmProvider";
import Header from "@/components/Header";

import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

const queryClient = new QueryClient();

function StarknetWrapper({ children }: { children: ReactNode }) {
  return (
    <StarknetConfig
      chains={[starknetSepolia]}
      provider={jsonRpcProvider({ rpc: () => ({ nodeUrl: STARKNET_RPC }) })}
      connectors={starknetConnectors}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>DeadPool — Confidential BTC Dark Pool</title>
        <meta
          name="description"
          content="DeadPool: Private BTC-collateralized dark pool using Starknet ZK proofs and Zama fhEVM encrypted order matching."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%236366f1'/><text x='16' y='22' text-anchor='middle' font-size='18' fill='white'>🔐</text></svg>" />
      </head>
      <body>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              theme={darkTheme({
                accentColor: "#6366f1",
                accentColorForeground: "white",
                borderRadius: "large",
                fontStack: "system",
              })}
            >
              <StarknetWrapper>
                <FhevmProvider>
                  <Header />
                  <main className="pt-20 min-h-screen bg-black">
                    {children}
                  </main>
                  <Toaster
                    position="bottom-right"
                    toastOptions={{
                      style: {
                        background: "rgba(9,9,11,0.95)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fafafa",
                        backdropFilter: "blur(20px)",
                        fontFamily: "Inter, sans-serif",
                      },
                    }}
                  />
                </FhevmProvider>
              </StarknetWrapper>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
