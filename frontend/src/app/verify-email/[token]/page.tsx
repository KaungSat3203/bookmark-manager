"use client";


import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Verification failed");
        setStatus("success");
        toast.success("Email verified! You can now log in.");
        setTimeout(() => router.push("/login"), 2000);
      } catch (err: any) {
        setStatus("error");
        toast.error(err.message || "Verification failed");
      }
    };
    if (token) verify();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {status === "verifying" && <p className="text-lg">Verifying your email...</p>}
      {status === "success" && <p className="text-green-600 text-lg">Email verified! Redirecting to login...</p>}
      {status === "error" && <p className="text-red-600 text-lg">Verification failed. Please try again or contact support.</p>}
    </div>
  );
}
