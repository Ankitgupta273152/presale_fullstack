import { formatUnits } from "ethers";

export function fmt(v: bigint, decimals: number, maxFrac = 4): string {
  const s = formatUnits(v, decimals);
  const [i, f = ""] = s.split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = f.slice(0, maxFrac).replace(/0+$/, "");
  return frac ? `${int}.${frac}` : int;
}

export function dur(sec: number): string {
  if (sec <= 0) return "0s";
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${d ? d + "d " : ""}${d || h ? h + "h " : ""}${m}m ${s}s`;
}

export const shortAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

export function toLocalInput(ts: number): string {
  const d = new Date(ts * 1000 - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}
