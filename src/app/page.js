import { redirect } from "next/navigation";

export default function Home() {
  // Temporarily redirect to dashboard for testing
  redirect("/dashboard");
} 