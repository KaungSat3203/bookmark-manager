"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import fetchApi from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await fetchApi("/users/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast.success(result.message || "Password reset email sent! Check your inbox.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-neutral-800">Forgot Password</h1>
        <div className="mb-4">
          <label className="block mb-2 text-neutral-700 text-sm font-medium">Email Address</label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 bg-neutral-50 text-neutral-800"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-neutral-800 text-white text-sm font-medium hover:bg-neutral-700 transition"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>
        <p className="mt-4 text-center text-sm text-neutral-600">
          Remembered? <a href="/login" className="text-neutral-800 hover:underline font-medium">Back to Login</a>
        </p>
      </form>
    </div>
  );
}
