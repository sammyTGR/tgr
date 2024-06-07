"use client"

import { useState, useEffect, useRef, FC } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';

import SortableLinks from '@/components/SortableLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddNewItem } from '@/components/AddNewItem';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useRole } from '@/context/RoleContext';  // Correct import
import { supabase } from '@/utils/supabase/client';

// Define the item interface
interface Item {
  name: string;
  id: number;
  user_id: string;
  user_name: string;
  list_id: string;
}

// Define the list interface
interface List {
  id: string;
  title: string;
  items: Item[];
}

interface HomeProps {
  // You can add any additional props if needed
}

const Todo: React.FC<HomeProps> = () => {
  const { role, user } = useRole();  // Fetch role and user information from context
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [lists, setLists] = useState<List[]>([
    { id: uuidv4(), title: 'Project Planning', items: [] },
    { id: uuidv4(), title: 'To Do Planner', items: [] },
    { id: uuidv4(), title: 'Just Another List', items: [] }
  ]);
  const [username, setUsername] = useState<string | null>(null);
  const channel = useRef<RealtimeChannel | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    // Fetch items from Supabase
    const fetchItems = async () => {
      const { data, error } = await supabase.from('items').select('*').order('id');
      if (error) {
        console.error('Error fetching items:', error);
      } else if (data) {
        setLists(prevLists =>
          prevLists.map(list => ({
            ...list,
            items: data.filter((item: Item) => item.list_id === list.id),
          }))
        );
      }
    };

    // Fetch username from employees table
    const fetchUsername = async () => {
      if (user) {
        const { data: userData, error } = await supabase
          .from("employees")
          .select("name")
          .eq("user_uuid", user.id)
          .single();
        if (userData) {
          setUsername(userData.name);
        } else {
          console.error("Error fetching username:", error?.message);
        }
      }
    };

    fetchItems();
    fetchUsername();

    if (!channel.current) {
      channel.current = supabase.channel('public:items');

      channel.current
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' }, (payload) => {
          setLists(prevLists =>
            prevLists.map(list =>
              list.id === payload.new.list_id
                ? { ...list, items: [...list.items, payload.new as Item] }
                : list
            )
          );
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, (payload) => {
          setLists(prevLists =>
            prevLists.map(list =>
              list.id === payload.old.list_id
                ? { ...list, items: list.items.filter(item => item.id !== payload.old.id) }
                : list
            )
          );
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' }, (payload) => {
          setLists(prevLists =>
            prevLists.map(list =>
              list.id === payload.new.list_id
                ? {
                  ...list,
                  items: list.items.map(item => item.id === payload.new.id ? payload.new as Item : item),
                }
                : list
            )
          );
        })
        .subscribe();
    }

    return () => {
      channel.current?.unsubscribe();
      channel.current = null;
    };
  }, [user]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (activeContainer && overContainer && activeContainer !== overContainer) {
      setLists(prevLists => {
        const activeList = prevLists.find(list => list.id === activeContainer);
        const overList = prevLists.find(list => list.id === overContainer);
        if (!activeList || !overList) return prevLists;

        const activeIndex = activeList.items.findIndex(item => item.id === active.id);
        const overIndex = overList.items.findIndex(item => item.id === over.id);

        if (activeIndex === -1 || overIndex === -1) return prevLists;

        const [movedItem] = activeList.items.splice(activeIndex, 1);
        overList.items.splice(overIndex, 0, movedItem);

        return prevLists.map(list =>
          list.id === activeContainer
            ? { ...activeList }
            : list.id === overContainer
              ? { ...overList }
              : list
        );
      });
    } else if (activeContainer === overContainer) {
      setLists(prevLists => {
        const activeList = prevLists.find(list => list.id === activeContainer);
        if (!activeList) return prevLists;

        const activeIndex = activeList.items.findIndex(item => item.id === active.id);
        const overIndex = activeList.items.findIndex(item => item.id === over.id);

        if (activeIndex !== -1 && overIndex !== -1) {
          const newItems = arrayMove(activeList.items, activeIndex, overIndex);
          return prevLists.map(list =>
            list.id === activeContainer
              ? { ...list, items: newItems }
              : list
          );
        }

        return prevLists;
      });
    }
  };

  const findContainer = (id: number): string | undefined => {
    for (const list of lists) {
      if (list.items.find(item => item.id === id)) {
        return list.id;
      }
    }
  };

  const handleDelete = async (listId: string, idToDelete: number) => {
    const list = lists.find(list => list.id === listId);
    const item = list?.items.find((item) => item.id === idToDelete);
    if (item && item.user_id === user.id) {
      const { error } = await supabase.from('items').delete().eq('id', idToDelete);
      if (error) {
        console.error('Error deleting item:', error);
      } else {
        setLists(prevLists =>
          prevLists.map(list =>
            list.id === listId ? { ...list, items: list.items.filter((item) => item.id !== idToDelete) } : list
          )
        );
      }
    } else {
      console.error('You do not have permission to delete this item.');
    }
  };

  const addNewItem = async (listId: string, newItem: string) => {
    if (!user || !username) {
      console.error('User or username is not defined');
      return;
    }

    const newItemData: Item = { name: newItem, id: Date.now(), user_id: user.id, user_name: username, list_id: listId };
    const { data, error } = await supabase.from('items').insert([newItemData]);
    if (error) {
      console.error('Error adding item:', error);
    } else if (data) {
      setLists(prevLists =>
        prevLists.map(list =>
          list.id === listId ? { ...list, items: [...list.items, newItemData] } : list
        )
      );
    }
  };

  return (
    <main className='flex grid cols-4 justify-center mt-10h-screen px-2 mx-auto select-none'>
      <div className="container mt-10 px-4 md:px-6">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3 md:grid-cols-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {lists.map((list) => (
              <Card key={list.id} className='w-full md:max-w-lg'>
                <CardHeader className='space-y-1 '>
                  <CardTitle className='text-2xl flex justify-between'>
                    {list.title}
                    <AddNewItem addNewItem={(newItem: string) => addNewItem(list.id, newItem)} />
                  </CardTitle>
                  <CardDescription>List All Of Your Projects</CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4'>
                  <SortableContext items={list.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                    {list.items.map((item) => (
                      <SortableLinks key={item.id} item={item} onDelete={() => handleDelete(list.id, item.id)} />
                    ))}
                  </SortableContext>
                </CardContent>
              </Card>
            ))}
            <DragOverlay>
              {activeId ? <SortableLinks item={{ id: activeId, name: '' }} onDelete={() => {}} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </main>
  );
};

export default Todo;
