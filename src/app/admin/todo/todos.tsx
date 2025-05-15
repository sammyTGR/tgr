'use client';

import { useQuery } from '@tanstack/react-query';
import Todo from './todo';
import AddTodo from './add-todo';
import type { Todo as TodoType } from '@/lib/interface';

export default function Todos() {
  const {
    data: todos,
    isLoading,
    error,
  } = useQuery<TodoType[], Error>({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/fetch-todos');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
  });

  if (isLoading) return <div>Loading todos...</div>;
  if (error) return <div>Error loading todos: {error.message}</div>;

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex flex-col gap-1 mb-2">
        {todos
          ?.filter((todo) => !todo.is_complete)
          .map((todo) => <Todo key={todo.id} todo={todo} />)}
        {todos
          ?.filter((todo) => todo.is_complete)
          .map((todo) => <Todo key={todo.id} todo={todo} />)}
      </div>
      <AddTodo />
    </div>
  );
}
