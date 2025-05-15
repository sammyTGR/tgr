import React, { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';

interface SortableCardProps {
  id: string;
  children: ReactNode;
}

const SortableCard: React.FC<SortableCardProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center">
        <div className="cursor-move p-2" {...listeners}>
          <DragHandleDots2Icon />
        </div>
        <div className="flex-grow">{children}</div>
      </div>
    </div>
  );
};

export default SortableCard;
