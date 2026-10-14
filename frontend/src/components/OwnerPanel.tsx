import { useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { Pause, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Data, Meta } from "@/hooks/usePresale";
import { fmt, toLocalInput } from "@/lib/format";
import { runTx } from "@/lib/tx";

type Props = { meta: Meta; data: Data; account: string; explorer?: string; refresh: () => Promise<unknown> };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function OwnerPanel({ meta, data, account, explorer, refresh }: Props) {
  const [price, setPrice] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [tre, setTre] = useState("");
  const [start, setStart] = useState(() => toLocalInput(data.start));
  const [end, setEnd] = useState(() => toLocalInput(data.end));
  const [wdTo, setWdTo] = useState(account);
  const [wdAmt, setWdAmt] = useState("");
  const { presale } = meta;

  const act = (label: string, send: () => Promise<any>) => runTx(label, send, refresh, explorer);
  const U = (v: string) => parseUnits(v.trim() || "0", meta.ud);
  const when = (v: string) => {
    if (!v) throw new Error("Pick a date and time");
    return Math.floor(new Date(v).getTime() / 1000);
  };

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Owner panel</CardTitle>
        <CardDescription>Only you (the owner wallet) can see this.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={data.paused} onClick={() => act("Pause", () => presale.pause())}><Pause /> Pause sale</Button>
          <Button variant="outline" disabled={!data.paused} onClick={() => act("Unpause", () => presale.unpause())}><Play /> Unpause sale</Button>
        </div>
        <Separator />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <Field label={`New price (${meta.us} per 1 ${meta.ts})`} hint="Works only while the sale is paused.">
              <div className="flex gap-2">
                <Input placeholder="0.05" value={price} onChange={(e) => setPrice(e.target.value)} />
                <Button onClick={() => act("Set price", () => presale.setPrice(U(price)))}>Set</Button>
              </div>
            </Field>
            <Field label={`Min buy and max per wallet (${meta.us})`} hint="Use 0 for no limit.">
              <div className="flex gap-2">
                <Input placeholder="min" value={min} onChange={(e) => setMin(e.target.value)} />
                <Input placeholder="max" value={max} onChange={(e) => setMax(e.target.value)} />
                <Button onClick={() => act("Set limits", () => presale.setLimits(U(min), U(max)))}>Set</Button>
              </div>
            </Field>
            <Field label="New treasury address" hint={`${meta.us} from buyers goes to this wallet.`}>
              <div className="flex gap-2">
                <Input placeholder="0x..." value={tre} onChange={(e) => setTre(e.target.value)} />
                <Button onClick={() => act("Set treasury", () => presale.setTreasury(tre.trim()))}>Set</Button>
              </div>
            </Field>
          </div>
          <div className="space-y-5">
            <Field label="Sale start">
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Sale end">
              <div className="flex gap-2">
                <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
                <Button onClick={() => act("Set sale window", () => presale.setSaleWindow(when(start), when(end)))}>Set</Button>
              </div>
            </Field>
            <Field label="Withdraw unsold tokens" hint={`Only after the sale ends. Presale holds ${fmt(data.held, meta.td, 2)} ${meta.ts}.`}>
              <div className="space-y-2">
                <Input placeholder="to address" value={wdTo} onChange={(e) => setWdTo(e.target.value)} />
                <div className="flex gap-2">
                  <Input placeholder="amount" value={wdAmt} onChange={(e) => setWdAmt(e.target.value)} />
                  <Button variant="outline" onClick={() => setWdAmt(formatUnits(data.held, meta.td))}>Max</Button>
                  <Button onClick={() => act("Withdraw", () => presale.withdrawUnsold(wdTo.trim(), parseUnits(wdAmt.trim() || "0", meta.td)))}>Withdraw</Button>
                </div>
              </div>
            </Field>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
