const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const e = (n) => ethers.parseEther(String(n));
const Z = ethers.ZeroAddress;

async function fx() {
  const [owner, tre, a, b, c] = await ethers.getSigners();
  const token = await (await ethers.getContractFactory("StandardToken")).deploy("Sale Token", "SALE", 1000000000, owner.address);
  const usdt = await (await ethers.getContractFactory("MockUSDT")).deploy();
  const now = await time.latest();
  const end = now + 10000;
  const p = await (await ethers.getContractFactory("StandardPresale")).deploy(token.target, usdt.target, tre.address, e("0.05"), e(100000), now + 100, end, owner.address);
  await token.transfer(p.target, e(100000));
  for (const s of [a, b]) await usdt.mint(s.address, e(10000));
  await time.increaseTo(now + 101);
  return { owner, tre, a, b, c, token, usdt, p, end };
}
const buy = async (f, who, amt, min = 0) => { await f.usdt.connect(who).approve(f.p.target, amt); return f.p.connect(who).buy(amt, min); };

describe("StandardToken", () => {
  it("fixed supply, burn, no mint", async () => {
    const { owner, token } = await loadFixture(fx);
    expect(await token.totalSupply()).to.equal(e(1000000000));
    await token.burn(e(1));
    expect(await token.totalSupply()).to.equal(e(999999999));
    expect(token.interface.getFunction("mint")).to.equal(null);
  });
  it("rejects zero supply and zero recipient", async () => {
    const T = await ethers.getContractFactory("StandardToken");
    const [o] = await ethers.getSigners();
    await expect(T.deploy("X", "X", 0, o.address)).to.be.revertedWithCustomError(T, "ZeroSupply");
    await expect(T.deploy("X", "X", 1, Z)).to.be.revertedWithCustomError(T, "ZeroAddress");
  });
});

