"use client";

import { useState, useEffect, useRef, FC, useCallback } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableLinks from "@/components/SortableLinks";
import SortableCard from "@/components/SortableCard"; // Import the new SortableCard component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddNewItem } from "@/components/AddNewItem";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useRole } from "@/context/RoleContext"; // Correct import
import { supabase } from "@/utils/supabase/client";
import { AddNewList } from "@/components/AddNewList";
import { EditListTitle } from "@/components/EditListTitle";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { EditItem } from "@/components/EditItem";

interface Item {
  id: number;
  name: string;
  user_id: string;
  user_name: string;
  list_id: string;
  order: number;
  completed?: string;
}

interface List {
  id: string;
  title: string;
  items: Item[];
  order: number;
}

interface AddNewItemProps {
  listId: string;
  addNewItem: (listId: string, name: string) => void;
}

interface HomeProps {}

const WeeklyAgenda: React.FC<HomeProps> = () => {
  const { role, user } = useRole();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [lists, setLists] = useState<List[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const channel = useRef<RealtimeChannel | null>(null);
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const { data: listData, error: listError } = await supabase
          .from("lists")
          .select("*")
          .order("order", { ascending: true });

        if (listError) {
          //console.("Error fetching lists:", listError);
          return;
        }

        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select("*")
          .order("order", { ascending: true });

        if (itemError) {
          //console.("Error fetching items:", itemError);
          return;
        }

        if (listData && itemData) {
          const listsWithItems = listData.map((list: List) => ({
            ...list,
            items: itemData
              .filter((item: Item) => item.list_id === list.id)
              .sort((a, b) => a.order - b.order),
          }));
          setLists(listsWithItems);
        }
      } catch (error) {
        //console.("Error in fetchLists:", error);
      }
    };

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
          //console.("Error fetching username:", error?.message);
        }
      }
    };

    fetchLists();
    fetchUsername();

    if (!channel.current) {
      channel.current = supabase.channel("public:items");

      channel.current
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "items" },
          (payload) => {
            setLists((prevLists) =>
              prevLists.map((list) =>
                list.id === payload.new.list_id
                  ? { ...list, items: [...list.items, payload.new as Item] }
                  : list
              )
            );
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "items" },
          (payload) => {
            setLists((prevLists) =>
              prevLists.map((list) =>
                list.id === payload.old.list_id
                  ? {
                      ...list,
                      items: list.items.filter(
                        (item) => item.id !== payload.old.id
                      ),
                    }
                  : list
              )
            );
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "items" },
          (payload) => {
            setLists((prevLists) =>
              prevLists.map((list) =>
                list.id === payload.new.list_id
                  ? {
                      ...list,
                      items: list.items.map((item) =>
                        item.id === payload.new.id
                          ? (payload.new as Item)
                          : item
                      ),
                    }
                  : list
              )
            );
          }
        )
        .subscribe();
    }

    return () => {
      channel.current?.unsubscribe();
      channel.current = null;
    };
  }, [user]);

  const findContainer = (id: number | string): string | undefined => {
    for (const list of lists) {
      if (list.items.find((item) => item.id === id)) {
        return list.id;
      }
    }
    return lists.find((list) => list.id === id)?.id;
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) return;

    const activeId = active.id;
    const overId = over.id;

    setLists((prevLists) => {
      // Check if we're dragging a list
      const activeListIndex = prevLists.findIndex(
        (list) => list.id === activeId
      );

      if (activeListIndex !== -1) {
        // We're dragging a list
        const overListIndex = prevLists.findIndex((list) => list.id === overId);

        if (overListIndex !== -1 && activeListIndex !== overListIndex) {
          // Reorder the lists
          const newLists = arrayMove(prevLists, activeListIndex, overListIndex);
          // Update the order of the lists
          const updatedLists = newLists.map((list, index) => ({
            ...list,
            order: index,
          }));
          // Save the new order to the database
          updateListsOrder(updatedLists);
          return updatedLists;
        }
      } else {
        // We're dragging an item
        const sourceListIndex = prevLists.findIndex((list) =>
          list.items.some((item) => item.id === activeId)
        );
        const destinationListIndex = prevLists.findIndex(
          (list) =>
            list.items.some((item) => item.id === overId) || list.id === overId
        );

        if (sourceListIndex !== -1 && destinationListIndex !== -1) {
          const newLists = [...prevLists];
          const sourceList = newLists[sourceListIndex];
          const destinationList = newLists[destinationListIndex];

          const [movedItem] = sourceList.items.splice(
            sourceList.items.findIndex((item) => item.id === activeId),
            1
          );

          if (sourceListIndex === destinationListIndex) {
            // Reordering within the same list
            const newIndex = destinationList.items.findIndex(
              (item) => item.id === overId
            );
            destinationList.items.splice(newIndex, 0, movedItem);
          } else {
            // Moving to a different list
            if (overId === destinationList.id) {
              // Dropping at the end of the list
              destinationList.items.push(movedItem);
            } else {
              // Dropping before a specific item
              const newIndex = destinationList.items.findIndex(
                (item) => item.id === overId
              );
              destinationList.items.splice(newIndex, 0, movedItem);
            }
          }

          // Update the order of items in both source and destination lists
          sourceList.items.forEach((item, index) => {
            item.order = index;
          });
          destinationList.items.forEach((item, index) => {
            item.order = index;
          });

          // Update the list_id of the moved item if it changed lists
          if (sourceListIndex !== destinationListIndex) {
            movedItem.list_id = destinationList.id;
          }

          // Save the new order and list_id to the database
          updateItemsOrder([...sourceList.items, ...destinationList.items]);

          return newLists;
        }
      }

      // If we're here, we couldn't perform the drag operation
      return prevLists;
    });

    setActiveId(null);
  };

  const updateListsOrder = async (lists: List[]) => {
    const updates = lists.map((list) => ({
      id: list.id,
      order: list.order,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("lists")
        .update({ order: update.order })
        .eq("id", update.id);

      if (error) {
        //console.("Error updating list order:", error);
        // You might want to handle this error more gracefully
      }
    }
  };

  const updateItemsOrder = async (items: Item[]) => {
    for (const item of items) {
      const { error } = await supabase
        .from("items")
        .update({ order: item.order, list_id: item.list_id })
        .eq("id", item.id);

      if (error) {
        //console.("Error updating item order:", error);
        // You might want to handle this error more gracefully
      }
    }
  };

  const handleDelete = async (listId: string, idToDelete: number) => {
    const list = lists.find((list) => list.id === listId);
    const item = list?.items.find((item) => item.id === idToDelete);
    if (
      (item && item.user_id === user.id) ||
      role === "super admin" ||
      role === "dev"
    ) {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", idToDelete);
      if (error) {
        //console.("Error deleting item:", error);
      } else {
        setLists((prevLists) =>
          prevLists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.filter((item) => item.id !== idToDelete),
                }
              : list
          )
        );
      }
    } else {
      //console.("You do not have permission to delete this item.");
    }
  };

  const addNewItem = async (listId: string, newItem: string) => {
    if (!user || !username) {
      //console.("User or username is not defined");
      return;
    }

    const { data: existingItems, error: fetchError } = await supabase
      .from("items")
      .select("order")
      .eq("list_id", listId)
      .order("order", { ascending: false })
      .limit(1);

    if (fetchError) {
      //console.("Error fetching existing items:", fetchError);
      return;
    }

    const newOrder =
      existingItems && existingItems.length > 0
        ? existingItems[0].order + 1
        : 0;

    const newItemData: Item = {
      name: newItem,
      id: Date.now(),
      user_id: user.id,
      user_name: username,
      list_id: listId,
      order: newOrder,
    };

    const { data, error } = await supabase.from("items").insert([newItemData]);
    if (error) {
      //console.("Error adding item:", error);
    } else if (data) {
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? { ...list, items: [...list.items, newItemData] }
            : list
        )
      );
    }
  };

  const addNewList = async (newListTitle: string) => {
    const { data: existingLists, error: fetchError } = await supabase
      .from("lists")
      .select("order")
      .order("order", { ascending: false })
      .limit(1);

    if (fetchError) {
      //console.("Error fetching existing lists:", fetchError);
      return;
    }

    const newOrder =
      existingLists && existingLists.length > 0
        ? existingLists[0].order + 1
        : 0;

    const newListData = {
      title: newListTitle,
      order: newOrder,
    };

    const { data, error } = await supabase
      .from("lists")
      .insert([newListData])
      .select();

    if (error) {
      //console.("Error adding list:", error);
    } else if (data && data.length > 0) {
      const newList: List = {
        id: data[0].id,
        title: newListTitle,
        items: [],
        order: newOrder,
      };
      setLists((prevLists) => [...prevLists, newList]);
    }
  };

  const updateListTitle = async (id: string, title: string) => {
    const { error } = await supabase
      .from("lists")
      .update({ title })
      .eq("id", id);
    if (error) {
      //console.("Error updating list title:", error);
    } else {
      setLists((prevLists) =>
        prevLists.map((list) => (list.id === id ? { ...list, title } : list))
      );
    }
  };

  const deleteList = async (listId: string) => {
    try {
      // Delete the list (items will be automatically deleted due to CASCADE)
      const { error: listDeleteError } = await supabase
        .from("lists")
        .delete()
        .eq("id", listId);

      if (listDeleteError) throw listDeleteError;

      // Update the local state
      setLists((prevLists) => prevLists.filter((list) => list.id !== listId));

      // console.log(`List ${listId} deleted successfully`);
    } catch (error) {
      //console.("Error deleting list:", error);
    }
  };

  const updateItem = async (id: number, updatedItem: Partial<Item>) => {
    try {
      // Update the item in the database
      const { error } = await supabase
        .from("items")
        .update(updatedItem)
        .eq("id", id);

      if (error) throw error;

      // If the database update was successful, update the local state
      setLists((prevLists) =>
        prevLists.map((list) => ({
          ...list,
          items: list.items.map((item) =>
            item.id === id ? { ...item, ...updatedItem } : item
          ),
        }))
      );

      // console.log(`Item ${id} updated successfully`);
    } catch (error) {
      //console.("Error updating item:", error);
    }
  };

  const clearList = useCallback(async (listId: string) => {
    try {
      // Delete all items associated with the list from the database
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("list_id", listId);

      if (error) throw error;

      // Update the local state to reflect the cleared list
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId ? { ...list, items: [] } : list
        )
      );

      // console.log(`List ${listId} cleared successfully`);
    } catch (error) {
      //console.("Error clearing list:", error);
    }
  }, []);

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin", "dev"]}>
      <main className="flex grid-cols-4 justify-center mt-10 h-screen px-2 mx-auto select-none">
        {(role === "super admin" || role === "dev") && (
          <div className="flex justify-start p-4 mb-4">
            <AddNewList addNewList={addNewList} />
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
                            updateListTitle={updateListTitle}
                            deleteList={deleteList}
                            clearList={clearList}
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
                              onDelete={(id) =>
                                handleDelete(list.id, id as number)
                              }
                              updateItem={updateItem}
                            />
                          ))}
                        </SortableContext>
                        <AddNewItem
                          addNewItem={(newItem: string) =>
                            addNewItem(list.id, newItem)
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
                    onDelete={async (id: string | number) => {
                      try {
                        // Delete the item from Supabase
                        const { error } = await supabase
                          .from("items")
                          .delete()
                          .eq("id", id);

                        if (error) throw error;

                        // Update local state
                        setLists((prevLists) =>
                          prevLists.map((list) => ({
                            ...list,
                            items: list.items.filter((item) => item.id !== id),
                          }))
                        );

                        // console.log(`Item ${id} deleted successfully`);
                      } catch (error) {
                        //console.("Error deleting item:", error);
                        // Optionally, you can show an error message to the user here
                        // For example: setErrorMessage("Failed to delete item. Please try again.");
                      }
                    }}
                    updateItem={async (
                      id: number,
                      updatedItem: Partial<Item>
                    ) => {
                      try {
                        // Update the item in Supabase
                        const { data, error } = await supabase
                          .from("items")
                          .update(updatedItem)
                          .eq("id", id)
                          .select();

                        if (error) throw error;

                        if (!data || data.length === 0) {
                          throw new Error(
                            "No data returned from update operation"
                          );
                        }

                        const updatedItemFromDB = data[0];

                        // Update local state
                        setLists((prevLists) =>
                          prevLists.map((list) => ({
                            ...list,
                            items: list.items.map((item) =>
                              item.id === id
                                ? { ...item, ...updatedItemFromDB }
                                : item
                            ),
                          }))
                        );

                        // console.log(`Item ${id} updated successfully`);
                      } catch (error) {
                        //console.("Error updating item:", error);
                        // Optionally, you can show an error message to the user here
                        // For example: setErrorMessage("Failed to update item. Please try again.");
                      }
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
