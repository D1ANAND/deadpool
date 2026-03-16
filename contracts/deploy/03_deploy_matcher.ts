import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with: ${deployer.address}`);

    const orderBookAddress = process.env.ORDER_BOOK_ADDRESS;
    const vaultAddress = process.env.VAULT_ADDRESS;

    if (!orderBookAddress || !vaultAddress) {
        console.error("ERROR: Set ORDER_BOOK_ADDRESS and VAULT_ADDRESS in .env first");
        process.exit(1);
    }

    const ConfidentialMatcher = await ethers.getContractFactory("ConfidentialMatcher");
    const matcher = await ConfidentialMatcher.deploy(orderBookAddress, vaultAddress);
    await matcher.waitForDeployment();

    const address = await matcher.getAddress();
    console.log(`ConfidentialMatcher deployed at: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});