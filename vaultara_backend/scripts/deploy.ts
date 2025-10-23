import { ethers } from "ethers";
import hre from "hardhat";

async function main() {
  console.log("🚀 Starting Vaultara deployment to Sepolia...\n");

  // Access ethers from the global context that Hardhat injects
  const ethersLib = (globalThis as any).ethers;
  
  if (!ethersLib) {
    throw new Error("Ethers is not available. Make sure hardhat-toolbox-mocha-ethers is properly configured.");
  }

  const signers = await ethersLib.getSigners();
  const deployer = signers[0];
  
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await ethersLib.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethersLib.formatEther(balance), "ETH\n");

  console.log("📝 Deploying VaultaraInheritance contract...");
  const VaultaraFactory = await ethersLib.getContractFactory("VaultaraInheritance");
  const vaultara = await VaultaraFactory.deploy();
  
  await vaultara.waitForDeployment();
  const contractAddress = await vaultara.getAddress();

  console.log("✅ VaultaraInheritance deployed to:", contractAddress);
  console.log("\n🔗 View on Sepolia Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
  
  console.log("\n⏳ Waiting for 5 block confirmations...");
  await vaultara.deploymentTransaction()?.wait(5);
  
  console.log("✅ Contract confirmed!\n");
  
  console.log("📋 Deployment Summary:");
  console.log("------------------------");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Network: Sepolia");
  console.log("------------------------\n");
  
  console.log("💡 Next steps:");
  console.log("1. Verify contract: npx hardhat verify --network sepolia", contractAddress);
  console.log("2. Save contract address for frontend integration");
  console.log("3. Test contract on Sepolia testnet\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });