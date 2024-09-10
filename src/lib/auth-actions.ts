// src/lib/auth-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SupabaseClient } from '@supabase/supabase-js';

type User = {
  id: string;
  email: string;
};

async function getEmployeeDomains() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('employee_domains')
    .select('domain');
  
  if (error) {
    console.error("Error fetching employee domains:", error.message);
    return [];
  }
  
  return data.map(row => row.domain.toLowerCase());
}

async function handleEmployeeUpsert(
  supabase: SupabaseClient,
  user: User,
  firstName: string,
  lastName: string
): Promise<void> {
  const { data: existingEmployee, error: fetchError } = await supabase
    .from("employees")
    .select("*")
    .eq("contact_info", user.email)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error("Error fetching existing employee:", fetchError.message);
    throw fetchError;
  }

  const employeeData = {
    user_uuid: user.id,
    contact_info: user.email,
    name: firstName,
    last_name: lastName,
    role: "user"
  };

  const { error: upsertError } = await supabase
    .from("employees")
    .upsert(employeeData, { onConflict: 'contact_info' });

  if (upsertError) {
    console.error("Error upserting employee:", upsertError.message);
    throw upsertError;
  }

  console.log(existingEmployee ? "Updated existing employee record" : "Inserted new employee record");
}

export async function handlePostGoogleSignIn() {
  const supabase = createClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user || !user.email) throw new Error("User or email undefined");

    console.log("Handling Google sign-in for:", user.email);

    const emailDomain = user.email.split("@")[1].toLowerCase();
    const fullName = user.user_metadata?.full_name || '';
    const firstName = fullName.split(' ')[0] || user.email.split('@')[0];
    const lastName = fullName.split(' ').slice(1).join(' ') || '';

    console.log("User details:", { firstName, lastName, emailDomain });

    const employeeDomains = await getEmployeeDomains();
    console.log("Employee domains:", employeeDomains);

    if (employeeDomains.includes(emailDomain)) {
      console.log("Email domain matches employee domain");
      await handleEmployeeUpsert(supabase, { id: user.id, email: user.email }, firstName, lastName);
    } else {
      console.log("Handling as customer");
      // Handle customer logic
      const { data: existingCustomer, error: customerFetchError } = await supabase
        .from("customers")
        .select("user_uuid")
        .eq("email", user.email)
        .single();

      if (customerFetchError && customerFetchError.code !== 'PGRST116') {
        throw customerFetchError;
      }

      if (!existingCustomer) {
        const { error: customerError } = await supabase
        .from("customers")
        .upsert({
          user_uuid: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          role: "customer",
        });

        if (customerError) throw customerError;
        console.log("Inserted new customer record for:", user.email);
      } else {
        // Update existing customer
        const { error: updateError } = await supabase
          .from("customers")
          .update({ user_uuid: user.id })
          .eq("email", user.email);

        if (updateError) throw updateError;
        console.log("Updated existing customer record for:", user.email);
      }
    }

    console.log("Google sign-in handled successfully for:", user.email);
    return { success: true };
  } catch (error) {
    console.error("Error in handlePostGoogleSignIn:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred" };
  }
}

export async function login(formData: FormData) {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;
    if (!user) throw new Error("User not found");

    const emailDomain = email.split("@")[1].toLowerCase();
    const employeeDomains = await getEmployeeDomains();

    let role;
    if (employeeDomains.includes(emailDomain)) {
      const { data } = await supabase.from("employees").select("role").eq("contact_info", email).single();
      role = data?.role;
    } else {
      const { data } = await supabase.from("customers").select("role").eq("email", email).single();
      role = data?.role;
    }

    if (role === "blocked") {
      await supabase.auth.signOut();
      return { error: "Your account has been blocked. Please contact support for assistance." };
    }

    if (!role) {
      return { error: "User account not properly set up. Please contact support." };
    }

    revalidatePath("/", "layout");
    return { success: true, role };
  } catch (error) {
    console.error("Login error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

export async function signup(data: { firstName: string, lastName: string, email: string, password: string }) {
  const supabase = createClient();
  const { firstName, lastName, email, password } = data;

  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          email: email,
        },
      },
    });

    if (signUpError) throw signUpError;

    const user = signUpData.user;
    if (!user) throw new Error("User not created");

    // Check if user.email is defined
    if (!user.email) throw new Error("User email is undefined");

    const emailDomain = email.split("@")[1].toLowerCase();
    const employeeDomains = await getEmployeeDomains();

    if (employeeDomains.includes(emailDomain)) {
      await handleEmployeeUpsert(supabase, { id: user.id, email: user.email }, firstName, lastName);
    } else {
      const { error: customerError } = await supabase
        .from("customers")
        .upsert({
          user_uuid: user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: "customer",
        }, {
          onConflict: "user_uuid",
        });

      if (customerError) throw customerError;
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred during signup" };
  }
}

export async function signout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Signout error:", error);
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
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error with Google sign-in:", error.message);
    redirect("/error");
  }

  redirect(data.url);
}

export async function handleOAuthUser(user: any) {
  const supabase = createClient();

  try {
    if (!user || !user.email) {
      console.error("Invalid user data:", user);
      throw new Error("Invalid user data");
    }

    console.log("Handling OAuth user:", user.email);

    const fullName = user.user_metadata?.full_name || '';
    const firstName = fullName.split(' ')[0] || user.email.split('@')[0];
    const lastName = fullName.split(' ').slice(1).join(' ') || '';
    const emailDomain = user.email.split("@")[1].toLowerCase();

    console.log("User details:", { firstName, lastName, emailDomain });

    const employeeDomains = await getEmployeeDomains();
    console.log("Employee domains:", employeeDomains);

    if (employeeDomains.includes(emailDomain)) {
      console.log("Email domain matches employee domain");
      await handleEmployeeUpsert(supabase, { id: user.id, email: user.email }, firstName, lastName);
    } else {
      console.log("Handling as customer");
      // Handle customer logic
      const { error: customerError } = await supabase
        .from("customers")
        .upsert({
          user_uuid: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          role: "customer",
        }, {
          onConflict: "email",
        });

      if (customerError) {
        console.error("Error upserting customer:", customerError);
        throw customerError;
      }
      console.log("Upserted customer record for:", user.email);
    }

    console.log("OAuth user handled successfully:", user.email);
    return { success: true };
  } catch (error) {
    console.error("Error in handleOAuthUser:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred while handling OAuth user" };
  }
}


export async function updateProfile(user: any) {
  const supabase = createClient();
  const { id, email, user_metadata: { full_name } } = user;
  const fullName = full_name || '';
  const firstName = fullName.split(' ')[0];
  const lastName = fullName.split(' ')[1] || '';

  const emailDomain = email.split("@")[1].toLowerCase();
  const employeeDomains = await getEmployeeDomains();

  if (employeeDomains.includes(emailDomain)) {
    const { error: profileError } = await supabase
      .from("employees")
      .upsert({
        user_uuid: id,
        contact_info: email,
        name: `${firstName} ${lastName}`.trim(),
        role: "user"
      }, {
        onConflict: "contact_info",
      });

    if (profileError) {
      console.error("Error updating employee profile:", profileError);
      redirect("/error");
    }
  } else {
    const { error: profileError } = await supabase
      .from("customers")
      .upsert({
        user_uuid: id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: "customer"
      }, {
        onConflict: "email",
      });

    if (profileError) {
      console.error("Error updating customer profile:", profileError);
      redirect("/error");
    }
  }
}