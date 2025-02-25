
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Upload as UploadIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [title, setTitle] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl || !title) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to upload videos",
      });
      return;
    }

    try {
      // First insert the video
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          title,
          url: videoUrl,
          thumbnail_url: thumbnailUrl || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Then reward tokens for the upload
      const { error: rewardError } = await supabase.rpc('reward_upload_tokens', {
        user_id: user.id,
        is_video: true
      });

      if (rewardError) throw rewardError;

      toast({
        title: "Success",
        description: "Your video has been uploaded and you've earned tokens!",
      });

      // Reset form and redirect to profile
      setVideoUrl("");
      setThumbnailUrl("");
      setTitle("");
      navigate("/profile");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Upload Video</h1>
            <p className="text-muted-foreground">
              Share your cloud storage video link
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Give your video a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="videoUrl"
                  placeholder="Paste your video link here"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="thumbnailUrl"
                  placeholder="Paste your thumbnail link here"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <UploadIcon className="h-5 w-5" />
              <span>Upload Video</span>
            </button>
          </form>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Upload;
