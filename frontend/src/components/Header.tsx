import { Coins, Moon, Sun, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHAINS } from "@/lib/config";
import { shortAddr } from "@/lib/format";

type Props = {
  title: string; account?: string; chainId?: number; connecting: boolean;
  dark: boolean; onToggleTheme: () => void; onConnect: () => void;
};

export function Header({ title, account, chainId, connecting, dark, onToggleTheme, onConnect }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Coins className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight sm:text-2xl">{title}</h1>
          <p className="text-xs text-muted-foreground">Buy tokens with USDT</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {chainId ? <Badge variant="outline">{CHAINS[chainId]?.name ?? `Chain ${chainId}`}</Badge> : null}
        {account ? (
          <Badge variant="secondary" className="font-mono">{shortAddr(account)}</Badge>
        ) : (
          <Button onClick={onConnect} disabled={connecting}>
            <Wallet /> {connecting ? "Connecting..." : "Connect MetaMask"}
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
          {dark ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  );
}
