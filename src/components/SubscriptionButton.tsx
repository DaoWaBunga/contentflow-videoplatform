
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Crown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const SubscriptionButton = ({ hasPremium = false }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to subscribe",
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error initiating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate subscription process",
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasPremium) {
    return (
      <Button disabled variant="outline" className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-yellow-500" />
        Premium Active
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleSubscribe} 
      disabled={loading}
      className="flex items-center gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Crown className="h-4 w-4" />
      )}
      Unlock unlimited posts $1 USD
    </Button>
  );
};
