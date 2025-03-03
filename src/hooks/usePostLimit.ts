
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePostLimit = () => {
  const [canPost, setCanPost] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPostLimit = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setCanPost(false);
          setLoading(false);
          return;
        }
        
        // Call the database function with the user's ID
        const { data, error } = await supabase.rpc('check_daily_post_limit', {
          user_id: user.id
        });
        
        if (error) {
          console.error("Error checking post limit:", error);
          setCanPost(false);
          return;
        }
        
        setCanPost(data);
      } catch (error) {
        console.error("Error checking post limit:", error);
        setCanPost(false);
      } finally {
        setLoading(false);
      }
    };

    checkPostLimit();
  }, []);

  return { canPost, loading };
};
