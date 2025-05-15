'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

type EmployeeProfileData = {
  name: string;
  last_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
};

export default function EmployeeProfilePage() {
  const [user, setUser] = useState<any>(null);
  const { register, handleSubmit, setValue } = useForm<EmployeeProfileData>();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData) {
        setUser(userData.user);

        const { data: employeeData, error } = await supabase
          .from('employees')
          .select('name, last_name, phone_number, street_address, city, state, zip')
          .eq('user_uuid', userData.user?.id)
          .single();

        if (error) {
          console.error('Error fetching employee data:', error);
          toast.error('Failed to load profile data. Please try again.');
          return;
        }

        if (employeeData) {
          // Type-safe way to set form values
          (Object.keys(employeeData) as Array<keyof EmployeeProfileData>).forEach((key) => {
            setValue(key, employeeData[key]);
          });
        }
      }
    };

    fetchProfile();
  }, [setValue]);

  const onSubmit = async (data: EmployeeProfileData) => {
    if (user) {
      const { error } = await supabase.from('employees').update(data).eq('user_uuid', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile. Please try again.');
      } else {
        toast.success('Profile updated successfully!');
      }
    }
  };

  return (
    <Card className="w-full max-w-3xl my-8 mx-auto">
      <header className="bg-muted dark:bg-muted p-6 rounded-t-lg flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src="/Circular.png" />
          <AvatarFallback>EP</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">Edit Employee Profile</h1>
        </div>
      </header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 rounded-b-lg space-y-6">
          {[
            { label: 'First Name', id: 'name' },
            { label: 'Last Name', id: 'last_name' },
            { label: 'Phone Number', id: 'phone_number' },
            { label: 'Street Address', id: 'street_address' },
            { label: 'City', id: 'city' },
            { label: 'State', id: 'state' },
            { label: 'ZIP Code', id: 'zip' },
          ].map((field) => (
            <div key={field.id} className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <input
                    id={field.id}
                    {...register(field.id as keyof EmployeeProfileData)}
                    className="block w-full mt-1 p-2 border rounded"
                  />
                </div>
              </div>
              <Separator />
            </div>
          ))}
          <div className="flex justify-end">
            <Button variant="linkHover1" type="submit">
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
