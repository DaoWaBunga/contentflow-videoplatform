
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { VideoCard } from "@/components/video/VideoCard";
import { Search, FileQuestion, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const CATEGORIES = [
  "Music", "Gaming", "Sports", "News", "Technology", 
  "Education", "Entertainment", "Travel", "Food", "Fashion", 
  "Art", "DIY", "Health", "Business", "Science", "Pets", "Fitness"
];

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

const Discover = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const filteredVideos = videos.filter(video => {
    // Filter by search query
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by categories (if any are selected)
    const matchesCategory = selectedCategories.length === 0 || 
      (video.category && selectedCategories.includes(video.category));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search videos..."
              className="pl-10 bg-muted border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CATEGORIES.map(category => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearCategories}>
                  Clear filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {selectedCategories.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCategories}>
                Clear all
              </Button>
            )}
          </div>
          
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(category => (
                <Badge 
                  key={category} 
                  variant="secondary"
                  className="px-2 py-1 flex items-center gap-1"
                >
                  {category}
                  <button 
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="sr-only">Remove</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </Badge>
              ))}
            </div>
          )}
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
                category={video.category || "Uncategorized"}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-medium">No content found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              {searchQuery || selectedCategories.length > 0 
                ? "Try different search terms or categories" 
                : "Be the first to share amazing content!"}
            </p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Discover;
