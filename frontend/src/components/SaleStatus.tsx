import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Data, Meta } from "@/hooks/usePresale";
import { fmt } from "@/lib/format";
import type { Status } from "@/lib/status";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-base font-semibold sm:text-lg">{value}</div>
    </div>
  );
}

export function SaleStatus({ meta, data, status }: { meta: Meta; data: Data; status: Status }) {
  const pct = data.cap === 0n ? 0 : Number((data.sold * 10000n) / data.cap) / 100;
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Sale status</CardTitle>
          <CardDescription>{status.countdown}</CardDescription>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Progress value={pct} aria-label="Sale progress" />
          <div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{fmt(data.sold, meta.td, 2)} / {fmt(data.cap, meta.td, 2)} {meta.ts} sold</span>
            <span>{pct.toFixed(2)}%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Price" value={`${fmt(data.price, meta.ud, 6)} ${meta.us} / ${meta.ts}`} />
          <Stat label="Total raised" value={`${fmt(data.raised, meta.ud)} ${meta.us}`} />
          <Stat label="Tokens remaining" value={`${fmt(data.remain, meta.td, 2)} ${meta.ts}`} />
          <Stat label="Min buy" value={data.minBuy === 0n ? "No limit" : `${fmt(data.minBuy, meta.ud)} ${meta.us}`} />
          <Stat label="Max per wallet" value={data.maxW === 0n ? "No limit" : `${fmt(data.maxW, meta.ud)} ${meta.us}`} />
        </div>
      </CardContent>
    </Card>
  );
}
