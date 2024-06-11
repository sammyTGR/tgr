"use client";

import React, { Suspense, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

const title = "TGR Crew Login";

function LoginComponent() {
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  const next = params ? params.get("next") || "" : "";

  const loginWithOAuth = async (provider: "google") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback${next}`,
        },
      });

      if (error) throw error;

      setTimeout(async () => {
        const userResponse = await supabase.auth.getUser();
        const user = userResponse.data.user;

        if (user) {
          const response = await fetch("/api/syncUser", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
          });

          if (response.ok) {
            // Redirect to the intended page or dashboard
            window.location.href = next || "/";
          } else {
            console.error("Error syncing user:", await response.text());
          }
        }
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error logging in with OAuth:", error.message);
      } else {
        console.error("Unexpected error logging in with OAuth:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid place-items-center h-screen">
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="w-[400px] h-[500px] max-w-md space-y-6  p-6">
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
            className="grid w-[600px] grid-cols-2 border border-gray-300 rounded-lg h-[400px] mx-auto"
          >
            <TabsList className="flex ">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <div className="flex flex-col my-40 items-center justify-center">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="email">Login With Your Work Email</Label>
                  <Button
                    onClick={() => loginWithOAuth("google")}
                    variant="ringHover"
                    className="w-full "
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login with Google"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="signup">
              <div className="flex flex-col my-40 items-center justify-center">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="email">Sign Up With Your Work Email</Label>
                  <Button
                    onClick={() => loginWithOAuth("google")}
                    variant="ringHover"
                    className="w-full "
                    disabled={loading}
                  >
                    {loading ? "Signing up..." : "Sign Up with Google"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function Component() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginComponent />
    </Suspense>
  );
}
