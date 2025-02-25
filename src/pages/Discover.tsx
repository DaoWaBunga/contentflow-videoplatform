
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { VideoCard } from "@/components/video/VideoCard";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const discoverVideos = [
  {
    id: 3,
    title: "Urban Photography Tips",
    author: "@cityscape",
    thumbnail: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
    likes: 3200,
    comments: 128,
  },
  {
    id: 4,
    title: "Dance Tutorial 2024",
    author: "@dancepro",
    thumbnail: "https://images.unsplash.com/photo-1516567727245-ad8c68f3cdc9",
    likes: 5400,
    comments: 230,
  },
];

const Discover = () => {
  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search videos..."
            className="pl-10 bg-muted border-none"
          />
        </div>
        <div className="space-y-4">
          {discoverVideos.map((video) => (
            <VideoCard key={video.id} {...video} />
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Discover;
