// import { cookies } from 'next/headers'
// import { NextResponse } from 'next/server'
// import { createClient } from "@/utils/supabase/server";

// export async function GET(request: Request) {
//   const { searchParams, origin } = new URL(request.url)
//   const code = searchParams.get('code')
//   // if "next" is in param, use it as the redirect URL
//   const next = searchParams.get('next') ?? '/'

//   if (code) {
//     const cookieStore = cookies()
//     const supabase = createClient()
//     const { error } = await supabase.auth.exchangeCodeForSession(code)
//     if (!error) {
//       return NextResponse.redirect(`${origin}${next}`)
//     }
//   }

//   // return the user to an error page with instructions
//   return NextResponse.redirect(`${origin}/auth/auth-code-error`)
// }

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Call the function to insert into the correct table
      await handlePostGoogleSignIn();

      // Redirect the user after inserting into the correct table
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
