
import { useState, useEffect } from "react";
import { Play, Heart, MessageCircle, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface VideoCardProps {
  id?: string;  // Make id optional for now since some uses might not provide it
  title: string;
  author: string;
  thumbnail: string;
  likes: number;
  comments: number;
}

export function VideoCard({ id, title, author, thumbnail, likes, comments }: VideoCardProps) {
  const [isViewed, setIsViewed] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | "youtube" | "iframe" | "unknown">("unknown");
  const { toast } = useToast();

  useEffect(() => {
    // Determine media type based on thumbnail/URL
    if (thumbnail.match(/\.(jpeg|jpg|gif|png)$/i) || thumbnail.includes('images.unsplash.com')) {
      setMediaType("image");
    } else if (thumbnail.match(/\.(mp4|mov|webm)$/i)) {
      setMediaType("video");
    } else if (thumbnail.includes('youtube.com') || thumbnail.includes('youtu.be')) {
      setMediaType("youtube");
    } else if (thumbnail.includes('imgur.com')) {
      // Check if it's an Imgur image or album
      setMediaType(thumbnail.match(/\.(jpeg|jpg|gif|png)$/i) ? "image" : "iframe");
    } else {
      setMediaType("unknown");
    }
  }, [thumbnail]);

  const handleView = async () => {
    if (!id || isViewed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to view videos",
        });
        return;
      }

      const { error } = await supabase.rpc('handle_video_view', {
        video_id: id,
        viewer_id: user.id
      });

      if (error) throw error;

      setIsViewed(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  // Function to render the correct media based on type
  const renderMedia = () => {
    switch (mediaType) {
      case "image":
        return (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            onClick={handleView}
          />
        );
      case "video":
        return (
          <video
            src={thumbnail}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
            poster=""
            onClick={handleView}
          />
        );
      case "youtube":
        // Extract YouTube video ID
        const youtubeId = thumbnail.includes('youtube.com/watch?v=') 
          ? new URL(thumbnail).searchParams.get('v')
          : thumbnail.includes('youtu.be/')
            ? thumbnail.split('youtu.be/')[1]?.split('?')[0]
            : null;
        
        return youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onClick={handleView}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            Invalid YouTube URL
          </div>
        );
      case "iframe":
        // Handle Imgur embeds
        if (thumbnail.includes('imgur.com/a/')) {
          const albumId = thumbnail.split('imgur.com/a/')[1]?.split('/')[0];
          return albumId ? (
            <iframe
              src={`https://imgur.com/a/${albumId}/embed`}
              className="w-full h-full"
              allowFullScreen
              onClick={handleView}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              Invalid Imgur URL
            </div>
          );
        }
        // Fall through to default
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
              onClick={handleView}
            />
          </div>
        );
    }
  };

  return (
    <div className="relative w-full aspect-[9/16] bg-muted rounded-lg overflow-hidden">
      {renderMedia()}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-gray-300">{author}</p>
      </div>
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4">
        <button className="p-3 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-colors group">
          <Heart className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="text-xs mt-1">{likes}</span>
        </button>
        <button className="p-3 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-colors group">
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="text-xs mt-1">{comments}</span>
        </button>
        <button className="p-3 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-colors group">
          <Share2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
