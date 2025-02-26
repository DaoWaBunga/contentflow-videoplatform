
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { VideoCard } from "@/components/video/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FileQuestion } from "lucide-react";

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  category: string | null;
  profiles: {
    username: string;
  };
}

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles!videos_user_id_fkey (
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setVideos(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load videos",
      });
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-pulse text-center">
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          </div>
        ) : videos.length > 0 ? (
          videos.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              author={video.profiles.username}
              thumbnail={video.thumbnail_url || video.url}
              likes={video.likes_count || 0}
              comments={video.comments_count || 0}
              category={video.category || "Uncategorized"}
            />
          ))
        ) : (
          <div className="text-center py-20 space-y-4">
            <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-medium">No content yet</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Be the first to upload videos and images to the platform!
            </p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
