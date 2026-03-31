import type { Address } from "viem";

export const EVM_ADDRESSES = {
  collateralRegistry: (process.env.NEXT_PUBLIC_COLLATERAL_REGISTRY_ADDRESS ??
    "0xf9BbdcA8D3bC8e95fafB3eF61042adbFF155DB3a") as Address,
  orderBook: (process.env.NEXT_PUBLIC_ORDER_BOOK_ADDRESS ??
    "0xDb46efF504e72CB898EB8f0eFD3f3dC20676c2a9") as Address,
  vault: (process.env.NEXT_PUBLIC_VAULT_ADDRESS ??
    "0x4aeB8DbF79BbC401c63CDA4b54c64D55c5551172") as Address,
} as const;

export const STARKNET_ADDRESSES = {
  collateralVerifier:
    process.env.NEXT_PUBLIC_COLLATERAL_VERIFIER_ADDRESS ??
    "0x04c877f5047d217ec65c801f735bd55631f61294da8c7079b45b5eb331a443a9",
} as const;
