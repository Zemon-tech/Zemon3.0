"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function AdminLayout({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated and admin
    if (!loading && (!user || !isAdmin)) {
      // Redirect to dashboard if user is not admin or not authenticated
      router.push("/dashboard");
    }
  }, [user, isAdmin, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  // Show unauthorized message if not admin (this will briefly show before redirect)
  if (!isAdmin) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">
            You don't have permission to access the admin section.
          </p>
        </div>
      </div>
    );
  }

  // Render children if user is admin
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
} 