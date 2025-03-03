
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const PostLimitMessage = () => {
  const navigate = useNavigate();

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Daily Post Limit Reached</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          You've reached your limit of 5 posts per day. Upgrade to Premium for unlimited posts.
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
