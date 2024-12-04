import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

export const fetchLists = async (): Promise<List[]> => {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: listData, error: listError } = await supabase
      .from("lists")
      .select("*")
      .order("order", { ascending: true });

    if (listError) {
      console.error("Error fetching lists:", listError);
      return [];
    }

    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("*")
      .order("order", { ascending: true });

    if (itemError) {
      console.error("Error fetching items:", itemError);
      return [];
    }

    if (listData && itemData) {
      return listData.map((list: List) => ({
        ...list,
        items: itemData
          .filter((item: Item) => item.list_id === list.id)
          .sort((a, b) => a.order - b.order),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error in fetchLists:", error);
    return [];
  }
};

export const fetchUsername = async (userId: string): Promise<string | null> => {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: userData, error } = await supabase
      .from("employees")
      .select("name")
      .eq("user_uuid", userId)
      .single();

    if (error) {
      console.error("Error fetching username:", error);
      return null;
    }

    return userData?.name || null;
  } catch (error) {
    console.error("Error in fetchUsername:", error);
    return null;
  }
};

export const updateListsOrder = async (lists: List[]): Promise<void> => {
  const supabase = createRouteHandlerClient({ cookies });
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
      console.error("Error updating list order:", error);
    }
  }
};

export const updateItemsOrder = async (items: Item[]): Promise<void> => {
  const supabase = createRouteHandlerClient({ cookies });

  for (const item of items) {
    const { error } = await supabase
      .from("items")
      .update({ order: item.order, list_id: item.list_id })
      .eq("id", item.id);

    if (error) {
      console.error("Error updating item order:", error);
    }
  }
};

export const addNewItem = async (
  listId: string,
  newItem: string,
  userId: string,
  username: string
): Promise<Item | null> => {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: existingItems, error: fetchError } = await supabase
    .from("items")
    .select("order")
    .eq("list_id", listId)
    .order("order", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("Error fetching existing items:", fetchError);
    return null;
  }

  const newOrder =
    existingItems && existingItems.length > 0 ? existingItems[0].order + 1 : 0;

  const newItemData: Item = {
    name: newItem,
    id: Date.now(),
    user_id: userId,
    user_name: username,
    list_id: listId,
    order: newOrder,
  };

  const { data, error } = await supabase
    .from("items")
    .insert([newItemData])
    .select()
    .single();

  if (error) {
    console.error("Error adding item:", error);
    return null;
  }

  return data;
};

export const addNewList = async (title: string): Promise<List | null> => {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: existingLists, error: fetchError } = await supabase
    .from("lists")
    .select("order")
    .order("order", { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("Error fetching existing lists:", fetchError);
    return null;
  }

  const newOrder =
    existingLists && existingLists.length > 0 ? existingLists[0].order + 1 : 0;

  const { data, error } = await supabase
    .from("lists")
    .insert([{ title, order: newOrder }])
    .select()
    .single();

  if (error) {
    console.error("Error adding list:", error);
    return null;
  }

  return { ...data, items: [] };
};

export const updateListTitle = async (
  id: string,
  title: string
): Promise<boolean> => {
  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.from("lists").update({ title }).eq("id", id);

  if (error) {
    console.error("Error updating list title:", error);
    return false;
  }

  return true;
};

export const deleteList = async (listId: string): Promise<boolean> => {
  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.from("lists").delete().eq("id", listId);

  if (error) {
    console.error("Error deleting list:", error);
    return false;
  }

  return true;
};

export const updateItem = async (
  id: number,
  updatedItem: Partial<Item>
): Promise<Item | null> => {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from("items")
    .update(updatedItem)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating item:", error);
    return null;
  }

  return data;
};

export const clearList = async (listId: string): Promise<boolean> => {
  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.from("items").delete().eq("list_id", listId);

  if (error) {
    console.error("Error clearing list:", error);
    return false;
  }

  return true;
};
