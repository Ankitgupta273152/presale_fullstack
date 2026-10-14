import { toast } from "sonner";
import type { TransactionResponse } from "ethers";
import { nice } from "./errors";

export async function runTx(
  label: string,
  send: () => Promise<TransactionResponse>,
  after: () => Promise<unknown>,
  explorer?: string
): Promise<boolean> {
  const id = toast.loading(`${label}: confirm in MetaMask...`);
  try {
    const tx = await send();
    toast.loading(`${label}: waiting for confirmation...`, { id });
    await tx.wait();
    await after();
    toast.success(`${label} done`, {
      id,
      action: explorer ? { label: "View tx", onClick: () => window.open(`${explorer}/tx/${tx.hash}`, "_blank") } : undefined,
    });
    return true;
  } catch (e) {
    toast.error(nice(e), { id });
    return false;
  }
}
