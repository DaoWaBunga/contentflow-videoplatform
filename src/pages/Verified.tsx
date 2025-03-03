
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Verified = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to profile after verification
    navigate("/profile");
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
        <p className="mb-4">Your email has been successfully verified. Redirecting to your profile...</p>
      </div>
    </div>
  );
};

export default Verified;
