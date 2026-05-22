"use client";

import { AdminHome } from "@/components/dashboard/admin-home";
import { InstructorHome } from "@/components/dashboard/instructor-home";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { instructor, isAdmin } = useAuth();

  if (isAdmin) {
    return <AdminHome />;
  }

  const firstName = instructor?.name?.split(" ")[0];

  return <InstructorHome firstName={firstName} />;
}
