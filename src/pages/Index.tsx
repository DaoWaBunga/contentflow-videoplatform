
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { VideoCard } from "@/components/video/VideoCard";

const mockVideos = [
  {
    id: 1,
    title: "Amazing Sunset Timelapse",
    author: "@naturelover",
    thumbnail: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    likes: 1234,
    comments: 56,
  },
  {
    id: 2,
    title: "Tech Review 2024",
    author: "@techie",
    thumbnail: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    likes: 890,
    comments: 34,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4 space-y-4">
        {mockVideos.map((video) => (
          <VideoCard key={video.id} {...video} />
        ))}
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
