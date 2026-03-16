import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with: ${deployer.address}`);

    const SettlementVault = await ethers.getContractFactory("SettlementVault");
    const vault = await SettlementVault.deploy();
    await vault.waitForDeployment();

    const address = await vault.getAddress();
    console.log(`SettlementVault deployed at: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});