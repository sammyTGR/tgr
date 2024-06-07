import React, { FC } from "react";
import { Card } from "@/components/ui/card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
}

const SortableLinks: FC<SortableLinkCardProps> = ({ item, onDelete }) => {
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
        <button
          onClick={() => onDelete(item.id)}
          className="hidden group-hover:block"
        >
          <TrashIcon className="h-4 w-4 text-red-500" />
        </button>
      </Card>
    </div>
  );
};

export default SortableLinks;
