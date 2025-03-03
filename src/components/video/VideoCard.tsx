import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { VideoModal } from "./VideoModal";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

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
  const [commentsData, setCommentsData] = useState<Comment[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isYoutubeVideo = 
    thumbnail.includes("youtube.com") || 
    thumbnail.includes("youtu.be");
  
  const isDirectImageUrl = 
    thumbnail.endsWith(".jpg") || 
    thumbnail.endsWith(".jpeg") || 
    thumbnail.endsWith(".png") || 
    thumbnail.endsWith(".gif") ||
    thumbnail.includes("storage.googleapis.com");

  useEffect(() => {
    const checkIfLiked = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('likes')
          .select()
          .eq('video_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsLiked(!!data);
      }
    };
    
    checkIfLiked();
  }, [id]);

  useEffect(() => {
    if (showCommentInput && commentsData.length === 0) {
      fetchComments();
    }
  }, [showCommentInput]);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profiles:user_id (
            username
          )
        `)
        .eq('video_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCommentsData(data as Comment[] || []);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

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
    setIsModalOpen(true);
  };

  const handleLikeClick = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to like videos",
          variant: "destructive",
        });
        return;
      }
      
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
      
      const { error } = await supabase
        .from('likes')
        .insert({
          video_id: id,
          user_id: user.id
        });
      
      if (error) throw error;
      
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to comment",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase
        .from('comments')
        .insert({
          video_id: id,
          user_id: user.id,
          content: commentText.trim()
        });
      
      if (error) throw error;
      
      setCommentCount(prev => prev + 1);
      setCommentText("");
      
      fetchComments();
      
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderThumbnail = () => {
    if (isYoutubeVideo) {
      const embedUrl = getYoutubeEmbedUrl(thumbnail);
      return (
        <div 
          className="aspect-video w-full rounded-md overflow-hidden bg-muted cursor-pointer"
          onClick={handleThumbnailClick}
        >
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

  const visibleComments = showAllComments ? commentsData : commentsData.slice(0, 2);
  const hasMoreComments = commentsData.length > 2;

  return (
    <>
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
        </CardFooter>
        
        {showCommentInput && (
          <div className="px-4 pb-4 border-t border-border">
            {isLoadingComments ? (
              <div className="py-3 text-center text-sm text-muted-foreground">
                Loading comments...
              </div>
            ) : (
              <>
                {commentsData.length > 0 ? (
                  <div className="mb-3">
                    <div className="flex justify-between items-center my-2">
                      <h4 className="text-sm font-medium">Comments ({commentCount})</h4>
                      {hasMoreComments && (
                        <button 
                          onClick={() => setShowAllComments(!showAllComments)}
                          className="text-xs text-primary flex items-center"
                        >
                          {showAllComments ? (
                            <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
                          ) : (
                            <>View more comments <ChevronDown className="h-3 w-3 ml-1" /></>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <ScrollArea className={`${showAllComments ? 'max-h-[200px]' : ''} pr-2`}>
                      <div className="space-y-3">
                        {visibleComments.map((comment) => (
                          <div key={comment.id} className="bg-card/50 p-2 rounded-md">
                            <div className="flex justify-between">
                              <p className="text-xs font-medium">{comment.profiles.username}</p>
                              <span className="text-[10px] text-muted-foreground">{formatDate(comment.created_at)}</span>
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </div>
                )}
                
                <form onSubmit={handleCommentSubmit} className="flex space-x-2 mt-2">
                  <Input
                    type="text"
                    className="flex-1 min-h-9 focus:min-h-12 transition-all"
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
              </>
            )}
          </div>
        )}
      </Card>

      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoSrc={thumbnail}
        title={title}
        isYoutubeVideo={isYoutubeVideo}
      />
    </>
  );
};
