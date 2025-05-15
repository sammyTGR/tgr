// src/app/sales/waiver/checkin/waiver-table-row-actions.tsx
import { Waiver } from './types';
import { supabase } from '@/utils/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';

const WaiverTableRowActions = ({
  waiver,
  onStatusChange,
}: {
  waiver: Waiver;
  onStatusChange: (id: string, status: 'checked_in' | 'checked_out') => void;
}) => {
  const handleCheckIn = async () => {
    const { error } = await supabase
      .from('waiver')
      .update({ status: 'checked_in' })
      .eq('id', waiver.id);

    if (!error) {
      onStatusChange(waiver.id, 'checked_in');
    } else {
      console.error('Error updating waiver:', error);
    }
  };

  const handleCheckOut = async () => {
    const { error } = await supabase
      .from('waiver')
      .update({ status: 'checked_out' })
      .eq('id', waiver.id);

    if (!error) {
      onStatusChange(waiver.id, 'checked_out');
    } else {
      console.error('Error updating waiver:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCheckIn}>Check In</DropdownMenuItem>
        <DropdownMenuItem onClick={handleCheckOut}>Check Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WaiverTableRowActions;
