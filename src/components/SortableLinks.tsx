import React, { FC } from 'react';
import { Card } from '@/components/ui/card';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Item {
  id: number;
  name: string;
}

interface SortableLinkCardProps {
  item: Item;
  onDelete: (id: number) => void;
}

const SortableLinks: FC<SortableLinkCardProps> = ({ item, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className='p-4 relative flex justify-between gap-5 group'>
        <div>{item.name}</div>
        <div className='flex justify-center items-center gap-4'>
          <button className="hidden group-hover:block" onClick={() => onDelete(item.id)}>
            <svg className='text-red-500' xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <button className='cursor-grab'>
            <svg viewBox="0 0 20 20" width="15">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"
                fill="currentColor"></path>
            </svg>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default SortableLinks;
