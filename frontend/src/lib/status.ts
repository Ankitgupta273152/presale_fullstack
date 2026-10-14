import type { Data } from "@/hooks/usePresale";
import { dur } from "./format";

export type Status = { label: string; variant: "success" | "warning" | "destructive"; countdown: string };

export function getStatus(d: Data, now: number): Status {
  if (d.paused) return { label: "Paused", variant: "destructive", countdown: "Sale is paused by the owner" };
  if (now < d.start) return { label: "Not started", variant: "warning", countdown: `Starts in ${dur(d.start - now)}` };
  if (now > d.end) return { label: "Ended", variant: "destructive", countdown: "Sale has ended" };
  if (d.remain === 0n) return { label: "Sold out", variant: "destructive", countdown: "All tokens are sold" };
  return { label: "Live", variant: "success", countdown: `Ends in ${dur(d.end - now)}` };
}
