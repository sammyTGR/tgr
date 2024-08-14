"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner"; // Import toast from Sonner

type ProfileData = {
  first_name: string;
  last_name: string;
  email: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const { register, handleSubmit, setValue } = useForm<ProfileData>();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData) {
        setUser(userData.user);

        const { data: customerData } = await supabase
          .from("customers")
          .select("first_name, last_name, email")
          .eq("user_uuid", userData.user?.id)
          .single();

        if (customerData) {
          setValue("first_name", customerData.first_name);
          setValue("last_name", customerData.last_name);
          setValue("email", customerData.email);
        }
      }
    };

    fetchProfile();
  }, [setValue]);

  const onSubmit = async (data: ProfileData) => {
    if (user) {
      const { error } = await supabase
        .from("customers")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
        })
        .eq("user_uuid", user.id);

      if (error) {
        console.error("Error updating profile:", error);
      } else {
        toast.success("Profile updated successfully!"); // Use toast.success to confirm success
      }
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <header className="bg-gray-100 dark:bg-gray-800 p-6 rounded-t-lg flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback></AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>
      </header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white dark:bg-black p-6 rounded-b-lg space-y-6">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <input
                  id="first_name"
                  {...register("first_name")}
                  className="block w-full mt-1 p-2 border rounded"
                />
              </div>
            </div>
            <Separator />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <input
                  id="last_name"
                  {...register("last_name")}
                  className="block w-full mt-1 p-2 border rounded"
                />
              </div>
            </div>
            <Separator />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="block w-full mt-1 p-2 border rounded"
                />
              </div>
            </div>
            <Separator />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
