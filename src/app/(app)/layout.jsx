"use client";

import { useAuth } from "@/hooks/useAuth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AppRouteLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-3">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect if not authenticated
  if (!isAuthenticated && !loading) {
    redirect("/login");
  }

  return <AppLayout>{children}</AppLayout>;
} 