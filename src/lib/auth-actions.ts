// src/lib/auth-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(data: { firstName: string, lastName: string, email: string, password: string }) {
  const supabase = createClient();

  const { firstName, lastName, email, password } = data;
  const avatar_url = '/default-avatar.png'; // Default avatar URL

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        email: email,
      },
    },
  });

  if (signUpError) {
    redirect("/error");
  }

  const user = signUpData.user;

  if (user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: `${firstName} ${lastName}`, email: email, avatar_url, role: "customer" });

    if (profileError) {
      console.log(profileError);
      redirect("/error");
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect("/logout");
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.log(error);
    redirect("/error");
  }

  // Redirect the user to the OAuth URL
  redirect(data.url);
}

// Function to handle user data sync after OAuth sign-in
export async function handleOAuthUser(user: any) {
  const supabase = createClient();
  const fullName = user.user_metadata.full_name || '';
  const firstName = fullName.split(' ')[0];
  const lastName = fullName.split(' ')[1] || '';

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName, email: user.email, role: "customer" });

  if (profileError) {
    console.log(profileError);
    redirect("/error");
  }

  // Check if the user exists in the employees table
  const { data: existingEmployee, error: fetchError } = await supabase
    .from("employees")
    .select("*")
    .eq("contact_info", user.email)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching existing employee:", fetchError);
    redirect("/error");
  }

  if (!existingEmployee) {
    const { error: employeeError } = await supabase
      .from("employees")
      .upsert({
        user_uuid: user.id,
        contact_info: user.email,
        name: firstName,
        role: "user",
      }, {
        onConflict: "contact_info",
      });

    if (employeeError) {
      console.log(employeeError);
      redirect("/error");
    }
  }
}

export async function updateProfile(user: any) {
  const supabase = createClient();
  const { id, email, user_metadata: { full_name } } = user;
  const fullName = full_name || '';
  const firstName = fullName.split(' ')[0];
  const lastName = fullName.split(' ')[1] || '';

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: id, full_name: fullName, email: email, role: "customer" });

  if (profileError) {
    console.log(profileError);
    redirect("/error");
  }
}
