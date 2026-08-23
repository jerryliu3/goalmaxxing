"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DemoNewGoalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an account to add goals</DialogTitle>
          <DialogDescription>
            The demo is a lived-in snapshot of Alex&apos;s plan. Goal creation is available
            after you create an account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <Link href="/signup">Create account</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
