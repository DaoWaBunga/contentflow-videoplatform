
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserIcon } from "lucide-react";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";
import { SubscriptionButton } from "@/components/SubscriptionButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface ProfileHeaderProps {
  profile: Profile;
  hasPremium: boolean;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

export const ProfileHeader = ({ profile, hasPremium, onProfileUpdate }: ProfileHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile>(profile);
  const { toast } = useToast();

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

    onProfileUpdate(editedProfile);
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  const handleProfileImageUploaded = (url: string) => {
    if (isEditing) {
      setEditedProfile({
        ...editedProfile,
        avatar_url: url
      });
    } else {
      onProfileUpdate({
        ...profile,
        avatar_url: url
      });
    }
  };

  return (
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

      {!isEditing && (
        <div className="mb-4">
          <ProfileImageUpload 
            currentImageUrl={profile.avatar_url}
            onImageUploaded={handleProfileImageUploaded}
          />
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={editedProfile?.username || ""}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  username: e.target.value
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={editedProfile?.bio || ""}
              onChange={(e) =>
                setEditedProfile({
                  ...editedProfile,
                  bio: e.target.value
                })
              }
            />
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleSaveProfile}>
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedProfile(profile);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-1">{profile.username}</h1>
          {profile.bio && (
            <p className="text-muted-foreground mb-4">{profile.bio}</p>
          )}
          <div className="flex flex-col gap-3 items-center">
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
            <SubscriptionButton hasPremium={hasPremium} />
          </div>
        </>
      )}
    </div>
  );
};
