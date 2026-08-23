"use client";

import { useEffect } from "react";
import { useAppRouter } from "@/lib/navigation/use-app-router";

export default function DemoTasksPage() {
  const router = useAppRouter();
  useEffect(() => {
    router.replace("/calendar?surface=tasks");
  }, [router]);
  return null;
}
