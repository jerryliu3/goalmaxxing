import { notFound, redirect } from "next/navigation";
import { requireAdminContextFromCookies } from "@/lib/api/admin-context";
import { ApiRouteError } from "@/lib/api/route";

/**
 * UX labs and prototypes are moderator-only: signed-out visitors go to login and
 * everyone else gets a 404, so the routes don't advertise that they exist.
 */
export async function requireUxLabAccess() {
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
}
