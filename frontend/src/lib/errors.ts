import { Interface } from "ethers";
import { PRESALE_ABI } from "./abi";

const IFACE = new Interface(PRESALE_ABI);

const FRIENDLY: Record<string, string> = {
  SaleNotActive: "Sale is not active right now (not started or already ended).",
  SaleNotEnded: "Sale has not ended yet.",
  BelowMinBuy: "Amount is below the minimum buy.",
  WalletLimitExceeded: "This would go over the per-wallet limit.",
  SaleCapExceeded: "Not enough tokens left in the sale.",
  SlippageTooHigh: "Price moved or amount too small. Try again.",
  EnforcedPause: "Sale is paused.",
  ExpectedPause: "Pause the sale first, then try again.",
  OwnableUnauthorizedAccount: "Only the owner can do this.",
  ERC20InsufficientAllowance: "Approve USDT first.",
  ERC20InsufficientBalance: "Not enough balance (the presale may be out of tokens, or you lack USDT).",
  InvalidWindow: "Start time must be before end time.",
  InvalidLimits: "Max per wallet must be 0 or at least the min buy.",
  ZeroValue: "Value cannot be zero.",
  ZeroAddress: "Address cannot be zero.",
  CannotRescueSaleToken: "Sale token cannot be rescued.",
};

function revertName(e: any): string | null {
  try {
    let d = e?.data ?? e?.error?.data ?? e?.info?.error?.data;
    if (d && typeof d === "object") d = d.data ?? d.originalError?.data;
    if (typeof d === "string" && d.startsWith("0x") && d.length >= 10) return IFACE.parseError(d)?.name ?? null;
  } catch {
    /* ignore */
  }
  return null;
}

export function nice(e: any): string {
  if (e && (e.code === 4001 || e.code === "ACTION_REJECTED")) return "You rejected the request in MetaMask.";
  const n = e?.revert?.name || revertName(e);
  if (n && FRIENDLY[n]) return FRIENDLY[n];
  const m: string = e?.shortMessage || e?.info?.error?.message || e?.message || String(e);
  return m.length > 200 ? m.slice(0, 200) + "..." : m;
}
