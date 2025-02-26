
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const [tokenCount, setTokenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserTokens = async () => {
      setLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('content_tokens, view_tokens')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            // Sum of content and view tokens, rounded to nearest integer
            const totalTokens = Math.round(data.content_tokens + data.view_tokens);
            setTokenCount(totalTokens);
          }
        }
      } catch (error) {
        console.error("Error fetching user tokens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTokens();

    // Also subscribe to auth changes to update tokens when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserTokens();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-muted">
      <div className="flex justify-between items-center h-16 px-4 max-w-lg mx-auto">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DrivePlay
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-muted">
            <span className="text-sm font-medium">
              {loading ? "..." : tokenCount}
            </span>
            <span className="text-xs text-muted-foreground">tokens</span>
          </div>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
