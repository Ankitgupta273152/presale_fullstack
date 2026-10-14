import { useCallback, useEffect, useState } from "react";
import { Contract, isAddress, type JsonRpcSigner } from "ethers";
import { ERC20_ABI, PRESALE_ABI } from "@/lib/abi";
import { nice } from "@/lib/errors";

export type Meta = {
  presale: Contract; token: Contract; usdt: Contract;
  tokenAddr: string; usdtAddr: string; presaleAddr: string;
  ts: string; td: number; us: string; ud: number;
};
export type Data = {
  price: bigint; cap: bigint; sold: bigint; raised: bigint; minBuy: bigint; maxW: bigint;
  start: number; end: number; paused: boolean; remain: bigint; owner: string; treasury: string;
  contrib: bigint; uBal: bigint; tBal: bigint; allow: bigint; held: bigint; treasBal: bigint;
};

export function usePresale(signer: JsonRpcSigner | undefined, account: string | undefined, address: string) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  // load contracts + token info whenever wallet or address changes
  useEffect(() => {
    let dead = false;
    setMeta(null); setData(null); setError(null);
    if (!signer || !account) return;
    if (!isAddress(address)) { setError("Enter a valid presale contract address."); return; }
    (async () => {
      try {
        if ((await signer.provider.getCode(address)) === "0x")
          throw new Error("No contract found at this address on this network. Check the address and network.");
        const presale = new Contract(address, PRESALE_ABI, signer);
        const [tokenAddr, usdtAddr]: string[] = await Promise.all([presale.token(), presale.usdt()]);
        const token = new Contract(tokenAddr, ERC20_ABI, signer);
        const usdt = new Contract(usdtAddr, ERC20_ABI, signer);
        const [ts, td, us, ud] = await Promise.all([token.symbol(), token.decimals(), usdt.symbol(), usdt.decimals()]);
        if (!dead) setMeta({ presale, token, usdt, tokenAddr, usdtAddr, presaleAddr: address, ts, td: Number(td), us, ud: Number(ud) });
      } catch (e) {
        if (!dead) setError(nice(e));
      }
    })();
    return () => { dead = true; };
  }, [signer, account, address]);

  const refresh = useCallback(async () => {
    if (!meta || !account) return;
    try {
      const { presale, usdt, token } = meta;
      const [price, cap, sold, raised, minBuy, maxW, start, end, paused, remain, owner, treasury, contrib, uBal, tBal, allow, held] =
        await Promise.all([
          presale.price(), presale.saleCap(), presale.totalSold(), presale.totalRaised(), presale.minBuy(), presale.maxPerWallet(),
          presale.startTime(), presale.endTime(), presale.paused(), presale.tokensRemaining(), presale.owner(), presale.treasury(),
          presale.contributed(account), usdt.balanceOf(account), token.balanceOf(account),
          usdt.allowance(account, meta.presaleAddr), token.balanceOf(meta.presaleAddr),
        ]);
      const treasBal: bigint = await usdt.balanceOf(treasury);
      setData({ price, cap, sold, raised, minBuy, maxW, start: Number(start), end: Number(end), paused, remain, owner, treasury, contrib, uBal, tBal, allow, held, treasBal });
      setError(null);
    } catch (e) {
      setError("Could not read data: " + nice(e));
    }
  }, [meta, account]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  return { meta, data, error, refresh };
}
