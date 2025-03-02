
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Send,
  Copy,
  ShoppingBag,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'display' | 'comment' | 'content';
  preview?: string;
  icon?: React.ReactNode;
}

const storeItems: StoreItem[] = [
  // Display enhancements
  {
    id: 'red-username',
    name: 'Red Username',
    description: 'Make your username stand out with a bold red color',
    price: 10000,
    category: 'display',
    preview: '#ea384c'
  },
  {
    id: 'purple-username',
    name: 'Purple Username',
    description: 'Style your username with an elegant purple hue',
    price: 15000,
    category: 'display',
    preview: '#9b87f5'
  },
  {
    id: 'glowing-username',
    name: 'Glowing Username',
    description: 'Add a mesmerizing glow effect to your username',
    price: 30000,
    category: 'display',
    preview: '#D6BCFA'
  },
  {
    id: 'custom-border',
    name: 'Custom Profile Border',
    description: 'Add a distinctive border to your profile avatar',
    price: 20000,
    category: 'display'
  },
  
  // Comment perks
  {
    id: 'premium-emoji',
    name: 'Premium Reaction Emojis',
    description: 'Express yourself with exclusive reaction emojis',
    price: 1000,
    category: 'comment'
  },
  {
    id: 'ultra-rare-emoji',
    name: 'Ultra-Rare Emoji',
    description: 'Stand out with the rarest emoji in the platform',
    price: 1000000,
    category: 'comment'
  },
  {
    id: 'comment-highlight',
    name: 'Comment Highlighting',
    description: 'Make your comments more visible with a special highlight',
    price: 7500,
    category: 'comment'
  },
  {
    id: 'priority-comment',
    name: 'Priority Comment Placement',
    description: 'Have your comments appear at the top of the list',
    price: 5000,
    category: 'comment'
  },
  
  // Content features
  {
    id: 'spotlight-post',
    name: 'Spotlight Post Ability',
    description: 'Boost the visibility of your posts in the discover feed',
    price: 25000,
    category: 'content'
  },
  {
    id: 'extended-caption',
    name: 'Extended Caption Length',
    description: 'Get more characters for your post captions',
    price: 5000,
    category: 'content'
  }
];

const Wallet = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [recipientCode, setRecipientCode] = useState("");
  const [contentTokensAmount, setContentTokensAmount] = useState("");
  const [activeTab, setActiveTab] = useState("wallet");
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [confirmPurchaseOpen, setConfirmPurchaseOpen] = useState(false);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
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
      const { error } = await supabase.rpc('transfer_tokens', {
        recipient_transfer_code: recipientCode,
        content_tokens_amount: parseFloat(contentTokensAmount) || 0,
        view_tokens_amount: 0
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tokens transferred successfully",
      });

      setIsTransferOpen(false);
      setRecipientCode("");
      setContentTokensAmount("");
      
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

  const handlePurchaseItem = async () => {
    if (!selectedItem || !profile) return;
    
    try {
      if (profile.content_tokens < selectedItem.price) {
        toast({
          variant: "destructive",
          title: "Insufficient tokens",
          description: "You don't have enough tokens to purchase this item",
        });
        setConfirmPurchaseOpen(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // First, record the transaction for the token deduction
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          sender_id: user.id,
          recipient_id: user.id,
          content_tokens: -selectedItem.price,
          type: 'purchase'
        });
      
      if (transactionError) throw transactionError;
      
      // Update the user's token balance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          content_tokens: profile.content_tokens - selectedItem.price 
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Record the purchase using a direct table insert instead of RPC
      const { error: purchaseError } = await supabase
        .from('store_purchases')
        .insert({
          user_id: user.id,
          item_id: selectedItem.id,
          price: selectedItem.price
        });
      
      if (purchaseError) {
        console.error("Failed to record purchase, but tokens were deducted:", purchaseError);
      }
      
      toast({
        title: "Purchase Successful",
        description: `You've successfully purchased ${selectedItem.name}`,
      });
      
      fetchProfile();
      fetchTransactions();
      setConfirmPurchaseOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error.message,
      });
      setConfirmPurchaseOpen(false);
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

  const getFilteredStoreItems = () => {
    if (!filteredCategory) return storeItems;
    return storeItems.filter(item => item.category === filteredCategory);
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

          <Tabs defaultValue="wallet" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
              <TabsTrigger value="store" className="flex-1">Store</TabsTrigger>
            </TabsList>
            
            <TabsContent value="wallet" className="space-y-4">
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
                          transaction.type === 'purchase' ? 'bg-purple-500/10' :
                          'bg-yellow-500/10'
                        }`}>
                          {transaction.type === 'transfer' ? (
                            <Send className="h-4 w-4 text-blue-500" />
                          ) : transaction.type === 'view' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : transaction.type === 'purchase' ? (
                            <ShoppingBag className="h-4 w-4 text-purple-500" />
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
                        {transaction.content_tokens < 0 && (
                          <div className="text-sm text-destructive">
                            {transaction.content_tokens.toFixed(8)} CT
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="store" className="space-y-6">
              <Alert className="bg-muted/80">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  Purchase digital items and features using your earned tokens.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button 
                  variant={filteredCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilteredCategory(null)}
                >
                  All
                </Button>
                <Button 
                  variant={filteredCategory === 'display' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilteredCategory('display')}
                >
                  Display
                </Button>
                <Button 
                  variant={filteredCategory === 'comment' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilteredCategory('comment')}
                >
                  Comments
                </Button>
                <Button 
                  variant={filteredCategory === 'content' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilteredCategory('content')}
                >
                  Content
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {getFilteredStoreItems().map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{item.price.toLocaleString()} CT</div>
                      </div>
                    </div>
                    
                    {item.preview && item.id.includes('username') && (
                      <div className="mt-3 p-2 rounded bg-muted/80">
                        <span className="font-semibold" style={{ color: item.preview }}>
                          Username Preview
                        </span>
                        {item.id === 'glowing-username' && (
                          <span className="ml-2 text-xs">(Glow effect not shown in preview)</span>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <Button 
                        className="w-full"
                        onClick={() => {
                          setSelectedItem(item);
                          setConfirmPurchaseOpen(true);
                        }}
                        disabled={profile.content_tokens < item.price}
                      >
                        {profile.content_tokens < item.price ? "Not Enough Tokens" : "Purchase"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <AlertDialog open={confirmPurchaseOpen} onOpenChange={setConfirmPurchaseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to purchase <strong>{selectedItem?.name}</strong> for <strong>{selectedItem?.price.toLocaleString()} CT</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePurchaseItem}>Confirm Purchase</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <BottomNav />
    </div>
  );
};

export default Wallet;
