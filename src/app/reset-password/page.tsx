'use client';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define the validation schema using Zod
const schema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
});

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormData) => {
    const { email } = data;

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://tgr-dashboard.vercel.app/change-password',
      });

      if (error) throw error;

      toast.success('Password reset email sent successfully');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error requesting password reset:', error.message);
        toast.error(error.message);
      } else {
        console.error('Unexpected error requesting password reset:', error);
        toast.error('Unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid place-items-center h-screen">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Reset Password</CardTitle>
          <CardDescription>Enter your email to reset your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="uspsashooter@example.com"
                    required
                  />
                )}
              />
              {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
            </div>
            <Button variant="outline" type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Remembered your password?{' '}
            <Link href="/sign-in" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
