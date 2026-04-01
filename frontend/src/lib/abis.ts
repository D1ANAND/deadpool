export const COLLATERAL_VERIFIER_ABI = [
  { type: "function", name: "submit_utxo_commitment", inputs: [{ name: "btc_address_hash", type: "core::felt252" }, { name: "amount", type: "core::felt252" }, { name: "nonce", type: "core::felt252" }, { name: "minimum_threshold", type: "core::felt252" }], outputs: [], state_mutability: "external" },
  { type: "function", name: "is_proof_valid", inputs: [{ name: "proof_hash", type: "core::felt252" }], outputs: [{ type: "core::bool" }], state_mutability: "view" },
] as const;

export const SETTLEMENT_VAULT_ABI = [
  { type: "function", name: "deposit", inputs: [{ name: "encryptedAmount", type: "bytes32" }, { name: "inputProof", type: "bytes" }], outputs: [], stateMutability: "nonpayable" },
] as const;

export const ENCRYPTED_ORDER_BOOK_ABI = [
  { type: "function", name: "placeOrder", inputs: [{ name: "encryptedPrice", type: "bytes32" }, { name: "encryptedSize", type: "bytes32" }, { name: "side", type: "uint8" }, { name: "priceProof", type: "bytes" }, { name: "sizeProof", type: "bytes" }], outputs: [{ name: "orderId", type: "uint256" }], stateMutability: "nonpayable" },
] as const;

export const COLLATERAL_VERIFIER_ADDRESS = "0x0647d541e5dbec4d457eadc7be68165701e647bd8667bb8a66d21d17a7c65ec5";
export const SETTLEMENT_VAULT_ADDRESS = "0x0000000000000000000000000000000000000001" as `0x${string}`;
export const ENCRYPTED_ORDER_BOOK_ADDRESS = "0x0000000000000000000000000000000000000002" as `0x${string}`;
