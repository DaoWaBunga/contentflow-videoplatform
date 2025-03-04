
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileImageUploadProps {
  currentImageUrl: string | null;
  onImageUploaded: (url: string) => void;
}

export const ProfileImageUpload = ({ 
  currentImageUrl, 
  onImageUploaded 
}: ProfileImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Profile image must be less than 5MB",
        });
        return;
      }

      setUploading(true);

      // Get the user's session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to upload a profile image",
        });
        return;
      }

      // Upload directly to Supabase Storage instead of using edge function
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${sessionData.session.user.id}_${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_images')
        .getPublicUrl(fileName);
      
      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', sessionData.session.user.id);
      
      if (updateError) {
        throw updateError;
      }

      onImageUploaded(publicUrl);
      
      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload profile image. Please check if the 'profile_images' bucket exists in Supabase storage.",
      });
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleUpload}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {uploading ? "Uploading..." : "Upload New Photo"}
      </Button>
    </div>
  );
};
