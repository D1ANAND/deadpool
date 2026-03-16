import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying with: ${deployer.address}`);

    const EncryptedOrderBook = await ethers.getContractFactory("EncryptedOrderBook");
    const orderbook = await EncryptedOrderBook.deploy();
    await orderbook.waitForDeployment();

    const address = await orderbook.getAddress();
    console.log(`EncryptedOrderBook deployed at: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});