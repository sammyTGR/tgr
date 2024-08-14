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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

const schema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type FormData = z.infer<typeof schema>;

export default function SignIn() {
  const params = useSearchParams();
  const next = params ? params.get("next") || "" : "";
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const { email, password } = data;

    try {
      const { data: signInData, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;

      if (signInData.user) {
        const user = signInData.user;

        // Fetch the customer's role from the customers table
        const { data: customerData, error: fetchError } = await supabase
          .from("customers")
          .select("role")
          .eq("user_uuid", user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching customer role:", fetchError.message);
          toast.error("An error occurred. Please try again.");
          return;
        }

        if (customerData) {
          toast.success("Signed in successfully");
          window.location.href = "/"; // Redirect to home page after sign-in
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error signing in:", error.message);
        toast.error(error.message);
      } else {
        console.error("Unexpected error signing in:", error);
        toast.error("Unexpected error occurred.");
      }
    }
  };

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
          const { data: customerData, error: fetchError } = await supabase
            .from("customers")
            .select("role")
            .eq("user_uuid", user.id)
            .single();

          if (fetchError) {
            console.error("Error fetching customer role:", fetchError.message);
            return;
          }

          if (customerData) {
            // If role is fetched successfully, redirect to the desired page
            window.location.href = next || "/";
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
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Login</CardTitle>
          <CardDescription>Select your login type</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="membersLogin">
            <TabsList className="flex">
              <TabsTrigger value="membersLogin">Members Login</TabsTrigger>
              <TabsTrigger value="employeesLogin">Employees Login</TabsTrigger>
            </TabsList>
            <TabsContent value="membersLogin">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid gap-4 mt-4"
              >
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                      />
                    )}
                  />
                  {errors.email && (
                    <span className="text-red-500 text-xs">
                      {errors.email.message}
                    </span>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />
                    )}
                  />
                  {errors.password && (
                    <span className="text-red-500 text-xs">
                      {errors.password.message}
                    </span>
                  )}
                </div>
                <Button variant="gooeyLeft" type="submit" className="w-full">
                  Sign In
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <Link href="/reset-password" className="underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="underline">
                  Sign up
                </Link>
              </div>
            </TabsContent>
            <TabsContent value="employeesLogin">
              <div className="flex flex-col my-4 items-center justify-center">
                <div className="flex flex-col gap-1 my-4">
                  <Label htmlFor="email">Login With Your Work Email</Label>
                  <Button
                    onClick={() => loginWithOAuth("google")}
                    variant="gooeyRight"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login with Google"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
