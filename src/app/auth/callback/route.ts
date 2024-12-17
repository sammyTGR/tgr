"use server";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { handlePostGoogleSignIn } from "@/lib/auth-actions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user && data.user.email) {
      const emailDomain = data.user.email.split("@")[1];

      // Check if the email domain exists in the employee_domains table
      const { data: domainData, error: domainError } = await supabase
        .from("employee_domains")
        .select("domain")
        .eq("domain", emailDomain)
        .single();

      if (domainError) {
        console.error("Error checking employee domain:", domainError.message);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }

      if (domainData) {
        // Check if the user already exists in the employees table
        const { data: existingEmployee } = await supabase
          .from("employees")
          .select("user_uuid")
          .eq("user_uuid", data.user.id)
          .single();

        if (!existingEmployee) {
          // Insert into the employees table if not exists
          const { error: insertEmployeeError } = await supabase
            .from("employees")
            .upsert({
              user_uuid: data.user.id,
              contact_info: data.user.email,
              name:
                data.user.user_metadata?.full_name?.split(" ")[0] ||
                data.user.email.split("@")[0],
              role: "user", // Automatically assign the role of "user"
            });

          if (insertEmployeeError) {
            console.error(
              "Error inserting new employee:",
              insertEmployeeError.message
            );
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
          }
        }
      } else {
        // Check if the user already exists in the customers table
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("user_uuid")
          .eq("user_uuid", data.user.id)
          .single();

        if (!existingCustomer) {
          // Insert into the customers table if not exists
          const { error: insertCustomerError } = await supabase
            .from("customers")
            .upsert({
              user_uuid: data.user.id,
              email: data.user.email,
              first_name:
                data.user.user_metadata?.full_name?.split(" ")[0] ||
                data.user.email.split("@")[0],
              last_name:
                data.user.user_metadata?.full_name?.split(" ")[1] || "",
              role: "customer", // Automatically assign the role of "customer"
            });

          if (insertCustomerError) {
            console.error(
              "Error inserting new customer:",
              insertCustomerError.message
            );
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
          }
        }
      }

      // Check if the user is blocked
      const [{ data: employeeData }, { data: customerData }] =
        await Promise.all([
          supabase
            .from("employees")
            .select("role")
            .eq("user_uuid", data.user.id)
            .single(),
          supabase
            .from("customers")
            .select("role")
            .eq("user_uuid", data.user.id)
            .single(),
        ]);

      const role = employeeData?.role || customerData?.role;

      if (role === "blocked") {
        // console.log("User is blocked, preventing login");
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth/blocked`);
      }

      // Call the function to insert into the correct table
      await handlePostGoogleSignIn();

      // Redirect the user after inserting into the correct table
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
