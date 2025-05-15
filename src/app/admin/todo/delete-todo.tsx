'use client';

import { Button } from '@/components/ui/button';
import { Cross2Icon, TrashIcon } from '@radix-ui/react-icons';
import { deleteTodo } from './actions';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function DeleteTodo({ id }: { id: number }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteTodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={() => mutation.mutate()}>
      <TrashIcon className="h-4 w-4" />
    </Button>
  );
}
