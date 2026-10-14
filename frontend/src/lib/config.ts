export const TARGET_CHAIN = Number(import.meta.env.VITE_CHAIN_ID ?? 11155111);
export const DEFAULT_PRESALE: string =
  (import.meta.env.VITE_PRESALE_ADDRESS as string | undefined) ?? "0x256Fb188FB478C25c7bEb6E31dAab6072389789C";

type Chain = { name: string; explorer: string; add?: Record<string, unknown> };

export const CHAINS: Record<number, Chain> = {
  31337: {
    name: "Localhost",
    explorer: "",
    add: {
      chainId: "0x7a69", chainName: "Hardhat Local",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: ["http://127.0.0.1:8545"],
    },
  },
  11155111: { name: "Sepolia", explorer: "https://sepolia.etherscan.io" },
  1: { name: "Ethereum", explorer: "https://etherscan.io" },
  97: {
    name: "BNB Testnet",
    explorer: "https://testnet.bscscan.com",
    add: {
      chainId: "0x61", chainName: "BNB Smart Chain Testnet",
      nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
      rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"], blockExplorerUrls: ["https://testnet.bscscan.com"],
    },
  },
  56: {
    name: "BNB Chain",
    explorer: "https://bscscan.com",
    add: {
      chainId: "0x38", chainName: "BNB Smart Chain",
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
      rpcUrls: ["https://bsc-dataseed.binance.org/"], blockExplorerUrls: ["https://bscscan.com"],
    },
  },
};

export const explorerOf = (chainId?: number) => (chainId ? CHAINS[chainId]?.explorer : undefined);

export const FAUCET_ENABLED = import.meta.env.VITE_ENABLE_FAUCET === "true";
