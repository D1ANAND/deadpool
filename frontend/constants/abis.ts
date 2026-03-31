// EVM contract ABIs — minimal surfaces used by the frontend

export const COLLATERAL_REGISTRY_ABI = [
  {
    type: "function",
    name: "validProofHashes",
    inputs: [{ name: "proofHash", type: "bytes32", internalType: "bytes32" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const;

export const SETTLEMENT_VAULT_ABI = [
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "encryptedAmount",
        type: "bytes32",
        internalType: "externalEuint64",
      },
      { name: "inputProof", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "FundsDeposited",
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
        indexed: true,
      },
    ],
    anonymous: false,
  },
] as const;

export const ENCRYPTED_ORDER_BOOK_ABI = [
  {
    type: "function",
    name: "placeOrder",
    inputs: [
      {
        name: "encryptedPrice",
        type: "bytes32",
        internalType: "externalEuint64",
      },
      {
        name: "encryptedSize",
        type: "bytes32",
        internalType: "externalEuint64",
      },
      { name: "side", type: "uint8", internalType: "enum EncryptedOrderBook.OrderSide" },
      { name: "priceProof", type: "bytes", internalType: "bytes" },
      { name: "sizeProof", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "orderId", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OrderPlaced",
    inputs: [
      {
        name: "orderId",
        type: "uint256",
        internalType: "uint256",
        indexed: true,
      },
      {
        name: "trader",
        type: "address",
        internalType: "address",
        indexed: true,
      },
      {
        name: "side",
        type: "uint8",
        internalType: "enum EncryptedOrderBook.OrderSide",
        indexed: false,
      },
    ],
    anonymous: false,
  },
] as const;
