import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

// Middleware redirects logged-in users to their dashboard,
// so this page only renders for unauthenticated visitors.

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <GraduationCap className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Examattic
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Your all-in-one exam preparation platform. Practice, learn, and
            excel.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

