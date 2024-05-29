import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUp } from "@clerk/nextjs";
import UserSessionHandler from "@/components/UserSessionHandler"; // Import UserSessionHandler
import CustomSignUp from "@/components/CustomSignUp";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="mx-auto max-w-md space-y-4">
        <CardContent>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Employees Sign Up By Logging Into Your Work Email
            </CardDescription>
          </CardHeader>
          <div className="grid gap-4 mb-4"></div>
          <div className="grid gap-4">
            <CustomSignUp />
          </div>
        </CardContent>
      </Card>
      <UserSessionHandler /> {/* Include the UserSessionHandler component */}
    </div>
  );
}
