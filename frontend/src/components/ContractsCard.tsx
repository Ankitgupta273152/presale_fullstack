import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Data, Meta } from "@/hooks/usePresale";
import { fmt } from "@/lib/format";

function AddressRow({ label, value, explorer }: { label: string; value: string; explorer?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-1">
        <span className="truncate font-mono text-xs sm:text-sm">{value}</span>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copy} aria-label={`Copy ${label} address`}>
          {copied ? <Check /> : <Copy />}
        </Button>
        {explorer ? (
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <a href={`${explorer}/address/${value}`} target="_blank" rel="noreferrer" aria-label={`Open ${label} in explorer`}><ExternalLink /></a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ContractsCard({ meta, data, explorer }: { meta: Meta; data: Data; explorer?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>Contracts and treasury</CardTitle></CardHeader>
      <CardContent>
        <AddressRow label="Presale" value={meta.presaleAddr} explorer={explorer} />
        <AddressRow label={`${meta.ts} token`} value={meta.tokenAddr} explorer={explorer} />
        <AddressRow label={`${meta.us} token`} value={meta.usdtAddr} explorer={explorer} />
        <AddressRow label="Treasury" value={data.treasury} explorer={explorer} />
        <div className="flex items-center justify-between gap-3 border-b py-2.5">
          <span className="text-sm text-muted-foreground">Treasury {meta.us} balance</span>
          <span className="text-sm font-semibold">{fmt(data.treasBal, meta.ud)} {meta.us}</span>
        </div>
        <AddressRow label="Owner" value={data.owner} explorer={explorer} />
      </CardContent>
    </Card>
  );
}
