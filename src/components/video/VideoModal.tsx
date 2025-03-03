
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title: string;
  isYoutubeVideo?: boolean;
}

export function VideoModal({ isOpen, onClose, videoSrc, title, isYoutubeVideo }: VideoModalProps) {
  const navigate = useNavigate();

  // Extract video ID from YouTube URL
  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = "";
    
    if (url.includes("youtube.com/watch")) {
      videoId = new URL(url).searchParams.get("v") || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  const isDirectImageUrl = 
    videoSrc.endsWith(".jpg") || 
    videoSrc.endsWith(".jpeg") || 
    videoSrc.endsWith(".png") || 
    videoSrc.endsWith(".gif") ||
    videoSrc.includes("storage.googleapis.com");

  const handleBackToFeed = () => {
    navigate("/");
    onClose();
  };

  const renderContent = () => {
    if (isYoutubeVideo) {
      const embedUrl = getYoutubeEmbedUrl(videoSrc);
      return (
        <div className="w-full max-h-[70vh] aspect-video bg-black">
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
        <div className="flex justify-center">
          <img 
            src={videoSrc} 
            alt={title} 
            className="max-w-full max-h-[70vh] object-contain" 
          />
        </div>
      );
    } else {
      return (
        <div className="w-full max-h-[70vh] flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Content not available</p>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 sm:rounded-xl overflow-hidden">
        <div className="absolute z-10 top-4 right-4">
          <DialogClose className="bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        
        <div className="p-0">
          {renderContent()}
          
          <div className="p-4 bg-card">
            <h2 className="text-lg font-semibold mb-2">{title}</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleBackToFeed}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to feed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
