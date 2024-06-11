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
import { TrashIcon } from "@radix-ui/react-icons";

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
  onDelete: (id: number | string) => void;
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
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if ("name" in item) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card className="p-4 relative flex justify-between items-center gap-2 group">
          <div>{item.name}</div>
          {/* <div className="flex justify-center items-center gap-2 hidden group-hover:flex">
            <EditItem
              item={item}
              updateItem={updateItem}
              deleteItem={onDelete}
            />
            <button onClick={() => onDelete(item.id)}>
              <TrashIcon className="h-4 w-4" />
            </button>
          </div> */}
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
                  deleteList={onDelete}
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
