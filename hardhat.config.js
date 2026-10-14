require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const fs = require("fs");

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

task("mint-usdt", "Mint free test USDT to an address (test USDT only)")
  .addParam("to", "wallet address")
  .addParam("amount", "amount in USDT, e.g. 1000")
  .setAction(async ({ to, amount }, hre) => {
    const file = `deployments/${hre.network.name}.json`;
    if (!fs.existsSync(file)) throw new Error(`Deploy first: ${file} not found`);
    const d = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!d.mockUsdt) throw new Error("This deployment uses a real USDT, cannot mint.");
    const [signer] = await hre.ethers.getSigners();
    const usdt = new hre.ethers.Contract(d.usdt, ["function mint(address,uint256)"], signer);
    await (await usdt.mint(to, hre.ethers.parseEther(amount))).wait();
    console.log(`Minted ${amount} test USDT to ${to}`);
  });

module.exports = {
  solidity: { version: "0.8.35", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris" } },
  networks: {
    sepolia: { url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com", accounts, chainId: 11155111 },
    bscTestnet: { url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/", accounts, chainId: 97 },
  },
  etherscan: { apiKey: process.env.ETHERSCAN_API_KEY || "" },
};
