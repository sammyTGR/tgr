"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  MeasuringStrategy,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase/client";
import { useRole } from "@/context/RoleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SortableLinks from "@/components/SortableLinks";
import SortableCard from "@/components/SortableCard";
import { AddNewItem } from "@/components/AddNewItem";
import { AddNewList } from "@/components/AddNewList";
import { EditListTitle } from "@/components/EditListTitle";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import {
  fetchLists,
  fetchUsername,
  updateListsOrder,
  updateItemsOrder,
  addNewItem as addNewItemAction,
  addNewList as addNewListAction,
  updateListTitle as updateListTitleAction,
  deleteList as deleteListAction,
  updateItem as updateItemAction,
  clearList as clearListAction,
} from "./actions";

interface Item {
  id: number;
  name: string;
  user_id: string;
  user_name: string;
  list_id: string;
  order: number;
  completed?: string;
  deleted?: boolean;
}

interface List {
  id: string;
  title: string;
  items: Item[];
  order: number;
}

const WeeklyAgenda: React.FC = () => {
  const { role, user } = useRole();
  const queryClient = useQueryClient();
  const channel = useRef<RealtimeChannel | null>(null);
  const [activeId, setActiveId] = useState<number | string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries
  const { data: lists = [] } = useQuery({
    queryKey: ["lists"],
    queryFn: fetchLists,
  });

  const { data: username } = useQuery({
    queryKey: ["username", user?.id],
    queryFn: () => fetchUsername(user?.id as string),
    enabled: !!user?.id,
  });

  // Mutations
  const updateListsOrderMutation = useMutation({
    mutationFn: updateListsOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const updateItemsOrderMutation = useMutation({
    mutationFn: updateItemsOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const addNewItemMutation = useMutation({
    mutationFn: ({ listId, newItem }: { listId: string; newItem: string }) =>
      addNewItemAction(listId, newItem, user?.id as string, username as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const addNewListMutation = useMutation({
    mutationFn: addNewListAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const updateListTitleMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateListTitleAction(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const deleteListMutation = useMutation({
    mutationFn: deleteListAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      id,
      updatedItem,
    }: {
      id: number;
      updatedItem: Partial<Item>;
    }) => updateItemAction(id, updatedItem),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  const clearListMutation = useMutation({
    mutationFn: clearListAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lists"] }),
  });

  // Handlers
  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;

    const activeId = active.id;
    const overId = over.id;

    // Check if we're dragging a list
    const activeListIndex = lists.findIndex((list) => list.id === activeId);

    if (activeListIndex !== -1) {
      const overListIndex = lists.findIndex((list) => list.id === overId);
      if (overListIndex !== -1 && activeListIndex !== overListIndex) {
        const newLists = arrayMove(lists, activeListIndex, overListIndex);
        const updatedLists = newLists.map((list, index) => ({
          ...list,
          order: index,
        }));
        updateListsOrderMutation.mutate(updatedLists);
      }
    } else {
      // Handle item drag logic
      const sourceListIndex = lists.findIndex((list) =>
        list.items.some((item) => item.id === activeId)
      );
      const destinationListIndex = lists.findIndex(
        (list) =>
          list.items.some((item) => item.id === overId) || list.id === overId
      );

      if (sourceListIndex !== -1 && destinationListIndex !== -1) {
        const newLists = [...lists];
        const sourceList = newLists[sourceListIndex];
        const destinationList = newLists[destinationListIndex];

        const [movedItem] = sourceList.items.splice(
          sourceList.items.findIndex((item) => item.id === activeId),
          1
        );

        if (sourceListIndex === destinationListIndex) {
          const newIndex = destinationList.items.findIndex(
            (item) => item.id === overId
          );
          destinationList.items.splice(newIndex, 0, movedItem);
        } else {
          if (overId === destinationList.id) {
            destinationList.items.push(movedItem);
          } else {
            const newIndex = destinationList.items.findIndex(
              (item) => item.id === overId
            );
            destinationList.items.splice(newIndex, 0, movedItem);
          }
        }

        sourceList.items.forEach((item, index) => {
          item.order = index;
        });
        destinationList.items.forEach((item, index) => {
          item.order = index;
        });

        if (sourceListIndex !== destinationListIndex) {
          movedItem.list_id = destinationList.id;
        }

        updateItemsOrderMutation.mutate([
          ...sourceList.items,
          ...destinationList.items,
        ]);
      }
    }

    setActiveId(null);
  };

  // Setup Realtime subscription
  if (!channel.current) {
    channel.current = supabase.channel("public:items");
    channel.current
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        queryClient.invalidateQueries({ queryKey: ["lists"] });
      })
      .subscribe();
  }

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin", "dev"]}>
      <main className="flex grid-cols-4 justify-center mt-10 h-screen px-2 mx-auto select-none">
        {(role === "super admin" || role === "dev") && (
          <div className="flex justify-start p-4 mb-4">
            <AddNewList
              addNewList={(title) => addNewListMutation.mutate(title)}
            />
          </div>
        )}
        <div className="container mt-10 px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3 md:grid-cols-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
            >
              <SortableContext
                items={lists.map((list) => list.id)}
                strategy={rectSortingStrategy}
              >
                {lists.map((list) => (
                  <SortableCard key={list.id} id={list.id}>
                    <Card className="w-full min-w-[325px] md:max-w-lg">
                      <CardHeader className="space-y-1">
                        <CardTitle className="flex justify-between items-center">
                          {list.title}
                          <EditListTitle
                            list={list}
                            updateListTitle={async (id, title) => {
                              await updateListTitleMutation.mutateAsync({
                                id,
                                title,
                              });
                            }}
                            deleteList={async (id) => {
                              await deleteListMutation.mutateAsync(id);
                            }}
                            clearList={async (id) => {
                              await clearListMutation.mutateAsync(id);
                            }}
                          />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <SortableContext
                          items={list.items.map((item) => item.id)}
                          strategy={rectSortingStrategy}
                        >
                          {list.items.map((item) => (
                            <SortableLinks
                              key={item.id}
                              item={item}
                              onDelete={async (id) => {
                                await updateItemMutation.mutateAsync({
                                  id: id as number,
                                  updatedItem: { deleted: true },
                                });
                              }}
                              updateItem={async (id, updatedItem) => {
                                await updateItemMutation.mutateAsync({
                                  id,
                                  updatedItem,
                                });
                              }}
                            />
                          ))}
                        </SortableContext>
                        <AddNewItem
                          addNewItem={(newItem) =>
                            addNewItemMutation.mutate({
                              listId: list.id,
                              newItem,
                            })
                          }
                        />
                      </CardContent>
                    </Card>
                  </SortableCard>
                ))}
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <SortableLinks
                    item={
                      lists
                        .flatMap((list) => list.items)
                        .find((item) => item.id === activeId) || {
                        id: activeId as number,
                        name: "",
                        user_id: "",
                        user_name: "",
                        list_id: "",
                        order: 0,
                      }
                    }
                    onDelete={async (id) => {
                      await updateItemMutation.mutateAsync({
                        id: id as number,
                        updatedItem: { deleted: true },
                      });
                    }}
                    updateItem={async (id, updatedItem) => {
                      await updateItemMutation.mutateAsync({ id, updatedItem });
                    }}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </main>
    </RoleBasedWrapper>
  );
};

export default WeeklyAgenda;
