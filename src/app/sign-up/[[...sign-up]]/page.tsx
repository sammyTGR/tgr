import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SignUp } from "@clerk/nextjs";
import UserProfileForm from "@/components/UserProfileForm"; // Import UserProfileForm

export default function LoginForm() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="mx-auto max-w-md space-y-4">
        <CardContent>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create A New Account
              </CardDescription>
          </CardHeader>
          <div className="grid gap-4 mb-4">
        <UserProfileForm />
        </div>
        <div className="grid gap-4">
          <SignUp />
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
