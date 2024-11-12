// src/lib/auth-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function handlePostGoogleSignIn() {
  const supabase = createClient();

  // Get the current authenticated user
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    console.error("Error fetching authenticated user:", error?.message || "User or email undefined");
    redirect("/error");
    return;
  }

  const emailDomain = user.email.split("@")[1];
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email.split('@')[0];
  const lastName = user.user_metadata?.full_name?.split(' ')[1] || '';

  // Check if the email domain exists in the employee_domains table
  const { data: domainData, error: domainError } = await supabase
    .from("employee_domains")
    .select("domain")
    .eq("domain", emailDomain)
    .single();

  if (domainError) {
    console.error("Error checking employee domain:", domainError.message);
    redirect("/error");
    return;
  }

  if (domainData) {
    // Check if the user already exists in the employees table
    const { data: existingEmployee } = await supabase
      .from("employees")
      .select("user_uuid")
      .eq("user_uuid", user.id)
      .single();

    if (!existingEmployee) {
      // Insert into the employees table if not exists
      const { error: insertEmployeeError } = await supabase.from("employees").upsert({
        user_uuid: user.id, 
        contact_info: user.email,
        name: firstName,
        role: "user",  // Automatically assign the role of "user"
      });

      if (insertEmployeeError) {
        console.error("Error inserting new employee:", insertEmployeeError.message);
        redirect("/error");
      } else {
        // console.log("User inserted into employees table:", user.email);
      }
    }

  } else {
    // Check if the user already exists in the customers table
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("user_uuid")
      .eq("user_uuid", user.id)
      .single();

    if (!existingCustomer) {
      // Insert into the customers table if not exists
      const { error: insertCustomerError } = await supabase.from("customers").upsert({
        user_uuid: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        role: "customer",  // Automatically assign the role of "customer"
      });

      if (insertCustomerError) {
        console.error("Error inserting new customer:", insertCustomerError.message);
        redirect("/error");
      } else {
        // console.log("User inserted into customers table:", user.email);
      }
    }
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

    // Check the role in both employees and customers tables
    const [{ data: employeeData }, { data: customerData }] = await Promise.all([
      supabase.from("employees").select("role").eq("user_uuid", user.id).single(),
      supabase.from("customers").select("role").eq("user_uuid", user.id).single()
    ]);

    const role = employeeData?.role || customerData?.role;

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

  if (signUpError) {
    console.error(signUpError);
    return;
  }

  const user = signUpData.user;

  if (user) {
    const { error: profileError } = await supabase
      .from("customers")
      .upsert({
        user_uuid: user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: "customer",
      });

    if (profileError) {
      console.error(profileError);
      return;
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}


export async function signout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    // console.log(error);
    redirect("/error");
  }

  redirect("/logout");
}

// export async function signInWithGoogle() {
//   const supabase = createClient();
//   const { data, error } = await supabase.auth.signInWithOAuth({
//     provider: "google",
//     options: {
//       queryParams: {
//         access_type: "offline",
//         prompt: "consent",
//       },
//     },
//   });

//   if (error) {
//     // console.log(error);
//     redirect("/error");
//   }

//   // Redirect the user to the OAuth URL
//   redirect(data.url);
// }

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,  // Replace with your callback URL
    },
  });

  if (error) {
    console.error("Error with Google sign-in:", error.message);
    redirect("/error");
  }

  // Redirect the user to the OAuth URL
  redirect(data.url);
}


// Function to handle user data sync after OAuth sign-in
// export async function handleOAuthUser(user: any) {
//   const supabase = createClient();
//   const fullName = user.user_metadata.full_name || '';
//   const firstName = fullName.split(' ')[0];
//   const lastName = fullName.split(' ')[1] || '';

//   const { error: profileError } = await supabase
//     .from("profiles")
//     .upsert({ id: user.id, full_name: fullName, email: user.email, role: "customer" });

//   if (profileError) {
//     // console.log(profileError);
//     redirect("/error");
//   }

//   // Check if the user exists in the employees table
//   const { data: existingEmployee, error: fetchError } = await supabase
//     .from("employees")
//     .select("*")
//     .eq("contact_info", user.email)
//     .single();

//   if (fetchError && fetchError.code !== "PGRST116") {
//     console.error("Error fetching existing employee:", fetchError);
//     redirect("/error");
//   }

//   if (!existingEmployee) {
//     const { error: employeeError } = await supabase
//       .from("employees")
//       .upsert({
//         user_uuid: user.id,
//         contact_info: user.email,
//         name: firstName,
//         role: "user",
//       }, {
//         onConflict: "contact_info",
//       });

//     if (employeeError) {
//       // console.log(employeeError);
//       redirect("/error");
//     }
//   }
// }

export async function handleOAuthUser(user: any) {
  const supabase = createClient();
  const fullName = user.user_metadata.full_name || '';
  const firstName = fullName.split(' ')[0];
  const lastName = fullName.split(' ')[1] || '';
  const emailDomain = user.email.split("@")[1];

  // Check if the email domain exists in the employee_domains table
  const { data: domainData, error: domainError } = await supabase
    .from("employee_domains")
    .select("domain")
    .eq("domain", emailDomain)
    .single();

  if (domainError) {
    console.error("Error checking employee domain:", domainError.message);
    redirect("/error");
    return;
  }

  if (domainData) {
    // Upsert into the employees table
    const { error: employeeError } = await supabase
      .from("employees")
      .upsert({
        user_uuid: user.id,
        contact_info: user.email,
        name: firstName,
        role: "user",  // Automatically assign the role of "user"
      }, {
        onConflict: "contact_info",  // Use onConflict to handle duplicate entries
      });

    if (employeeError) {
      console.error("Error upserting into employees table:", employeeError.message);
      redirect("/error");
      return;
    }

    // console.log("User upserted into employees table:", user.email);

  } else {
    // Upsert into the customers table
    const { error: customerError } = await supabase
      .from("customers")
      .upsert({
        user_uuid: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        role: "customer",  // Automatically assign the role of "customer"
      }, {
        onConflict: "email",  // Use onConflict to handle duplicate entries
      });

    if (customerError) {
      console.error("Error upserting into customers table:", customerError.message);
      redirect("/error");
      return;
    }

    // console.log("User upserted into customers table:", user.email);
  }
}


export async function updateProfile(user: any) {
  const supabase = createClient();
  const { id, email, user_metadata: { full_name } } = user;
  const fullName = full_name || '';
  const firstName = fullName.split(' ')[0];
  const lastName = fullName.split(' ')[1] || '';

  const { error: profileError } = await supabase
    .from("customers")
    .upsert({
      user_uuid: id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      role: "user"
    });

  if (profileError) {
    // console.log(profileError);
    redirect("/error");
  }
}