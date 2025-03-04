
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type PostLimitMessageProps = {
  remainingPosts?: number | null;
};

export const PostLimitMessage = ({ remainingPosts }: PostLimitMessageProps) => {
  const navigate = useNavigate();

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Daily Post Limit</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          {remainingPosts === 0 ? (
            "You've reached your limit of 5 posts per day. Upgrade to Premium for unlimited posts."
          ) : (
            `You have ${remainingPosts} posts remaining today. Free accounts are limited to 5 posts per day.`
          )}
        </p>
        <Button 
          variant="outline" 
          onClick={() => navigate("/profile")}
        >
          Go to Profile to Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
};
