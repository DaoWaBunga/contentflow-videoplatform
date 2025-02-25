
import { Play, Heart, MessageCircle, Share2 } from "lucide-react";

interface VideoCardProps {
  title: string;
  author: string;
  thumbnail: string;
  likes: number;
  comments: number;
}

export function VideoCard({ title, author, thumbnail, likes, comments }: VideoCardProps) {
  return (
    <div className="relative w-full aspect-[9/16] bg-muted rounded-lg overflow-hidden">
      <img
        src={thumbnail}
        alt={title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-gray-300">{author}</p>
      </div>
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4">
        <button className="p-3 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-colors group">
          <Heart className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="text-xs mt-1">{likes}</span>
        </button>
        <button className="p-3 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-colors group">
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="text-xs mt-1">{comments}</span>
        </button>
        <button className="p-3 rounded-full bg-primary/10 backdrop-blur-sm hover:bg-primary/20 transition-colors group">
          <Share2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
