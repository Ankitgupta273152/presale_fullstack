import { parseUnits } from "ethers";
import { toast } from "sonner";
import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Data, Meta } from "@/hooks/usePresale";
import { FAUCET_ENABLED } from "@/lib/config";
import { fmt } from "@/lib/format";
import { runTx } from "@/lib/tx";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-words text-right text-sm font-semibold">{value}</span>
    </div>
  );
}

async function watch(address: string, symbol: string, decimals: number) {
  try {
    await window.ethereum.request({ method: "wallet_watchAsset", params: { type: "ERC20", options: { address, symbol, decimals } } });
  } catch {
    toast.error("Could not add the token to MetaMask.");
  }
}

type Props = { meta: Meta; data: Data; account: string; explorer?: string; refresh: () => Promise<unknown> };

export function AccountCard({ meta, data, account, explorer, refresh }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Your account</CardTitle></CardHeader>
      <CardContent>
        <Row label={`${meta.us} balance`} value={`${fmt(data.uBal, meta.ud)} ${meta.us}`} />
        <Row label={`${meta.ts} balance`} value={`${fmt(data.tBal, meta.td, 2)} ${meta.ts}`} />
        <Row label="You contributed" value={`${fmt(data.contrib, meta.ud)} ${meta.us}`} />
        <Row label={`${meta.us} approved`} value={`${fmt(data.allow, meta.ud)} ${meta.us}`} />
        <div className="mt-4 space-y-2">
          {FAUCET_ENABLED ? (
            <Button className="w-full" variant="secondary"
              onClick={() => runTx("Get test USDT", () => meta.usdt.mint(account, parseUnits("1000", meta.ud)), refresh, explorer)}>
              <Coins /> Get 1,000 test {meta.us}
            </Button>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => watch(meta.tokenAddr, meta.ts, meta.td)}><Plus /> {meta.ts} to MetaMask</Button>
            <Button variant="outline" size="sm" onClick={() => watch(meta.usdtAddr, meta.us, meta.ud)}><Plus /> {meta.us} to MetaMask</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
