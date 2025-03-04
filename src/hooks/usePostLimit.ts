
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePostLimit = () => {
  const [canPost, setCanPost] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [remainingPosts, setRemainingPosts] = useState<number | null>(null);

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
        
        // First check if user has premium
        const { data: premiumData, error: premiumError } = await supabase
          .from('store_purchases')
          .select('active')
          .eq('user_id', user.id)
          .eq('item_id', 'premium_subscription')
          .maybeSingle();
        
        // If user has active premium, they can always post
        if (premiumData?.active) {
          setCanPost(true);
          setRemainingPosts(null); // Unlimited posts for premium users
          setLoading(false);
          return;
        }
        
        // Count today's posts
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of day
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start of next day
        
        const { data: postsData, error: postsError, count } = await supabase
          .from('videos')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());
        
        if (postsError) {
          console.error("Error checking post count:", postsError);
          setCanPost(false);
          return;
        }
        
        const postCount = count || 0;
        const maxPosts = 5; // Free user daily post limit
        
        setCanPost(postCount < maxPosts);
        setRemainingPosts(Math.max(0, maxPosts - postCount));
      } catch (error) {
        console.error("Error checking post limit:", error);
        setCanPost(false);
      } finally {
        setLoading(false);
      }
    };

    checkPostLimit();
  }, []);

  return { canPost, loading, remainingPosts };
};
