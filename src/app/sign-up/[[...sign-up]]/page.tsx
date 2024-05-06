import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SignUp } from "@clerk/nextjs";

export default function LoginForm() {
  return (
    <Card className="mx-auto max-w-sm">
     
        <div className="grid gap-4">
          <div className="grid gap-2">
          <SignUp />
        </div>
        </div>
        
     
    </Card>
  );
}
