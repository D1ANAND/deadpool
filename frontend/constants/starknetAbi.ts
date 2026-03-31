// Cairo ABI for CollateralVerifier — used by starknet-react useContract / useSendTransaction

export const COLLATERAL_VERIFIER_ABI = [
  {
    type: "function",
    name: "submit_utxo_commitment",
    inputs: [
      { name: "btc_address_hash", type: "core::felt252" },
      { name: "amount", type: "core::felt252" },
      { name: "nonce", type: "core::felt252" },
      { name: "minimum_threshold", type: "core::felt252" },
    ],
    outputs: [],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "is_proof_valid",
    inputs: [{ name: "proof_hash", type: "core::felt252" }],
    outputs: [{ type: "core::bool" }],
    state_mutability: "view",
  },
  {
    type: "event",
    name: "CollateralVerifier::CollateralVerifier::Event",
    kind: "enum",
    variants: [
      {
        name: "ProofVerified",
        type: "CollateralVerifier::CollateralVerifier::ProofVerified",
        kind: "nested",
      },
    ],
  },
  {
    type: "event",
    name: "CollateralVerifier::CollateralVerifier::ProofVerified",
    kind: "struct",
    members: [
      { name: "prover", type: "core::starknet::contract_address::ContractAddress", kind: "data" },
      { name: "proof_hash", type: "core::felt252", kind: "data" },
      { name: "timestamp", type: "core::integer::u64", kind: "data" },
    ],
  },
] as const;