describe("StandardPresale", () => {
  it("100 USDT buys 2000 tokens, USDT goes to treasury, presale keeps no USDT", async () => {
    const f = await loadFixture(fx);
    await f.usdt.connect(f.a).approve(f.p.target, e(100));
    await expect(f.p.connect(f.a).buy(e(100), e(2000))).to.changeTokenBalances(f.token, [f.a, f.p], [e(2000), -e(2000)]);
    expect(await f.usdt.balanceOf(f.tre.address)).to.equal(e(100));
    expect(await f.usdt.balanceOf(f.p.target)).to.equal(0n);
    expect(await f.p.totalSold()).to.equal(e(2000));
    expect(await f.p.totalRaised()).to.equal(e(100));
  });
  it("emits TokensPurchased", async () => {
    const f = await loadFixture(fx);
    await expect(buy(f, f.a, e(10))).to.emit(f.p, "TokensPurchased").withArgs(f.a.address, e(10), e(200));
  });
  it("sale window: before start and after end", async () => {
    const f = await loadFixture(fx);
    const now = await time.latest();
    const p2 = await (await ethers.getContractFactory("StandardPresale")).deploy(f.token.target, f.usdt.target, f.tre.address, e("0.05"), e(1000), now + 500, now + 900, f.owner.address);
    await expect(p2.connect(f.a).buy(1, 0)).to.be.revertedWithCustomError(p2, "SaleNotActive");
    await time.increaseTo(f.end + 1);
    await expect(f.p.connect(f.a).buy(e(1), 0)).to.be.revertedWithCustomError(f.p, "SaleNotActive");
  });
  it("slippage protection", async () => {
    const f = await loadFixture(fx);
    await f.usdt.connect(f.a).approve(f.p.target, e(100));
    await expect(f.p.connect(f.a).buy(e(100), e(2001))).to.be.revertedWithCustomError(f.p, "SlippageTooHigh");
  });
  it("min buy and wallet limit", async () => {
    const f = await loadFixture(fx);
    await f.p.setLimits(e(10), e(50));
    await expect(buy(f, f.a, e(5))).to.be.revertedWithCustomError(f.p, "BelowMinBuy");
    await buy(f, f.a, e(50));
    await expect(buy(f, f.a, e(10))).to.be.revertedWithCustomError(f.p, "WalletLimitExceeded");
    await expect(f.p.setLimits(e(10), e(5))).to.be.revertedWithCustomError(f.p, "InvalidLimits");
  });
  it("hard cap", async () => {
    const f = await loadFixture(fx);
    await expect(buy(f, f.a, e(5001))).to.be.revertedWithCustomError(f.p, "SaleCapExceeded");
  });
  it("pause blocks buy, price changes only while paused", async () => {
    const f = await loadFixture(fx);
    await expect(f.p.setPrice(e(1))).to.be.reverted;
    await f.p.pause();
    await expect(buy(f, f.a, e(1))).to.be.reverted;
    await expect(f.p.setPrice(e("0.1"))).to.emit(f.p, "PriceUpdated").withArgs(e("0.05"), e("0.1"));
    await f.p.unpause();
    await buy(f, f.a, e(10));
    expect(await f.token.balanceOf(f.a.address)).to.equal(e(100));
  });
  it("fails without allowance, without USDT, or without stock", async () => {
    const f = await loadFixture(fx);
    await expect(f.p.connect(f.a).buy(e(1), 0)).to.be.reverted;
    await expect(buy(f, f.c, e(1))).to.be.reverted;
  });
  it("withdrawUnsold only after end; rescue never touches the sale token", async () => {
    const f = await loadFixture(fx);
    await expect(f.p.withdrawUnsold(f.owner.address, 1)).to.be.revertedWithCustomError(f.p, "SaleNotEnded");
    await expect(f.p.rescueToken(f.token.target, f.owner.address, 1)).to.be.revertedWithCustomError(f.p, "CannotRescueSaleToken");
    await f.usdt.connect(f.a).transfer(f.p.target, e(5));
    await expect(f.p.rescueToken(f.usdt.target, f.c.address, e(5))).to.changeTokenBalance(f.usdt, f.c, e(5));
    await time.increaseTo(f.end + 1);
    await expect(f.p.withdrawUnsold(f.c.address, e(1000))).to.changeTokenBalance(f.token, f.c, e(1000));
  });
  it("only owner can use admin functions", async () => {
    const f = await loadFixture(fx);
    const p = f.p.connect(f.a);
    for (const fn of [() => p.pause(), () => p.setTreasury(f.a.address), () => p.setLimits(0, 0), () => p.setSaleWindow(1, 2),
      () => p.withdrawUnsold(f.a.address, 1), () => p.rescueToken(f.usdt.target, f.a.address, 1)]) await expect(fn()).to.be.reverted;
  });
  it("2-step ownership and renounce disabled", async () => {
    const f = await loadFixture(fx);
    await expect(f.p.renounceOwnership()).to.be.revertedWithCustomError(f.p, "RenounceDisabled");
    await f.p.transferOwnership(f.a.address);
    expect(await f.p.owner()).to.equal(f.owner.address);
    await f.p.connect(f.a).acceptOwnership();
    expect(await f.p.owner()).to.equal(f.a.address);
  });
  it("treasury can change, zero address rejected", async () => {
    const f = await loadFixture(fx);
    await expect(f.p.setTreasury(Z)).to.be.revertedWithCustomError(f.p, "ZeroAddress");
    await f.p.setTreasury(f.b.address);
    await buy(f, f.a, e(10));
    expect(await f.usdt.balanceOf(f.b.address)).to.equal(e(10010));
  });
  it("constructor checks", async () => {
    const f = await loadFixture(fx);
    const F = await ethers.getContractFactory("StandardPresale");
    const n = await time.latest();
    await expect(F.deploy(Z, f.usdt.target, f.tre.address, 1, 1, n + 1, n + 2, f.owner.address)).to.be.revertedWithCustomError(F, "ZeroAddress");
    await expect(F.deploy(f.token.target, f.usdt.target, f.tre.address, 0, 1, n + 1, n + 2, f.owner.address)).to.be.revertedWithCustomError(F, "ZeroValue");
    await expect(F.deploy(f.token.target, f.usdt.target, f.tre.address, 1, 1, n + 2, n + 1, f.owner.address)).to.be.revertedWithCustomError(F, "InvalidWindow");
  });
});
