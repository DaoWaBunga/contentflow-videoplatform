
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VideoCardProps {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  likes: number;
  comments: number;
  category?: string;
}

export const VideoCard = ({ 
  id, 
  title, 
  author, 
  thumbnail, 
  likes, 
  comments,
  category = "Uncategorized"
}: VideoCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [commentCount, setCommentCount] = useState(comments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isYoutubeVideo = 
    thumbnail.includes("youtube.com") || 
    thumbnail.includes("youtu.be");
  
  const isDirectImageUrl = 
    thumbnail.endsWith(".jpg") || 
    thumbnail.endsWith(".jpeg") || 
    thumbnail.endsWith(".png") || 
    thumbnail.endsWith(".gif") ||
    thumbnail.includes("storage.googleapis.com");

  // Extract video ID from YouTube URL
  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = "";
    
    if (url.includes("youtube.com/watch")) {
      videoId = new URL(url).searchParams.get("v") || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  const handleThumbnailClick = () => {
    navigate(`/video/${id}`);
  };

  const handleLikeClick = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to like videos",
          variant: "destructive",
        });
        return;
      }
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select()
        .eq('video_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingLike) {
        toast({
          title: "Already liked",
          description: "You've already liked this video",
        });
        setIsLiked(true);
        return;
      }
      
      // Add like
      const { error } = await supabase
        .from('likes')
        .insert({
          video_id: id,
          user_id: user.id
        });
      
      if (error) throw error;
      
      // Update UI
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      
      toast({
        title: "Liked!",
        description: "You've successfully liked this video",
      });
    } catch (error: any) {
      console.error("Error liking video:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to like video",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentClick = () => {
    setShowCommentInput(!showCommentInput);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !commentText.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to comment",
          variant: "destructive",
        });
        return;
      }
      
      // Add comment
      const { error } = await supabase
        .from('comments')
        .insert({
          video_id: id,
          user_id: user.id,
          content: commentText.trim()
        });
      
      if (error) throw error;
      
      // Update UI
      setCommentCount(prev => prev + 1);
      setCommentText("");
      setShowCommentInput(false);
      
      toast({
        title: "Comment added!",
        description: "Your comment has been posted",
      });
    } catch (error: any) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderThumbnail = () => {
    if (isYoutubeVideo) {
      const embedUrl = getYoutubeEmbedUrl(thumbnail);
      return (
        <div className="aspect-video w-full rounded-md overflow-hidden bg-muted">
          <iframe 
            src={embedUrl} 
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        </div>
      );
    } else if (isDirectImageUrl) {
      return (
        <div 
          className="aspect-video w-full rounded-md overflow-hidden bg-muted cursor-pointer"
          onClick={handleThumbnailClick}
        >
          <img 
            src={thumbnail} 
            alt={title} 
            className="w-full h-full object-cover" 
          />
        </div>
      );
    } else {
      // Fallback for other types of content or invalid URLs
      return (
        <div 
          className="aspect-video w-full rounded-md overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
          onClick={handleThumbnailClick}
        >
          <p className="text-muted-foreground">Click to view content</p>
        </div>
      );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
            <p className="text-sm text-muted-foreground">by {author}</p>
          </div>
          <Badge variant="outline" className="ml-2">
            {category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {renderThumbnail()}
      </CardContent>
      <CardFooter className="p-4 flex justify-between">
        <div className="flex space-x-4">
          <button 
            className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : ''}`}
            onClick={handleLikeClick}
            disabled={isSubmitting || isLiked}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </button>
          <button 
            className="flex items-center space-x-1"
            onClick={handleCommentClick}
          >
            <MessageCircle className="h-5 w-5" />
            <span>{commentCount}</span>
          </button>
        </div>
        <button className="flex items-center space-x-1">
          <Share2 className="h-5 w-5" />
          <span>Share</span>
        </button>
      </CardFooter>
      
      {showCommentInput && (
        <div className="px-4 pb-4">
          <form onSubmit={handleCommentSubmit} className="flex space-x-2">
            <input
              type="text"
              className="flex-1 bg-muted rounded-md px-3 py-2 text-sm"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium"
              disabled={isSubmitting || !commentText.trim()}
            >
              Post
            </button>
          </form>
        </div>
      )}
    </Card>
  );
};
