import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Data, Meta } from "@/hooks/usePresale";
import { fmt } from "@/lib/format";
import { runTx } from "@/lib/tx";
import { cn } from "@/lib/utils";

const SLIPPAGE = [{ bps: 50, label: "0.5%" }, { bps: 100, label: "1%" }, { bps: 300, label: "3%" }];

type Props = { meta: Meta; data: Data; status: string; explorer?: string; refresh: () => Promise<unknown> };

export function BuyCard({ meta, data, status, explorer, refresh }: Props) {
  const [amount, setAmount] = useState("");
  const [slip, setSlip] = useState(100);
  const [out, setOut] = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);

  const amt = useMemo(() => {
    try {
      if (!amount || Number(amount) <= 0) return null;
      return parseUnits(amount, meta.ud);
    } catch {
      return null;
    }
  }, [amount, meta.ud]);

  useEffect(() => {
    let dead = false;
    setOut(null);
    if (amt == null) return;
    meta.presale.tokensForUsdt(amt).then((o: bigint) => { if (!dead) setOut(o); }).catch(() => {});
    return () => { dead = true; };
  }, [amt, meta, data.price]);

  const minOut = out == null ? null : (out * BigInt(10000 - slip)) / 10000n;
  const needsApproval = amt != null && data.allow < amt;

  const why = (() => {
    if (amt == null) return "Enter amount";
    if (status !== "Live") return `Sale is ${status.toLowerCase()}`;
    if (amt > data.uBal) return `Not enough ${meta.us}`;
    if (data.minBuy > 0n && amt < data.minBuy) return `Below minimum buy (${fmt(data.minBuy, meta.ud)} ${meta.us})`;
    if (data.maxW > 0n && data.contrib + amt > data.maxW) return "Over per-wallet limit";
    if (out == null) return "Calculating...";
    if (out === 0n) return "Amount too small";
    if (out > data.remain) return "Not enough tokens left";
    return null;
  })();

  const onClick = async () => {
    if (amt == null) return;
    setBusy(true);
    if (needsApproval) {
      await runTx("Approve", () => meta.usdt.approve(meta.presaleAddr, amt), refresh, explorer);
    } else {
      const ok = await runTx("Buy", () => meta.presale.buy(amt, minOut ?? 0n), refresh, explorer);
      if (ok) setAmount("");
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buy {meta.ts}</CardTitle>
        <CardDescription>Approve USDT once, then buy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({meta.us})</Label>
          <div className="flex gap-2">
            <Input id="amount" inputMode="decimal" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value.trim())} />
            <Button type="button" variant="outline" onClick={() => setAmount(formatUnits(data.uBal, meta.ud))}>Max</Button>
          </div>
        </div>

        <div className="rounded-lg border bg-background/40 p-3 text-sm">
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">You get</span>
            <b data-testid="estimate">{out == null ? "-" : `${fmt(out, meta.td, 4)} ${meta.ts}`}</b></div>
          <div className="mt-1 flex justify-between gap-3"><span className="text-muted-foreground">Minimum you accept</span>
            <span>{minOut == null ? "-" : `${fmt(minOut, meta.td, 4)} ${meta.ts}`}</span></div>
        </div>

        <div className="space-y-2">
          <Label>Slippage protection</Label>
          <div className="grid grid-cols-3 gap-2">
            {SLIPPAGE.map((s) => (
              <Button key={s.bps} type="button" size="sm" variant={slip === s.bps ? "default" : "outline"} onClick={() => setSlip(s.bps)}>{s.label}</Button>
            ))}
          </div>
        </div>

        <Button
          className={cn("w-full")}
          size="lg"
          disabled={busy || why !== null}
          onClick={onClick}
        >
          {busy ? "Processing..." : why ?? (needsApproval ? `Step 1: Approve ${meta.us}` : `Buy ${meta.ts}`)}
        </Button>
      </CardContent>
    </Card>
  );
}
