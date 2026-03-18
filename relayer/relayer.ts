import { Provider, CallData, hash as snHash } from "starknet";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const STATE_FILE = "./relayer_state.json";

const snProvider = new Provider({ nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-sepolia.public.blastapi.io" });
const ethProvider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, ethProvider);

const STARKNET_VERIFIER = process.env.COLLATERAL_VERIFIER_ADDRESS!;
const ETH_REGISTRY = process.env.COLLATERAL_REGISTRY_ADDRESS!;

const REGISTRY_ABI = [
    "function registerProofHash(bytes32 proofHash) external",
    "function validProofHashes(bytes32) external view returns (bool)"
];

const registryContract = new ethers.Contract(ETH_REGISTRY, REGISTRY_ABI, relayerWallet);

function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
    }
    return { lastBlock: 0 };
}

function saveState(state: any) {
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

    const proofVerifiedKey = snHash.starknetKeccak("ProofVerified");

    setInterval(async () => {
        try {
            const latestBlock = await snProvider.getBlockNumber();
            if (state.lastBlock >= latestBlock) return; // Up to date

            console.log(`[Relayer] Polling Starknet blocks ${state.lastBlock + 1} to ${latestBlock}...`);

            let continuationToken: string | undefined = undefined;
            let allEvents: any[] = [];

            do {
                const response = await snProvider.getEvents({
                    from_block: { block_number: state.lastBlock + 1 },
                    to_block: { block_number: latestBlock },
                    address: STARKNET_VERIFIER,
                    keys: [[proofVerifiedKey.toString()]],
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
                } catch (txErr: any) {
                    console.error(`[Relayer] Failed to send EVM tx: ${txErr.message}`);
                }
            }

            // Update state
            state.lastBlock = latestBlock;
            saveState(state);
        } catch (error: any) {
            console.error(`[Relayer] Polling Error: ${error.message}`);
        }
    }, 15000);
}

startRelayer();
