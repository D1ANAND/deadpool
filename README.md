# Deadpool: Confidential BTC-Collateralized Dark Pool

> **“A modular privacy-preserving trading primitive that uses Starknet ZK proofs for Bitcoin collateral and Zama fhEVM for fully encrypted order matching.”**

---

## Hackathon Context & Track Alignment

This project is built for **PL_Genesis: Frontiers of Collaboration**, under the **Infrastructure & Digital Rights** track. 

Deadpool is infrastructure, not just a single dApp. It is a composable module that any DeFi protocol can plug into for private, Bitcoin-backed trading. We believe that a true user-owned, open, and resilient internet must treat financial privacy as a fundamental digital right rather than an optional premium feature.

By combining cutting-edge privacy-preserving technologies and decentralized infrastructure—spanning Bitcoin, Starknet, and Ethereum equipped with Zama's fhEVM—Deadpool aggressively protects user trading data. It reduces the footprint for mass surveillance and extends digital human rights into the realm of decentralized finance. Our architecture directly reflects Protocol Labs’ “modular worlds” ethos: Bitcoin serves as the foundational value layer, Starknet provides the ZK privacy rail, and fhEVM handles the confidential compute, all composed into a single coherent primitive.

---

## Sponsor Challenge Alignment

### 3.1 Zama — Confidential Onchain Finance
Deadpool integrates **Zama’s fhEVM v0.9.1** to keep sensitive financial data entirely encrypted at all times.
- **Encrypted Trade Execution:** Orders (price, quantity, side) are stored as encrypted `euint` and `ebool` types.
- **FHE Matching Logic:** Complex matching engine logic is handled via Fully Homomorphic Encryption operations (e.g., encrypted comparisons, min selection, and arithmetic). No plaintext is ever visible on-chain.
- **FHE Access Control List (ACL):** Access control is strictly encoded directly in the contract logic using `FHE.allowThis` and `FHE.allow(value, user)`. These primitives cryptographically define exactly who can decrypt which piece of data. 

This is not simply “hiding a field;” it embodies running a full-scale matching engine on encrypted state, directly answering Zama’s challenge for robust, confidential on-chain finance.

### 3.2 Starknet — Bitcoin Privacy with ZK
Starknet operates as our secure, scalable Bitcoin privacy gateway.
- **Proof of Asset Control:** Users prove they control sufficient BTC (modeled as a UTXO commitment) via a Cairo contract. This natively simulates a Zero-Knowledge proof of BTC collateral.
- **Data Minimization:** The only element leaving the Starknet ecosystem is a proof hash. No addresses, UTXOs, or exact BTC amounts are revealed or bridged.

This tightly aligns with Starknet’s bounty for enhancing financial privacy for Bitcoin users through zero-knowledge proofs and scalable cryptographic infrastructure. *(Note: The current hackathon implementation utilizes a Pedersen commitment as a mock stand-in. In a production environment, this would be replaced with a real Bitcoin light client or a Herodotus-like BTC storage-proof system.)*

### 3.3 PL_Genesis — Infrastructure & Digital Rights
Deadpool treats financial privacy as a digital right and functions as a reusable infrastructure block. Other DeFi protocols, OTC desks, or RFQ systems can safely route their orders through Deadpool without ever learning an individual user's specific strategies or real balances. 

The system enforces strict data minimization principles—only highly abstracted proof hashes and unreadable encrypted values cross domains. This gives users absolute control over what, if anything, eventually becomes decryptable.

---

## Why ZK + FHE Together (Not Just Bounty Hunting)

Zama (FHE) and Starknet (ZK) are fundamentally leveraged to solve different, complementary problems in our architecture:

1. **Starknet ZK (The Entry Layer):** Used to prove a specific statement: *“This user controls sufficient BTC collateral,”* without ever revealing their Bitcoin address, UTXO set, or exact balance. ZK is excellent at verifying statements about data, but it cannot intrinsically hide ongoing state changes across multiple users (like a constantly changing orderbook).
2. **Zama fhEVM (The Execution Layer):** Used to maintain live computation privacy. FHE keeps all orders, balances, and real-time matching logic continuously encrypted during execution. However, FHE alone cannot import private Bitcoin collateral in a trustless way—you still need a ZK-style proof of BTC ownership to safely onboard that value.

