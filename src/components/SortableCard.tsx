import React, { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleDots2Icon } from "@radix-ui/react-icons"; // Replace with an appropriate drag handle icon

interface SortableCardProps {
  id: string;
  children: ReactNode;
}

const SortableCard: React.FC<SortableCardProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center">
        <div className="cursor-move p-2" {...listeners} {...attributes}>
          <DragHandleDots2Icon /> {/* Drag handle */}
        </div>
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  );
};

export default SortableCard;
