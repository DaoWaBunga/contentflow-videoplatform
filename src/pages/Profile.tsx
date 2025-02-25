
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Settings, Grid3X3, User as UserIcon } from "lucide-react";
import { VideoCard } from "@/components/video/VideoCard";

const userVideos = [
  {
    id: 5,
    title: "My First Video",
    author: "@currentuser",
    thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
    likes: 42,
    comments: 7,
  },
];

const Profile = () => {
  return (
    <div className="min-h-screen bg-card text-foreground pb-16">
      <Header />
      <main className="max-w-lg mx-auto pt-20 px-4">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-1">@username</h1>
          <p className="text-muted-foreground mb-4">Video creator</p>
          <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors">
            Edit Profile
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="text-center flex-1">
            <div className="font-bold">42</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
          <div className="text-center flex-1">
            <div className="font-bold">1.2k</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div className="text-center flex-1">
            <div className="font-bold">12k</div>
            <div className="text-sm text-muted-foreground">Likes</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Videos</h2>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Grid3X3 className="h-5 w-5" />
            </button>
          </div>
          {userVideos.map((video) => (
            <VideoCard key={video.id} {...video} />
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
