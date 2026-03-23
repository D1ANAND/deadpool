import { mainnet, sepolia } from "@starknet-react/chains";
import { InjectedConnector } from "starknetkit/injected";

export const starknetChains = [sepolia] as const;

export const starknetConnectors = [
  new InjectedConnector({ options: { id: "argentX", name: "ArgentX" } }),
  new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
];

export const STARKNET_RPC =
  process.env.NEXT_PUBLIC_STARKNET_RPC_URL ??
  "https://starknet-sepolia.public.blastapi.io/rpc/v0_7";
