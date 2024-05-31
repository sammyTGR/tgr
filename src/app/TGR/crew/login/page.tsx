"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

const title = "TGR Crew Login";

export default function Component() {
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
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-[400px] h-[500px] max-w-md space-y-6">
        <div className="space-y-2 text-start">
          <h1 className="text-3xl font-bold">
            <TextGenerateEffect words={title} />
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            If You Haven&apos;t Already, Sign Up For Your First Visit.
          </p>
        </div>
        <Tabs
          defaultValue="login"
          className="grid w-[500px] grid-cols-2 rounded-lg bg-white shadow-lg dark:bg-black h-[300px]"
        >
          <TabsList className="flex bg-gray-100 dark:bg-muted">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <div className="space-y-4 p-6 flex items-center justify-center">
              <div className="mt-20 space-y-4 items-center justify-center flex flex-col">
                <Label htmlFor="email">Login With Your Work Email</Label>
                <Button
                  onClick={() => loginWithOAuth("google")}
                  variant="outline"
                  className="w-full"
                >
                  Login with Google
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="signup">
            <div className="space-y-4 p-6 flex items-center justify-center">
              <div className="mt-20 space-y-4 items-center justify-center flex flex-col">
                <Label htmlFor="email">Sign Up With Your Work Email</Label>
                <Button
                  onClick={() => loginWithOAuth("google")}
                  variant="outline"
                  className="w-full"
                >
                  Login with Google
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
