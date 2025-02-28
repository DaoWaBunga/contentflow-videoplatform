
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Settings, Grid3X3, User as UserIcon, Edit, Trash2 } from "lucide-react";
import { VideoCard } from "@/components/video/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [isEditVideoOpen, setIsEditVideoOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchUserVideos();
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
    setEditedProfile(data);
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

  const handleSaveProfile = async () => {
    if (!editedProfile) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        username: editedProfile.username,
        avatar_url: editedProfile.avatar_url,
        bio: editedProfile.bio,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
      return;
    }

    setProfile(editedProfile);
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  const handleEditVideo = (video: Video) => {
    setCurrentVideo(video);
    setEditedTitle(video.title);
    setIsEditVideoOpen(true);
  };

  const handleUpdateVideo = async () => {
    if (!currentVideo || !editedTitle.trim()) return;

    const { error } = await supabase
      .from('videos')
      .update({ title: editedTitle.trim() })
      .eq('id', currentVideo.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update video title",
      });
      return;
    }

    // Update local state
    setVideos(videos.map(video => 
      video.id === currentVideo.id 
        ? { ...video, title: editedTitle.trim() } 
        : video
    ));
    
    setIsEditVideoOpen(false);
    setCurrentVideo(null);
    
    toast({
      title: "Success",
      description: "Video title updated successfully",
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

    // Update local state
    setVideos(videos.filter(video => video.id !== videoId));
    
    toast({
      title: "Success",
      description: "Video deleted successfully",
    });
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editedProfile?.username || ""}
                  onChange={(e) =>
                    setEditedProfile((prev) =>
                      prev ? { ...prev, username: e.target.value } : null
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  value={editedProfile?.avatar_url || ""}
                  onChange={(e) =>
                    setEditedProfile((prev) =>
                      prev ? { ...prev, avatar_url: e.target.value } : null
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={editedProfile?.bio || ""}
                  onChange={(e) =>
                    setEditedProfile((prev) =>
                      prev ? { ...prev, bio: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile(profile);
                  }}
                  className="px-4 py-2 bg-muted hover:bg-muted/90 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">{profile.username}</h1>
              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            </>
          )}
        </div>

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
                    author={profile.username}
                    thumbnail={video.thumbnail_url || video.url}
                    likes={video.likes_count || 0}
                    comments={video.comments_count || 0}
                    category={video.category || undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Edit Video Dialog */}
      <Dialog open={isEditVideoOpen} onOpenChange={setIsEditVideoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>
              Update the title of your video
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditVideoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateVideo}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  );
};

export default Profile;
