import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AlertCircle, Wallet } from "lucide-react";
import { AccountCard } from "@/components/AccountCard";
import { BuyCard } from "@/components/BuyCard";
import { ContractsCard } from "@/components/ContractsCard";
import { Header } from "@/components/Header";
import { OwnerPanel } from "@/components/OwnerPanel";
import { SaleStatus } from "@/components/SaleStatus";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNow } from "@/hooks/useNow";
import { usePresale } from "@/hooks/usePresale";
import { useWallet } from "@/hooks/useWallet";
import { DEFAULT_PRESALE, explorerOf } from "@/lib/config";
import { getStatus } from "@/lib/status";

export default function App() {
  const wallet = useWallet();
  const now = useNow();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [address, setAddress] = useState(() => localStorage.getItem("presaleAddr") || DEFAULT_PRESALE);
  const [draft, setDraft] = useState(address);
  const { meta, data, error, refresh } = usePresale(wallet.signer, wallet.account, address);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const loadAddress = () => {
    const v = draft.trim();
    localStorage.setItem("presaleAddr", v);
    setAddress(v);
  };

  const explorer = explorerOf(wallet.chainId);
  const status = data ? getStatus(data, now) : null;
  const isOwner = !!(data && wallet.account && data.owner.toLowerCase() === wallet.account.toLowerCase());

  return (
    <div className="min-h-screen">
      <div className="container space-y-4 py-5 sm:py-8">
        <Header
          title={meta ? `${meta.ts} Presale` : "Token Presale"}
          account={wallet.account}
          chainId={wallet.chainId}
          connecting={wallet.connecting}
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          onConnect={wallet.connect}
        />

        {!wallet.account ? (
          <Card>
            <CardHeader><CardTitle>Connect your wallet</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Connect MetaMask to see the presale and buy tokens.</p>
              {wallet.error ? (
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Could not connect</AlertTitle><AlertDescription>{wallet.error}</AlertDescription></Alert>
              ) : !wallet.hasWallet ? (
                <Alert variant="warning"><AlertCircle className="h-4 w-4" /><AlertTitle>MetaMask not detected</AlertTitle><AlertDescription>Install the MetaMask extension and reload this page.</AlertDescription></Alert>
              ) : null}
              <Button size="lg" onClick={wallet.connect} disabled={wallet.connecting}><Wallet /> {wallet.connecting ? "Connecting..." : "Connect MetaMask"}</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="space-y-2 p-4 sm:p-5">
                <div className="flex gap-2">
                  <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Presale contract address 0x..." spellCheck={false} className="font-mono" aria-label="Presale contract address" />
                  <Button variant="outline" onClick={loadAddress}>Load</Button>
                </div>
                {error ? (
                  <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Problem</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
                ) : null}
              </CardContent>
            </Card>

            {meta && data && status ? (
              <>
                <SaleStatus meta={meta} data={data} status={status} />
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="md:col-span-3"><BuyCard meta={meta} data={data} status={status.label} explorer={explorer} refresh={refresh} /></div>
                  <div className="md:col-span-2">{wallet.account ? <AccountCard meta={meta} data={data} account={wallet.account} explorer={explorer} refresh={refresh} /> : null}</div>
                </div>
                <ContractsCard meta={meta} data={data} explorer={explorer} />
                {isOwner && wallet.account ? <OwnerPanel key={meta.presaleAddr} meta={meta} data={data} account={wallet.account} explorer={explorer} refresh={refresh} /> : null}
              </>
            ) : !error ? (
              <div className="space-y-4"><Skeleton className="h-48 w-full" /><div className="grid gap-4 md:grid-cols-5"><Skeleton className="h-72 md:col-span-3" /><Skeleton className="h-72 md:col-span-2" /></div></div>
            ) : null}
          </>
        )}

        <p className="pt-2 text-center text-xs text-muted-foreground">Testnet tokens have no real value. Never share your seed phrase or private key.</p>
      </div>
      <Toaster theme={dark ? "dark" : "light"} position="top-center" richColors closeButton />
    </div>
  );
}
