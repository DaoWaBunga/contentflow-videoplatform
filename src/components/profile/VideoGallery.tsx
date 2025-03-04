
import { useState } from "react";
import { Grid3X3, Edit, Trash2 } from "lucide-react";
import { VideoCard } from "@/components/video/VideoCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  category: string | null;
}

interface VideoGalleryProps {
  videos: Video[];
  username: string;
  onVideosUpdate: (videos: Video[]) => void;
}

const CATEGORIES = [
  "Uncategorized",
  "Tutorial",
  "Entertainment",
  "Music",
  "Gaming",
  "Travel",
  "Cooking",
  "Education",
  "Technology",
  "Other"
];

export const VideoGallery = ({ videos, username, onVideosUpdate }: VideoGalleryProps) => {
  const [isEditVideoOpen, setIsEditVideoOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const { toast } = useToast();

  const handleEditVideo = (video: Video) => {
    setCurrentVideo(video);
    setEditedTitle(video.title);
    setEditedCategory(video.category || "Uncategorized");
    setIsEditVideoOpen(true);
  };

  const handleUpdateVideo = async () => {
    if (!currentVideo || !editedTitle.trim()) return;

    const { error } = await supabase
      .from('videos')
      .update({ 
        title: editedTitle.trim(),
        category: editedCategory 
      })
      .eq('id', currentVideo.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update video information",
      });
      return;
    }

    const updatedVideos = videos.map(video => 
      video.id === currentVideo.id 
        ? { ...video, title: editedTitle.trim(), category: editedCategory } 
        : video
    );
    
    onVideosUpdate(updatedVideos);
    setIsEditVideoOpen(false);
    setCurrentVideo(null);
    
    toast({
      title: "Success",
      description: "Video information updated successfully",
    });
  };

  const handleDeleteVideo = async (videoId: string) => {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete video",
      });
      return;
    }

    onVideosUpdate(videos.filter(video => video.id !== videoId));
    
    toast({
      title: "Success",
      description: "Video deleted successfully",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Videos</h2>
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Grid3X3 className="h-5 w-5" />
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          You haven't uploaded any videos yet.
        </div>
      ) : (
        <div className="space-y-6">
          {videos.map((video) => (
            <div key={video.id} className="relative">
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <button 
                  onClick={() => handleEditVideo(video)}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-2 rounded-full bg-red-500/50 text-white hover:bg-red-500/70 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Video</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this video? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteVideo(video.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <VideoCard
                id={video.id}
                title={video.title}
                author={username}
                thumbnail={video.thumbnail_url || video.url}
                likes={video.likes_count || 0}
                comments={video.comments_count || 0}
                category={video.category || undefined}
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={isEditVideoOpen} onOpenChange={setIsEditVideoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>
              Update the title and category of your video
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="videoTitle">Title</Label>
              <Input
                id="videoTitle"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="videoCategory">Category</Label>
              <Select 
                value={editedCategory} 
                onValueChange={setEditedCategory}
              >
                <SelectTrigger id="videoCategory" className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditVideoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateVideo}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
