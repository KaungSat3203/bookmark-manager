"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import fetchApi from "@/lib/api";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const result = await fetchApi("/users/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      toast.success(result.message || "Password reset successful! You can now log in.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-neutral-800">Reset Password</h1>
        <div className="mb-4">
          <label className="block mb-2 text-neutral-700 text-sm font-medium">New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 bg-neutral-50 text-neutral-800"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-neutral-700 text-sm font-medium">Confirm New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 bg-neutral-50 text-neutral-800"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 rounded-lg bg-neutral-800 text-white text-sm font-medium hover:bg-neutral-700 transition"
          disabled={isLoading}
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
