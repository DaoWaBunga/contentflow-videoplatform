
import { Bell, BellDot } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notification {
  id: string;
  type: 'like' | 'comment';
  video_title: string;
  user_name: string;
  created_at: string;
  is_read: boolean;
}

export function Header() {
  const [tokenCount, setTokenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  useEffect(() => {
    const fetchUserTokens = async () => {
      setLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('content_tokens, view_tokens, username')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            // Sum of content and view tokens, rounded to nearest integer
            const totalTokens = Math.round(data.content_tokens + data.view_tokens);
            setTokenCount(totalTokens);
            setUsername(data.username);
          }
        }
      } catch (error) {
        console.error("Error fetching user tokens:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTokens();

    // Also subscribe to auth changes to update tokens when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserTokens();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // If user is logged in, fetch notifications
    const fetchNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setIsLoadingNotifications(true);

        // Get user's videos
        const { data: userVideos, error: videosError } = await supabase
          .from('videos')
          .select('id, title')
          .eq('user_id', user.id);

        if (videosError) throw videosError;
        if (!userVideos || userVideos.length === 0) {
          setIsLoadingNotifications(false);
          return;
        }

        const videoIds = userVideos.map(video => video.id);
        const videoTitlesMap = userVideos.reduce((acc, video) => {
          acc[video.id] = video.title;
          return acc;
        }, {} as Record<string, string>);

        // Get likes on user's videos
        const { data: likes, error: likesError } = await supabase
          .from('likes')
          .select(`
            id,
            created_at,
            video_id,
            profiles:user_id (username)
          `)
          .in('video_id', videoIds)
          .neq('user_id', user.id) // Don't show user's own likes
          .order('created_at', { ascending: false })
          .limit(10);

        if (likesError) throw likesError;

        // Get comments on user's videos
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select(`
            id,
            created_at,
            video_id,
            profiles:user_id (username)
          `)
          .in('video_id', videoIds)
          .neq('user_id', user.id) // Don't show user's own comments
          .order('created_at', { ascending: false })
          .limit(10);

        if (commentsError) throw commentsError;

        // Combine and format notifications
        const formattedLikes = (likes || []).map(like => ({
          id: like.id,
          type: 'like' as const,
          video_title: videoTitlesMap[like.video_id] || 'Unknown video',
          user_name: like.profiles.username,
          created_at: like.created_at,
          is_read: false // We would track this in a separate table in a real app
        }));

        const formattedComments = (comments || []).map(comment => ({
          id: comment.id,
          type: 'comment' as const,
          video_title: videoTitlesMap[comment.video_id] || 'Unknown video',
          user_name: comment.profiles.username,
          created_at: comment.created_at,
          is_read: false // We would track this in a separate table in a real app
        }));

        // Combine and sort by date (newest first)
        const allNotifications = [...formattedLikes, ...formattedComments]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);

        setNotifications(allNotifications);
        setHasUnreadNotifications(allNotifications.length > 0);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();

    // Set up Realtime subscription to detect new likes and comments
    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'likes',
      }, () => {
        fetchNotifications();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };
  
  const handleNotificationClick = () => {
    // Mark all as read in a real app
    setHasUnreadNotifications(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-muted">
      <div className="flex justify-between items-center h-16 px-4 max-w-lg mx-auto">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DrivePlay {username ? `- ${username}` : "- Click Profile"}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-muted">
            <span className="text-sm font-medium">
              {loading ? "..." : tokenCount}
            </span>
            <span className="text-xs text-muted-foreground">tokens</span>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <button 
                className="p-2 rounded-full hover:bg-muted transition-colors"
                onClick={handleNotificationClick}
              >
                {hasUnreadNotifications ? (
                  <BellDot className="h-6 w-6 text-primary" />
                ) : (
                  <Bell className="h-6 w-6" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b">
                <h4 className="font-medium">Notifications</h4>
              </div>
              {isLoadingNotifications ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length > 0 ? (
                <ScrollArea className="max-h-80">
                  <div className="p-2">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className="p-2 hover:bg-muted rounded-md mb-1 text-sm border-b border-border pb-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p>
                              <span className="font-medium">{notification.user_name}</span>{' '}
                              {notification.type === 'like' ? 'liked' : 'commented on'}{' '}
                              your video "{notification.video_title}"
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