**Deadpool is not stitching together two sponsor technologies just to chase multiple bounties.** The architecture is explicitly designed so that each primitive does exactly what it is uniquely optimized for. ZK proves you are allowed into the pool; FHE keeps everything you do inside the pool comprehensively private. The resulting composable system achieves a privacy property that neither Starknet nor Zama could independently provide.

---

## Architecture

**Core Design Principle: *"ZK proves you are allowed in; FHE keeps what you do inside private."***

```text
+----------------+        +--------------------------+        +-----------------+
|   Bitcoin      |        |        Starknet          |        |                 |
|   Network      |        |  (ZK UXTO Verification)  |        |  Relayer Node   |
| (Mock target)  | =====> |  collateral_verifier     | =====> |  (NodeJS)       |
+----------------+        +--------------------------+        +-----------------+
  [Layer 1]                     [Layer 1]                         [Layer 3]
                                                                       |
                                                                       v
+-------------------------------------------------------------------------------+
|                        Ethereum Sepolia (Zama fhEVM)                          |
|                                [Layer 2]                                      |
|   +--------------------+       +-----------------------+                      |
|   | CollateralRegistry | <---- | EncryptedOrderBook    |                      |
|   +--------------------+  Auth +-----------------------+                      |
|             ^                           ^                                     |
|             |                           |                                     |
|   +--------------------+       +-----------------------+                      |
|   | SettlementVault    | <---- | ConfidentialMatcher   |                      |
|   +--------------------+Settle +-----------------------+                      |
+-------------------------------------------------------------------------------+
```

### Layer 1: Bitcoin + Starknet (Entry / ZK Collateral Gate)
- **Components:** Bitcoin (L1 value), Starknet Cairo `CollateralVerifier` contract.
- **Guarantees:** Cryptographically guarantees sufficient collateral exists without revealing UTXOs or exact amounts.
- **Interactions:** Receives user proofs and emits a `ProofVerified` event containing only an opaque proof hash and prover address.

### Layer 2: Ethereum Sepolia + fhEVM (Encrypted Dark Pool Core)
- **Components:** `CollateralRegistry`, `EncryptedOrderBook`, `ConfidentialMatcher`, `SettlementVault` (Solidity contracts on Zama fhEVM).
- **Guarantees:** Ensures that all order prices, sides, and quantities, as well as Vault balances, are cryptographically masked from the public and miners during computation.
- **Interactions:** Consumes verified proof hashes from the Relayer, accepts user encrypted orders, and processes matching entirely in ciphertext. 

### Layer 3: Relayer + Next.js Frontend (Messaging + UX)
- **Components:** Trusted Node.js relayer, React/Next.js client interface.
- **Guarantees:** Ensures low-friction, private user onboarding. Encrypts sensitive trading data locally in the browser before transaction submission.
- **Interactions:** The Relayer listens to Starknet events and calls the EVM registry. The Frontend drives the seamless user flow from Starknet proof generation to EVM order placement.

---

## Technical Design Deep Dive

### Collateral Verification on Starknet
The Cairo smart contract acts as the gatekeeper. It is responsible for computing Pedersen commitments, verifying that user inputs meet configured minimum collateral thresholds, storing a registry of valid proofs, and emitting verified events.
*Note: The current verifier is a pragmatic mock modeling a future Bitcoin light client or storage-proof system. Upgrading to a production-grade ZK light client would not require any changes to the EVM logic.*

### Encrypted Orderbook & Matching on fhEVM
- **`CollateralRegistry`:** Registers ingested proof hashes authorizing a user's wallet.
- **`EncryptedOrderBook`:** Receives and stores trading intentions. User inputs via `inEuint64` are converted and stored as `euint64` and `ebool` ciphertext.
- **`ConfidentialMatcher`:** The beating heart of Deadpool. It matches opposing orders entirely through FHE operations (encrypted greater-than/less-than operators, homomorphic addition/subtraction).
- **`SettlementVault`:** Updates resulting balances.
- **End-to-End Flow:** A user places an order involving client-side encryption. ACL configuration (`FHE.allowThis` and `FHE.allow`) maps decrypt rights. The order hits the book as ciphertext. If matched, the `SettlementVault` is updated via FHE arithmetic. At no point is a plaintext balance or price stored on-chain.

