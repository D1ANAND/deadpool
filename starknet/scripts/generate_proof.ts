import { Provider, Account, Contract, hash } from "starknet";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const args = process.argv.slice(2);
    let btcAddrHash = "";
    let amountSats = "";
    let nonce = "";

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--btc-addr-hash") btcAddrHash = args[i + 1];
        if (args[i] === "--amount-sats") amountSats = args[i + 1];
        if (args[i] === "--nonce") nonce = args[i + 1];
    }

    if (!btcAddrHash || !amountSats || !nonce) {
        console.error("Usage: ts-node generate_proof.ts --btc-addr-hash <hex> --amount-sats <number> --nonce <number>");
        process.exit(1);
    }

    const provider = new Provider({ nodeUrl: process.env.STARKNET_RPC_URL || "https://starknet-sepolia.public.blastapi.io" });
    const privateKey = process.env.STARKNET_DEPLOYER_PRIVATE_KEY!;
    const accountAddress = process.env.STARKNET_DEPLOYER_ADDRESS!;
    const verifierAddress = process.env.COLLATERAL_VERIFIER_ADDRESS!;

    if (!privateKey || !accountAddress || !verifierAddress) {
        console.error("Missing Starknet environment variables in .env");
        process.exit(1);
    }

    const account = new Account(provider, accountAddress, privateKey);

    // Compute the Pedersen hash commitment
    const hash1 = hash.computePedersenHash(btcAddrHash, amountSats);
    const expectedProofHash = hash.computePedersenHash(hash1, nonce);
    console.log(`Computed expected proofHash: ${expectedProofHash}`);

    // Minimum threshold for demo (e.g. 100000 sats)
    const minimumThreshold = "100000";

    if (parseInt(amountSats) < parseInt(minimumThreshold)) {
        console.error("Amount is less than the minimum threshold");
        process.exit(1);
    }

    const { abi: testAbi } = await provider.getClassAt(verifierAddress);
    if (testAbi === undefined) { 
        throw new Error('no abi.'); 
    }

    const collateralVerifier = new Contract(testAbi, verifierAddress, provider);
    collateralVerifier.connect(account);

    console.log(`Submitting UTXO commitment to ${verifierAddress}...`);
    try {
        const tx = await collateralVerifier.submit_utxo_commitment(
            btcAddrHash, 
            amountSats, 
            nonce, 
            minimumThreshold
        );
        console.log(`Transaction submitted! Hash: ${tx.transaction_hash}`);
        const receipt = await provider.waitForTransaction(tx.transaction_hash);
        console.log(`Transaction mined! Status: ${receipt.execution_status}`);

        // Extract emitted ProofVerified event
        const events = receipt.events || [];
        for (const ev of events) {
            // Starknet events layout:
            // keys[0] = sn_keccak("ProofVerified")
            // data[0] = prover
            // data[1] = proof_hash
            // data[2] = timestamp
            if (ev.keys?.[0] === hash.starknetKeccak("ProofVerified")) {
                const proofHash = ev.data[1];
                console.log(`=====================================`);
                console.log(`✅ Success! Event Emitted.`);
                console.log(`Prover: ${ev.data[0]}`);
                console.log(`Proof Hash (felt252): ${proofHash}`);
                console.log(`Use this Proof Hash in the fHEVM frontend!`);
                console.log(`=====================================`);
            }
        }

    } catch (e) {
        console.error("Error submitting tx:", e);
    }
}

main();
