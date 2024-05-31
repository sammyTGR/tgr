"use client";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";

export default function SignUp() {
  const params = useSearchParams();
  const next = params ? params.get("next") || "" : "";

  const loginWithOAuth = async (provider: "google") => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: location.origin + "/auth/callback" + next,
        },
      });

      if (error) throw error;

      // Wait for the redirect to complete and the session to be set
      setTimeout(async () => {
        const userResponse = await supabase.auth.getUser();
        const user = userResponse.data.user;

        if (user) {
          await fetch("/api/syncUser", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
          });
        }
      }, 2000); // Add a delay to ensure the session is set
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error logging in with OAuth:", error.message);
      } else {
        console.error("Unexpected error logging in with OAuth:", error);
      }
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" placeholder="Max" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" placeholder="Robinson" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
          <Button type="submit" className="w-full">
            Create an account
          </Button>
          {/* <Button onClick={() => loginWithOAuth("google")} variant="outline" className="w-full">
            Login with Google
          </Button> */}
        </div>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="underline" prefetch={false}>
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
