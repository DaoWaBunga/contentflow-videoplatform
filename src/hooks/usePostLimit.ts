
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
          .single();
        
        // If user has active premium, they can always post
        if (premiumData?.active) {
          setCanPost(true);
          setRemainingPosts(null); // Unlimited posts for premium users
          setLoading(false);
          return;
        }
        
        // Count today's posts
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
        
        const { data: postsData, error: postsError } = await supabase
          .from('videos')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('created_at', startOfDay)
          .lt('created_at', endOfDay);
        
        if (postsError) {
          console.error("Error checking post count:", postsError);
          setCanPost(false);
          return;
        }
        
        const postCount = postsData?.length || 0;
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
