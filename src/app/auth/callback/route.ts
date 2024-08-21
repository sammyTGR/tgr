import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { handlePostGoogleSignIn } from "@/lib/auth-actions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if the user is blocked
      const [{ data: employeeData }, { data: customerData }] = await Promise.all([
        supabase.from("employees").select("role").eq("user_uuid", data.user.id).single(),
        supabase.from("customers").select("role").eq("user_uuid", data.user.id).single()
      ]);

      const role = employeeData?.role || customerData?.role;

      if (role === "blocked") {
        console.log("User is blocked, preventing login");
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