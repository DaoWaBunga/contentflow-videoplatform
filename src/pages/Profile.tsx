
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Settings, Grid3X3, User as UserIcon } from "lucide-react";
import { VideoCard } from "@/components/video/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
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
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              title={video.title}
              author={profile.username}
              thumbnail={video.thumbnail_url || video.url}
              likes={video.likes_count}
              comments={video.comments_count}
            />
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
