import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "DeadPool Dark Pool",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "deadpool_dev",
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://rpc.sepolia.org"
    ),
  },
  ssr: true,
});
