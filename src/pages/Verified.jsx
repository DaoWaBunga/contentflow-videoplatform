import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function Verified() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "signup") {
      setMessage("Your email has been successfully verified!Enjoy your Play Drive account! 🎉");
    } else {
      setMessage("Invalid or expired verification link.");
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">{message}</h1>
    </div>
  );
}
