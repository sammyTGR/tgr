import React, { FC } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditItem } from "@/components/EditItem";
import { EditListTitle } from "@/components/EditListTitle";
import { Pencil1Icon } from "@radix-ui/react-icons";

interface Item {
  id: number;
  name: string;
  user_id: string;
  user_name: string;
  list_id: string;
}

interface List {
  id: string;
  title: string;
  items: Item[];
}

interface SortableLinkCardProps {
  item: Item | List;
  onDelete: (id: string | number) => void;
  updateItem: (id: number, updatedItem: Partial<Item>) => void;
  updateListTitle?: (id: string, title: string) => void;
}

const SortableLinks: FC<SortableLinkCardProps> = ({
  item,
  onDelete,
  updateItem,
  updateListTitle,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  if ("name" in item) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card className="p-4 relative flex justify-between items-center gap-2 group">
          <div>{item.name}</div>
          <div className="hidden group-hover:flex absolute top-2 right-2">
            <EditItem
              item={item}
              updateItem={updateItem}
              deleteItem={() => onDelete(item.id)}
            />
          </div>
        </Card>
      </div>
    );
  } else {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card className="w-full min-w-[325px] md:max-w-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl flex justify-between">
              {item.title}
              {updateListTitle && (
                <EditListTitle
                  list={item}
                  updateListTitle={updateListTitle}
                  deleteList={() => onDelete(item.id)}
                />
              )}
            </CardTitle>
            <CardDescription>List All Of Your Projects</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <SortableContext
              items={item.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {item.items.map((i) => (
                <SortableLinks
                  key={i.id}
                  item={i}
                  onDelete={onDelete}
                  updateItem={updateItem}
                />
              ))}
            </SortableContext>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default SortableLinks;
