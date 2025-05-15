import { SalesData } from './types';
import { supabase } from '@/utils/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';

const SalesTableRowActions = ({
  sale,
  onUpdate,
}: {
  sale: SalesData;
  onUpdate: (id: number, updates: Partial<SalesData>) => void;
}) => {
  const handleUpdate = async (status: string) => {
    const { error } = await supabase.from('sales_data').update({ status }).eq('id', sale.id);

    if (!error) {
      onUpdate(sale.id, { status });
    } else {
      //console.("Error updating sale:", error);
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
        <DropdownMenuItem onClick={() => handleUpdate('processed')}>
          Mark as Processed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdate('pending')}>Mark as Pending</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SalesTableRowActions;
