"use client";

import Link from "next/link";
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
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { signup, signInWithGoogle } from "@/lib/auth-actions";
import { Separator } from "@/components/ui/separator";
import {
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import DOMPurify from "isomorphic-dompurify";
import LoadingIndicator from "@/components/LoadingIndicator";
import dynamic from "next/dynamic";

// Create a client
const queryClient = new QueryClient();

// Define the validation schema using Zod
const schema = z.object({
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type FormData = z.infer<typeof schema>;

function SignUpForm() {
  const params = useSearchParams();
  const next = params ? params.get("next") || "" : "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Mutation for email signup
  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Sanitize input data
      const sanitizedData = {
        firstName: DOMPurify.sanitize(data.firstName),
        lastName: DOMPurify.sanitize(data.lastName),
        email: DOMPurify.sanitize(data.email),
        password: data.password, // Don't sanitize password as it needs to match exactly
      };
      return await signup(sanitizedData);
    },
    onSuccess: () => {
      toast.success("Account created successfully! G'head & sign in!");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/sign-in");
    },
    onError: (error: Error) => {
      console.error("Error creating account:", error);
      toast.error(error.message || "An unexpected error occurred");
    },
  });

  // Mutation for Google signup
  const googleSignupMutation = useMutation({
    mutationFn: signInWithGoogle,
    onError: (error: Error) => {
      console.error("Error with Google sign-up:", error);
      toast.error(
        error.message || "An unexpected error occurred with Google sign-up"
      );
    },
  });

  const onSubmit = (data: FormData) => {
    signupMutation.mutate(data);
  };

  const handleGoogleSignUp = () => {
    googleSignupMutation.mutate();
  };

  return (
    <div className="grid place-items-center h-screen">
      {isLoading && <LoadingIndicator />}
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account or sign up with your
            Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid gap-4"
            aria-label="Sign up form"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First name</Label>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="first_name"
                      type="text"
                      aria-invalid={errors.firstName ? "true" : "false"}
                      aria-describedby={
                        errors.firstName ? "firstName-error" : undefined
                      }
                      required
                    />
                  )}
                />
                {errors.firstName && (
                  <span
                    id="firstName-error"
                    role="alert"
                    className="text-red-500 text-xs"
                  >
                    {errors.firstName.message}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last name</Label>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="last_name"
                      type="text"
                      aria-invalid={errors.lastName ? "true" : "false"}
                      aria-describedby={
                        errors.lastName ? "lastName-error" : undefined
                      }
                      required
                    />
                  )}
                />
                {errors.lastName && (
                  <span
                    id="lastName-error"
                    role="alert"
                    className="text-red-500 text-xs"
                  >
                    {errors.lastName.message}
                  </span>
                )}
              </div>
            </div>
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
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    required
                  />
                )}
              />
              {errors.email && (
                <span
                  id="email-error"
                  role="alert"
                  className="text-red-500 text-xs"
                >
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
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    required
                  />
                )}
              />
              {errors.password && (
                <span
                  id="password-error"
                  role="alert"
                  className="text-red-500 text-xs"
                >
                  {errors.password.message}
                </span>
              )}
            </div>
            <Button
              variant="gooeyRight"
              type="submit"
              className="w-full mb-4 mt-2"
              disabled={signupMutation.isPending}
              aria-busy={signupMutation.isPending}
            >
              {signupMutation.isPending
                ? "Signing up..."
                : "Sign Up With Email"}
            </Button>
          </form>

          <Separator className="my-4" />

          <Button
            onClick={handleGoogleSignUp}
            variant="outline"
            className="w-full mt-4"
            disabled={googleSignupMutation.isPending}
            aria-busy={googleSignupMutation.isPending}
          >
            {googleSignupMutation.isPending
              ? "Connecting..."
              : "Sign Up With Google"}
          </Button>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap the component with QueryClientProvider
export default function SignUp() {
  return (
    <QueryClientProvider client={queryClient}>
      <SignUpForm />
    </QueryClientProvider>
  );
}
