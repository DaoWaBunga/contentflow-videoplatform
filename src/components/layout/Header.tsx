
import { Bell } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-muted">
      <div className="flex justify-between items-center h-16 px-4 max-w-lg mx-auto">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            DrivePlay
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-muted">
            <span className="text-sm font-medium">1,234</span>
            <span className="text-xs text-muted-foreground">tokens</span>
          </div>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
