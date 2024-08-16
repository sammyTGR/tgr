// "use client";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useSearchParams, useRouter } from "next/navigation";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { toast } from "sonner";
// import { signup } from "@/lib/auth-actions"; // Import the signup function

// // Define the validation schema using Zod
// const schema = z.object({
//   firstName: z.string().min(2, { message: "First name is required" }),
//   lastName: z.string().min(2, { message: "Last name is required" }),
//   email: z
//     .string()
//     .min(1, { message: "Email is required" })
//     .email({ message: "Invalid email address" }),
//   password: z
//     .string()
//     .min(6, { message: "Password must be at least 6 characters" }),
// });

// type FormData = z.infer<typeof schema>;

// export default function SignUp() {
//   const params = useSearchParams();
//   const next = params ? params.get("next") || "" : "";
//   const router = useRouter();

//   const {
//     handleSubmit,
//     control,
//     formState: { errors },
//   } = useForm<FormData>({
//     resolver: zodResolver(schema),
//   });

//   const onSubmit = async (data: FormData) => {
//     try {
//       await signup(data); // Call the signup function

//       toast.success("Account created successfully! G'head & sign in!");

//       // Redirect to sign-in page
//       router.push("/sign-in");
//     } catch (error) {
//       if (error instanceof Error) {
//         console.error("Error creating account:", error.message);
//         toast.error(error.message);
//       } else {
//         console.error("Unexpected error creating account:", error);
//         toast.error("Unexpected error occurred.");
//       }
//     }
//   };

//   return (
//     <div className="grid place-items-center h-screen">
//       <Card className="mx-auto max-w-sm">
//         <CardHeader>
//           <CardTitle className="text-xl">Sign Up</CardTitle>
//           <CardDescription>
//             Enter your information to create an account
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="first_name">First name</Label>
//                 <Controller
//                   name="firstName"
//                   control={control}
//                   render={({ field }) => (
//                     <Input
//                       {...field}
//                       id="first_name"
//                       placeholder="Max"
//                       required
//                     />
//                   )}
//                 />
//                 {errors.firstName && (
//                   <span className="text-red-500 text-xs">
//                     {errors.firstName.message}
//                   </span>
//                 )}
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="last_name">Last name</Label>
//                 <Controller
//                   name="lastName"
//                   control={control}
//                   render={({ field }) => (
//                     <Input
//                       {...field}
//                       id="last_name"
//                       placeholder="Robinson"
//                       required
//                     />
//                   )}
//                 />
//                 {errors.lastName && (
//                   <span className="text-red-500 text-xs">
//                     {errors.lastName.message}
//                   </span>
//                 )}
//               </div>
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="email">Email</Label>
//               <Controller
//                 name="email"
//                 control={control}
//                 render={({ field }) => (
//                   <Input
//                     {...field}
//                     id="email"
//                     type="email"
//                     placeholder="m@example.com"
//                     required
//                   />
//                 )}
//               />
//               {errors.email && (
//                 <span className="text-red-500 text-xs">
//                   {errors.email.message}
//                 </span>
//               )}
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="password">Password</Label>
//               <Controller
//                 name="password"
//                 control={control}
//                 render={({ field }) => (
//                   <Input
//                     {...field}
//                     id="password"
//                     type="password"
//                     placeholder="Enter your password"
//                     required
//                   />
//                 )}
//               />
//               {errors.password && (
//                 <span className="text-red-500 text-xs">
//                   {errors.password.message}
//                 </span>
//               )}
//             </div>
//             <Button variant="gooeyRight" type="submit" className="w-full">
//               Create an account
//             </Button>
//           </form>
//           <div className="mt-4 text-center text-sm">
//             Already have an account?{" "}
//             <Link href="/sign-in" className="underline">
//               Sign in
//             </Link>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

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
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { signup, signInWithGoogle } from "@/lib/auth-actions"; // Import the signup and signInWithGoogle functions

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

export default function SignUp() {
  const params = useSearchParams();
  const next = params ? params.get("next") || "" : "";
  const router = useRouter();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await signup(data); // Call the signup function

      toast.success("Account created successfully! G'head & sign in!");

      // Redirect to sign-in page
      router.push("/sign-in");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error creating account:", error.message);
        toast.error(error.message);
      } else {
        console.error("Unexpected error creating account:", error);
        toast.error("Unexpected error occurred.");
      }
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle(); // This will redirect to Google's OAuth flow
      // No further code needed here as the user is redirected.
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error with Google sign-up:", error.message);
        toast.error(error.message);
      } else {
        console.error("Unexpected error with Google sign-up:", error);
        toast.error("Unexpected error occurred.");
      }
    }
  };

  return (
    <div className="grid place-items-center h-screen">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account or sign up with your
            Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
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
                      placeholder="Max"
                      required
                    />
                  )}
                />
                {errors.firstName && (
                  <span className="text-red-500 text-xs">
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
                      placeholder="Robinson"
                      required
                    />
                  )}
                />
                {errors.lastName && (
                  <span className="text-red-500 text-xs">
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
            <Button variant="linkHover1" type="submit" className="w-full">
              Create an account
            </Button>
          </form>
          <Button
            onClick={handleGoogleSignUp}
            variant="outline"
            className="w-full mt-4"
          >
            Sign Up with Google
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
