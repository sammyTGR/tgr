import React, { FC } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { EditItem } from "@/components/EditItem";

interface Item {
  id: number;
  name: string;
  user_id: string;
  user_name: string;
  list_id: string;
}

interface SortableLinkCardProps {
  item: Item;
  onDelete: (id: number) => Promise<void>;
  updateItem: (id: number, updatedItem: Partial<Item>) => Promise<void>;
}

const SortableLinks: FC<SortableLinkCardProps> = ({
  item,
  onDelete,
  updateItem,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="p-4 relative flex justify-between items-center gap-2 group">
        <div>{item.name}</div>
        <div
          className="absolute top-2 right-2"
          onClick={(e) => e.stopPropagation()}
        >
          <EditItem item={item} updateItem={updateItem} deleteItem={onDelete} />
        </div>
      </Card>
    </div>
  );
};

export default SortableLinks;
