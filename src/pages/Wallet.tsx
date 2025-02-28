
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Send,
  Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Profile {
  content_tokens: number;
  transfer_code: string;
}

interface Transaction {
  id: string;
  content_tokens: number;
  type: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

const Wallet = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [recipientCode, setRecipientCode] = useState("");
  const [contentTokensAmount, setContentTokensAmount] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchTransactions();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('content_tokens, transfer_code')
      .eq('id', user.id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load wallet information",
      });
      return;
    }

    setProfile(data);
  };

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('token_transactions')
      .select(`
        *,
        profiles!token_transactions_recipient_id_fkey(username)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transactions",
      });
      return;
    }

    setTransactions(data || []);
  };

  const handleTransferTokens = async () => {
    try {
      // Set view_tokens_amount to 0 since we're only using content tokens now
      const { error } = await supabase.rpc('transfer_tokens', {
        recipient_transfer_code: recipientCode,
        content_tokens_amount: parseFloat(contentTokensAmount) || 0,
        view_tokens_amount: 0 // Always 0 since we removed view tokens
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tokens transferred successfully",
      });

      setIsTransferOpen(false);
      setRecipientCode("");
      setContentTokensAmount("");
      
      // Refresh data
      fetchProfile();
      fetchTransactions();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const copyTransferCode = () => {
    if (!profile?.transfer_code) return;
    
    navigator.clipboard.writeText(profile.transfer_code);
    toast({
      title: "Copied!",
      description: "Transfer code copied to clipboard",
    });
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <div className="space-y-6">
          <div className="text-center">
            <WalletIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold">Your Wallet</h1>
            <div className="mt-2 text-sm text-muted-foreground flex items-center justify-center gap-2">
              <span>Transfer Code: {profile.transfer_code}</span>
              <button 
                onClick={copyTransferCode}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-muted p-6 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-2">Content Tokens</div>
            <div className="text-3xl font-bold">{profile.content_tokens.toFixed(8)}</div>
          </div>

          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <button className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center gap-2">
                <Send className="h-5 w-5" />
                <span>Transfer Tokens</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Tokens</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientCode">Recipient Transfer Code</Label>
                  <Input
                    id="recipientCode"
                    value={recipientCode}
                    onChange={(e) => setRecipientCode(e.target.value)}
                    placeholder="Enter recipient's transfer code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentTokens">Content Tokens Amount</Label>
                  <Input
                    id="contentTokens"
                    type="number"
                    step="0.00000001"
                    min="0"
                    value={contentTokensAmount}
                    onChange={(e) => setContentTokensAmount(e.target.value)}
                    placeholder="0.00000000"
                  />
                </div>
                <button
                  onClick={handleTransferTokens}
                  className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg"
                >
                  Send Tokens
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'transfer' ? 'bg-blue-500/10' :
                      transaction.type === 'view' ? 'bg-green-500/10' :
                      'bg-yellow-500/10'
                    }`}>
                      {transaction.type === 'transfer' ? (
                        <Send className="h-4 w-4 text-blue-500" />
                      ) : transaction.type === 'view' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{transaction.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.profiles?.username}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {transaction.content_tokens > 0 && (
                      <div className="text-sm">
                        {transaction.content_tokens.toFixed(8)} CT
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Wallet;
