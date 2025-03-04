
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "react-router-dom";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { VideoGallery } from "@/components/profile/VideoGallery";

interface Profile {
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  category: string | null;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [hasPremium, setHasPremium] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Check for payment success/failure
    const query = new URLSearchParams(location.search);
    const paymentStatus = query.get('payment');
    
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful",
        description: "Thank you for subscribing to Premium! You now have unlimited posts.",
      });
    } else if (paymentStatus === 'canceled') {
      toast({
        variant: "destructive",
        title: "Payment Canceled",
        description: "Your subscription was not completed.",
      });
    }
  }, [location, toast]);

  useEffect(() => {
    fetchProfile();
    fetchUserVideos();
    checkPremiumStatus();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, bio')
      .eq('id', user.id)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile",
      });
      return;
    }

    setProfile(data);
  };

  const fetchUserVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load videos",
      });
      return;
    }

    setVideos(data || []);
  };

  const checkPremiumStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('store_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', 'premium_subscription')
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error("Error checking premium status:", error);
      return;
    }

    setHasPremium(!!data);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <ProfileHeader 
          profile={profile} 
          hasPremium={hasPremium} 
          onProfileUpdate={setProfile} 
        />
        
        <VideoGallery 
          videos={videos} 
          username={profile.username} 
          onVideosUpdate={setVideos} 
        />
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
