import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/utils/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const holidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required'),
  date: z.date({
    required_error: 'Date is required',
  }),
  is_full_day: z.boolean().default(true),
  repeat_yearly: z.boolean().default(false),
  isOpen: z.boolean().default(false),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

const useHolidaysTableCheck = () => {
  return useQuery({
    queryKey: ['holidaysTableCheck'],
    queryFn: async () => {
      const { data, error } = await supabase.from('holidays').select('id').limit(1);

      if (error) {
        console.error('Table check error:', error);
        return false;
      }
      return true;
    },
    retry: false,
  });
};

export function HolidayManager() {
  const queryClient = useQueryClient();
  const tableCheck = useHolidaysTableCheck();

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: '',
      is_full_day: true,
      repeat_yearly: false,
      isOpen: false,
    },
  });

  const { mutate: addHoliday, isPending } = useMutation({
    mutationFn: async (values: HolidayFormValues) => {
      if (!values.date) {
        throw new Error('Date is required');
      }

      const formattedData = {
        name: values.name.trim(),
        date: format(values.date, 'yyyy-MM-dd'),
        is_full_day: values.is_full_day,
        repeat_yearly: values.repeat_yearly,
      };

      // console.log('Sending data:', formattedData);

      const response = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add holiday');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday added successfully');
      form.reset();
      form.setValue('isOpen', false);
    },
    onError: (error: Error) => {
      console.error('Holiday creation error:', error);
      toast.error(error.message);
    },
  });

  function onSubmit(values: HolidayFormValues) {
    if (!values.date) {
      toast.error('Please select a date');
      return;
    }
    addHoliday(values);
  }

  // If table check fails, show error
  if (tableCheck.isError) {
    console.error('Holidays table not accessible:', tableCheck.error);
    return <div>Error: Unable to access holidays table</div>;
  }

  return (
    <Form {...form}>
      <Dialog open={form.watch('isOpen')} onOpenChange={(open) => form.setValue('isOpen', open)}>
        <DialogTrigger asChild>
          <Button variant="outline">Manage Holidays</Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Holiday Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter holiday name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-row space-x-2">
              <FormField
                control={form.control}
                name="is_full_day"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Full Day Closure</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repeat_yearly"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Repeat Yearly</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending || !form.formState.isValid}>
                {isPending ? 'Adding...' : 'Add Holiday'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
