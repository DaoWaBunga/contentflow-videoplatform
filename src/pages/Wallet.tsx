
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTokenStore } from "@/store/useTokenStore";

const Wallet = () => {
  const { contentTokens, viewTokens } = useTokenStore();

  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <div className="space-y-6">
          <div className="text-center">
            <WalletIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold">Your Wallet</h1>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Content Tokens</div>
              <div className="text-2xl font-bold">{contentTokens}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">View Tokens</div>
              <div className="text-2xl font-bold">{viewTokens}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-full">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Received Tokens</div>
                    <div className="text-sm text-muted-foreground">For video views</div>
                  </div>
                </div>
                <div className="text-green-500">+50</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/10 rounded-full">
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <div className="font-medium">Spent Tokens</div>
                    <div className="text-sm text-muted-foreground">Video upload</div>
                  </div>
                </div>
                <div className="text-red-500">-10</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Wallet;
