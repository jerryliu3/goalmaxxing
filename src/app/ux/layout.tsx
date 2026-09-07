import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdminContextFromCookies } from "@/lib/api/admin-context";
import { ApiRouteError } from "@/lib/api/route";

export default async function UxLayout({ children }: { children: ReactNode }) {
  try {
    const context = await requireAdminContextFromCookies("moderator");
    if (!context) {
      notFound();
    }
  } catch (error) {
    if (error instanceof ApiRouteError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }

  return children;
}