### Relayer and Cross-Domain Message Flow
A Node.js backend operates as an event listener bridging the two chains. It watches for `ProofVerified` events emitted on Starknet, natively converts the `felt252` proof hashes into EVM-compatible `bytes32` hashes, and triggers the `registerProofHash` function on the EVM `CollateralRegistry`. 
*Note: This relayer acts as a trusted oracle explicitly for the hackathon demo scope. Moving forward, this will be swapped for a trustless messaging bridging layer (e.g., Hyperlane, Wormhole).*

### Frontend UX and Privacy Model
The Next.js application unifies the cross-chain experience:
1. Generate BTC collateral commitments natively on Starknet.
2. Claim authorized collateral on the EVM network.
3. Place fully encrypted orders (prices, quantities, and sides are encrypted **in-browser** before any RPC submission occurs).

**The Privacy Model Reality:** The user sees status updates, confirmation IDs, and verification flags. What intentionally remains opaque to the user (and global chain observers) are public positions, on-chain plaintext prices, and the strategies of other market participants.

---

## Vision & Future Roadmap

- **Decentralized ZK Collateral:** Integrate a real Bitcoin light client or Herodotus-style BTC proof system in place of the current mock Pedersen commitment.
- **Trustless Messaging:** Replace the trusted Node.js relayer with a trustless decentralized bridge or messaging layer (Hyperlane, Wormhole, LayerZero).
- **Shared Privacy Layer:** Generalize Deadpool into an omnichain privacy base layer that other DeFi protocols can seamlessly consume for RFQs, OTC flows, and institutional dark pools.
- **Policy-Controlled Audit Nodes:** Add opt-in, policy-controlled audit modes where specific aggregated metrics (e.g., total volume, macro risk metrics) can be selectively decrypted for localized regulatory compliance, *without* ever revealing individual orders.
- **Ecosystem Expansion:** Explore integration with emerging private BTC representations natively on Starknet and other leading L2 ecosystems.

---

## Demo Flow & How to Run

### 1. Environment & Setup
**Action:** Clone the repository and configure environments.
**Input:** Copy `.env.example` to `.env` in the root, `contracts/`, and `relayer/` directories and populate your RPC endpoints and private keys.
**Outcome:** The environment is primed to deploy components across Starknet and Ethereum Sepolia.

### 2. EVM Contracts (Zama fhEVM on Sepolia)
**Action:** Deploy the Encrypted core infrastructure.
**Input:** 
```bash
cd contracts && npm install
npx hardhat deploy --network sepolia
```
**Outcome:** Generates the `CollateralRegistry`, `OrderBook`, `ConfidentialMatcher`, and `Vault` addresses. Update your `.env` files with these addresses. 

### 3. Starknet Prover (Cairo 1 on Sepolia)
**Action:** Deploy the ZK Collateral Gate.
**Input:**
```bash
cd starknet && scarb build
starkli declare target/dev/collateral_verifier.contract_class.json --network sepolia
starkli deploy <CLASS_HASH> --network sepolia
```
**Outcome:** Generates the Starknet `CollateralVerifier` address. *Property Demonstrated: No real BTC keys are requested or exposed.*

### 4. Boot Relayer Integration
**Action:** Start the cross-chain bridge.
**Input:**
```bash
cd relayer && npm install
npm run start
```
**Outcome:** The bridge actively listens to Starknet to permission the EVM registry. 

### 5. Frontend Walkthrough
**Action:** Execute the user journey.
**Input:** 
```bash
cd frontend && npm install && npm run dev
```
**Outcome & Flow:**
1. **Mock BTC Commitment:** Connect Starknet wallet, generate collateral proof. *Property: No BTC address leaked.*
2. **Claim Collateral:** Switch to MetaMask, claim proof hash on Ethereum Sepolia.
3. **Execute Trade:** Submit limit order (Buy/Sell, Amount, Price). *Property: Orders are encrypted in the browser UI, meaning absolutely no plaintext price data touches the RPC or the blockchain.* 

Welcome to Deadpool. Trade in the shadows.