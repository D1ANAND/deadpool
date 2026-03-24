// lib/fhevm.ts
// Uses fhEVM v0.9.1 latest client SDK format
import { createInstance } from "@zama-fhe/relayer-sdk/web";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { ethers } from "ethers";

// Fallback to Sepolia public RPC if not provided
export const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

let fhevmInstance: FhevmInstance | null = null;

export const getFhevmInstance = async (walletSigner?: ethers.Signer): Promise<FhevmInstance> => {
    if (fhevmInstance) return fhevmInstance;

    try {
        console.log("Initializing fhEVM instance for v0.9.1...");
        
        // Zama fhEVM v0.9.1 instance creation using relayer-sdk
        fhevmInstance = await createInstance({ 
            network: SEPOLIA_RPC
        } as any);

        console.log("fhEVM instance created.");
        return fhevmInstance;
    } catch (e) {
        console.error("Failed to initialize fhEVM:", e);
        throw e;
    }
};

/**
 * Publicly decrypts a set of handles using the new publicDecrypt from relayer-sdk
 * The contract must first call FHE.makePubliclyDecryptable on these values.
 */
export const performPublicDecryption = async (
    handles: { handle: string }[],
    provider: ethers.BrowserProvider,
    signer: ethers.Signer
) => {
    try {
        const instance = await getFhevmInstance();
        const results = await instance.publicDecrypt(handles.map(h => h.handle));
        return Object.values(results);
    } catch (error) {
        console.error("Failed public array decryption off-chain:", error);
        throw error;
    }
};
