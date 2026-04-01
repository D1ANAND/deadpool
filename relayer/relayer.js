"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const starknet_1 = require("starknet");
const ethers_1 = require("ethers");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv.config();
const STATE_FILE = "./relayer_state.json";
const snProvider = new starknet_1.Provider({ nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-sepolia.public.blastapi.io" });
const ethProvider = new ethers_1.ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const relayerWallet = new ethers_1.ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, ethProvider);
const STARKNET_VERIFIER = process.env.COLLATERAL_VERIFIER_ADDRESS;
const ETH_REGISTRY = process.env.COLLATERAL_REGISTRY_ADDRESS;
const REGISTRY_ABI = [
    "function registerProofHash(bytes32 proofHash) external",
    "function validProofHashes(bytes32) external view returns (bool)"
];
const registryContract = new ethers_1.ethers.Contract(ETH_REGISTRY, REGISTRY_ABI, relayerWallet);
function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    }
    return { lastBlock: 0 };
}
function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}
async function startRelayer() {
    console.log(`[Relayer] Starting bridge relayer...`);
    console.log(`[Relayer] EVM RPC: ${process.env.SEPOLIA_RPC_URL}`);
    console.log(`[Relayer] Relayer Wallet: ${relayerWallet.address}`);
    let state = loadState();
    // Quick initialize if state is 0 to current starknet block minus 10 to avoid scanning from genesis
    if (state.lastBlock === 0) {
        const latestBlock = await snProvider.getBlockNumber();
        state.lastBlock = Math.max(0, latestBlock - 100);
        saveState(state);
    }
    const proofVerifiedKey = starknet_1.hash.starknetKeccak("ProofVerified");
    setInterval(async () => {
        try {
            const latestBlock = await snProvider.getBlockNumber();
            if (state.lastBlock >= latestBlock)
                return; // Up to date
            console.log(`[Relayer] Polling Starknet blocks ${state.lastBlock + 1} to ${latestBlock}...`);
            let continuationToken = undefined;
            let allEvents = [];
            do {
                const response = await snProvider.getEvents({
                    from_block: { block_number: state.lastBlock + 1 },
                    to_block: { block_number: latestBlock },
                    address: STARKNET_VERIFIER,
                    keys: [["0x" + proofVerifiedKey.toString(16).padStart(64, "0")]], // ← fixed
                    chunk_size: 100,
                    continuation_token: continuationToken
                });
                allEvents = allEvents.concat(response.events);
                continuationToken = response.continuation_token;
            } while (continuationToken);
            for (const ev of allEvents) {
                // Event data structure from Cairo: 0=prover, 1=proof_hash, 2=timestamp
                const proofHashFelt = ev.data[1];
                // Convert felt252 to bytes32 (pad with zeros up to 64 hex chars = 32 bytes)
                let hexProofHash = BigInt(proofHashFelt).toString(16);
                hexProofHash = "0x" + hexProofHash.padStart(64, "0");
                console.log(`[Relayer] Found Starknet ProofVerified Event!`);
                console.log(`[Relayer]  - Prover: ${ev.data[0]}`);
                console.log(`[Relayer]  - Proof Hash: ${hexProofHash}`);
                // Check if already registered
                const isRegistered = await registryContract.validProofHashes(hexProofHash);
                if (isRegistered) {
                    console.log(`[Relayer]  -> Already registered on EVM. Skipping.`);
                    continue;
                }
                console.log(`[Relayer] Bridging proofHash ${hexProofHash} to Ethereum Sepolia...`);
                // Register on Ethereum
                try {
                    const tx = await registryContract.registerProofHash(hexProofHash);
                    console.log(`[Relayer] Sent Tx: ${tx.hash}. Waiting for confirmation...`);
                    const receipt = await tx.wait();
                    console.log(`[Relayer] ✅ Successfully registered on EVM! Block: ${receipt.blockNumber}`);
                }
                catch (txErr) {
                    console.error(`[Relayer] Failed to send EVM tx: ${txErr.message}`);
                }
            }
            // Update state
            state.lastBlock = latestBlock;
            saveState(state);
        }
        catch (error) {
            console.error(`[Relayer] Polling Error: ${error.message}`);
        }
    }, 15000);
}
startRelayer();
