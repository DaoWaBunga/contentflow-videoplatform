
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { VideoCard } from "@/components/video/VideoCard";
import { Search, FileQuestion } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  profiles: {
    username: string;
  };
}

const Discover = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
          profiles (
            username
          )
        `)
        .order('created_at', { ascending: false });

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

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search videos..."
            className="pl-10 bg-muted border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-pulse text-center">
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="space-y-4">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                author={video.profiles.username}
                thumbnail={video.thumbnail_url || video.url}
                likes={video.likes_count || 0}
                comments={video.comments_count || 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-medium">No content found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              {searchQuery ? "Try a different search query" : "Be the first to share amazing content!"}
            </p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Discover;
