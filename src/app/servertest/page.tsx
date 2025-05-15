import { auth } from '@clerk/nextjs/server';
import { CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function createClerkSupabaseClient() {
  const cookieStore = cookies();
  const { getToken } = auth();

  const token = await getToken({ template: 'supabase' });
  const authToken = token ? { Authorization: `Bearer ${token}` } : null;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { 'Cache-Control': 'no-store', ...authToken } },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle the error
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle the error
          }
        },
      },
    }
  );
}

export default async function Supabase() {
  const client = await createClerkSupabaseClient();

  const { data, error } = await client.from('Addresses').select();

  if (error) {
    return <p>Error: {JSON.stringify(error, null, 2)}</p>;
  }

  return (
    <div>
      <h2>Addresses</h2>
      {!data ? (
        <p>No addresses</p>
      ) : (
        <ul>
          {data.map((address: any) => (
            <li key={address.id}>{address.content}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
