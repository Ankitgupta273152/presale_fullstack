require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");

const env = (k, d) => process.env[k] || d;

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  console.log(`Network: ${network.name} (chainId ${chainId})\nDeployer: ${deployer.address}\n`);

  const treasury = env("TREASURY", deployer.address);

  // 1) USDT (free test USDT unless USDT_ADDRESS is given)
  let usdtAddr = env("USDT_ADDRESS", "");
  const mockUsdt = !usdtAddr;
  if (mockUsdt) {
    const u = await (await ethers.getContractFactory("MockUSDT")).deploy();
    await u.waitForDeployment();
    usdtAddr = await u.getAddress();
  }
  console.log(`1) USDT:     ${usdtAddr} ${mockUsdt ? "(test USDT)" : "(existing)"}`);
  const usdt = new ethers.Contract(usdtAddr, ["function decimals() view returns (uint8)", "function mint(address,uint256)"], deployer);
  const ud = Number(await usdt.decimals());

  // 2) Sale token
  const token = await (await ethers.getContractFactory("StandardToken")).deploy(
    env("TOKEN_NAME", "Sale Token"), env("TOKEN_SYMBOL", "SALE"), env("TOKEN_SUPPLY", "1000000000"), deployer.address);
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  const td = Number(await token.decimals());
  console.log(`2) Token:    ${tokenAddr}`);

  // 3) Presale
  const now = (await ethers.provider.getBlock("latest")).timestamp;
  const saleCap = ethers.parseUnits(env("SALE_TOKENS", "100000"), td);
  const presale = await (await ethers.getContractFactory("StandardPresale")).deploy(
    tokenAddr, usdtAddr, treasury, ethers.parseUnits(env("PRICE_USDT", "0.05"), ud), saleCap,
    now, now + Number(env("SALE_DAYS", "7")) * 86400, deployer.address);
  await presale.waitForDeployment();
  const presaleAddr = await presale.getAddress();
  console.log(`3) Presale:  ${presaleAddr}`);

  // 4) Put the sale tokens inside the presale
  await (await token.transfer(presaleAddr, saleCap)).wait();
  console.log(`4) Sent ${env("SALE_TOKENS", "100000")} tokens to the presale`);

  // 5) Free test USDT for testing
  if (mockUsdt) {
    const who = ["localhost", "hardhat"].includes(network.name) ? signers.slice(0, 5) : [deployer];
    for (const s of who) await (await usdt.mint(s.address, ethers.parseUnits("10000", ud))).wait();
    console.log(`5) Minted 10,000 test USDT to ${who.length} wallet(s)`);
  }

  // 6) Save addresses
  const out = { network: network.name, chainId, deployer: deployer.address, treasury, usdt: usdtAddr, mockUsdt, token: tokenAddr, presale: presaleAddr, deployedAt: new Date().toISOString() };
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(`deployments/${network.name}.json`, JSON.stringify(out, null, 2));
  const feDir = path.join(__dirname, "..", "frontend");
  if (fs.existsSync(feDir)) {
    fs.writeFileSync(path.join(feDir, ".env"), `VITE_CHAIN_ID=${chainId}\nVITE_PRESALE_ADDRESS=${presaleAddr}\nVITE_ENABLE_FAUCET=${mockUsdt}\n`);
    console.log("\nfrontend/.env updated automatically.");
  }
  console.log(`Addresses saved in deployments/${network.name}.json\nNext: npm run dev`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
