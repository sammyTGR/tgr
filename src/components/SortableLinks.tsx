import React, { FC } from "react";
import { Card } from "@/components/ui/card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditItem } from "@/components/EditItem";
import { TrashIcon } from "@radix-ui/react-icons";

interface Item {
  id: number;
  name: string;
  user_id: string;
  user_name: string;
  list_id: string;
}

interface SortableLinkCardProps {
  item: Item;
  onDelete: (id: number) => void;
  updateItem: (id: number, name: string) => void;
}

const SortableLinks: FC<SortableLinkCardProps> = ({
  item,
  onDelete,
  updateItem,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="p-4 relative flex justify-between items-center gap-2 group">
        <div>{item.name}</div>
        <div className="flex justify-center items-center gap-2 hidden group-hover:flex">
        <EditItem
            item={item}
            updateItem={updateItem}
            deleteItem={(id) => {
              // Logic to delete the item with the given id
            }}
          />
          <button onClick={() => onDelete(item.id)}>
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};

export default SortableLinks;
