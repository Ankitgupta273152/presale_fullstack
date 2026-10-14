import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, type JsonRpcSigner } from "ethers";
import { CHAINS, TARGET_CHAIN } from "@/lib/config";
import { nice } from "@/lib/errors";

type WalletState = { provider?: BrowserProvider; signer?: JsonRpcSigner; account?: string; chainId?: number };

async function switchChain() {
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + TARGET_CHAIN.toString(16) }] });
  } catch (e: any) {
    const add = CHAINS[TARGET_CHAIN]?.add;
    if (e?.code === 4902 && add) await window.ethereum.request({ method: "wallet_addEthereumChain", params: [add] });
    else throw e;
  }
}

async function build(): Promise<Required<WalletState>> {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer, account: await signer.getAddress(), chainId: Number((await provider.getNetwork()).chainId) };
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({});
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasWallet = typeof window !== "undefined" && !!window.ethereum;

  const connect = useCallback(async () => {
    if (!window.ethereum) return setError("MetaMask not found. Install MetaMask and reload this page.");
    setConnecting(true);
    setError(null);
    try {
      const first = new BrowserProvider(window.ethereum);
      await first.send("eth_requestAccounts", []);
      if (Number((await first.getNetwork()).chainId) !== TARGET_CHAIN) await switchChain();
      setWallet(await build());
    } catch (e) {
      setError(nice(e));
    } finally {
      setConnecting(false);
    }
  }, []);

  // reconnect silently if the site is already allowed in MetaMask
  useEffect(() => {
    if (!window.ethereum) return;
    (async () => {
      try {
        const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length) {
          const chain = Number(await window.ethereum.request({ method: "eth_chainId" }));
          if (chain === TARGET_CHAIN) setWallet(await build());
        }
      } catch {
        /* user can click connect */
      }
    })();
    const reload = () => window.location.reload();
    window.ethereum.on?.("accountsChanged", reload);
    window.ethereum.on?.("chainChanged", reload);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", reload);
      window.ethereum.removeListener?.("chainChanged", reload);
    };
  }, []);

  return { ...wallet, connecting, error, hasWallet, connect };
}
