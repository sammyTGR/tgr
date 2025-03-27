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
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import LoadingIndicator from "@/components/LoadingIndicator";
import dynamic from "next/dynamic";
import { useSidebar } from "@/components/ui/sidebar";

// Type definitions
interface Customer {
  role: string;
  user_uuid: string;
}

interface SignInResponse {
  user: {
    id: string;
    email: string;
  } | null;
  error: Error | null;
}

// Form validation schema
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

const LazySignIn = dynamic(
  () =>
    import("@/app/sign-in/[[...sign-in]]/page").then((module) => ({
      default: module.default,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

export default function SignIn() {
  const params = useSearchParams();
  const next = params ? DOMPurify.sanitize(params.get("next") || "") : "";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useSidebar();

  const { isLoading } = useQuery({
    queryKey: ["navigation", pathname, searchParams],
    queryFn: async () => {
      // Simulate a delay to show the loading indicator
      await new Promise((resolve) => setTimeout(resolve, 100));
      return null;
    },
    staleTime: 0, // Always refetch on route change
    refetchInterval: 0, // Disable automatic refetching
  });

  // Form setup with validation
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Mutation for email/password sign in
  const emailSignInMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: signInData, error } =
        await supabase.auth.signInWithPassword({
          email: DOMPurify.sanitize(data.email),
          password: data.password, // No need to sanitize password
        });

      if (error) throw error;

      return { user: signInData.user, error: null } as SignInResponse;
    },
    onSuccess: async (data) => {
      if (data.user) {
        const { data: customerData, error: fetchError } = await supabase
          .from("customers")
          .select("role")
          .eq("user_uuid", data.user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching customer role:", fetchError.message);
          toast.error("An error occurred. Please try again.");
          return;
        }

        if (customerData) {
          toast.success("Signed in successfully");
          window.location.href = "/";
        }
      }
    },
    onError: (error: Error) => {
      console.error("Error signing in:", error.message);
      toast.error(error.message);
    },
  });

  // Mutation for OAuth sign in
  const oAuthSignInMutation = useMutation({
    mutationFn: async (provider: "google") => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback${next}`,
        },
      });

      if (error) throw error;

      return data;
    },
    onSuccess: async () => {
      // Wait for OAuth redirect and user session
      await new Promise((resolve) => setTimeout(resolve, 2000));

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
          window.location.href = next || "/";
        }
      }
    },
    onError: (error: Error) => {
      console.error("Error logging in with OAuth:", error.message);
      toast.error("Failed to login with Google");
    },
  });

  // Form submission handler
  const onSubmit = (data: FormData) => {
    emailSignInMutation.mutate(data);
  };

  // OAuth login handler
  const handleOAuthLogin = () => {
    oAuthSignInMutation.mutate("google");
  };

  return (
    <div
      className={`relative place-items-center h-screen max-w-xl mx-auto ml-16 md:ml-16 lg:ml-16 md:w-xl lg:w-xl overflow-hidden flex-1 transition-all duration-300`}
    >
      {isLoading && <LoadingIndicator />}
      <Card className="mx-auto min-w-[350px]">
        <CardHeader>
          <CardTitle className="text-xl">Login</CardTitle>
          <CardDescription>Welcome Back!</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="membersLogin">
            <TabsContent value="membersLogin">
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
                {/* <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="plinkingchamp@example.com"
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
                <Button
                  variant="gooeyLeft"
                  type="submit"
                  className="w-full mb-4 mt-2"
                  disabled={emailSignInMutation.isPending}
                >
                  {emailSignInMutation.isPending
                    ? "Signing in..."
                    : "Sign In With Email"}
                </Button>
                <Separator className="my-4" /> */}
                <Button
                  onClick={handleOAuthLogin}
                  variant="outline"
                  className="w-full"
                  disabled={oAuthSignInMutation.isPending}
                >
                  {oAuthSignInMutation.isPending
                    ? "Logging in..."
                    : "Login With Google"}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm">
                <Link href="/reset-password" className="underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="underline">
                  Sign up
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
