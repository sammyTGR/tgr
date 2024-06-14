"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/utils/supabase/client";

type ProfileData = {
  full_name: string;
  email: string;
  bio: string;
  avatar_url: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const { register, handleSubmit, setValue, watch } = useForm<ProfileData>();
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder-user.jpg");
  const avatarRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData) {
        setUser(userData.user);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user?.id)
          .single();

        if (profileData) {
          setValue("full_name", profileData.full_name);
          setValue("email", profileData.email);
          setValue("bio", profileData.bio);
          setAvatarUrl(profileData.avatar_url || "/placeholder-user.jpg");
        }
      }
    };

    fetchProfile();
  }, [setValue]);

  const onSubmit = async (data: ProfileData) => {
    if (user) {
      let avatarUrlToUpdate = avatarUrl;

      if (avatarRef.current && avatarRef.current.files && avatarRef.current.files.length > 0) {
        const file = avatarRef.current.files[0];
        const fileName = `${user.id}/${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from("avatars")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Error uploading avatar:", uploadError);
          alert("Error uploading avatar. Please try again.");
          return;
        } else {
            const publicUrlData: { data: { publicUrl: string; }, error?: any; } = supabase.storage.from("avatars").getPublicUrl(fileName);
            if (publicUrlData.error) {
              console.error("Error getting public URL for avatar:", publicUrlData.error);
              alert("Error getting public URL for avatar. Please try again.");
              return;
            }
            avatarUrlToUpdate = publicUrlData.data.publicUrl;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          email: data.email,
          bio: data.bio,
          avatar_url: avatarUrlToUpdate,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
      } else {
        setAvatarUrl(avatarUrlToUpdate);
        alert("Profile updated successfully!");
      }
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <header className="bg-gray-100 dark:bg-gray-800 p-6 rounded-t-lg flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback></AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>
      </header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white dark:bg-gray-950 p-6 rounded-b-lg space-y-6">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="full_name">Name</Label>
                <input
                  id="full_name"
                  {...register("full_name")}
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
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  {...register("bio")}
                  className="block w-full mt-1 p-2 border rounded"
                />
              </div>
            </div>
            <Separator />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="avatar_url">Avatar</Label>
                <input
                  id="avatar_url"
                  type="file"
                  accept="image/*"
                  {...register("avatar_url")}
                  ref={avatarRef}
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
