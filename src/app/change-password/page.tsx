"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function ChangePasswordContent() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = searchParams?.get("access_token");

  useEffect(() => {
    if (!accessToken) {
      toast.error("Invalid or missing token!");
      router.push("/sign-in");
      return;
    }

    const setSession = async () => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: "",
      });

      if (error) {
        toast.error("Failed to set session!");
        router.push("/sign-in");
      }
    };

    setSession();
  }, [accessToken, router]);

  const handlePasswordChange = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully");
        router.push("/sign-in");
      }
    } catch (error) {
      toast.error("An error occurred while updating the password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid place-items-center h-screen">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChangePassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChangePasswordContent />
    </Suspense>
  );
}
