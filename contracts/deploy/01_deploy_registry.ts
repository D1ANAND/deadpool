import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with: ${deployer.address}`);

    const CollateralRegistry = await ethers.getContractFactory("CollateralRegistry");
    const registry = await CollateralRegistry.deploy();
    await registry.waitForDeployment();

    const address = await registry.getAddress();
    console.log(`CollateralRegistry deployed at: ${address}`);

    // Auto-authorize the relayer wallet so it can call registerProofHash
    const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS;
    if (RELAYER_ADDRESS) {
        console.log(`Authorizing relayer: ${RELAYER_ADDRESS}`);
        const tx = await (registry as any).authorizeRelayer(RELAYER_ADDRESS);
        await tx.wait();
        console.log(`Relayer authorized. Tx: ${tx.hash}`);
    } else {
        console.warn("RELAYER_ADDRESS not set in .env — skipping authorizeRelayer");
    }

    console.log(`\n>>> Update your .env:`);
    console.log(`COLLATERAL_REGISTRY_ADDRESS=${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});