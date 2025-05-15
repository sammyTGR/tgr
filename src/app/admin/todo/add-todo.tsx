'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addTodo } from './actions';
import { PlusIcon } from '@radix-ui/react-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function AddTodo() {
  const ref = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (formData: FormData) => addTodo(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      ref.current?.reset();
    },
  });

  return (
    <form
      className="flex outline-none items-center gap-2"
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const task = formData.get('task') as string;
        mutation.mutate(formData);
      }}
    >
      <Input
        id="task"
        className="p-2 focus-visible:ring-transparent"
        name="task"
        placeholder=" Add new item..."
        required
      />
      <Button type="submit" className="p-2" size="icon" variant="gooeyLeft">
        <PlusIcon />
      </Button>
    </form>
  );
}
