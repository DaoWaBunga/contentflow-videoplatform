
import { useState, useEffect } from "react";
import { Play, Heart, MessageCircle, Share2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface VideoCardProps {
  id?: string;
  title: string;
  author: string;
  thumbnail: string;
  likes: number;
  comments: number;
  category?: string;
}

export function VideoCard({ 
  id, 
  title, 
  author, 
  thumbnail, 
  likes, 
  comments, 
  category = "Uncategorized" 
}: VideoCardProps) {
  const [isViewed, setIsViewed] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | "youtube" | "iframe" | "unknown">("unknown");
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(likes);
  const [commentsCount, setCommentsCount] = useState(comments);
  const [commentText, setCommentText] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
    determineMediaType();
    if (id) {
      checkIfLiked();
    }
  }, [id, thumbnail]);

  const checkAuthStatus = async () => {
    const { data } = await supabase.auth.getUser();
    setIsAuthenticated(!!data.user);
  };

  const determineMediaType = () => {
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
  };

  const checkIfLiked = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !id) return;

    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('video_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error("Error checking like status:", error);
      return;
    }

    setLiked(!!data);
  };

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

  const handleLike = async () => {
    if (!id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please sign in to like videos",
        });
        return;
      }

      if (liked) {
        // Unlike the video
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('video_id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Unliked",
          description: "You have unliked this video",
        });
      } else {
        // Like the video
        const { error } = await supabase
          .from('likes')
          .insert({
            video_id: id,
            user_id: user.id
          });

        if (error) {
          // If there's a conflict (already liked), don't show an error
          if (error.code !== '23505') { // PostgreSQL unique constraint violation
            throw error;
          }
        } else {
          setLiked(true);
          setLikesCount(prev => prev + 1);
          toast({
            title: "Liked!",
            description: "You liked this video",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleComment = async () => {
    if (!id || !commentText.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please sign in to comment",
        });
        return;
      }

      // Here's the fixed part - we need to fix the Supabase types by using the SQL API directly
      const { error } = await supabase
        .from('comments')
        .insert({
          video_id: id,
          user_id: user.id,
          content: commentText.trim()
        });

      if (error) throw error;

      setCommentText("");
      setCommentsCount(prev => prev + 1);
      setIsCommentDialogOpen(false);
      
      toast({
        title: "Comment Posted",
        description: "Your comment has been added successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const openCommentDialog = () => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to comment",
      });
      return;
    }
    setIsCommentDialogOpen(true);
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
      
      {/* Category badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge variant="secondary" className="px-2 py-1 bg-black/50 backdrop-blur-sm">
          <Tag className="h-3 w-3 mr-1" />
          {category}
        </Badge>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-gray-300">{author}</p>
      </div>

      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4">
        <button 
          className={`p-3 rounded-full ${liked ? 'bg-red-500/30' : 'bg-primary/10'} backdrop-blur-sm hover:bg-primary/20 transition-colors group`}
          onClick={handleLike}
        >
          <Heart className={`h-6 w-6 group-hover:scale-110 transition-transform ${liked ? 'fill-red-500 text-red-500' : ''}`} />
          <span className="text-xs mt-1">{likesCount}</span>
        </button>

        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
          <DialogTrigger asChild>
            <button 
              className="p-3 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-colors group"
              onClick={openCommentDialog}
            >
              <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs mt-1">{commentsCount}</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a comment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Textarea
                placeholder="Write your comment here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-24"
              />
              <div className="flex justify-end">
                <Button onClick={handleComment} disabled={!commentText.trim()}>
                  Post Comment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <button className="p-3 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-colors group">
          <Share2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
