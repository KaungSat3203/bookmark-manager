
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { TagsProvider } from '@/contexts/TagsContext';
import Navbar from '@/components/layout/Navbar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bookmark Manager",
  description: "Your personal bookmarking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TagsProvider>
            <Toaster position="top-center" />
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
          </TagsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
