
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Upload as UploadIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Upload = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl || !title) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields",
      });
      return;
    }
    
    toast({
      title: "Video submitted!",
      description: "Your video is being processed.",
    });
    
    // Reset form
    setVideoUrl("");
    setTitle("");
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
